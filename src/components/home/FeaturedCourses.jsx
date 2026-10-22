import { courses } from "../../data/courses";
import { CourseCard } from "../CourseCard";
import { Route,Link } from "react-router-dom";
export const FeaturedCourses = () => {
  return (
    <>
      
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-violet-600">
            Keep Learning
          </p>

          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            Featured Courses
          </h2>

          <p className="mt-2 text-slate-600">
            Explore courses selected to help you grow.
          </p>
        </div>

        <Link
          to="/courses"
          className="shrink-0 rounded-lg px-3 py-2 font-semibold text-violet-600 transition hover:bg-violet-50"
        >
          View all courses →
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4">
        {courses
          .filter((course) => course.featured).slice(0,4)
          .map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
      </div>
    </>
  );
};
