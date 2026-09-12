import React, { useEffect, useState } from "react";
// navigate not required in this component
import { RefreshCw, Package } from "lucide-react";
import { apiUrl, requestJson } from "../config/api";
import { getCookie, setCookie } from "../utils/cookies";
import PageHeader from "../ui/PageHeader";
import Card from "../ui/Card";
import Input from "../ui/Input";
import Btn from "../stockistComponents/Btn";

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
    <div className="min-h-screen bg-slate-50">
      <PageHeader
        title="Stockists (Admin)"
        subtitle="Verify and approve supplier applications"
        role="slate"
        showBack
        right={
          <button
            onClick={fetchStockists}
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
              <Btn variant="success" onClick={saveDevToken} className="shrink-0">
                Save
              </Btn>
            </div>
          </Card>
        )}

        {loading && (
          <div className="flex justify-center py-6">
            <div className="w-8 h-8 border-2 border-role-stockist/30 border-t-role-stockist rounded-full animate-spin" />
          </div>
        )}
        {error && (
          <div className="mb-4 text-sm text-red-600 text-center">{error}</div>
        )}

        <div className="space-y-3 pb-10">
          {stockists.map((s) => {
            const imgSrc = s.profileImageUrl || s.licenseImageUrl || null;
            const isApproved = Boolean(s.approved);
            const isProcessing = s.status === "processing";

            return (
              <Card key={s._id} padding="p-4">
                <div className="flex items-start gap-4">
                  {imgSrc ? (
                    <img
                      src={imgSrc}
                      alt={s.name || "stockist"}
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
                      <Package className="w-6 h-6 text-slate-400" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-800 truncate">
                      {s.title || s.name || s.companyName}
                    </div>
                    <div className="text-sm text-slate-500 truncate">
                      {s.email || s.phone}
                    </div>
                    {isApproved && (
                      <div className="flex items-center gap-1 mt-1 text-emerald-600 text-xs font-semibold">
                        <Package className="w-3.5 h-3.5" />
                        Approved
                      </div>
                    )}
                  </div>

                  {isApproved && (
                    <span className="shrink-0 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide bg-emerald-50 text-emerald-600">
                      Approved
                    </span>
                  )}
                </div>

                {isProcessing && (
                  <div className="flex gap-2 justify-end mt-3">
                    <Btn
                      variant="stockist"
                      className="min-w-[100px]"
                      onClick={() => approve(s._id)}
                      disabled={approving[s._id]}
                    >
                      {approving[s._id] ? "Approving..." : "Approve"}
                    </Btn>
                    <Btn
                      variant="danger"
                      className="min-w-[100px]"
                      onClick={() => decline(s._id)}
                      disabled={declining[s._id]}
                    >
                      {declining[s._id] ? "Declining..." : "Decline"}
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

export default AdminPage;
