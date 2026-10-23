import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../../lib/api.js";
import { Alert, EmptyState, LoadingState, PageHeading, Pagination, StatusBadge } from "../../components/admin/AdminUi.jsx";
import { formatDate } from "../../lib/adminFormat.js";

const PAGE_SIZE = 10;
const buttonClass = "rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 transition hover:border-violet-200 hover:bg-violet-50 dark:hover:bg-violet-950 hover:text-violet-700 dark:hover:text-violet-300 disabled:cursor-not-allowed disabled:opacity-50";
const primaryButtonClass = "rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50";
const fieldClass = "mt-1.5 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100 dark:focus:ring-violet-900";

const blankCourse = {
  title: "",
  description: "",
  category: "",
  instructor: "",
  price: "0",
  image: "",
  duration: "",
  level: "Beginner",
  curriculum: "",
};

function CourseForm({ course, categories, saving, onCancel, onSubmit }) {
  const [form, setForm] = useState(() => course ? {
    title: course.title ?? "",
    description: course.description ?? "",
    category: course.category ?? "",
    instructor: course.instructor ?? "",
    price: String(course.price ?? 0),
    image: course.image ?? "",
    duration: course.duration ?? "",
    level: course.level ?? "Beginner",
    curriculum: (course.curriculum ?? []).join("\n"),
  } : blankCourse);
  const [formError, setFormError] = useState("");

  function update(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function submit(event) {
    event.preventDefault();
    setFormError("");
    const price = Number(form.price);
    if (!Number.isFinite(price) || price < 0) {
      setFormError("Enter a valid non-negative price.");
      return;
    }
    const curriculum = form.curriculum.split("\n").map((item) => item.trim()).filter(Boolean);
    onSubmit({
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category.trim(),
      instructor: form.instructor.trim(),
      price,
      image: form.image.trim(),
      duration: form.duration.trim(),
      level: form.level,
      curriculum,
    }).catch((error) => setFormError(error.message));
  }

  return (
    <form onSubmit={submit} className="space-y-5 rounded-2xl border border-violet-200 dark:border-violet-800 bg-white dark:bg-slate-900 p-5 shadow-sm sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <div><p className="text-xs font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-400">{course ? "Course editor" : "New course"}</p><h2 className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">{course ? `Edit ${course.title}` : "Create a course"}</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">New courses start as drafts and are not visible to students until published.</p></div>
        <button type="button" onClick={onCancel} aria-label="Close course form" className="rounded-lg px-2 py-1 text-lg text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700">×</button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 sm:col-span-2">Title<input name="title" required maxLength={140} value={form.title} onChange={update} className={fieldClass} /></label>
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 sm:col-span-2">Description<textarea name="description" rows="3" value={form.description} onChange={update} className={fieldClass} /></label>
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Category<input name="category" list="admin-course-categories" required maxLength={80} value={form.category} onChange={update} placeholder="Choose or enter a category" className={fieldClass} /><datalist id="admin-course-categories">{categories.map((category) => <option key={category} value={category} />)}</datalist><span className="mt-1 block text-xs font-normal text-slate-400 dark:text-slate-500">Existing categories come from course data; you can add a new one by typing it.</span></label>
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Instructor<input name="instructor" required maxLength={120} value={form.instructor} onChange={update} className={fieldClass} /></label>
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Price (₹)<input name="price" type="number" min="0" step="0.01" required value={form.price} onChange={update} className={fieldClass} /></label>
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Duration<input name="duration" required maxLength={80} value={form.duration} onChange={update} placeholder="e.g. 8 hours" className={fieldClass} /></label>
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Level<select name="level" value={form.level} onChange={update} className={fieldClass}><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></label>
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Image URL<input name="image" type="url" value={form.image} onChange={update} placeholder="https://…" className={fieldClass} /></label>
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 sm:col-span-2">Curriculum<textarea name="curriculum" rows="5" value={form.curriculum} onChange={update} placeholder={"One lesson ID per line\nlesson-one\nlesson-two"} className={fieldClass} /><span className="mt-1 block text-xs font-normal text-slate-400 dark:text-slate-500">Enter one lesson identifier per line.</span></label>
      </div>

      {formError && <Alert>{formError}</Alert>}
      <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
        <button type="button" onClick={onCancel} className={buttonClass}>Cancel</button>
        <button type="submit" disabled={saving} className={primaryButtonClass}>{saving ? "Saving…" : course ? "Save changes" : "Create draft"}</button>
      </div>
    </form>
  );
}

function courseTone(status) {
  return status === "published" ? "green" : status === "archived" ? "slate" : "amber";
}

export default function AdminCourses() {
  const [data, setData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;
    apiFetch("/api/admin/categories")
      .then((result) => { if (active) setCategories(result.categories ?? []); })
      .catch((loadError) => { if (active) setError(`Could not load categories: ${loadError.message}`); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    async function loadCourses() {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
        if (status !== "all") params.set("status", status);
        const result = await apiFetch(`/api/admin/courses?${params}`);
        if (active) { setData(result); setError(""); }
      } catch (loadError) {
        if (active) setError(loadError.message);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadCourses();
    return () => { active = false; };
  }, [page, status, refreshKey]);

  const refresh = useCallback(() => setRefreshKey((key) => key + 1), []);

  async function saveCourse(payload) {
    setSaving(true);
    try {
      if (editing) {
        await apiFetch(`/api/admin/courses/${encodeURIComponent(editing.id)}`, { method: "PATCH", body: JSON.stringify(payload) });
        setSuccess("Course changes saved.");
      } else {
        await apiFetch("/api/admin/courses", { method: "POST", body: JSON.stringify(payload) });
        setSuccess("Course created as a draft.");
      }
      setEditing(null);
      setCreating(false);
      refresh();
    } finally {
      setSaving(false);
    }
  }

  async function updateCourse(course, fields, message) {
    setError("");
    setSuccess("");
    try {
      await apiFetch(`/api/admin/courses/${encodeURIComponent(course.id)}`, { method: "PATCH", body: JSON.stringify(fields) });
      setSuccess(message);
      refresh();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function changeStatus(course, nextStatus) {
    if (nextStatus === "archived" && !window.confirm(`Archive “${course.title}”? Students with enrollments will keep course access.`)) return;
    setError("");
    setSuccess("");
    try {
      if (nextStatus === "published") {
        await apiFetch(`/api/admin/courses/${encodeURIComponent(course.id)}/publish`, { method: "POST" });
      } else if (nextStatus === "archived") {
        await apiFetch(`/api/admin/courses/${encodeURIComponent(course.id)}/archive`, { method: "POST" });
      } else {
        await apiFetch(`/api/admin/courses/${encodeURIComponent(course.id)}`, { method: "PATCH", body: JSON.stringify({ status: "draft" }) });
      }
      setSuccess(nextStatus === "draft" ? "Course unpublished and saved as a draft." : `Course ${nextStatus}.`);
      refresh();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function deleteCourse(course) {
    if (!window.confirm(`Permanently delete “${course.title}”? This cannot be undone.`)) return;
    setError("");
    setSuccess("");
    try {
      await apiFetch(`/api/admin/courses/${encodeURIComponent(course.id)}`, { method: "DELETE" });
      setSuccess("Course deleted.");
      refresh();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  const headingAction = !creating && !editing && (
    <button type="button" onClick={() => { setSuccess(""); setCreating(true); }} className={primaryButtonClass}>+ New course</button>
  );

  return (
    <>
      <PageHeading title="Courses" description="Create courses as drafts, then publish them when they are ready." action={headingAction} />
      {(error || success) && <div className="mb-5">{error ? <Alert>{error}</Alert> : <Alert variant="success">{success}</Alert>}</div>}
      {(creating || editing) && <div className="mb-6"><CourseForm key={editing?.id ?? "new-course"} course={editing} categories={categories} saving={saving} onCancel={() => { setCreating(false); setEditing(null); }} onSubmit={saveCourse} /></div>}

      {!creating && !editing && (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-300">Status
              <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 outline-none focus:border-violet-400"><option value="all">All courses</option><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select>
            </label>
            <p className="text-sm text-slate-500 dark:text-slate-400">{data?.total ?? 0} courses</p>
          </div>
          {loading ? <LoadingState label="Loading courses…" /> : data?.items?.length ? (
            <section className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-950 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400"><tr><th className="px-5 py-4 font-semibold">Course</th><th className="px-5 py-4 font-semibold">Category</th><th className="px-5 py-4 font-semibold">Price</th><th className="px-5 py-4 font-semibold">Status</th><th className="px-5 py-4 font-semibold">Updated</th><th className="px-5 py-4 font-semibold">Actions</th></tr></thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {data.items.map((course) => (
                      <tr key={course.id} className="align-top hover:bg-slate-50/70 dark:hover:bg-slate-800/70">
                        <td className="px-5 py-4"><div className="flex items-center gap-3">{course.image ? <img src={course.image} alt="" className="h-12 w-16 rounded-lg bg-slate-100 dark:bg-slate-800 object-cover" /> : <div className="grid h-12 w-16 place-items-center rounded-lg bg-violet-50 dark:bg-violet-950 text-violet-600 dark:text-violet-400" aria-hidden="true">▤</div>}<div className="max-w-xs"><p className="font-semibold text-slate-900 dark:text-slate-100">{course.title}</p><p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">{course.instructor} · {course.duration}</p>{course.featured && <span className="mt-1 inline-block text-xs font-semibold text-amber-600 dark:text-amber-400">★ Featured</span>}</div></div></td>
                        <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{course.category}</td>
                        <td className="px-5 py-4 font-medium text-slate-700 dark:text-slate-300">{course.price > 0 ? `₹${course.price}` : "Free"}</td>
                        <td className="px-5 py-4"><StatusBadge tone={courseTone(course.status)}>{course.status ?? "unmigrated"}</StatusBadge></td>
                        <td className="px-5 py-4 text-slate-500 dark:text-slate-400">{formatDate(course.updatedAt)}</td>
                        <td className="px-5 py-4"><div className="flex max-w-sm flex-wrap gap-2">
                          <button type="button" onClick={() => { setError(""); setSuccess(""); setEditing(course); }} className={buttonClass}>Edit</button>
                          <button type="button" onClick={() => updateCourse(course, { featured: !course.featured }, course.featured ? "Course unfeatured." : "Course featured.")} className={buttonClass}>{course.featured ? "Unfeature" : "Feature"}</button>
                          {course.status === "published" ? <button type="button" onClick={() => changeStatus(course, "draft")} className={buttonClass}>Unpublish</button> : <button type="button" onClick={() => changeStatus(course, "published")} className={buttonClass}>Publish</button>}
                          {course.status !== "archived" && <button type="button" onClick={() => changeStatus(course, "archived")} className={`${buttonClass} border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 hover:bg-amber-50`}>Archive</button>}
                          <button type="button" onClick={() => deleteCourse(course)} className={`${buttonClass} border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-50`}>Delete</button>
                        </div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
            </section>
          ) : (
            <EmptyState title={status === "all" ? "No courses yet" : `No ${status} courses`} description="Create a course to add learning content to Eduverse." />
          )}
        </>
      )}
    </>
  );
}
