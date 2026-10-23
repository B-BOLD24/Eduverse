import heroBg from "../../assets/hero-bg.svg";

export const Hero = () => {
  return (
    <section className="relative isolate flex min-h-[520px] w-full items-center overflow-hidden bg-linear-to-br from-violet-50 via-white to-indigo-50 px-6 py-16 transition-colors dark:from-slate-950 dark:via-slate-950 dark:to-violet-950 sm:px-10 lg:px-16">

      <img
        src={heroBg}
        alt=""
        className="absolute right-0 top-1/2 hidden h-[85%] w-[42%] max-w-140 -translate-y-1/2 object-contain object-right md:block"
      />

      <div className="relative z-10 w-full md:w-[58%]">

        <h1 className="font-sans text-4xl font-bold leading-tight tracking-tight text-slate-900 dark:text-slate-100 sm:text-5xl lg:text-6xl">
          Upgrade Your Skills.
          <span className="block text-violet-600 dark:text-violet-400">
            Build Your Future.
          </span>
        </h1>

        <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg sm:leading-8">
          Explore high-quality courses, learn from industry experts,
          and take your career to the next level.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-4">

          <button className="rounded-xl bg-violet-600 px-6 py-3.5 font-semibold text-white shadow-lg shadow-violet-600/20 transition duration-200 hover:-translate-y-0.5 hover:bg-violet-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600">
            Explore Courses
          </button>

          <button className="rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-6 py-3.5 font-semibold text-slate-700 dark:text-slate-300 transition duration-200 hover:border-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600">
            Watch Demo
          </button>

        </div>
      </div>
    </section>
  );
};
