import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiFetch } from "../../lib/api.js";
import { Alert, EmptyState, LoadingState, PageHeading, StatusBadge } from "../../components/admin/AdminUi.jsx";
import { formatDate } from "../../lib/adminFormat.js";

export default function AdminStudentDetails() {
  const { studentId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadStudent() {
      setLoading(true);
      setError("");
      try {
        const result = await apiFetch(`/api/admin/students/${encodeURIComponent(studentId)}`);
        if (active) setData(result);
      } catch (loadError) {
        if (active) setError(loadError.message);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadStudent();
    return () => { active = false; };
  }, [studentId]);

  if (loading) return <LoadingState label="Loading student details…" />;
  if (error) return <><PageHeading title="Student details" /><Alert>{error}</Alert><Link className="mt-5 inline-block text-sm font-semibold text-violet-700" to="/admin/students">← Back to students</Link></>;

  const student = data.student;
  return (
    <>
      <Link to="/admin/students" className="mb-5 inline-block text-sm font-semibold text-violet-700 hover:text-violet-900">← Back to students</Link>
      <PageHeading eyebrow="Student account" title={student.name} description="Account details and course access. Learning progress is not shown here." />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</p><p className="mt-2 break-all font-semibold text-slate-900">{student.email}</p></article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Registered</p><p className="mt-2 font-semibold text-slate-900">{formatDate(student.createdAt)}</p></article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Enrollment summary</p><p className="mt-2 font-semibold text-slate-900">{data.enrollmentCount} courses · {data.accessSummary}</p><p className="mt-2 text-xs text-slate-500">{data.accessCounts.paid} paid · {data.accessCounts.free} free · {data.accessCounts.unknown} unresolved</p></article>
      </section>

      <section className="mt-7">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div><h2 className="text-lg font-semibold text-slate-900">Course enrollments</h2><p className="mt-1 text-sm text-slate-500">Access type is shown per enrollment.</p></div>
        </div>
        {data.enrollments.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {data.enrollments.map((enrollment) => (
              <article key={enrollment.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0"><h3 className="font-semibold text-slate-900">{enrollment.course.title}</h3><p className="mt-1 text-sm text-slate-500">{enrollment.course.category} · {enrollment.course.price > 0 ? `₹${enrollment.course.price}` : "Free course"}</p></div>
                  <StatusBadge tone={enrollment.accessType === "paid" ? "green" : enrollment.accessType === "free" ? "violet" : "amber"}>{enrollment.accessType}</StatusBadge>
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500"><span>Enrolled {formatDate(enrollment.enrolledAt)}</span><span>{enrollment.course.status ?? "unmigrated"}</span></div>
              </article>
            ))}
          </div>
        ) : <EmptyState title="No course enrollments" description="This student has not enrolled in a course yet." />}
      </section>
    </>
  );
}
