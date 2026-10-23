export function PageHeading({ eyebrow = "Admin workspace", title, description, action }) {
  return (
    <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-600 dark:text-violet-400">{eyebrow}</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Alert({ children, variant = "error" }) {
  const colors = variant === "success"
    ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300"
    : "border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300";
  return <p role={variant === "error" ? "alert" : "status"} className={`rounded-xl border px-4 py-3 text-sm ${colors}`}>{children}</p>;
}

export function LoadingState({ label = "Loading…" }) {
  return <div role="status" className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-5 py-12 text-center text-sm text-slate-500 dark:text-slate-400">{label}</div>;
}

export function EmptyState({ title, description }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-5 py-12 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-violet-50 dark:bg-violet-950 text-xl text-violet-600 dark:text-violet-400" aria-hidden="true">✦</div>
      <h2 className="mt-4 font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
      {description && <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>}
    </div>
  );
}

export function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;
  return (
    <nav aria-label="Pagination" className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 px-4 py-4">
      <p className="text-sm text-slate-500 dark:text-slate-400">Page {page} of {totalPages}</p>
      <div className="flex gap-2">
        <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)} className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40">Previous</button>
        <button type="button" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40">Next</button>
      </div>
    </nav>
  );
}

export function StatusBadge({ children, tone = "slate" }) {
  const tones = {
    slate: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300",
    violet: "bg-violet-100 dark:bg-violet-900/60 text-violet-700 dark:text-violet-300",
    green: "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300",
    amber: "bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300",
    red: "bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300",
  };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone] ?? tones.slate}`}>{children}</span>;
}

