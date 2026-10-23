import { Router } from "express";
import Course from "../models/Course.js";

const router = Router();
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
router.get("/", async (req, res) => {
  try {
    const filter = { status: "published" };
    const search = String(req.query.search ?? "")
      .trim()
      .slice(0, 100);

    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");
      filter.$or = [
        { title: regex },
        { instructor: regex },
        { category: regex },
      ];
    }
    const category = String(req.query.category ?? "");
    const level = String(req.query.level ?? "");

    if (category && category !== "All") {
      filter.category = category;
    }

    if (level && level !== "All") {
      filter.level = level;
    }
    if (req.query.maxPrice !== undefined && req.query.maxPrice !== "all") {
      const maxPrice = Number(req.query.maxPrice);

      if (!Number.isFinite(maxPrice) || maxPrice < 0) {
        return res.status(400).json({
          message: "Invalid maximum price.",
        });
      }

      filter.price = { $lte: maxPrice };
    }
    if (req.query.minRating !== undefined) {
      const minRating = Number(req.query.minRating);

      if (!Number.isFinite(minRating) || minRating < 0 || minRating > 5) {
        return res.status(400).json({
          message: "Invalid minimum rating.",
        });
      }

      filter.rating = { $gte: minRating };
    }

    // Sorting
    const sortBy = String(req.query.sortBy ?? "popular");

    const sortOptions = {
      popular: { students: -1 },
      rating: { rating: -1 },
      "price-low": { price: 1 },
      "price-high": { price: -1 },
      newest: { createdAt: -1 },
    };

    const sort = sortOptions[sortBy] ?? sortOptions.popular;

    // Pagination
    const page = Math.max(
      1,
      Number.parseInt(String(req.query.page ?? "1"), 10) || 1,
    );

    const limit = Math.min(
      50,
      Math.max(1, Number.parseInt(String(req.query.limit ?? "8"), 10) || 8),
    );

    const skip = (page - 1) * limit;

    // Fetch this page and count all matching courses
    const [courses, total] = await Promise.all([
      Course.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      Course.countDocuments(filter),
    ]);

    const result = courses.map(({ _id, __v, ...course }) => ({
      ...course,
    }));

    const totalPages = Math.ceil(total / limit);

    res.json({
      courses: result,
      total,
      page,
      limit,
      totalPages,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Failed to fetch courses:", error.message);

    res.status(500).json({
      message: "Failed to fetch courses.",
    });
  }
});

router.get("/:courseId", async (req, res) => {
  try {
    const course = await Course.findOne({
      id: req.params.courseId,
      status: "published",
    }).lean();

    if (!course) {
      return res.status(404).json({
        message: "Course not found",
      });
    }

    const { _id, __v, ...courseData } = course;

    res.json({
      course: courseData,
    });
  } catch (error) {
    console.error("Failed to fetch course:", error.message);

    res.status(500).json({
      message: "Failed to fetch course",
    });
  }
});

export default router;
