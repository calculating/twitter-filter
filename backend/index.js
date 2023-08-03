import sqlite3 from "sqlite3";
import { open } from "sqlite";
import Fastify from "fastify";

const fastify = Fastify({ logger: true });
sqlite3.verbose();

let db;

fastify.get("/", async function handler(_request, reply) {
  try {
    const tweets = await db.all("SELECT * FROM tweets");
    return tweets;
  } catch (err) {
    fastify.log.error(err);
    reply.status(500).send("Error accessing database");
  }
});

// Proxy to the openai chat API at https://api.openai.com/v1/chat/completions
fastify.post("/api/chat", async function handler(request, reply) {
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
    -- Later we could introduce a table for users with foreign keys, but for now this is simple.
    CREATE TABLE IF NOT EXISTS tweets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      tweet_created_at DATETIME NOT NULL,

      name TEXT NOT NULL,
      username TEXT NOT NULL,
      text TEXT NOT NULL,

      comments INTEGER NOT NULL,
      retweets INTEGER NOT NULL,
      likes INTEGER NOT NULL,
      views INTEGER NOT NULL
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
    filename: "/tmp/database.db",
    driver: sqlite3.Database,
  });
  await initDB();

  try {
    await fastify.listen({ port: 3000 });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
