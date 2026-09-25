import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Phone,
  MessageCircle,
  Loader2,
  AlertTriangle,
  Truck,
  Check,
  X,
} from "lucide-react";
import { fetchJson } from "../config/api";
import PageHeader from "../ui/PageHeader";
import Card from "../ui/Card";

const STATUS_STYLES = {
  sent: "bg-amber-100 text-amber-800",
  accepted: "bg-sky-100 text-sky-800",
  dispatched: "bg-indigo-100 text-indigo-800",
  completed: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-700",
};

// Stockist's incoming-demand inbox — GET /demand?stockistId= already
// excludes status "pending" server-side (routes/demand.js), so everything
// this returns is something the stockist should act on or has already
// acted on. Accept/Reject via PATCH /demand/:id (id = SupplierDemand _id,
// only valid while status is "sent"); Dispatch via POST /demand/:id/dispatch
// (only valid while status is "accepted"); Chat once accepted/dispatched/
// completed. Deep-link highlight via ?demandId= (DemandNotificationsButton).
export default function DemandInbox() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get("demandId");

  const [stockistId, setStockistId] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actingId, setActingId] = useState(null);

  const pausedRef = useRef(document.hidden);

  const loadInbox = useCallback(async (sid) => {
    try {
      const res = await fetchJson(`/demand?stockistId=${encodeURIComponent(sid)}`);
      setItems(res?.data || []);
      setError(null);
    } catch (e) {
      setError((prev) => prev || e.body?.message || e.message || "Could not load demands.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Resolve "my stockist id" via the dedicated /stockist/me endpoint
  // (stockistController.getMyProfile) — no id param on this route.
  useEffect(() => {
    fetchJson("/stockist/me")
      .then((res) => {
        const id = res?.data?._id || res?.data?.id;
        if (id) setStockistId(id);
        else setError("Could not resolve your stockist account.");
      })
      .catch((e) => setError(e.body?.message || e.message || "Could not resolve your stockist account."));
  }, []);

  useEffect(() => {
    const onVisibility = () => {
      pausedRef.current = document.hidden;
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onVisibility);
    };
  }, []);

  useEffect(() => {
    if (!stockistId) return;
    loadInbox(stockistId);
    const timer = setInterval(() => {
      if (!pausedRef.current) loadInbox(stockistId);
    }, 5000);
    return () => clearInterval(timer);
  }, [stockistId, loadInbox]);

  const act = async (id, path, body) => {
    // Guards against a rapid double-click firing two requests before the
    // disabled prop's re-render lands (found via runtime testing: a real
    // double-accept produces a 409 from the backend, which is correct, but
    // the UI was left showing stale action buttons instead of resyncing).
    if (actingId) return;
    setActingId(id);
    try {
      await fetchJson(`/demand/${id}${path}`, {
        method: path === "/dispatch" ? "POST" : "PATCH",
        body: body ? JSON.stringify(body) : undefined,
      });
      await loadInbox(stockistId);
    } catch (e) {
      // A 409 means someone/something already actioned this demand (e.g. a
      // duplicate click, or another tab) — the backend's own message names
      // the actual current status, so surface it and resync to the real
      // state rather than leaving stale Accept/Reject buttons on screen.
      setError(e.body?.message || e.message || "Action failed.");
      await loadInbox(stockistId);
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <PageHeader title="Demand Inbox" subtitle="Incoming medicine orders" role="stockist" />
      <div className="container mx-auto max-w-2xl px-4 py-8">
        {error && (
          <div className="bg-orange-100 border-l-4 border-orange-500 rounded-r-lg p-4 mb-4 flex items-center gap-3">
            <AlertTriangle className="text-orange-500" size={20} />
            <div className="text-orange-800 font-medium">{error}</div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-slate-400" size={32} />
          </div>
        ) : items.length === 0 ? (
          <Card padding="p-8" className="text-center text-slate-500">
            No demands yet.
          </Card>
        ) : (
          <div className="space-y-4">
            {items.map((d) => (
              <Card
                key={d._id}
                padding="p-5"
                elevated
                className={`rounded-2xl ${highlightId === d._id ? "ring-2 ring-cyan-400" : ""}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase ${
                      STATUS_STYLES[d.status] || "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {d.status}
                  </span>
                  <span className="text-xs text-slate-400">
                    {d.createdAt ? new Date(d.createdAt).toLocaleString() : ""}
                  </span>
                </div>

                <div className="text-sm text-slate-700 font-medium mb-2">
                  {d.purchaserName || "Medical owner"}
                </div>

                <div className="space-y-1 mb-3">
                  {(d.items || []).map((it, i) => (
                    <div key={i} className="text-sm text-slate-600">
                      <span className="font-medium">{it.name}</span> × {it.qty || it.quantity || 1}
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {d.status === "sent" && (
                    <>
                      <button
                        onClick={() => act(d._id, "", { status: "accepted" })}
                        disabled={actingId === d._id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 disabled:opacity-50"
                      >
                        <Check size={14} /> Accept
                      </button>
                      <button
                        onClick={() => act(d._id, "", { status: "rejected" })}
                        disabled={actingId === d._id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-100 text-red-700 text-sm font-semibold hover:bg-red-200 disabled:opacity-50"
                      >
                        <X size={14} /> Reject
                      </button>
                    </>
                  )}

                  {d.status === "accepted" && (
                    <button
                      onClick={() => act(d._id, "/dispatch")}
                      disabled={actingId === d._id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-600 disabled:opacity-50"
                    >
                      <Truck size={14} /> {actingId === d._id ? "Dispatching..." : "Mark Dispatched"}
                    </button>
                  )}

                  {["accepted", "dispatched", "completed"].includes(d.status) && (
                    <>
                      {d.ownerPhone && (
                        <a
                          href={`tel:${d.ownerPhone}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-100 text-sky-700 text-sm font-semibold hover:bg-sky-200"
                        >
                          <Phone size={14} /> Call
                        </a>
                      )}
                      <button
                        onClick={() => navigate(`/demand-chat/${d._id}`)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-white text-sm font-semibold hover:bg-slate-900"
                      >
                        <MessageCircle size={14} /> Chat
                      </button>
                    </>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
