import "dotenv/config";
import mongoose from "mongoose";

import { connectDB } from "./config/db.js";
import Course from "./models/Course.js";
import { courses } from "../src/data/courses.js";

const seedCourses = async () => {
  try {
    await connectDB();

    const operations = courses.map(({ id, ...course }) => ({
      updateOne: {
        filter: { id: id },

        update: {
          $set: {
            ...course,
            id: id,
            status: "published",
          },
        },

        upsert: true,
      },
    }));

    await Course.bulkWrite(operations);

    console.log(`${courses.length} courses seeded successfully.`);
  } catch (error) {
    console.error("Seeding failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

seedCourses();
