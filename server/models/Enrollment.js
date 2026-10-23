import mongoose from "mongoose";

const enrollmentSchema = new mongoose.Schema(
  {
    accessType: {
      type: String,
      enum: ["free", "paid", "unknown"],
      default: "unknown",
    },

    // Which user enrolled?
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Which course did they enroll in?
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },

    // Lessons the student has completed
    completedLessons: {
      type: [String],
      default: [],
    },

    // Completion percentage: 0–100
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
  },
  { timestamps: true }
);

// Prevent the same user from enrolling in the same course twice.
enrollmentSchema.index(
  { user: 1, course: 1 },
  { unique: true }
);

const Enrollment = mongoose.model("Enrollment", enrollmentSchema);

export default Enrollment;
