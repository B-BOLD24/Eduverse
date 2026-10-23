import { useEffect, useMemo, useState } from "react";
import { fetchAllAdminEnrollments } from "../../lib/adminApi.js";
import { Alert, EmptyState, LoadingState, PageHeading, Pagination, StatusBadge } from "../../components/admin/AdminUi.jsx";
import { formatDate } from "../../lib/adminFormat.js";

const PAGE_SIZE = 15;

export default function AdminEnrollments() {
  const [enrollments, setEnrollments] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadEnrollments() {
      setLoading(true);
      setError("");
      try {
        const result = await fetchAllAdminEnrollments();
        if (active) setEnrollments(result);
      } catch (loadError) {
        if (active) setError(loadError.message);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadEnrollments();
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase();
    if (!normalized) return enrollments;
    return enrollments.filter((item) => [
      item.user?.name,
      item.user?.email,
      item.course?.title,
      item.course?.category,
      item.accessType,
    ].some((value) => String(value ?? "").toLocaleLowerCase().includes(normalized)));
  }, [enrollments, search]);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <PageHeading title="Enrollments" description="Search and review course access records. Enrollment management is read-only." />
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <label htmlFor="enrollment-search" className="w-full max-w-xl text-sm font-semibold text-slate-700 dark:text-slate-300">Search enrollments
          <input id="enrollment-search" type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Student, email, course, category, or access type" className="mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm font-normal outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100 dark:focus:ring-violet-900" />
        </label>
        {!loading && <p className="text-sm text-slate-500 dark:text-slate-400">{filtered.length} {filtered.length === 1 ? "record" : "records"}</p>}
      </div>
      {error && <div className="mb-5"><Alert>{error}</Alert></div>}
      {loading ? <LoadingState label="Loading enrollment records…" /> : visible.length ? (
        <section className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-950 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400"><tr><th className="px-5 py-4 font-semibold">Student</th><th className="px-5 py-4 font-semibold">Course</th><th className="px-5 py-4 font-semibold">Enrolled</th><th className="px-5 py-4 font-semibold">Access type</th></tr></thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {visible.map((enrollment) => (
                  <tr key={enrollment.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/70">
                    <td className="px-5 py-4"><p className="font-semibold text-slate-900 dark:text-slate-100">{enrollment.user?.name}</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{enrollment.user?.email}</p></td>
                    <td className="px-5 py-4"><p className="font-medium text-slate-800 dark:text-slate-200">{enrollment.course?.title}</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{enrollment.course?.category}</p></td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{formatDate(enrollment.enrolledAt)}</td>
                    <td className="px-5 py-4"><StatusBadge tone={enrollment.accessType === "paid" ? "green" : enrollment.accessType === "free" ? "violet" : "amber"}>{enrollment.accessType ?? "unknown"}</StatusBadge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </section>
      ) : (
        <EmptyState title={search ? "No enrollments match that search" : "No enrollments yet"} description={search ? "Try another student, course, category, or access type." : "Enrollment records will appear here when students join courses."} />
      )}
    </>
  );
}
