import { Router } from "express";
import { ObjectId } from "mongodb";
import { verifyJWT } from "../middleware/auth.js";

const router = Router();

export const EVENT_TYPES = [
  "Cleanup",
  "Plantation",
  "Donation",
  "Food Distribution",
  "Blood Donation",
  "Health Camp",
  "Education",
  "Awareness",
  "Others",
];

const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function validateEvent(body = {}) {
  const errors = {};
  const title = String(body.title ?? "").trim();
  const description = String(body.description ?? "").trim();
  const eventType = String(body.eventType ?? "").trim();
  const thumbnail = String(body.thumbnail ?? "").trim();
  const location = String(body.location ?? "").trim();
  const eventDate = new Date(body.eventDate);

  if (title.length < 5) errors.title = "Title must be at least 5 characters";
  if (description.length < 20) errors.description = "Description must be at least 20 characters";
  if (!EVENT_TYPES.includes(eventType)) errors.eventType = "Please choose a valid event type";
  try {
    const url = new URL(thumbnail);
    if (!["http:", "https:"].includes(url.protocol)) throw new Error();
  } catch {
    errors.thumbnail = "Please enter a valid image URL";
  }
  if (location.length < 3) errors.location = "Location is required";
  if (Number.isNaN(eventDate.getTime())) errors.eventDate = "Please choose a valid date";
  else if (eventDate <= new Date()) errors.eventDate = "Event date must be in the future";

  return { errors, data: { title, description, eventType, thumbnail, location, eventDate } };
}

const badId = (res) => res.status(404).json({ message: "Event not found" });

// Public: upcoming events only (supports ?limit=6&search=&type=&sort=asc|desc)
router.get("/", async (req, res, next) => {
  try {
    const search = String(req.query.search ?? "").trim();
    const type = String(req.query.type ?? "").trim();
    const sort = req.query.sort === "desc" ? -1 : 1;
    const limit = parseInt(req.query.limit, 10);

    const filter = { eventDate: { $gte: new Date() } };
    if (type && type !== "all") filter.eventType = type;
    if (search) {
      const rx = new RegExp(escapeRegExp(search), "i");
      filter.$or = [{ title: rx }, { location: rx }];
    }

    let cursor = req.db.collection("events").find(filter).sort({ eventDate: sort });
    if (limit > 0) cursor = cursor.limit(Math.min(limit, 50));
    res.json(await cursor.toArray());
  } catch (err) {
    next(err);
  }
});

// Private: events created by the logged-in user
router.get("/mine", verifyJWT, async (req, res, next) => {
  try {
    const events = await req.db
      .collection("events")
      .find({ creatorEmail: req.user.email })
      .sort({ eventDate: 1 })
      .toArray();
    res.json(events);
  } catch (err) {
    next(err);
  }
});

// Public: single event
router.get("/:id", async (req, res, next) => {
  try {
    if (!ObjectId.isValid(req.params.id)) return badId(res);
    const event = await req.db.collection("events").findOne({ _id: new ObjectId(req.params.id) });
    if (!event) return badId(res);
    res.json(event);
  } catch (err) {
    next(err);
  }
});

// Private: create
router.post("/", verifyJWT, async (req, res, next) => {
  try {
    const { errors, data } = validateEvent(req.body);
    if (Object.keys(errors).length) {
      return res.status(400).json({ message: "Please fix the highlighted fields", errors });
    }
    const doc = {
      ...data,
      creatorEmail: req.user.email,
      creatorName: req.user.name,
      creatorImage: req.user.image,
      participants: 0,
      createdAt: new Date(),
    };
    const result = await req.db.collection("events").insertOne(doc);
    res.status(201).json({ insertedId: result.insertedId, message: "Event created successfully" });
  } catch (err) {
    next(err);
  }
});

// Private: update (owner only)
router.put("/:id", verifyJWT, async (req, res, next) => {
  try {
    if (!ObjectId.isValid(req.params.id)) return badId(res);
    const _id = new ObjectId(req.params.id);
    const events = req.db.collection("events");
    const event = await events.findOne({ _id });
    if (!event) return badId(res);
    if (event.creatorEmail !== req.user.email) {
      return res.status(403).json({ message: "You can only update your own events" });
    }
    const { errors, data } = validateEvent(req.body);
    if (Object.keys(errors).length) {
      return res.status(400).json({ message: "Please fix the highlighted fields", errors });
    }
    await events.updateOne({ _id }, { $set: { ...data, updatedAt: new Date() } });
    res.json({ message: "Event updated successfully" });
  } catch (err) {
    next(err);
  }
});

// Private: delete (owner only)
router.delete("/:id", verifyJWT, async (req, res, next) => {
  try {
    if (!ObjectId.isValid(req.params.id)) return badId(res);
    const _id = new ObjectId(req.params.id);
    const events = req.db.collection("events");
    const event = await events.findOne({ _id });
    if (!event) return badId(res);
    if (event.creatorEmail !== req.user.email) {
      return res.status(403).json({ message: "You can only delete your own events" });
    }
    await events.deleteOne({ _id });
    await req.db.collection("joins").deleteMany({ eventId: _id });
    res.json({ message: "Event deleted successfully" });
  } catch (err) {
    next(err);
  }
});

export default router;
