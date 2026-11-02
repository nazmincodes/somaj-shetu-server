import { Router } from "express";
import { ObjectId } from "mongodb";
import { verifyJWT } from "../middleware/auth.js";

const router = Router();
router.use(verifyJWT);

// Events joined by the logged-in user, sorted by event date
router.get("/me", async (req, res, next) => {
  try {
    const events = await req.db
      .collection("joins")
      .aggregate([
        { $match: { userEmail: req.user.email } },
        { $lookup: { from: "events", localField: "eventId", foreignField: "_id", as: "event" } },
        { $unwind: "$event" },
        { $replaceRoot: { newRoot: { $mergeObjects: ["$event", { joinId: "$_id", joinedAt: "$joinedAt" }] } } },
        { $sort: { eventDate: 1 } },
      ])
      .toArray();
    res.json(events);
  } catch (err) {
    next(err);
  }
});

// Has this user joined the event?
router.get("/status/:eventId", async (req, res, next) => {
  try {
    if (!ObjectId.isValid(req.params.eventId)) return res.json({ joined: false });
    const found = await req.db
      .collection("joins")
      .findOne({ eventId: new ObjectId(req.params.eventId), userEmail: req.user.email });
    res.json({ joined: Boolean(found) });
  } catch (err) {
    next(err);
  }
});

// Join an event
router.post("/:eventId", async (req, res, next) => {
  try {
    if (!ObjectId.isValid(req.params.eventId)) return res.status(404).json({ message: "Event not found" });
    const eventId = new ObjectId(req.params.eventId);
    const events = req.db.collection("events");

    const event = await events.findOne({ _id: eventId });
    if (!event) return res.status(404).json({ message: "Event not found" });
    if (new Date(event.eventDate) <= new Date()) {
      return res.status(400).json({ message: "This event has already ended" });
    }

    try {
      await req.db.collection("joins").insertOne({
        eventId,
        eventTitle: event.title,
        userEmail: req.user.email,
        userName: req.user.name,
        userImage: req.user.image,
        joinedAt: new Date(),
      });
    } catch (err) {
      if (err.code === 11000) return res.status(409).json({ message: "You have already joined this event" });
      throw err;
    }

    await events.updateOne({ _id: eventId }, { $inc: { participants: 1 } });
    res.status(201).json({ message: "You have joined the event" });
  } catch (err) {
    next(err);
  }
});

// Leave an event
router.delete("/:eventId", async (req, res, next) => {
  try {
    if (!ObjectId.isValid(req.params.eventId)) return res.status(404).json({ message: "Event not found" });
    const eventId = new ObjectId(req.params.eventId);
    const result = await req.db.collection("joins").deleteOne({ eventId, userEmail: req.user.email });
    if (!result.deletedCount) return res.status(404).json({ message: "You have not joined this event" });
    await req.db.collection("events").updateOne({ _id: eventId }, { $inc: { participants: -1 } });
    res.json({ message: "You have left the event" });
  } catch (err) {
    next(err);
  }
});

export default router;
