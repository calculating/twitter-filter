import sqlite3 from "sqlite3";
import { open } from "sqlite";
import Fastify from "fastify";

const fastify = Fastify({ logger: true });
sqlite3.verbose();

let db;

fastify.get("/", async function handler(request, reply) {
  try {
    const users = await db.all("SELECT * FROM tweets");
    return users;
  } catch (err) {
    fastify.log.error(err);
    reply.status(500).send("Error accessing database");
  }
});

fastify.addHook("onClose", async (instance, done) => {
  await db.close();
  done();
});

const initDB = async () => {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS tweets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tweet TEXT NOT NULL
    )
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
    fastify.log.info(`Server listening on ${fastify.server.address().port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
