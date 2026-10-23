import { Router } from "express";
import requireAdmin from "../middleware/requireAdmin.js";
import requireAuth from "../middleware/requireAuth.js";
import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import Payment from "../models/Payment.js";
import User from "../models/User.js";

const router = Router();
const courseFields = [
  "title",
  "instructor",
  "category",
  "level",
  "duration",
  "rating",
  "reviews",
  "students",
  "price",
  "originalPrice",
  "image",
  "featured",
  "badge",
  "description",
  "curriculum",
];
const courseStatuses = new Set(["draft", "published", "archived"]);

router.use(requireAuth, requireAdmin);

function pagination(query) {
  const page = Math.max(1, Number.parseInt(query.page ?? "1", 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit ?? "20", 10) || 20));
  return { page, limit, skip: (page - 1) * limit };
}

function accessSummary(enrollments) {
  if (enrollments.length === 0) return "no-enrollments";
  const types = new Set(enrollments.map(({ accessType }) => accessType ?? "unknown"));
  if (types.has("paid") && types.has("free")) return "mixed";
  if (types.has("unknown")) return "unresolved";
  if (types.has("paid")) return "paid";
  if (types.has("free")) return "free";
  return "unresolved";
}

function accessCounts(enrollments) {
  return enrollments.reduce((counts, { accessType }) => {
    const type = ["paid", "free", "unknown"].includes(accessType) ? accessType : "unknown";
    counts[type] += 1;
    return counts;
  }, { paid: 0, free: 0, unknown: 0 });
}

function pageResult(items, total, page, limit) {
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

function coursePayload(body) {
  const result = {};
  for (const key of courseFields) {
    if (Object.hasOwn(body ?? {}, key)) result[key] = body[key];
  }
  return result;
}

function courseSlug(title) {
  return title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

router.get("/access-check", (req, res) => {
  res.json({ authorized: true });
});

router.get("/dashboard", async (req, res) => {
  try {
    const [students, courses, enrollments, courseStatuses, recent] = await Promise.all([
      User.countDocuments({ role: "student" }),
      Course.countDocuments(),
      Enrollment.countDocuments(),
      Course.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Enrollment.find().select("user course accessType createdAt")
        .populate("user", "name email")
        .populate("course", "id title")
        .sort({ createdAt: -1 }).limit(8).lean(),
    ]);
    return res.json({
      totals: { students, courses, enrollments },
      coursesByStatus: Object.fromEntries(courseStatuses.map(({ _id, count }) => [_id ?? "unmigrated", count])),
      recentEnrollments: recent.filter(({ user, course }) => user && course),
    });
  } catch (error) {
    console.error("Admin dashboard failed:", error.message);
    return res.status(500).json({ message: "Failed to load dashboard." });
  }
});

router.get("/students", async (req, res) => {
  try {
    const { page, limit, skip } = pagination(req.query);
    const search = String(req.query.search ?? "").trim().slice(0, 100);
    const filter = { role: "student" };
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "i");
      filter.$or = [{ name: regex }, { email: regex }];
    }
    const [users, total] = await Promise.all([
      User.find(filter).select("_id name email createdAt").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(filter),
    ]);
    const enrollments = users.length
      ? await Enrollment.find({ user: { $in: users.map(({ _id }) => _id) } }).select("user accessType").lean()
      : [];
    const grouped = new Map();
    for (const enrollment of enrollments) {
      const key = enrollment.user.toString();
      grouped.set(key, [...(grouped.get(key) ?? []), enrollment]);
    }
    const items = users.map(({ _id, ...user }) => {
      const records = grouped.get(_id.toString()) ?? [];
      return {
        id: _id.toString(),
        ...user,
        enrollmentCount: records.length,
        accessSummary: accessSummary(records),
        accessCounts: accessCounts(records),
      };
    });
    return res.json(pageResult(items, total, page, limit));
  } catch (error) {
    console.error("Admin student listing failed:", error.message);
    return res.status(500).json({ message: "Failed to list students." });
  }
});

router.get("/students/:studentId", async (req, res) => {
  try {
    const student = await User.findOne({ _id: req.params.studentId, role: "student" })
      .select("_id name email createdAt").lean();
    if (!student) return res.status(404).json({ message: "Student not found." });
    const enrollments = await Enrollment.find({ user: student._id })
      .select("course accessType createdAt")
      .populate("course", "id title category price status")
      .sort({ createdAt: -1 }).lean();
    const records = enrollments.filter(({ course }) => course);
    return res.json({
      student: { id: student._id.toString(), name: student.name, email: student.email, createdAt: student.createdAt },
      enrollmentCount: records.length,
      accessSummary: accessSummary(records),
      accessCounts: accessCounts(records),
      enrollments: records.map(({ _id, course, accessType, createdAt }) => ({
        id: _id.toString(), course, accessType: accessType ?? "unknown", enrolledAt: createdAt,
      })),
    });
  } catch (error) {
    if (error.name === "CastError") return res.status(404).json({ message: "Student not found." });
    console.error("Admin student detail failed:", error.message);
    return res.status(500).json({ message: "Failed to load student." });
  }
});

router.get("/courses", async (req, res) => {
  try {
    const { page, limit, skip } = pagination(req.query);
    const filter = {};
    if (req.query.status && courseStatuses.has(req.query.status)) filter.status = req.query.status;
    const [items, total] = await Promise.all([
      Course.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
      Course.countDocuments(filter),
    ]);
    return res.json(pageResult(items, total, page, limit));
  } catch (error) {
    console.error("Admin course listing failed:", error.message);
    return res.status(500).json({ message: "Failed to list courses." });
  }
});

router.post("/courses", async (req, res) => {
  try {
    const fields = coursePayload(req.body);
    if (typeof fields.title !== "string" || !fields.title.trim()) {
      return res.status(400).json({ message: "Course title is required." });
    }
    const baseId = courseSlug(fields.title);
    if (!baseId) return res.status(400).json({ message: "Course title cannot form a course ID." });
    let id = baseId;
    let suffix = 2;
    while (await Course.exists({ id })) id = `${baseId.slice(0, 75)}-${suffix++}`;
    const course = await Course.create({ ...fields, id, status: "draft" });
    return res.status(201).json({ course });
  } catch (error) {
    if (error.name === "ValidationError") return res.status(400).json({ message: error.message });
    console.error("Admin course creation failed:", error.message);
    return res.status(500).json({ message: "Failed to create course." });
  }
});

router.patch("/courses/:courseId", async (req, res) => {
  try {
    const fields = coursePayload(req.body);
    if (Object.hasOwn(req.body ?? {}, "status")) {
      if (!courseStatuses.has(req.body.status)) return res.status(400).json({ message: "Invalid course status." });
      fields.status = req.body.status;
    }
    if (Object.keys(fields).length === 0) return res.status(400).json({ message: "No supported course fields provided." });
    const course = await Course.findOneAndUpdate(
      { id: req.params.courseId },
      { $set: fields },
      { returnDocument: "after", runValidators: true },
    ).lean();
    if (!course) return res.status(404).json({ message: "Course not found." });
    return res.json({ course });
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") return res.status(400).json({ message: error.message });
    console.error("Admin course update failed:", error.message);
    return res.status(500).json({ message: "Failed to update course." });
  }
});

router.post("/courses/:courseId/publish", async (req, res) => {
  try {
    const course = await Course.findOneAndUpdate({ id: req.params.courseId }, { $set: { status: "published" } }, { returnDocument: "after" }).lean();
    if (!course) return res.status(404).json({ message: "Course not found." });
    return res.json({ course });
  } catch (error) {
    console.error("Course publish failed:", error.message);
    return res.status(500).json({ message: "Failed to publish course." });
  }
});

router.post("/courses/:courseId/archive", async (req, res) => {
  try {
    const course = await Course.findOneAndUpdate({ id: req.params.courseId }, { $set: { status: "archived" } }, { returnDocument: "after" }).lean();
    if (!course) return res.status(404).json({ message: "Course not found." });
    return res.json({ course });
  } catch (error) {
    console.error("Course archive failed:", error.message);
    return res.status(500).json({ message: "Failed to archive course." });
  }
});

router.delete("/courses/:courseId", async (req, res) => {
  try {
    const course = await Course.findOne({ id: req.params.courseId }).select("_id");
    if (!course) return res.status(404).json({ message: "Course not found." });
    const [enrollmentCount, paymentCount] = await Promise.all([
      Enrollment.countDocuments({ course: course._id }),
      Payment.countDocuments({ course: course._id }),
    ]);
    if (enrollmentCount || paymentCount) {
      return res.status(409).json({ message: "Course has enrollment or payment history; archive it instead." });
    }
    await course.deleteOne();
    return res.json({ deleted: true });
  } catch (error) {
    console.error("Course deletion failed:", error.message);
    return res.status(500).json({ message: "Failed to delete course." });
  }
});

router.get("/categories", async (req, res) => {
  try {
    const categories = await Course.distinct("category", { category: { $type: "string", $ne: "" } });
    return res.json({ categories: categories.sort((a, b) => a.localeCompare(b)) });
  } catch (error) {
    console.error("Admin category listing failed:", error.message);
    return res.status(500).json({ message: "Failed to list categories." });
  }
});

router.get("/enrollments", async (req, res) => {
  try {
    const { page, limit, skip } = pagination(req.query);
    const [rows, total] = await Promise.all([
      Enrollment.find().select("user course accessType createdAt")
        .populate("user", "name email")
        .populate("course", "id title category price status")
        .sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Enrollment.countDocuments(),
    ]);
    const items = rows.filter(({ user, course }) => user && course).map(({ _id, user, course, accessType, createdAt }) => ({
      id: _id.toString(), user, course, accessType: accessType ?? "unknown", enrolledAt: createdAt,
    }));
    return res.json(pageResult(items, total, page, limit));
  } catch (error) {
    console.error("Admin enrollment listing failed:", error.message);
    return res.status(500).json({ message: "Failed to list enrollments." });
  }
});

export default router;
