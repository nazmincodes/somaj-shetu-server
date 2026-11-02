import "dotenv/config";
import express from "express";
import cors from "cors";
import { getDb } from "./db.js";
import eventsRouter from "./routes/events.js";
import joinsRouter from "./routes/joins.js";

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());

app.get("/", (req, res) => res.json({ ok: true, name: "Shomaj Setu API" }));

app.use(async (req, res, next) => {
  try {
    req.db = await getDb();
    next();
  } catch (err) {
    next(err);
  }
});

app.use("/events", eventsRouter);
app.use("/joins", joinsRouter);

app.use((req, res) => res.status(404).json({ message: "Route not found" }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || "Internal server error" });
});

const port = process.env.PORT || 5000;
if (!process.env.VERCEL) {
  app.listen(port, () => console.log(`Server running on port ${port}`));
}

export default app;
