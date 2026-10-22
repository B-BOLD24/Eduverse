
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { apiFetch } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function CourseLearning() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user, authLoading } = useAuth();

  const [course, setCourse] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingLesson, setProcessingLesson] = useState("");
  const [error, setError] = useState("");

  // Load the course and this user's enrollment.
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    let cancelled = false;

    async function loadLearningData() {
      setLoading(true);
      setError("");

      try {
        const [courseData, enrollmentData] = await Promise.all([
          apiFetch(`/api/courses/${encodeURIComponent(courseId)}`),
          apiFetch(`/api/enrollments/${encodeURIComponent(courseId)}`),
        ]);

        if (cancelled) return;

        // Only enrolled users can access the learning page.
        if (!enrollmentData.enrolled) {
          navigate(`/courses/${encodeURIComponent(courseId)}`, {
            replace: true,
          });
          return;
        }

        setCourse(courseData.course);
        setEnrollment(enrollmentData);
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

    loadLearningData();

    return () => {
      cancelled = true;
    };
  }, [courseId, user, authLoading, navigate]);

  // Save a completed lesson through our Express API.
  async function handleCompleteLesson(lessonId) {
    if (!enrollment || processingLesson) return;

    setProcessingLesson(lessonId);
    setError("");

    try {
      const data = await apiFetch(
        `/api/enrollments/${encodeURIComponent(courseId)}/progress`,
        {
          method: "PATCH",
          body: JSON.stringify({ lessonId }),
        }
      );

      // Update the UI with the progress saved by the backend.
      setEnrollment((previous) => ({
        ...previous,
        progress: data.progress,
        completedLessons: data.completedLessons,
      }));
    } catch (error) {
      setError(error.message);
    } finally {
      setProcessingLesson("");
    }
  }

  if (loading || authLoading) {
    return <p className="p-8 text-center">Loading your course...</p>;
  }

  if (error && !course) {
    return (
      <p role="alert" className="p-8 text-center text-red-600">
        Couldn't load the course: {error}
      </p>
    );
  }

  if (!course || !enrollment) return null;

  const lessons = course.curriculum ?? [];
  const completedLessons = enrollment.completedLessons ?? [];

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10">
      <div className="mx-auto max-w-4xl">
        <Link
          to={`/courses/${course.id}`}
          className="text-sm font-medium text-violet-600 hover:text-violet-700"
        >
          ← Back to course details
        </Link>

        <h1 className="mt-6 text-3xl font-bold text-slate-900">
          {course.title}
        </h1>

        <p className="mt-2 text-slate-600">
          Continue learning at your own pace.
        </p>

        {/* Progress saved in MongoDB */}
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
          <div className="mb-3 flex justify-between text-sm">
            <span className="font-semibold text-slate-800">
              Course progress
            </span>
            <span className="text-slate-600">
              {enrollment.progress}% complete
            </span>
          </div>

          <div
            role="progressbar"
            aria-label="Course progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={enrollment.progress}
            className="h-3 overflow-hidden rounded-full bg-violet-100"
          >
            <div
              className="h-full rounded-full bg-violet-600 transition-all"
              style={{ width: `${enrollment.progress}%` }}
            />
          </div>
        </section>

        {error && (
          <p role="alert" className="mt-5 text-sm text-red-600">
            {error}
          </p>
        )}

        {/* List the lessons configured for this course */}
        <section className="mt-8 space-y-4">
          <h2 className="text-xl font-bold text-slate-900">
            Course lessons
          </h2>

          {lessons.length === 0 ? (
            <p className="rounded-xl border border-slate-200 bg-white p-5 text-slate-600">
              Lessons haven't been added to this course yet.
            </p>
          ) : (
            lessons.map((lessonId, index) => {
              const isCompleted = completedLessons.includes(lessonId);
              const title = lessonId
                .replace(/-/g, " ")
                .replace(/\b\w/g, (letter) => letter.toUpperCase());

              return (
                <div
                  key={lessonId}
                  className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center"
                >
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Lesson {index + 1}
                    </p>
                    <h3 className="mt-1 font-semibold text-slate-900">
                      {title}
                    </h3>
                  </div>

                  <button
                    type="button"
                    disabled={isCompleted || Boolean(processingLesson)}
                    onClick={() => handleCompleteLesson(lessonId)}
                    className="rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {isCompleted
                      ? "Completed ✓"
                      : processingLesson === lessonId
                        ? "Saving..."
                        : "Mark as complete"}
                  </button>
                </div>
              );
            })
          )}
        </section>
      </div>
    </main>
  );
}
