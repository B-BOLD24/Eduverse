import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

export default function AdminRoute() {
  const { user, authLoading } = useAuth();
  const location = useLocation();

  if (authLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 dark:bg-slate-950 px-5">
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300" role="status">
          Checking your session…
        </p>
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (user.role !== "admin") {
    return <Navigate to="/courses" replace />;
  }

  return <Outlet />;
}
