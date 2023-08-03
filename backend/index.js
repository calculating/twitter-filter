import sqlite3 from "sqlite3";
import { open } from "sqlite";
import Fastify from "fastify";
import cors from "@fastify/cors";

const fastify = Fastify({ logger: true });
sqlite3.verbose();

fastify.register(cors, {
  origin: "https://twitter.com",
  methods: ["GET", "POST"], // replace with the methods you want to allow
});

let db;

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
      "INSERT INTO raw_tweets (raw_text, ip, username) VALUES (?, ?, ?)",
      request.body.raw_text,
      request.ip,
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
      username VARCHAR NOT NULL, -- username of the person scraping
      ip VARCHAR
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
