const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// Send requests to our Express API.
export async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,

    // Send the session cookie with eligible requests.
    credentials: "include",

    headers: {
      ...(options.body
        ? { "Content-Type": "application/json" }
        : {}),
      ...options.headers,
    },
  });

  // Read the API response.
  const data = await response.json().catch(() => ({}));

  // Treat unsuccessful HTTP responses as errors.
  if (!response.ok) {
    throw new Error(data.message || "Request failed.");
  }

  return data;
}