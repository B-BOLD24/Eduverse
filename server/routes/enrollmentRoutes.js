import { Router } from "express";
import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import requireAuth from "../middleware/requireAuth.js";

const router = Router();

// Get all courses the logged-in user is enrolled in.
router.get("/my", requireAuth, async (req, res) => {
  try {
    // Find this user's enrollment records and fetch course details.
    const enrollments = await Enrollment.find({
      user: req.session.userId,
    })
      .populate(
        "course",
        "id title instructor category level duration rating reviews students price originalPrice image featured badge -_id",
      )
      .sort({ createdAt: -1 })
      .lean();

    // Prepare the response for the frontend.
    const result = enrollments
      .filter((enrollment) => enrollment.course)
      .map(
        ({
          _id,
          course,
          completedLessons,
          progress,
          createdAt,
          updatedAt,
        }) => ({
          id: _id.toString(),
          course,
          completedLessons,
          progress,
          enrolledAt: createdAt,
          updatedAt,
        }),
      );

    return res.json({ enrollments: result });
  } catch (error) {
    console.error("Failed to fetch enrollments:", error.message);

    return res.status(500).json({
      message: "Failed to fetch enrollments.",
    });
  }
});

// Enrolled students may continue published or archived courses.
router.get("/:courseId/content", requireAuth, async (req, res) => {
  try {
    const course = await Course.findOne({
      id: req.params.courseId,
      status: { $in: ["published", "archived"] },
    })
      .select("id title instructor category level duration rating reviews students price originalPrice image featured badge description curriculum status")
      .lean();

    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    const enrollment = await Enrollment.findOne({
      user: req.session.userId,
      course: course._id,
    }).select("progress completedLessons createdAt").lean();

    if (!enrollment) {
      return res.status(403).json({ message: "You are not enrolled in this course." });
    }

    return res.json({
      course: Object.fromEntries(Object.entries(course).filter(([key]) => key !== "_id" && key !== "__v")),
      enrollment: {
        enrolled: true,
        courseId: course.id,
        progress: enrollment.progress,
        completedLessons: enrollment.completedLessons,
        enrolledAt: enrollment.createdAt,
      },
    });
  } catch (error) {
    console.error("Failed to fetch enrolled course content:", error.message);
    return res.status(500).json({ message: "Failed to fetch course content." });
  }
});

// Mark a lesson as completed and update course progress.
router.patch("/:courseId/progress", requireAuth, async (req, res) => {
  try {
    const lessonId =
      typeof req.body?.lessonId === "string" ? req.body.lessonId.trim() : "";

    // A lesson identifier is required.
    if (!lessonId) {
      return res.status(400).json({
        message: "Lesson ID is required.",
      });
    }

    // Find the course using its public ID.
    const course = await Course.findOne({
      id: req.params.courseId,
    }).select("_id id curriculum");

    if (!course) {
      return res.status(404).json({
        message: "Course not found.",
      });
    }

    // Progress can only be calculated if lessons are configured.
    if (!course.curriculum || course.curriculum.length === 0) {
      return res.status(400).json({
        message: "This course has no lessons configured yet.",
      });
    }

    // Ensure the submitted lesson belongs to this course.
    if (!course.curriculum.includes(lessonId)) {
      return res.status(400).json({
        message: "Invalid lesson for this course.",
      });
    }

    // Find this user's enrollment for the course.
    const enrollment = await Enrollment.findOne({
      user: req.session.userId,
      course: course._id,
    });

    if (!enrollment) {
      return res.status(404).json({
        message: "You are not enrolled in this course.",
      });
    }

    // Add the lesson only if it hasn't already been completed.
    if (!enrollment.completedLessons.includes(lessonId)) {
      enrollment.completedLessons.push(lessonId);
    }

    // Calculate progress using the course's actual lesson count.
    enrollment.progress = Math.round(
      (enrollment.completedLessons.length / course.curriculum.length) * 100,
    );

    // Persist the updated progress in MongoDB.
    await enrollment.save();

    return res.json({
      message: "Progress updated successfully.",
      progress: enrollment.progress,
      completedLessons: enrollment.completedLessons,
    });
  } catch (error) {
    console.error("Failed to update progress:", error.message);

    return res.status(500).json({
      message: "Failed to update progress.",
    });
  }
});

// Check the current user's enrollment status for a course.
router.get("/:courseId", requireAuth, async (req, res) => {
  try {
    // Find the course using its public ID.
    const course = await Course.findOne({
      id: req.params.courseId,
    }).select("_id id");

    if (!course) {
      return res.status(404).json({
        message: "Course not found.",
      });
    }

    // Find this user's enrollment for that course.
    const enrollment = await Enrollment.findOne({
      user: req.session.userId,
      course: course._id,
    }).lean();

    // A logged-in user may not be enrolled yet.
    if (!enrollment) {
      return res.json({
        enrolled: false,
        progress: 0,
        completedLessons: [],
      });
    }

    // Return the user's saved progress.
    return res.json({
      enrolled: true,
      courseId: course.id,
      progress: enrollment.progress,
      completedLessons: enrollment.completedLessons,
      enrolledAt: enrollment.createdAt,
    });
  } catch (error) {
    console.error("Failed to check enrollment:", error.message);

    return res.status(500).json({
      message: "Failed to check enrollment.",
    });
  }
});
// Enroll the logged-in user in a course.
router.post("/:courseId", requireAuth, async (req, res) => {
  try {
    // Find the course using its public ID, e.g. "react-fundamentals".
    const course = await Course.findOne({
      id: req.params.courseId,
      status: "published",
    }).select("_id id price");

    if (!course) {
      return res.status(404).json({
        message: "Course not found.",
      });
    }

    // Don't allow paid enrollment until payment verification exists.
    if (course.price > 0) {
      return res.status(402).json({
        message: "Payment is required before enrollment.",
      });
    }

    // Check whether the user is already enrolled.
    const existingEnrollment = await Enrollment.findOne({
      user: req.session.userId,
      course: course._id,
    });

    if (existingEnrollment) {
      return res.status(409).json({
        message: "You are already enrolled in this course.",
      });
    }

    // Create the enrollment record.
    const enrollment = await Enrollment.create({
      user: req.session.userId,
      course: course._id,
      accessType: "free",
    });

    return res.status(201).json({
      message: "Successfully enrolled in the course.",
      enrollment: {
        courseId: course.id,
        progress: enrollment.progress,
        completedLessons: enrollment.completedLessons,
        enrolledAt: enrollment.createdAt,
      },
    });
  } catch (error) {
    // The unique index also protects against simultaneous duplicate requests.
    if (error.code === 11000) {
      return res.status(409).json({
        message: "You are already enrolled in this course.",
      });
    }

    console.error("Enrollment failed:", error.message);

    return res.status(500).json({
      message: "Failed to enroll in the course.",
    });
  }
});

export default router;
