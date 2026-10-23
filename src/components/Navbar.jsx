import bookIcon from "../assets/book.svg";
import menu from "../assets/menu.svg";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import ThemeToggle from "./ThemeToggle.jsx";
export const Navbar = () => {
  const [menuToggle, setMenuToggle] = useState(false);
  const closeMenu = () => setMenuToggle(false);
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
    <>
      <header className="relative z-40 border-b border-slate-200 bg-white text-slate-700 transition-colors dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center gap-2 px-4 sm:px-6">
        <div className="h-10 w-10 shrink-0">
          <img
            src={bookIcon}
            alt="Book"
            className="h-full w-full object-contain dark:invert"
          />
        </div>
        <Link to="/" className="p-2 text-xl font-bold text-slate-900 dark:text-white">Eduverse</Link>

        <div className="hidden p-2 md:block">
          <Link to={"/courses"}>Courses</Link>
        </div>
        <div className="hidden p-2 md:block">
          <Link to={"/courses#categories"}>Categories</Link>
        </div>
        <div className="hidden p-2 md:block">
          {" "}
          <Link to={"/#about"}>About</Link>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden p-2 md:block">
            <input type="text" placeholder="Search Courses..." aria-label="Search courses" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
          </div>
          <button
            onClick={() => setMenuToggle((prev) => !prev)}
            type="button"
            aria-label={menuToggle ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuToggle}
            className="h-10 w-10 shrink-0 rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden"
          >
            <img
              src={menu}
              alt="menu"
              className="h-full w-full object-contain dark:invert"
            />
          </button>

          <ThemeToggle />
          {!authLoading &&
            (user ? (
              <>
                <div className="p-2">
                  <Link to="/my-learning">My Learning</Link>
                </div>

                {user.role === "admin" && (
                  <div className="p-2">
                    <Link to="/admin">Admin panel</Link>
                  </div>
                )}

                <span className="hidden text-sm sm:inline">{user.name}</span>

                <button type="button" onClick={handleLogout} className="rounded-lg px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800">Log out</button>
              </>
            ) : (
              <>
                <div className="p-2">
                  <Link to="/login">Log in</Link>
                </div>

                <div className="p-2">
                  <Link to="/register">Get Started</Link>
                </div>
              </>
            ))}
          {/* <div className="p-2">
            <Link to={"/login"}>Sign in</Link>
          </div>
          <div className="p-2">
            {" "}
            <Link to={"/login"}>Get Started</Link>
          </div> */}
        </div>
      </div>
      </header>
      {menuToggle && (
        <div className="border-b border-slate-200 bg-white p-3 text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 md:hidden">
          <div className="p-2">
            <input type="text" placeholder="Search Courses..." aria-label="Search courses" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
          </div>
          <div className="p-2 ">
            <Link to={"/courses"} onClick={closeMenu}>
              Courses
            </Link>
          </div>
          {user?.role === "admin" && (
            <div className="p-2">
              <Link to="/admin" onClick={closeMenu}>Admin panel</Link>
            </div>
          )}
          <div className="p-2  ">
            <Link to={"/courses#categories"} onClick={closeMenu}>
              Categories
            </Link>
          </div>
          <div className="p-2  ">
            <Link to={"/#about"} onClick={closeMenu}>
              About
            </Link>
          </div>
        </div>
      )}
    </>
  );
};
