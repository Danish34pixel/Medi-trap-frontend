// Central API base URL for fetches.
// In production use the deployed backend (REMOTE_API).
// In development, prefer an explicit VITE_API_URL env var or default to localhost:5000.
// This avoids the common issue where dev fetches hit the Vite dev server (localhost:5173)
// and return 4xx/5xx because Vite isn't proxying /api to the backend.

// Remote backend used in production by default (can be overridden by VITE_REMOTE_API)
const REMOTE_API =
  import.meta.env.VITE_REMOTE_API || "https://medi-trap-backend-2.onrender.com";

// In development, prefer VITE_API_URL; otherwise default to the current page's
// hostname (helps when testing from a phone on the same Wi-Fi). Falls back
// to localhost when window is not available.
const DEV_FALLBACK =
  import.meta.env.VITE_API_URL ||
  `http://${
    typeof window !== "undefined" ? window.location.hostname : "localhost"
  }:5000`;

const IS_DEV = import.meta.env.MODE === "development";

export const API_BASE = IS_DEV ? DEV_FALLBACK : REMOTE_API;

// Helper to build full API URLs.
export const apiUrl = (path) => {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${p}`;
};

export default API_BASE;
