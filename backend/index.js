import sqlite3 from "sqlite3";
import { open } from "sqlite";
import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifyCookie from "@fastify/cookie";
import fastifySession from "@fastify/session";
import fastifyStatic from "@fastify/static";
import fetch from "node-fetch";
import OAuth from "./oauth-utils.js";
import Stripe from "stripe";
import path from "path";
import { fileURLToPath } from "url";

const fastify = Fastify({ logger: true });

sqlite3.verbose();

// @fastify/env wasn't working well lol
fastify.config = process.env;
["TWITTER_CONSUMER_KEY", "TWITTER_CONSUMER_SECRET", "HOSTNAME"].forEach((k) => {
  if (!fastify.config[k]) {
    fastify.log.error(`Missing config: ${k}`);
    process.exit(1);
  }
});

fastify.register(cors, {
  origin: "https://twitter.com",
  methods: ["GET", "POST"], // replace with the methods you want to allow
});

fastify.register(fastifyStatic, {
  root: path.join(path.dirname(fileURLToPath(import.meta.url)), "public"),
  prefix: "/",
});
fastify.register(fastifyCookie);
fastify.register(fastifySession, {
  secret: fastify.config.SESSION_SECRET,
  cookie: { secure: false }, // support localhost
});

const stripe = Stripe(fastify.config.STRIPE_SECRET_KEY);

const oa = new OAuth(
  "https://api.twitter.com/oauth/request_token",
  "https://api.twitter.com/oauth/access_token",
  fastify.config.TWITTER_CONSUMER_KEY,
  fastify.config.TWITTER_CONSUMER_SECRET,
  "1.0A",
  fastify.config.HOSTNAME + "/callback",
  "HMAC-SHA1"
);

let db;

fastify.get("/", async function (req, reply) {
  if (!req.session.oauth?.access_token) {
    return reply.redirect("/login/twitter");
  }

  try {
    const [data, _res] = await oa.get(
      "https://api.twitter.com/1.1/account/verify_credentials.json",
      req.session.oauth.access_token,
      req.session.oauth.access_token_secret
    );
    const parsedData = JSON.parse(data);
    fastify.log.info(parsedData);
    return reply.send(
      `You are signed in: ${parsedData.screen_name}\n\n${JSON.stringify(
        parsedData,
        null,
        2
      )}`
    );
  } catch (error) {
    fastify.log.error(error);
    return reply.send("Authentication Failure!");
  }
});

fastify.get("/login/twitter", async function handler(req, reply) {
  try {
    const [oauth_token, oauth_token_secret, _res] =
      await oa.getOAuthRequestToken();
    req.session.oauth = {
      token: oauth_token,
      token_secret: oauth_token_secret,
    };
    fastify.log.info(req.session.oauth);
    // "The GET oauth/authorize endpoint is used instead of GET oauth/authenticate. [for oauth 1.0a]"
    return reply.redirect(
      "https://twitter.com/oauth/authorize?oauth_token=" + oauth_token
    );
  } catch (error) {
    fastify.log.error(error);
    return reply.send("Authentication Failed!");
  }
});

fastify.get("/callback", async function (req, reply) {
  if (req.session.oauth) {
    req.session.oauth.verifier = req.query.oauth_verifier;
    const oauth = req.session.oauth;

    try {
      // TODO: Promisfy and async this.
      const [oauth_access_token, oauth_access_token_secret, results] =
        await oa.getOAuthAccessToken(
          oauth.token,
          oauth.token_secret,
          oauth.verifier
        );

      req.session.oauth.access_token = oauth_access_token;
      req.session.oauth.access_token_secret = oauth_access_token_secret;
      fastify.log.info(results, req.session.oauth);

      // you might want to start using the Access Token to make authenticated requests to the user's Twitter account at this point

      return reply.redirect("/");
    } catch (error) {
      fastify.log.error(error);
      return reply.send("Authentication Failure!");
    }
  } else {
    return reply.send("you're not supposed to be here.");
  }
});

fastify.get("/stripe", async function (req, reply) {
  const session = await stripe.checkout.sessions.create({
    line_items: [{ price: fastify.config.STRIPE_PRICE_ID, quantity: 1 }],
    mode: "subscription",
    success_url: `${fastify.config.HOSTNAME}/stripe/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${fastify.config.HOSTNAME}/cancel.html`,
  });

  reply.redirect(303, session.url);
});

fastify.get("/stripe/success", async function (req, reply) {
  // Store checkout session id in database with the user
  // TODO
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

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      username VARCHAR NOT NULL, -- twitter username
      stripe_customer_id VARCHAR -- stripe customer id, possibly null if not paid
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
