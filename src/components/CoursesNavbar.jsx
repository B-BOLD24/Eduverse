import { Link, useNavigate } from "react-router-dom";
import bookIcon from "../assets/book.svg";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "./ThemeToggle.jsx";

export const CoursesNavbar = ({ onSearchClick }) => {
  const { user, authLoading, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error.message);
    }
  }
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo and brand */}
        <Link to="/" className="flex items-center gap-2">
          <img src={bookIcon} alt="" className="h-9 w-9 object-contain dark:invert" />

          <span className="text-xl font-bold text-slate-900 dark:text-white">
            Eduverse
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {/* Theme toggle */}
          <ThemeToggle />

          {/* Mobile search icon */}
          <button
            type="button"
            onClick={onSearchClick}
            aria-label="Open search and filters"
            className="rounded-xl border border-slate-200 p-2 text-slate-700 transition hover:bg-violet-50 hover:text-violet-600 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 md:hidden"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-6 w-6"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-4-4" />
            </svg>
          </button>
          {!authLoading &&
            (user ? (
              <>
                <div className="p-2 text-slate-700 dark:text-slate-200">
                  <Link to="/my-learning">My Learning</Link>
                </div>

                <span className="hidden text-sm text-slate-700 dark:text-slate-200 sm:inline">{user.name}</span>

                <button type="button" onClick={handleLogout} className="rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800">Log out</button>
              </>
            ) : (
              <>
                <div className="p-2 text-slate-700 dark:text-slate-200">
                  <Link to="/login">Log in</Link>
                </div>

                <div className="p-2 text-slate-700 dark:text-slate-200">
                  <Link to="/register">Get Started</Link>
                </div>
              </>
            ))}
        </div>
      </div>
    </header>
  );
};
