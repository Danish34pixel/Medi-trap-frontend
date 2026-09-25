import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  Phone,
  MessageCircle,
  Loader2,
  Inbox,
} from "lucide-react";
import { fetchJson } from "../config/api";
import PageHeader from "../ui/PageHeader";
import Card from "../ui/Card";

// Purchaser screen: race to accept urgent requests from any medical owner.
// Backed by the single GET /urgent-request/dashboard poll endpoint.
// Nebula reference: purchaser-side Urgent Request tabs (Pending / My Accepted).
export default function UrgentRequestPurchaser() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("pending"); // pending | accepted
  const [pending, setPending] = useState([]);
  const [accepted, setAccepted] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [acceptingId, setAcceptingId] = useState(null);
  // Per-request transient message: { text, kind: "lost" | "error" }
  const [rowMessages, setRowMessages] = useState({});

  const pausedRef = useRef(document.hidden);

  const load = useCallback(async () => {
    try {
      const res = await fetchJson("/urgent-request/dashboard");
      setPending(res?.pending || []);
      setAccepted(res?.accepted || []);
    } catch (e) {
      // ponytail: sticky first error, don't flicker on every 5s poll tick.
      setError((prev) => prev || e.body?.message || e.message || "Could not load urgent requests.");
    } finally {
      setLoading(false);
    }
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
    load();
    const timer = setInterval(() => {
      if (!pausedRef.current) load();
    }, 5000);
    return () => clearInterval(timer);
  }, [load]);

  const accept = async (id) => {
    setAcceptingId(id);
    setRowMessages((prev) => ({ ...prev, [id]: null }));
    try {
      await fetchJson(`/urgent-request/${id}/accept`, { method: "POST" });
      setTab("accepted");
      await load();
    } catch (e) {
      if (e.status === 409) {
        // Expected outcome of losing the race, not a generic error.
        setRowMessages((prev) => ({
          ...prev,
          [id]: { kind: "lost", text: "Too slow — someone else already accepted this." },
        }));
        // Remove just this request from the pending list; leave everything else untouched.
        setPending((prev) => prev.filter((r) => r._id !== id));
      } else {
        setRowMessages((prev) => ({
          ...prev,
          [id]: { kind: "error", text: e.body?.message || e.message || "Could not accept. Try again." },
        }));
      }
    } finally {
      setAcceptingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <PageHeader title="Urgent Requests" subtitle="Medicine needed urgently by medical owners" role="purchaser" />
      <div className="container mx-auto max-w-2xl px-4 py-8 sm:py-12">
        <div className="flex gap-2 mb-6 bg-slate-200 rounded-xl p-1">
          {["pending", "accepted"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-colors ${
                tab === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
              }`}
            >
              {t === "pending" ? "Pending" : "My Accepted"}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-orange-100 border-l-4 border-orange-500 rounded-r-lg p-4 mb-6 flex items-center gap-3">
            <AlertTriangle className="text-orange-500" size={20} />
            <div className="text-orange-800 font-medium">{error}</div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-slate-400" size={32} />
          </div>
        ) : tab === "pending" ? (
          pending.length === 0 ? (
            <Card padding="p-8" className="text-center text-slate-500">
              <Inbox className="mx-auto mb-3 opacity-40" size={40} />
              No requests yet.
            </Card>
          ) : (
            <div className="space-y-4">
              {pending.map((r) => {
                const rowMsg = rowMessages[r._id];
                return (
                  <Card key={r._id} padding="p-5" elevated className="rounded-2xl">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-slate-700">{r.createdByName || "Medical owner"}</span>
                      <span className="text-xs text-slate-400">
                        {r.createdAt ? new Date(r.createdAt).toLocaleString() : ""}
                      </span>
                    </div>
                    <div className="space-y-1 mb-3">
                      {(r.items || []).map((it, i) => (
                        <div key={i} className="text-sm text-slate-700">
                          <span className="font-medium">{it.name}</span> × {it.quantity}
                          {it.description ? <span className="text-slate-400"> — {it.description}</span> : null}
                        </div>
                      ))}
                    </div>
                    {r.urgencyNote && (
                      <div className="text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mb-3">
                        {r.urgencyNote}
                      </div>
                    )}

                    {rowMsg && (
                      <div
                        className={`text-sm rounded-lg px-3 py-2 mb-3 ${
                          rowMsg.kind === "lost"
                            ? "bg-slate-100 text-slate-600"
                            : "bg-orange-100 text-orange-800"
                        }`}
                      >
                        {rowMsg.text}
                      </div>
                    )}

                    <button
                      onClick={() => accept(r._id)}
                      disabled={acceptingId === r._id}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-600 hover:to-sky-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
                    >
                      {acceptingId === r._id ? (
                        <>
                          <Loader2 className="animate-spin" size={16} /> Accepting...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={16} /> Accept
                        </>
                      )}
                    </button>
                  </Card>
                );
              })}
            </div>
          )
        ) : accepted.length === 0 ? (
          <Card padding="p-8" className="text-center text-slate-500">
            <Inbox className="mx-auto mb-3 opacity-40" size={40} />
            No accepted requests yet.
          </Card>
        ) : (
          <div className="space-y-4">
            {accepted.map((r) => (
              <Card key={r._id} padding="p-5" elevated className="rounded-2xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase bg-sky-100 text-sky-800">
                    {r.status}
                  </span>
                  <span className="text-xs text-slate-400">
                    {r.createdAt ? new Date(r.createdAt).toLocaleString() : ""}
                  </span>
                </div>
                <div className="space-y-1 mb-3">
                  {(r.items || []).map((it, i) => (
                    <div key={i} className="text-sm text-slate-700">
                      <span className="font-medium">{it.name}</span> × {it.quantity}
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="text-sm text-slate-700">
                    Owner: <span className="font-semibold">{r.ownerName || "Medical owner"}</span>
                  </div>
                  {r.ownerPhone && (
                    <a
                      href={`tel:${r.ownerPhone}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-100 text-sky-700 text-sm font-semibold hover:bg-sky-200"
                    >
                      <Phone size={14} /> Call
                    </a>
                  )}
                  <button
                    onClick={() => navigate(`/urgent-request-chat/${r._id}`)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-white text-sm font-semibold hover:bg-slate-900"
                  >
                    <MessageCircle size={14} /> Chat
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
