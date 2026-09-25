import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw, User, Check } from "lucide-react";
import { apiUrl } from "../config/api";
import { getCookie, setCookie } from "../utils/cookies";
import PageHeader from "../ui/PageHeader";
import Card from "../ui/Card";
import Input from "../ui/Input";
import Btn from "../stockistComponents/Btn";

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
      // Build full backend URL
      const build = (path) => apiUrl(path);
      // Primary attempt uses apiUrl (which is relative in dev so Vite proxy should forward it).
      let res = await fetch(build("/api/user"), { credentials: "include" });
      let json = {};
      try {
        json = await res.json();
      } catch (err) {
        // ignore JSON parse errors for non-JSON responses
        json = {};
      }

      // If Vite dev server responded 404, try hitting the backend directly (dev fallback).
      if (
        res.status === 404 &&
        (import.meta.env.MODE === "development" ||
          typeof window !== "undefined")
      ) {
        // Only fallback to a local backend to avoid accidentally calling the
        // production API (which will reject localhost origins via CORS).
        const envUrl = import.meta.env.VITE_API_URL || "";
        const isLocalEnv =
          /^https?:\/\/(localhost|127(?:\.0\.0\.1)?)(:?\d*)?/i.test(envUrl);
        const fallbackBase = isLocalEnv ? envUrl : "https://api.medi-trap.com";
        const fallbackUrl = `${fallbackBase.replace(/\/+$/, "")}/api/user`;
        try {
          res = await fetch(fallbackUrl, { credentials: "include" });
          json = await res.json().catch(() => ({}));
        } catch (e) {
          // fallback failed, continue to error handling below
        }
      }

      if (!res.ok)
        throw new Error(json.message || `Failed to load users (${res.status})`);
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
                : user,
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

      const build = (path) => apiUrl(path);
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
            : user,
        ),
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

      const build = (path) => apiUrl(path);
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
    <div className="min-h-screen bg-slate-50">
      <PageHeader
        title="Purchasers (Admin)"
        subtitle="Approve or decline purchaser registrations"
        role="slate"
        showBack
        right={
          <button
            onClick={fetchUsers}
            className="p-2 rounded-full hover:bg-white/15 transition-colors"
            aria-label="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        }
      />

      <div className="max-w-2xl mx-auto p-4 sm:p-6">
        {isDev && (
          <Card padding="p-4" className="mb-4">
            <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
              Dev Admin Token
            </label>
            <div className="flex items-center gap-2">
              <Input
                containerClassName="flex-1"
                value={devToken}
                onChange={(e) => setDevToken(e.target.value)}
                placeholder="Paste admin token here"
              />
              <Btn
                variant="success"
                onClick={saveDevToken}
                className="shrink-0"
              >
                Save
              </Btn>
            </div>
          </Card>
        )}

        {loading && (
          <div className="flex justify-center py-6">
            <div className="w-8 h-8 border-2 border-role-purchaser/30 border-t-role-purchaser rounded-full animate-spin" />
          </div>
        )}
        {error && (
          <div className="mb-4 text-sm text-red-600 text-center">{error}</div>
        )}

        <div className="space-y-3 pb-10">
          {users.map((user) => {
            const imgSrc = user.profileImageUrl || user.licenseImageUrl || null;
            const isApproved = Boolean(user.approved);
            const isPending = !isApproved && !user.declined;

            return (
              <Card key={user._id} padding="p-4">
                <div className="flex items-start gap-4">
                  {imgSrc ? (
                    <img
                      src={imgSrc}
                      alt={user.name || "user"}
                      className={`w-16 h-16 rounded-xl object-cover shrink-0 ${
                        isApproved ? "opacity-50" : ""
                      }`}
                    />
                  ) : (
                    <div
                      className={`w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 ${
                        isApproved ? "opacity-50" : ""
                      }`}
                    >
                      <User className="w-6 h-6 text-slate-400" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-800 truncate">
                      {user.title || user.name || user.companyName}
                    </div>
                    <div className="text-sm text-slate-500 truncate">
                      {user.email || user.phone}
                    </div>
                    {isApproved && (
                      <div className="flex items-center gap-1 mt-1 text-emerald-600 text-xs font-semibold">
                        <Check className="w-3.5 h-3.5" />
                        Approved
                      </div>
                    )}
                  </div>

                  <span
                    className={`shrink-0 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide ${
                      isApproved
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {isApproved ? "Approved" : "Pending"}
                  </span>
                </div>

                {isPending && (
                  <div className="flex gap-2 justify-end mt-3">
                    <Btn
                      variant="purchaser"
                      className="min-w-[100px]"
                      onClick={() => approve(user._id)}
                      disabled={approving[user._id]}
                    >
                      {approving[user._id] ? "Approving..." : "Approve"}
                    </Btn>
                    <Btn
                      variant="danger"
                      className="min-w-[100px]"
                      onClick={() => decline(user._id)}
                      disabled={declining[user._id]}
                    >
                      {declining[user._id] ? "Declining..." : "Decline"}
                    </Btn>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default UserAdmin;
