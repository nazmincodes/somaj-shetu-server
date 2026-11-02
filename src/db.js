import { MongoClient } from "mongodb";

let dbPromise;

/** Connects once and re-uses the connection (works for serverless too). */
export function getDb() {
  if (!dbPromise) {
    dbPromise = (async () => {
      const client = new MongoClient(process.env.MONGODB_URI);
      await client.connect();
      const db = client.db(process.env.DB_NAME);
      await db.collection("joins").createIndex({ eventId: 1, userEmail: 1 }, { unique: true });
      await db.collection("events").createIndex({ eventDate: 1 });
      await db.collection("events").createIndex({ creatorEmail: 1 });
      console.log(`MongoDB connected: ${db.databaseName}`);
      return db;
    })().catch((err) => {
      dbPromise = undefined;
      throw err;
    });
  }
  return dbPromise;
}
