import { createContext, useContext, useEffect, useState } from "react";

import { apiFetch } from "../lib/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Check whether an existing login session is still valid.
  useEffect(() => {
    let active = true;

    async function checkAuth() {
      try {
        const data = await apiFetch("/api/auth/me");

        if (active) {
          setUser(data.user);
        }
      } catch {
        // No valid session, or the API is unavailable.
        if (active) {
          setUser(null);
        }
      } finally {
        if (active) {
          setAuthLoading(false);
        }
      }
    }

    checkAuth();

    return () => {
      active = false;
    };
  }, []);

  // Log out the current user through our backend.
  async function logout() {
    await apiFetch("/api/auth/logout", {
      method: "POST",
    });

    // Clear the shared user state after successful logout.
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, setUser, authLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Lets components access the shared authentication state.
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
