import { useParams } from "react-router-dom";
import { courses } from "../data/courses";
import { useDebugValue } from "react";

export const CourseDetails = () => {
  const { courseId } = useParams();
  const course = courses.find((item) => item.id == courseId);
  if (!course) {
    return <div>Course ID not found</div>;
  }
  return (
    <>
      <div className="bg-violet-50">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <p className="text-sm font-medium text-violet-700">
            Courses / {course.category}
          </p>

          <div className="mt-6 grid gap-10 md:grid-cols-2 md:items-center">
            {/* Course information */}
            <div>
              <span className="rounded-full bg-violet-100 px-3 py-1 text-sm font-semibold text-violet-700">
                {course.level}
              </span>

              <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                {course.title}
              </h1>

              <p className="mt-4 text-lg leading-8 text-slate-600">
                Learn from industry experts and build practical skills with this{" "}
                {course.category.toLowerCase()} course.
              </p>

              <p className="mt-5 text-sm text-slate-600">
                Created by{" "}
                <span className="font-semibold text-slate-900">
                  {course.instructor}
                </span>
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                <span className="font-bold text-amber-600">
                  {course.rating} ★
                </span>
                <span className="text-slate-600">
                  ({course.reviews.toLocaleString()} reviews)
                </span>
                <span className="text-slate-600">
                  {course.students.toLocaleString()} learners
                </span>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <button className="rounded-xl bg-violet-600 px-6 py-3.5 font-semibold text-white transition hover:bg-violet-700">
                  Enroll Now
                </button>

                <span className="text-sm text-slate-600">
                  {course.duration} of learning
                </span>
              </div>
            </div>

            {/* Course preview and price */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
              <div className="h-64 w-full bg-slate-100 sm:h-80">
                <img
                  src={course.image}
                  alt={course.title}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="p-6">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold text-slate-900">
                    ₹{course.price}
                  </span>

                  {course.originalPrice > course.price && (
                    <span className="text-base text-slate-400 line-through">
                      ₹{course.originalPrice}
                    </span>
                  )}
                </div>

                <p className="mt-2 text-sm text-slate-500">
                  Course access and learning details
                </p>

                <ul className="mt-5 space-y-3 text-sm text-slate-600">
                  <li>✓ Course level: {course.level}</li>
                  <li>✓ Duration: {course.duration}</li>
                  <li>✓ Learn at your own pace</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
