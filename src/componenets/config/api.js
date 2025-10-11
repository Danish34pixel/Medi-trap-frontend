// // // Central API base URL for fetches.
// // In production use the deployed backend (REMOTE_API).
// // In development, prefer an explicit VITE_API_URL env var or default to localhost:5000.
// // This avoids the common issue where dev fetches hit the Vite dev server (localhost:5173)
// // and return 4xx/5xx because Vite isn't proxying /api to the backend.

// // Remote backend used in production by default (can be overridden by VITE_REMOTE_API)
// const REMOTE_API =
//   import.meta.env.VITE_REMOTE_API || "https://medi-trap-backend-2.onrender.com";

// // In development, prefer VITE_API_URL; otherwise default to the current page's
// // hostname (helps when testing from a phone on the same Wi-Fi). Falls back
// // to localhost when window is not available.
// const DEV_FALLBACK =
//   import.meta.env.VITE_API_URL ||
//   `http://${
//     typeof window !== "undefined" ? window.location.hostname : "localhost"
//   }:5000`;

// const IS_DEV = import.meta.env.MODE === "development";

// // Ensure API base has no trailing slash.
// const normalizeBase = (url) =>
//   url && url.endsWith("/") ? url.slice(0, -1) : url;

// // Prefer an explicit VITE_API_URL if present (applies to both dev and prod).
// const SELECTED_API =
//   import.meta.env.VITE_API_URL || (IS_DEV ? DEV_FALLBACK : REMOTE_API);
// export const API_BASE = normalizeBase(SELECTED_API);

// // Helper to build full API URLs. Ensures a single leading slash between base and path.
// export const apiUrl = (path = "") => {
//   const p = path.startsWith("/") ? path : /${path};
//   return ${API_BASE}${p};
// };

// // Small helper around fetch that sends/receives JSON and throws on non-2xx.
// export const fetchJson = async (path, options = {}) => {
//   const url = apiUrl(path);
//   const opts = {
//     headers: {
//       "Content-Type": "application/json",
//       ...(options.headers || {}),
//     },
//     ...options,
//   };

//   const res = await fetch(url, opts);

//   const text = await res.text();
//   const isJson = res.headers.get("content-type")?.includes("application/json");
//   const body = text && isJson ? JSON.parse(text) : text;

//   if (!res.ok) {
//     const err = new Error(body?.message || Request failed ${res.status});
//     err.status = res.status;
//     err.body = body;
//     throw err;
//   }

//   return body;
// };

// // POST a FormData payload. Do not set Content-Type (browser will set boundary).
// export const postForm = async (path, formData, options = {}) => {
//   const url = apiUrl(path);
//   const controller = new AbortController();
//   const timeout = options.timeout || 60000; // 60s default
//   const timer = setTimeout(() => controller.abort(), timeout);
//   try {
//     const res = await fetch(url, {
//       method: "POST",
//       body: formData,
//       mode: "cors",
//       credentials: options.credentials || "include",
//       headers: options.headers || {},
//       signal: controller.signal,
//     });
//     clearTimeout(timer);
//     const text = await res.text();
//     const isJson = res.headers
//       .get("content-type")
//       ?.includes("application/json");
//     const body = text && isJson ? JSON.parse(text) : text;
//     if (!res.ok) {
//       const err = new Error(body?.message || Request failed ${res.status});
//       err.status = res.status;
//       err.body = body;
//       throw err;
//     }
//     return body;
//   } catch (err) {
//     clearTimeout(timer);
//     throw err;
//   }
// };

// // POST JSON helper with timeout and CORS enabled
// export const postJson = async (path, data, options = {}) => {
//   const url = apiUrl(path);
//   const controller = new AbortController();
//   const timeout = options.timeout || 60000;
//   const timer = setTimeout(() => controller.abort(), timeout);
//   try {
//     const res = await fetch(url, {
//       method: "POST",
//       body: JSON.stringify(data),
//       headers: {
//         "Content-Type": "application/json",
//         ...(options.headers || {}),
//       },
//       mode: "cors",
//       credentials: options.credentials || "include",
//       signal: controller.signal,
//     });
//     clearTimeout(timer);
//     const text = await res.text();
//     const isJson = res.headers
//       .get("content-type")
//       ?.includes("application/json");
//     const body = text && isJson ? JSON.parse(text) : text;
//     if (!res.ok) {
//       const err = new Error(body?.message || Request failed ${res.status});
//       err.status = res.status;
//       err.body = body;
//       throw err;
//     }
//     return body;
//   } catch (err) {
//     clearTimeout(timer);
//     throw err;
//   }
// };

// export default API_BASE;

// ✅ Central API base URL configuration for both dev and production.

// -------------------------
// 🔧 Base URLs
// -------------------------

// Remote backend (Render URL or override with env)
const REMOTE_API =
  import.meta.env.VITE_REMOTE_API || "https://medi-trap-backend-2.onrender.com";

// Local/dev fallback (used only in development)
const DEV_FALLBACK =
  import.meta.env.VITE_API_URL ||
  `http://${
    typeof window !== "undefined" ? window.location.hostname : "localhost"
  }:5000`;

// Determine current mode
const IS_DEV =
  import.meta.env.MODE === "development" ||
  window.location.hostname === "localhost" ||
  window.location.hostname.startsWith("127.");

// Normalize to remove any trailing slashes
const normalizeBase = (url) =>
  url && url.endsWith("/") ? url.slice(0, -1) : url;

// -------------------------
// 🌐 Final API Base selection
// -------------------------

// Always prefer env var if defined
const SELECTED_API = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL
  : IS_DEV
  ? DEV_FALLBACK
  : REMOTE_API;

// Final API Base (normalized)
export const API_BASE = normalizeBase(SELECTED_API);

// Helper to safely build complete URLs
export const apiUrl = (path = "") => {
  // Defensive URL builder:
  // - If caller already provides a path beginning with '/api', respect it.
  // - Otherwise, ensure the request is sent under the '/api' namespace so
  //   accidental calls like apiUrl('/purchaser') become API calls to
  //   `${API_BASE}/api/purchaser` instead of `${API_BASE}/purchaser`.
  if (!path) return `${API_BASE}/api`;
  if (path.startsWith("/api")) return `${API_BASE}${path}`;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}/api${p}`;
};

// -------------------------
// ⚙ JSON Fetch Helper
// -------------------------
// export const fetchJson = async (path, options = {}) => {
//   const url = apiUrl(path);
//   const opts = {
//     headers: {
//       "Content-Type": "application/json",
//       ...(options.headers || {}),
//     },
//     ...options,
//   };

//   const res = await fetch(url, opts);
//   const text = await res.text();
//   const isJson = res.headers.get("content-type")?.includes("application/json");
//   const body = text && isJson ? JSON.parse(text) : text;

//   if (!res.ok) {
//     const err = new Error(body?.message || Request failed ${res.status});
//     err.status = res.status;
//     err.body = body;
//     throw err;
//   }

//   return body;
// };
export const fetchJson = async (path, options = {}) => {
  const url = apiUrl(path);
  const token = localStorage.getItem("token"); // grab token

  const opts = {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  };

  const res = await fetch(url, opts);
  const text = await res.text();
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = text && isJson ? JSON.parse(text) : text;

  if (!res.ok) {
    const err = new Error(body?.message || `Request failed ${res.status}`);
    err.status = res.status;
    err.body = body;
    throw err;
  }

  return body;
};

// // -------------------------
// // 📤 POST FormData Helper (Image Uploads)
// // -------------------------
export const postForm = async (path, formData, options = {}) => {
  const url = apiUrl(path);
  const controller = new AbortController();

  // Increased timeout to 120s for Cloudinary uploads
  const timeout = options.timeout || 120000;
  const timer = setTimeout(() => {
    console.warn("⚠ postForm timeout hit for:", url);
    controller.abort("Request timeout");
  }, timeout);

  try {
    const res = await fetch(url, {
      method: "POST",
      body: formData,
      mode: "cors",
      credentials: options.credentials || "include",
      headers: options.headers || {},
      signal: controller.signal,
    });

    clearTimeout(timer);
    const text = await res.text();
    const isJson = res.headers
      .get("content-type")
      ?.includes("application/json");
    const body = text && isJson ? JSON.parse(text) : text;

    if (!res.ok) {
      const err = new Error(body?.message || `Request failed ${res.status}`);
      err.status = res.status;
      err.body = body;
      throw err;
    }

    return body;
  } catch (err) {
    clearTimeout(timer);
    if (err.name === "AbortError") {
      console.error("🚨 Request aborted (likely timeout or mixed HTTPS):", url);
    }
    throw err;
  }
};

// -------------------------
// 💾 POST JSON Helper
// -------------------------
// export const postJson = async (path, data, options = {}) => {
//   const url = apiUrl(path);
//   const controller = new AbortController();
//   const timeout = options.timeout || 60000;
//   const timer = setTimeout(() => {
//     console.warn("⚠ postJson timeout hit for:", url);
//     controller.abort("Request timeout");
//   }, timeout);

//   try {
//     const res = await fetch(url, {
//       method: "POST",
//       body: JSON.stringify(data),
//       headers: {
//         "Content-Type": "application/json",
//         ...(options.headers || {}),
//       },
//       mode: "cors",
//       credentials: options.credentials || "include",
//       signal: controller.signal,
//     });

//     clearTimeout(timer);
//     const text = await res.text();
//     const isJson = res.headers
//       .get("content-type")
//       ?.includes("application/json");
//     const body = text && isJson ? JSON.parse(text) : text;

//     if (!res.ok) {
//       const err = new Error(body?.message || Request failed ${res.status});
//       err.status = res.status;
//       err.body = body;
//       throw err;
//     }

//     return body;
//   } catch (err) {
//     clearTimeout(timer);
//     if (err.name === "AbortError") {
//       console.error("🚨 Request aborted (timeout or SSL issue):", url);
//     }
//     throw err;
//   }
// };
export const postJson = async (path, data, options = {}) => {
  const url = apiUrl(path);
  const token = localStorage.getItem("token"); // grab token
  const controller = new AbortController();
  const timeout = options.timeout || 60000;
  const timer = setTimeout(() => {
    console.warn("⚠ postJson timeout hit for:", url);
    controller.abort("Request timeout");
  }, timeout);

  try {
    const res = await fetch(url, {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      mode: "cors",
      credentials: options.credentials || "include",
      signal: controller.signal,
    });

    clearTimeout(timer);
    const text = await res.text();
    const isJson = res.headers
      .get("content-type")
      ?.includes("application/json");
    const body = text && isJson ? JSON.parse(text) : text;

    if (!res.ok) {
      const err = new Error(body?.message || `Request failed ${res.status}`);
      err.status = res.status;
      err.body = body;
      throw err;
    }

    return body;
  } catch (err) {
    clearTimeout(timer);
    if (err.name === "AbortError") {
      console.error("🚨 Request aborted (timeout or SSL issue):", url);
    }
    throw err;
  }
};
export default API_BASE;
