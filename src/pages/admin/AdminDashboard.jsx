import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../../lib/api.js";
import { fetchAllAdminEnrollments } from "../../lib/adminApi.js";
import { EmptyState, LoadingState, PageHeading, StatusBadge } from "../../components/admin/AdminUi.jsx";
import { formatDate } from "../../lib/adminFormat.js";

const cardClass = "rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm";

export default function AdminDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [topCourses, setTopCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadDashboard() {
      setLoading(true);
      setError("");
      try {
        const [summary, enrollments] = await Promise.all([
          apiFetch("/api/admin/dashboard"),
          fetchAllAdminEnrollments(),
        ]);
        const counts = new Map();
        for (const enrollment of enrollments) {
          const course = enrollment.course;
          if (!course?.id) continue;
          const existing = counts.get(course.id) ?? { course, enrollments: 0 };
          existing.enrollments += 1;
          counts.set(course.id, existing);
        }
        if (active) {
          setDashboard(summary);
          setTopCourses([...counts.values()].sort((a, b) => b.enrollments - a.enrollments).slice(0, 5));
        }
      } catch (loadError) {
        if (active) setError(loadError.message);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadDashboard();
    return () => { active = false; };
  }, []);

  if (loading) return <LoadingState label="Loading dashboard summaries…" />;
  if (error) {
    return (
      <>
        <PageHeading title="Dashboard" description="A quick view of Eduverse activity." />
        <div className="rounded-2xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950 p-5 text-sm text-rose-700 dark:text-rose-300" role="alert">
          <p>{error}</p>
          <button type="button" onClick={() => window.location.reload()} className="mt-3 font-semibold underline">Reload dashboard</button>
        </div>
      </>
    );
  }

  const totals = dashboard?.totals ?? {};
  const metricCards = [
    { label: "Students", value: totals.students ?? 0, detail: "Registered student accounts", icon: "♙" },
    { label: "Courses", value: totals.courses ?? 0, detail: `${dashboard?.coursesByStatus?.published ?? 0} published`, icon: "▤" },
    { label: "Enrollments", value: totals.enrollments ?? 0, detail: "All recorded course enrollments", icon: "☷" },
  ];

  return (
    <>
      <PageHeading title="Dashboard" description="A quick view of Eduverse activity and the courses students are learning." />
      <section aria-label="Platform totals" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {metricCards.map((card) => (
          <article key={card.label} className={cardClass}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{card.label}</p>
                <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{card.value.toLocaleString()}</p>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{card.detail}</p>
              </div>
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-violet-50 dark:bg-violet-950 text-lg text-violet-700 dark:text-violet-300" aria-hidden="true">{card.icon}</span>
            </div>
          </article>
        ))}
      </section>

      <section className="mt-7 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className={cardClass}>
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Most enrolled courses</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Ranked from recorded enrollments.</p>
            </div>
            <Link to="/admin/courses" className="text-sm font-semibold text-violet-700 dark:text-violet-300 hover:text-violet-800 dark:hover:text-violet-300">All courses</Link>
          </div>
          {topCourses.length === 0 ? (
            <EmptyState title="No enrollments yet" description="Course rankings will appear after students enroll." />
          ) : (
            <ol className="divide-y divide-slate-100 dark:divide-slate-700">
              {topCourses.map(({ course, enrollments }, index) => (
                <li key={course.id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-violet-50 dark:bg-violet-950 text-sm font-bold text-violet-700 dark:text-violet-300">{index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-900 dark:text-slate-100">{course.title}</p>
                    <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">{course.category ?? "Uncategorized"}</p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-slate-700 dark:text-slate-300">{enrollments} {enrollments === 1 ? "enrollment" : "enrollments"}</span>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className={cardClass}>
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Recent enrollments</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Latest student course activity.</p>
            </div>
            <Link to="/admin/enrollments" className="text-sm font-semibold text-violet-700 dark:text-violet-300 hover:text-violet-800 dark:hover:text-violet-300">View all</Link>
          </div>
          {dashboard?.recentEnrollments?.length ? (
            <ul className="space-y-4">
              {dashboard.recentEnrollments.map((item) => (
                <li key={item._id} className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 last:border-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{item.user?.name ?? "Student"}</p>
                    <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">{item.course?.title ?? "Course"}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <StatusBadge tone={item.accessType === "paid" ? "green" : item.accessType === "free" ? "violet" : "amber"}>{item.accessType ?? "unknown"}</StatusBadge>
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{formatDate(item.createdAt)}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No recent enrollments" description="New enrollments will show here." />
          )}
        </div>
      </section>
    </>
  );
}
