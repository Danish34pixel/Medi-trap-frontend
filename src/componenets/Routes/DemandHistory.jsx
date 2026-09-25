import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Phone, MessageCircle, Loader2, AlertTriangle } from "lucide-react";
import { fetchJson } from "../config/api";
import { useAuth } from "../context/AuthContext";
import PageHeader from "../ui/PageHeader";
import Card from "../ui/Card";

const STATUS_STYLES = {
  pending: "bg-slate-100 text-slate-600",
  sent: "bg-amber-100 text-amber-800",
  accepted: "bg-sky-100 text-sky-800",
  dispatched: "bg-indigo-100 text-indigo-800",
  completed: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-700",
};

// Medical owner's "My Orders" — GET /demand?ownerId= returns each Demand
// with a supplierDemands[] array, one entry per stockist that carries an
// item (routes/demand.js). Chat/call only once a supplierDemand is
// accepted/dispatched/completed (stockist contact info is only revealed
// past that point server-side). Deep-link highlight via ?demandId=
// (DemandNotificationsButton — the id there is a supplierDemand _id).
export default function DemandHistory() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get("demandId");

  const [demands, setDemands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const pausedRef = useRef(document.hidden);
  const ownerId = user?._id || user?.id;

  const load = useCallback(async () => {
    if (!ownerId) return;
    try {
      const res = await fetchJson(`/demand?ownerId=${encodeURIComponent(ownerId)}`);
      setDemands(res?.data || []);
      setError(null);
    } catch (e) {
      setError((prev) => prev || e.body?.message || e.message || "Could not load your orders.");
    } finally {
      setLoading(false);
    }
  }, [ownerId]);

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
    load();
    const timer = setInterval(() => {
      if (!pausedRef.current) load();
    }, 5000);
    return () => clearInterval(timer);
  }, [load]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <PageHeader title="My Orders" subtitle="Demand requests you've sent" role="medical" />
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
        ) : demands.length === 0 ? (
          <Card padding="p-8" className="text-center text-slate-500">
            No demand history found.
          </Card>
        ) : (
          <div className="space-y-4">
            {demands.map((d) => (
              <Card key={d._id} padding="p-5" elevated className="rounded-2xl">
                <div className="text-xs text-slate-400 mb-3">
                  {d.createdAt ? new Date(d.createdAt).toLocaleString() : ""}
                </div>

                <div className="space-y-1 mb-4">
                  {(d.lines || d.items || []).map((it, i) => (
                    <div key={i} className="text-sm text-slate-700">
                      <span className="font-medium">{it.name}</span> × {it.qty || it.quantity || 1}
                    </div>
                  ))}
                </div>

                {(d.supplierDemands || []).length === 0 ? (
                  <div className="text-sm text-slate-400">Not yet sent to any stockist.</div>
                ) : (
                  <div className="space-y-2">
                    {d.supplierDemands.map((sd) => (
                      <div
                        key={sd._id}
                        className={`flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 ${
                          highlightId === sd._id ? "ring-2 ring-cyan-400" : ""
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-slate-800 truncate">
                            {sd.stockistName || "Stockist"}
                          </div>
                          <span
                            className={`inline-flex mt-1 items-center px-2 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                              STATUS_STYLES[sd.status] || "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {sd.status}
                          </span>
                        </div>
                        {["accepted", "dispatched", "completed"].includes(sd.status) && (
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {sd.stockistPhone && (
                              <a
                                href={`tel:${sd.stockistPhone}`}
                                className="p-2 rounded-lg bg-sky-100 text-sky-700 hover:bg-sky-200"
                                aria-label="Call stockist"
                              >
                                <Phone size={14} />
                              </a>
                            )}
                            <button
                              onClick={() => navigate(`/demand-chat/${sd._id}`)}
                              className="p-2 rounded-lg bg-slate-800 text-white hover:bg-slate-900"
                              aria-label="Chat with stockist"
                            >
                              <MessageCircle size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
