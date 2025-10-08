import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "../config/api";
import { getCookie, setCookie } from "../utils/cookies";

const AdminPage = () => {
  const navigate = useNavigate();
  const [stockists, setStockists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [approving, setApproving] = useState({});
  const [declining, setDeclining] = useState({}); // State for tracking decline actions

  // Fetch all stockists
  const fetchStockists = async () => {
    setLoading(true);
    setError(null);
    try {
      const useProxy = import.meta.env.MODE === "development";
      const build = (path) => (useProxy ? path : apiUrl(path));
      const res = await fetch(build("/api/stockist"));
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to load stockists");
      setStockists(json.data || []);
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
    alert("Token saved to cookie for dev testing");
  };

  // Approve stockist (admin action)
  const approve = async (id) => {
    setApproving((p) => ({ ...p, [id]: true }));
    try {
      const token = getCookie("token");
      const headers = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;

      const useProxy = import.meta.env.MODE === "development";
      const build = (path) => (useProxy ? path : apiUrl(path));
      const url = build(`/api/stockist/${id}/approve`);

      const extraHeaders = {};
      if (import.meta.env.MODE === "development")
        extraHeaders["x-dev-admin"] = "1";

      const res = await fetch(url, {
        method: "PATCH",
        headers: { ...headers, ...extraHeaders },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Approval failed");

      // Update approved status locally
      setStockists((s) =>
        s.map((st) =>
          st._id === id
            ? { ...st, approved: true, approvedAt: json.data.approvedAt }
            : st
        )
      );

      // ✅ Don't redirect admin — stockist's own verification page will handle redirect
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
      const token = getCookie("token");
      const headers = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;

      const useProxy = import.meta.env.MODE === "development";
      const build = (path) => (useProxy ? path : apiUrl(path));
      const url = build(`/api/stockist/${id}/decline`);

      const extraHeaders = {};
      if (import.meta.env.MODE === "development")
        extraHeaders["x-dev-admin"] = "1";

      const res = await fetch(url, {
        method: "PATCH",
        headers: { ...headers, ...extraHeaders },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Decline failed");

      // Remove declined stockist locally
      setStockists((s) => s.filter((st) => st._id !== id));
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
                  {s.approved && (
                    <div className="text-green-600 text-sm">Approved</div>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                {!s.approved && (
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
