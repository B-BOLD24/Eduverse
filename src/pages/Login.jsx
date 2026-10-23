
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      // Send credentials to our backend.
      const data = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      // Update the shared authentication state.
      setUser(data.user);

      // Redirect after successful login.
      navigate(
        location.state?.from?.pathname ??
          (data.user.role === "admin" ? "/admin" : "/courses"),
        { replace: true },
      );
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="mb-2 text-3xl font-bold">Welcome back</h1>
      <p className="mb-8 text-gray-500 dark:text-slate-400">
        Log in to continue learning on Eduverse.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white px-4 py-3 text-slate-900 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1 block text-sm font-medium"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white px-4 py-3 text-slate-900 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-black px-4 py-3 font-medium text-white disabled:opacity-60 dark:bg-violet-600 dark:hover:bg-violet-700"
        >
          {loading ? "Logging in..." : "Log in"}
        </button>
      </form>
    </main>
  );
}
