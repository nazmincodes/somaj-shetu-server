import "dotenv/config";
import { getDb } from "./db.js";

const day = 24 * 60 * 60 * 1000;
const at = (days, hour = 10) => {
  const d = new Date(Date.now() + days * day);
  d.setHours(hour, 0, 0, 0);
  return d;
};
const img = (seed) => `https://picsum.photos/seed/${seed}/800/500`;

const samples = [
  ["Winter Clothes Distribution", "Donation", "Mirpur 10, Dhaka", 3, "winter-clothes", "We are collecting and handing out warm clothes to families who need them most this winter. Bring clean, used clothes or join us on the day to help sort and distribute."],
  ["Blanket Distribution for the Needy", "Donation", "Mohammadpur, Dhaka", 6, "blanket-drive", "Join our volunteers to distribute blankets to people sleeping outdoors during the cold nights. Every blanket brings real comfort."],
  ["Dhanmondi Lake Cleanup Day", "Cleanup", "Dhanmondi Lake, Dhaka", 9, "lake-cleanup", "A morning of cleaning the lake side, sorting plastic waste and spreading awareness among walkers and visitors."],
  ["Plant 500 Trees Drive", "Plantation", "Purbachal, Dhaka", 12, "tree-plant", "Help us plant 500 native saplings and learn how to care for them. Tools and saplings are provided."],
  ["Free Health Checkup Camp", "Health Camp", "Savar, Dhaka", 15, "health-camp", "Volunteer doctors and nurses will offer free basic checkups, blood pressure and sugar tests for local families."],
  ["Street Children Learning Hour", "Education", "Kamalapur, Dhaka", 18, "learning-hour", "Spend an afternoon teaching reading, writing and basic maths to children who cannot attend regular school."],
  ["Emergency Blood Donation Camp", "Blood Donation", "Uttara Sector 7, Dhaka", 21, "blood-camp", "Donate blood and save lives. A medical team will be present to make sure every donor stays safe."],
  ["Iftar and Meal Sharing", "Food Distribution", "Gulshan 2, Dhaka", 25, "meal-share", "We cook and serve hot meals to rickshaw pullers and day labourers. Cooks and servers are both welcome."],
];

const db = await getDb();
const events = db.collection("events");
const docs = samples.map(([title, eventType, location, days, seed, description], i) => ({
  title,
  description,
  eventType,
  location,
  thumbnail: img(seed),
  eventDate: at(days, 9 + (i % 4)),
  creatorEmail: "demo@example.com",
  creatorName: "Demo Organizer",
  creatorImage: "",
  participants: 0,
  createdAt: new Date(),
}));
const result = await events.insertMany(docs);
console.log(`Inserted ${result.insertedCount} sample events`);
process.exit(0);
