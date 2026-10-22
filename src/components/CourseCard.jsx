import { Link } from "react-router-dom";

export const CourseCard = ({ course }) => {
  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg">

      {/* Course image */}
      <Link to={`/courses/${course.id}`} className="block">
        <div className="relative h-44 w-full overflow-hidden bg-slate-100">
          <img
            src={course.image}
            alt={course.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />

          {course.badge && (
            <span className="absolute left-3 top-3 rounded-full bg-violet-600 px-3 py-1 text-xs font-semibold text-white">
              {course.badge}
            </span>
          )}
        </div>
      </Link>

      {/* Course information */}
      <div className="p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">
          {course.category}
        </p>

        <h3 className="mt-2 line-clamp-2 min-h-12 text-lg font-semibold leading-snug text-slate-900">
          <Link
            to={`/courses/${course.id}`}
            className="transition hover:text-violet-700"
          >
            {course.title}
          </Link>
        </h3>

        <p className="mt-2 text-sm text-slate-500">
          By {course.instructor}
        </p>

        {/* Rating */}
        <div className="mt-3 flex items-center gap-2 text-sm">
          <span className="font-semibold text-slate-800">
            {course.rating}
          </span>
          <span className="text-amber-500" aria-hidden="true">
            ★
          </span>
          <span className="text-slate-500">
            ({course.reviews.toLocaleString()} reviews)
          </span>
        </div>

        {/* Price */}
        <div className="mt-4 flex items-baseline gap-2 border-t border-slate-100 pt-4">
          <span className="text-xl font-bold text-slate-900">
            ₹{course.price}
          </span>

          {course.originalPrice > course.price && (
            <span className="text-sm text-slate-400 line-through">
              ₹{course.originalPrice}
            </span>
          )}
        </div>

        {/* Additional information */}
        <div className="mt-2 flex items-center justify-between gap-2 text-xs text-slate-500">
          <span>{course.duration}</span>
          <span>{course.level}</span>
        </div>
      </div>
    </article>
  );
};