import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../../lib/api.js";
import { Alert, EmptyState, LoadingState, PageHeading, Pagination, StatusBadge } from "../../components/admin/AdminUi.jsx";
import { formatDate } from "../../lib/adminFormat.js";

const PAGE_SIZE = 12;

function summaryTone(summary) {
  if (summary === "paid") return "green";
  if (summary === "mixed") return "violet";
  if (summary === "free") return "amber";
  return "slate";
}

export default function AdminStudents() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadStudents() {
      setLoading(true);
      setError("");
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (search.trim()) params.set("search", search.trim());
      try {
        const result = await apiFetch(`/api/admin/students?${params}`);
        if (active) setData(result);
      } catch (loadError) {
        if (active) setError(loadError.message);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadStudents();
    return () => { active = false; };
  }, [page, search]);

  function updateSearch(value) {
    setSearch(value);
    setPage(1);
  }

  return (
    <>
      <PageHeading title="Students" description="Search student accounts and review their course access summaries." />
      <div className="mb-5 max-w-xl">
        <label htmlFor="student-search" className="mb-2 block text-sm font-semibold text-slate-700">Search students</label>
        <input id="student-search" type="search" value={search} onChange={(event) => updateSearch(event.target.value)} placeholder="Name or email" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100" />
      </div>
      {error && <div className="mb-5"><Alert>{error}</Alert></div>}
      {loading ? <LoadingState label="Loading students…" /> : data?.items?.length ? (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr><th className="px-5 py-4 font-semibold">Student</th><th className="px-5 py-4 font-semibold">Registered</th><th className="px-5 py-4 font-semibold">Enrollments</th><th className="px-5 py-4 font-semibold">Access summary</th><th className="px-5 py-4" /></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-4"><p className="font-semibold text-slate-900">{student.name}</p><p className="mt-1 text-xs text-slate-500">{student.email}</p></td>
                    <td className="px-5 py-4 text-slate-600">{formatDate(student.createdAt)}</td>
                    <td className="px-5 py-4 font-medium text-slate-700">{student.enrollmentCount}</td>
                    <td className="px-5 py-4"><div className="flex flex-wrap items-center gap-2"><StatusBadge tone={summaryTone(student.accessSummary)}>{student.accessSummary}</StatusBadge>{student.accessCounts?.unknown > 0 && <span className="text-xs text-amber-700">{student.accessCounts.unknown} unresolved</span>}</div></td>
                    <td className="px-5 py-4 text-right"><Link to={`/admin/students/${encodeURIComponent(student.id)}`} className="font-semibold text-violet-700 hover:text-violet-900">View details</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
        </section>
      ) : (
        <EmptyState title={search ? "No students match that search" : "No students yet"} description={search ? "Try another name or email address." : "Student accounts will appear here after they register."} />
      )}
    </>
  );
}
