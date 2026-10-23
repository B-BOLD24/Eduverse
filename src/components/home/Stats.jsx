const stats = [
  { value: "50K+", label: "Learners" },
  { value: "200+", label: "Courses" },
  { value: "100+", label: "Expert Instructors" },
  { value: "95%", label: "Satisfaction Rate" },
];

export const Stats = () => {
  return (
    <section className="grid grid-cols-2 gap-6 px-6 py-10 md:grid-cols-4">
  {stats.map((stat) => (
    <div key={stat.label} className="text-center">
      <h2 className="text-3xl font-bold tracking-tight text-violet-600 dark:text-violet-400 sm:text-4xl">
        {stat.value}
      </h2>

      <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-300 sm:text-base">
        {stat.label}
      </p>
    </div>
  ))}
</section>
  );
};
