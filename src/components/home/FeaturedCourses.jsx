import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { apiFetch } from "../../lib/api.js";
import { CourseCard } from "../CourseCard.jsx";

export const FeaturedCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch courses from our Express API.
  useEffect(() => {
    let cancelled = false;

    async function loadCourses() {
      try {
        const data = await apiFetch("/api/courses?limit=50");

        if (!cancelled) {
          setCourses(data.courses);
        }
      } catch (error) {
        if (!cancelled) {
          setError(error.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadCourses();

    return () => {
      cancelled = true;
    };
  }, []);

  // Select up to four featured courses.
  const featuredCourses = courses
    .filter((course) => course.featured)
    .slice(0, 4);

  return (
    <>
      {/* Section heading */}
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-violet-600">
            Keep Learning
          </p>

          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            Featured Courses
          </h2>

          <p className="mt-2 text-slate-600">
            Explore courses selected to help you grow.
          </p>
        </div>

        <Link
          to="/courses"
          className="shrink-0 rounded-lg px-3 py-2 font-semibold text-violet-600 transition hover:bg-violet-50"
        >
          View all courses →
        </Link>
      </div>

      {/* Loading, error, or featured courses */}
      {loading ? (
        <p className="py-10 text-center text-slate-600">
          Loading featured courses...
        </p>
      ) : error ? (
        <p role="alert" className="py-10 text-center text-red-600">
          Couldn't load featured courses: {error}
        </p>
      ) : featuredCourses.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4">
          {featuredCourses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      ) : (
        <p className="py-10 text-center text-slate-600">
          No featured courses available right now.
        </p>
      )}
    </>
  );
};
