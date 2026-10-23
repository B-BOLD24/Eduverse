import "dotenv/config";
import MongoStore from "connect-mongo";
import { connectDB } from "./config/db.js";
import { createApp } from "./app.js";

const PORT = 5000;
if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET is missing from .env");
}

connectDB();
const sessionStore = MongoStore.create({
  mongoUrl: process.env.MONGODB_URI,
  collectionName: "sessions",
});
const app = createApp({
  sessionSecret: process.env.SESSION_SECRET,
  sessionStore,
});
app.listen(PORT);
