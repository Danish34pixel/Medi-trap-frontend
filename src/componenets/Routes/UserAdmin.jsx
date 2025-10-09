import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "../config/api";
import { getCookie, setCookie } from "../utils/cookies";

const UserAdmin = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [approving, setApproving] = useState({});
  const [declining, setDeclining] = useState({});
  const APPROVED_STORAGE_KEY = "admin_approved_users";

  // Fetch all users
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const useProxy = import.meta.env.MODE === "development";
      const build = (path) => (useProxy ? path : apiUrl(path));
      const res = await fetch(build("/api/user"));
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to load users");
      let fetched = json.data || [];

      // Apply local overrides so approved state persists across refresh
      try {
        const raw = localStorage.getItem(APPROVED_STORAGE_KEY);
        if (raw) {
          const approvedIds = JSON.parse(raw);
          if (Array.isArray(approvedIds) && approvedIds.length) {
            fetched = fetched.map((user) =>
              approvedIds.includes(user._id)
                ? { ...user, approved: true, status: "approved" }
                : user
            );
          }
        }
      } catch (e) {
        // ignore localStorage parsing errors
        console.warn("Failed to read approved IDs from localStorage", e);
      }

      setUsers(fetched);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
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

  // Approve user (admin action)
  const approve = async (id) => {
    setApproving((p) => ({ ...p, [id]: true }));
    try {
      // Try cookie first, then fallback to localStorage (some flows store token there)
      let token = getCookie("token");
      if (!token && typeof localStorage !== "undefined") {
        token = localStorage.getItem("token");
      }
      const headers = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;

      const useProxy = import.meta.env.MODE === "development";
      const build = (path) => (useProxy ? path : apiUrl(path));
      const url = build(`/api/user/${id}/approve`);

      const extraHeaders = {};
      if (import.meta.env.MODE === "development")
        extraHeaders["x-dev-admin"] = "1";

      const res = await fetch(url, {
        method: "PATCH",
        headers: { ...headers, ...extraHeaders },
        // ensure cookies are sent when using cookie-based auth on same origin / proxy
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) {
        // Provide more helpful error feedback when 401 occurs
        const msg = json?.message || `Approval failed (${res.status})`;
        throw new Error(msg);
      }

      // Update approved status locally
      setUsers((s) =>
        s.map((user) =>
          user._id === id
            ? { ...user, approved: true, approvedAt: json.data?.approvedAt }
            : user
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
      await fetchUsers();
    } catch (e) {
      alert(e.message || String(e));
    } finally {
      setApproving((p) => ({ ...p, [id]: false }));
    }
  };

  // Decline user (admin action)
  const decline = async (id) => {
    setDeclining((p) => ({ ...p, [id]: true }));
    try {
      // Try cookie first, then fallback to localStorage
      let token = getCookie("token");
      if (!token && typeof localStorage !== "undefined") {
        token = localStorage.getItem("token");
      }
      const headers = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;

      const useProxy = import.meta.env.MODE === "development";
      const build = (path) => (useProxy ? path : apiUrl(path));
      const url = build(`/api/user/${id}/decline`);

      const extraHeaders = {};
      if (import.meta.env.MODE === "development")
        extraHeaders["x-dev-admin"] = "1";

      const res = await fetch(url, {
        method: "PATCH",
        headers: { ...headers, ...extraHeaders },
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) {
        const msg = json?.message || `Decline failed (${res.status})`;
        throw new Error(msg);
      }

      // Remove declined user locally
      setUsers((s) => s.filter((user) => user._id !== id));

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
      <h1 className="text-2xl font-bold mb-4">Users (Admin)</h1>

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
        {users.map((user) => {
          const imgSrc = user.profileImageUrl || user.licenseImageUrl || null;
          return (
            <div
              key={user._id}
              className="p-4 border rounded flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                {imgSrc ? (
                  <img
                    src={imgSrc}
                    alt={user.name || "user"}
                    className={`w-16 h-16 rounded-md object-cover border ${
                      user.approved ? "opacity-50 pointer-events-none" : ""
                    }`}
                  />
                ) : (
                  <div
                    className={`w-16 h-16 rounded-md bg-gray-100 flex items-center justify-center text-sm text-gray-500 border ${
                      user.approved ? "opacity-50 pointer-events-none" : ""
                    }`}
                  >
                    No image
                  </div>
                )}

                <div>
                  <div className="font-semibold">
                    {user.title || user.name || user.companyName}
                  </div>
                  <div className="text-sm text-gray-600">
                    {user.email || user.phone}
                  </div>
                  {user.status === "approved" && (
                    <div className="text-green-600 text-sm">Approved</div>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                {!user.approved && !user.declined && (
                  <>
                    <button
                      className="px-4 py-2 bg-blue-600 text-white rounded"
                      onClick={() => approve(user._id)}
                      disabled={approving[user._id]}
                    >
                      {approving[user._id] ? "Approving..." : "Approve"}
                    </button>
                    <button
                      className="px-4 py-2 bg-red-600 text-white rounded"
                      onClick={() => decline(user._id)}
                      disabled={declining[user._id]}
                    >
                      {declining[user._id] ? "Declining..." : "Decline"}
                    </button>
                  </>
                )}
                {user.approved && (
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

export default UserAdmin;
