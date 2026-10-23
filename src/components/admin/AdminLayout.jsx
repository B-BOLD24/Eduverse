import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

const navigation = [
  { to: "/admin", label: "Overview", end: true, icon: "▦" },
  { to: "/admin/students", label: "Students", icon: "♙" },
  { to: "/admin/courses", label: "Courses", icon: "▤" },
  { to: "/admin/enrollments", label: "Enrollments", icon: "☷" },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logout();
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error.message);
    }
  }

  const linkClass = ({ isActive }) =>
    `flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
      isActive
        ? "bg-violet-600 text-white shadow-sm"
        : "text-slate-600 hover:bg-violet-50 hover:text-violet-700"
    }`;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col lg:flex-row">
        <aside className="border-b border-slate-200 bg-white p-4 lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r lg:p-6">
          <NavLink to="/admin" className="flex items-center gap-3 px-2 py-2">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-600 text-lg font-bold text-white">E</span>
            <span>
              <span className="block font-bold text-slate-900">Eduverse</span>
              <span className="block text-xs font-medium text-violet-600">Admin workspace</span>
            </span>
          </NavLink>

          <nav aria-label="Admin navigation" className="mt-6 flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
            {navigation.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
                <span aria-hidden="true" className="w-5 text-center text-base">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-6 hidden rounded-2xl bg-violet-50 p-4 lg:block">
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">Signed in as</p>
            <p className="mt-2 truncate text-sm font-semibold text-slate-900">{user?.name}</p>
            <p className="truncate text-xs text-slate-500">{user?.email}</p>
          </div>

          <div className="mt-3 flex gap-2 lg:mt-6 lg:flex-col">
            <NavLink to="/courses" className="rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">View learning site</NavLink>
            <button type="button" onClick={handleLogout} className="rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-600 hover:bg-slate-100">Log out</button>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-600">Administration</p>
              <p className="mt-1 text-sm text-slate-500">Manage the learning experience</p>
            </div>
            <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">Admin</span>
          </header>
          <main className="px-4 py-6 sm:px-8 sm:py-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
