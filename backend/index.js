import sqlite3 from "sqlite3";
import { open } from "sqlite";
import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifyCookie from "@fastify/cookie";
import fastifySession from "@fastify/session";
import fetch from "node-fetch";
import OAuth from "oauth";

const fastify = Fastify({ logger: true });

sqlite3.verbose();

// @fastify/env wasn't working well lol
fastify.config = process.env;
["TWITTER_CONSUMER_KEY", "TWITTER_CONSUMER_SECRET", "OAUTH_CALLBACK"].forEach(
  (k) => {
    if (!fastify.config[k]) {
      fastify.log.error(`Missing config: ${k}`);
      process.exit(1);
    }
  }
);

fastify.register(cors, {
  origin: "https://twitter.com",
  methods: ["GET", "POST"], // replace with the methods you want to allow
});

fastify.register(fastifyCookie);
fastify.register(fastifySession, {
  secret: fastify.config.SESSION_SECRET,
  cookie: { secure: false }, // support localhost
});

const oa = new OAuth.OAuth(
  "https://api.twitter.com/oauth/request_token",
  "https://api.twitter.com/oauth/access_token",
  fastify.config.TWITTER_CONSUMER_KEY,
  fastify.config.TWITTER_CONSUMER_SECRET,
  "1.0A",
  fastify.config.OAUTH_CALLBACK,
  "HMAC-SHA1"
);

let db;

fastify.get("/", function (req, reply) {
  if (!req.session.oauth?.access_token) {
    return reply.redirect("/login/twitter");
  }

  oa.get(
    "https://api.twitter.com/1.1/account/verify_credentials.json",
    req.session.oauth.access_token,
    req.session.oauth.access_token_secret,
    (error, data, _res) => {
      if (error) {
        fastify.log.error(error);
        return reply.send("Authentication Failure!");
      } else {
        const parsedData = JSON.parse(data);
        fastify.log.info(parsedData);
        return reply.send(`You are signed in: ${parsedData.screen_name}`);
      }
    }
  );
});

fastify.get("/login/twitter", function handler(req, reply) {
  oa.getOAuthRequestToken((error, oauth_token, oauth_token_secret, _res) => {
    if (error) {
      fastify.log.error(error);
      return reply.send("Authentication Failed!");
    } else {
      req.session.oauth = {
        token: oauth_token,
        token_secret: oauth_token_secret,
      };
      fastify.log.info(req.session.oauth);
      return reply.redirect(
        // "The GET oauth/authorize endpoint is used instead of GET oauth/authenticate. [for oauth 1.0a]"
        "https://twitter.com/oauth/authorize?oauth_token=" + oauth_token
      );
    }
  });
});

fastify.get("/callback", function (req, reply) {
  if (req.session.oauth) {
    req.session.oauth.verifier = req.query.oauth_verifier;
    const oauth = req.session.oauth;

    // TODO: Promisfy and async this.
    oa.getOAuthAccessToken(
      oauth.token,
      oauth.token_secret,
      oauth.verifier,
      (error, oauth_access_token, oauth_access_token_secret, results) => {
        if (error) {
          fastify.log.error(error);
          return reply.send("Authentication Failure!");
        } else {
          req.session.oauth.access_token = oauth_access_token;
          req.session.oauth.access_token_secret = oauth_access_token_secret;
          fastify.log.info(results, req.session.oauth);

          // you might want to start using the Access Token to make authenticated requests to the user's Twitter account at this point

          return reply.redirect("/");
        }
      }
    );
  } else {
    return reply.send("you're not supposed to be here.");
  }
});

fastify.get("/api/tweets", async function handler(_request, reply) {
  try {
    const tweets = await db.all("SELECT * FROM raw_tweets");
    return tweets;
  } catch (err) {
    fastify.log.error(err);
    reply.status(500).send("Error accessing database");
  }
});

// Save tweet to db
fastify.post("/api/tweet", async function handler(request, reply) {
  try {
    await db.run(
      "INSERT INTO raw_tweets (raw_text, username) VALUES (?, ?)",
      request.body.raw_text,
      request.body.username
    );
    reply.status(200).send("OK");
  } catch (err) {
    fastify.log.error(err);
    reply.status(500).send("Error accessing database");
  }
});

// If openai blocks us this tracks when we're allowed to try again
let tryAgainAfter;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Proxy to the openai chat API at https://api.openai.com/v1/chat/completions
fastify.post("/api/chat", async function handler(request, reply) {
  // If we're blocked, wait until we're allowed to try again before continuing
  if (tryAgainAfter && tryAgainAfter > Date.now()) {
    await sleep(tryAgainAfter - Date.now());
  }

  // Make request to openai
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    // Proxy json in body directly
    body: JSON.stringify(request.body),
  });

  // check response code
  if (response.status !== 200) {
    if (response.status === 429) {
      tryAgainAfter = Date.now() + 1000; // lol, lmao
    }

    const error = await response.text();
    reply.status(response.status).send(error);
    fastify.log.error(error);
    return;
  }

  const json = await response.json();

  // Save response and request to database
  await db.run(
    "INSERT INTO api_calls (request_json, response_json) VALUES (?, ?)",
    JSON.stringify(request.body),
    JSON.stringify(json)
  );

  return json;
});

fastify.addHook("onClose", async (_instance, done) => {
  await db.close();
  done();
});

const initDB = async () => {
  await db.exec(`
    -- Raw tweet data, we can always parse it later
    CREATE TABLE IF NOT EXISTS raw_tweets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      raw_text VARCHAR NOT NULL,
      username VARCHAR NOT NULL -- username of the person scraping
    );

    -- Store the request and response of each call to openai.
    CREATE TABLE IF NOT EXISTS api_calls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      request_json TEXT NOT NULL,
      response_json TEXT NOT NULL
    );
  `);
};

const start = async () => {
  db = await open({
    filename: "database.db",
    driver: sqlite3.Database,
  });
  await initDB();

  try {
    await fastify.listen({ port: 3000, address: "0.0.0.0" });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
