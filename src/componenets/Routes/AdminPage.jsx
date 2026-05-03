import React, { useEffect, useState } from "react";
// navigate not required in this component
import { apiUrl, requestJson } from "../config/api";
import { getCookie, setCookie } from "../utils/cookies";

const AdminPage = () => {
  // navigate intentionally unused here
  const [stockists, setStockists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [approving, setApproving] = useState({});
  const [declining, setDeclining] = useState({}); // State for tracking decline actions
  const APPROVED_STORAGE_KEY = "admin_approved_stockists";

  // Fetch all stockists
  const fetchStockists = async () => {
    setLoading(true);
    setError(null);
    try {
      // Build a URL that prefers a relative '/api' path when running locally.
      // This avoids accidentally calling the production API during local dev
      // (which can trigger CORS preflight rejections for PATCH).
      const isLocal =
        import.meta.env.MODE === "development" ||
        window.location.hostname === "localhost" ||
        window.location.hostname.startsWith("127.");

      const build = (path) => {
        const p = path.startsWith("/api")
          ? path
          : path.startsWith("/")
          ? `/api${path}`
          : `/api/${path}`;
        return isLocal ? p : apiUrl(p);
      };

      const url = build("/stockist");
      console.debug("AdminPage: fetchStockists ->", url);
      const res = await fetch(url, { credentials: "include" });
      const json = await res.json();
      console.debug("AdminPage: fetchStockists response ->", {
        url,
        status: res.status,
        count: (json.data || []).length,
      });
      if (!res.ok) throw new Error(json.message || "Failed to load stockists");
      let fetched = json.data || [];

      // Apply local overrides so approved state persists across refresh
      try {
        const raw = localStorage.getItem(APPROVED_STORAGE_KEY);
        if (raw) {
          const approvedIds = JSON.parse(raw);
          if (Array.isArray(approvedIds) && approvedIds.length) {
            fetched = fetched.map((st) =>
              approvedIds.includes(st._id)
                ? { ...st, approved: true, status: "approved" }
                : st
            );
          }
        }
      } catch (e) {
        // ignore localStorage parsing errors
        console.warn("Failed to read approved IDs from localStorage", e);
      }

      setStockists(fetched);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockists();
  }, []);

  // Development helper for saving token
  const isDev = import.meta.env.MODE === "development";
  const [devToken, setDevToken] = useState("");
  useEffect(() => {
    if (isDev) {
      const existing = getCookie("token");
      if (existing) setDevToken(existing);
    }
  }, [isDev]);

  const saveDevToken = () => {
    if (!devToken) return alert("Enter a token to save");
    setCookie("token", devToken, 7);
    try {
      localStorage.setItem("token", devToken);
    } catch (e) {}
    alert("Token saved to cookie for dev testing");
  };

  // Approve stockist (admin action)
  const approve = async (id) => {
    setApproving((p) => ({ ...p, [id]: true }));
    try {
      // When running locally, send requests to the local backend via a
      // relative '/api' path to avoid production CORS issues. Use the
      // centralized requestJson in non-local (production) mode.
      const isLocal =
        import.meta.env.MODE === "development" ||
        window.location.hostname === "localhost" ||
        window.location.hostname.startsWith("127.");

      let json = null;
      if (isLocal) {
        const token = (() => {
          try {
            return localStorage.getItem("token") || getCookie("token");
          } catch (e) {
            try {
              return getCookie("token");
            } catch (ee) {
              return null;
            }
          }
        })();

        const headers = {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(import.meta.env.MODE === "development"
            ? { "x-dev-admin": "1" }
            : {}),
          "Content-Type": "application/json",
        };

        const approveUrl = `/api/stockist/${id}/approve`;
        console.debug("AdminPage: approve (local) ->", { approveUrl, headers });
        const res = await fetch(approveUrl, {
          method: "PATCH",
          headers,
          credentials: "include",
        });
        const text = await res.text();
        const body = text ? JSON.parse(text) : null;
        if (!res.ok)
          throw new Error(body?.message || `Request failed ${res.status}`);
        json = body;
      } else {
        const url = `/stockist/${id}/approve`;
        json = await requestJson(url, {
          method: "PATCH",
          headers:
            import.meta.env.MODE === "development"
              ? { "x-dev-admin": "1" }
              : {},
        });
      }

      // Update approved status locally
      setStockists((s) =>
        s.map((st) =>
          st._id === id
            ? { ...st, approved: true, approvedAt: json.data?.approvedAt }
            : st
        )
      );

      // Persist approved id in localStorage so approval survives refresh.
      try {
        const raw = localStorage.getItem(APPROVED_STORAGE_KEY);
        const arr = raw ? JSON.parse(raw) : [];
        if (!arr.includes(id)) {
          arr.push(id);
          localStorage.setItem(APPROVED_STORAGE_KEY, JSON.stringify(arr));
        }
      } catch (e) {
        console.warn("Failed to persist approved id", e);
      }

      // Refresh the list from server to get latest data, but overrides will keep approval visible
      await fetchStockists();
    } catch (e) {
      alert(e.message || String(e));
    } finally {
      setApproving((p) => ({ ...p, [id]: false }));
    }
  };

  // Decline stockist (admin action)
  const decline = async (id) => {
    setDeclining((p) => ({ ...p, [id]: true }));
    try {
      const isLocal =
        import.meta.env.MODE === "development" ||
        window.location.hostname === "localhost" ||
        window.location.hostname.startsWith("127.");

      if (isLocal) {
        const token = (() => {
          try {
            return localStorage.getItem("token") || getCookie("token");
          } catch (e) {
            try {
              return getCookie("token");
            } catch (ee) {
              return null;
            }
          }
        })();

        const headers = {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(import.meta.env.MODE === "development"
            ? { "x-dev-admin": "1" }
            : {}),
          "Content-Type": "application/json",
        };

        const declineUrl = `/api/stockist/${id}/decline`;
        console.debug("AdminPage: decline (local) ->", { declineUrl, headers });
        const res = await fetch(declineUrl, {
          method: "PATCH",
          headers,
          credentials: "include",
        });
        const text = await res.text();
        const body = text ? JSON.parse(text) : null;
        if (!res.ok)
          throw new Error(body?.message || `Request failed ${res.status}`);
      } else {
        const urlDecline = `/stockist/${id}/decline`;
        await requestJson(urlDecline, {
          method: "PATCH",
          headers:
            import.meta.env.MODE === "development"
              ? { "x-dev-admin": "1" }
              : {},
        });
      }

      // Remove declined stockist locally
      setStockists((s) => s.filter((st) => st._id !== id));

      // Ensure it's not kept in approved list in localStorage
      try {
        const raw = localStorage.getItem(APPROVED_STORAGE_KEY);
        const arr = raw ? JSON.parse(raw) : [];
        const newArr = arr.filter((x) => x !== id);
        localStorage.setItem(APPROVED_STORAGE_KEY, JSON.stringify(newArr));
      } catch (e) {
        console.warn("Failed to remove declined id from localStorage", e);
      }
    } catch (e) {
      alert(e.message || String(e));
    } finally {
      setDeclining((p) => ({ ...p, [id]: false }));
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Stockists (Admin)</h1>

      {isDev && (
        <div className="mb-4">
          <label className="block text-sm font-medium">Dev Admin Token</label>
          <div className="flex items-center gap-2 mt-1">
            <input
              className="border px-2 py-1 flex-1"
              value={devToken}
              onChange={(e) => setDevToken(e.target.value)}
            />
            <button
              className="px-3 py-1 bg-green-600 text-white rounded"
              onClick={saveDevToken}
            >
              Save
            </button>
          </div>
        </div>
      )}

      {loading && <div>Loading...</div>}
      {error && <div className="text-red-600">{error}</div>}

      <div className="space-y-3">
        {stockists.map((s) => {
          const imgSrc = s.profileImageUrl || s.licenseImageUrl || null;
          return (
            <div
              key={s._id}
              className="p-4 border rounded flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                {imgSrc ? (
                  <img
                    src={imgSrc}
                    alt={s.name || "stockist"}
                    className={`w-16 h-16 rounded-md object-cover border ${
                      s.approved ? "opacity-50 pointer-events-none" : ""
                    }`}
                  />
                ) : (
                  <div
                    className={`w-16 h-16 rounded-md bg-gray-100 flex items-center justify-center text-sm text-gray-500 border ${
                      s.approved ? "opacity-50 pointer-events-none" : ""
                    }`}
                  >
                    No image
                  </div>
                )}

                <div>
                  <div className="font-semibold">
                    {s.title || s.name || s.companyName}
                  </div>
                  <div className="text-sm text-gray-600">
                    {s.email || s.phone}
                  </div>
                  {s.status === "approved" && (
                    <div className="text-green-600 text-sm">Approved</div>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                {s.status === "processing" && (
                  <>
                    <button
                      className="px-4 py-2 bg-blue-600 text-white rounded"
                      onClick={() => approve(s._id)}
                      disabled={approving[s._id]}
                    >
                      {approving[s._id] ? "Approving..." : "Approve"}
                    </button>
                    <button
                      className="px-4 py-2 bg-red-600 text-white rounded"
                      onClick={() => decline(s._id)}
                      disabled={declining[s._id]}
                    >
                      {declining[s._id] ? "Declining..." : "Decline"}
                    </button>
                  </>
                )}
                {s.approved && (
                  <button
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded"
                    disabled
                  >
                    Approved
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminPage;
