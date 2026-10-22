import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { apiFetch } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function MyLearning() {
  const navigate = useNavigate();
  const { user, authLoading } = useAuth();

  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    let cancelled = false;

    async function loadEnrollments() {
      setLoading(true);
      setError("");

      try {
        const data = await apiFetch("/api/enrollments/my");

        if (!cancelled) {
          setEnrollments(data.enrollments);
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

    loadEnrollments();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading, navigate]);

  if (authLoading || loading) {
    return <p className="p-8 text-center">Loading your courses...</p>;
  }

  if (error) {
    return (
      <main className="mx-auto max-w-6xl px-5 py-12">
        <p role="alert" className="text-red-600">
          Couldn't load your courses: {error}
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-semibold uppercase tracking-wider text-violet-600">
          Your learning journey
        </p>

        <h1 className="mt-2 text-3xl font-bold text-slate-900">My Learning</h1>

        <p className="mt-3 text-slate-600">
          Continue where you left off and keep building your skills.
        </p>

        {enrollments.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <h2 className="text-xl font-semibold text-slate-900">
              You haven't enrolled in any courses yet
            </h2>

            <p className="mt-2 text-slate-500">
              Explore our courses and start learning something new.
            </p>

            <Link
              to="/courses"
              className="mt-6 inline-block rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white hover:bg-violet-700"
            >
              Explore courses
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {enrollments.map((enrollment) => {
              const course = enrollment.course;

              return (
                <article
                  key={enrollment.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  <img
                    src={course.image}
                    alt={course.title}
                    className="h-44 w-full bg-slate-100 object-cover"
                  />

                  <div className="p-5">
                    <p className="text-sm text-violet-600">
                      {course.category} · {course.level}
                    </p>

                    <h2 className="mt-2 text-lg font-bold text-slate-900">
                      {course.title}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      By {course.instructor}
                    </p>

                    <div className="mt-5">
                      <div className="mb-2 flex justify-between text-sm">
                        <span className="text-slate-600">Progress</span>
                        <span className="font-semibold text-slate-900">
                          {enrollment.progress}%
                        </span>
                      </div>

                      <div
                        role="progressbar"
                        aria-label={`${course.title} progress`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={enrollment.progress}
                        className="h-2 overflow-hidden rounded-full bg-violet-100"
                      >
                        <div
                          className="h-full rounded-full bg-violet-600 transition-all"
                          style={{
                            width: `${enrollment.progress}%`,
                          }}
                        />
                      </div>
                    </div>

                    <Link
                      to={`/courses/${encodeURIComponent(course.id)}/learn`}
                      className="mt-5 block rounded-lg bg-violet-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-violet-700"
                    >
                      Continue learning
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
