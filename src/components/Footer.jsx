import { Link } from "react-router-dom";
import bookIcon from "../assets/book.svg";

const exploreLinks = [
  { label: "All Courses", to: "/courses" },
  { label: "My Learning", to: "/my-learning" },
];

const accountLinks = [
  { label: "Sign In", to: "/login" },
  { label: "Get Started", to: "/login" },
];

export const Footer = () => {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">

        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">

          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="inline-flex items-center gap-2">
              <img
                src={bookIcon}
                alt=""
                className="h-9 w-9 object-contain"
              />
              <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Eduverse
              </span>
            </Link>

            <p className="mt-4 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-300">
              Upgrade your skills and build your future.
              Learn from industry experts and take the next
              step in your learning journey.
            </p>
          </div>

          {/* Explore links */}
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Explore
            </h2>

            <ul className="mt-4 space-y-3">
              {exploreLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-sm text-slate-600 dark:text-slate-300 transition-colors hover:text-violet-600"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account links */}
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Account
            </h2>

            <ul className="mt-4 space-y-3">
              {accountLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-sm text-slate-600 dark:text-slate-300 transition-colors hover:text-violet-600"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Copyright */}
        <div className="mt-10 flex flex-col gap-3 border-t border-slate-200 dark:border-slate-700 pt-6 text-sm text-slate-500 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} Eduverse. All rights reserved.
          </p>

          <p>Keep learning. Keep growing.</p>
        </div>

      </div>
    </footer>
  );
};