import express from "express";
import "dotenv/config";
import session from "express-session";
import MongoStore from "connect-mongo";
import { connectDB } from "./config/db.js";
import { CourseRoutes } from "../server/routes/courseRoutes.js";
import { authRoutes } from "../server/routes/authRoutes.js";
import enrollmentRoutes from "./routes/enrollmentRoutes.js";
import helmet from "helmet";

const PORT = 5000;
connectDB();
const app = express();
app.use(helmet());
app.use(express.json());

app.use(
  session({
    name: "eduverse.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,

    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      collectionName: "sessions",
    }),

    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  }),
);
if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET is missing from .env");
}

app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/courses", CourseRoutes);

app.listen(PORT);
