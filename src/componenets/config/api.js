// Central API base URL for fetches.
// In development, use a relative path so the Vite dev server proxy handles CORS.
// In production (or when BUILD env var is set), use the deployed backend URL.
// Updated to point to the new Render backend instance.
const REMOTE_API = "https://medi-trap-backend-2.onrender.com";

export const API_BASE =
  process.env.NODE_ENV === "development" ? "" : REMOTE_API;

// Helper to build full API URLs. If API_BASE is empty (dev), return relative path.
export const apiUrl = (path) => {
  const p = path.startsWith("/") ? path : `/${path}`;
  return API_BASE ? `${API_BASE}${p}` : p;
};

export default API_BASE;
