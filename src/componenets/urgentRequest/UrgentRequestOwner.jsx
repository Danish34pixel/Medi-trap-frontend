import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Phone,
  MessageCircle,
  Clock,
  XCircle,
  Loader2,
} from "lucide-react";
import { fetchJson } from "../config/api";
import PageHeader from "../ui/PageHeader";
import Card from "../ui/Card";

const STATUS_STYLES = {
  pending: "bg-amber-100 text-amber-800",
  accepted: "bg-sky-100 text-sky-800",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-slate-200 text-slate-600",
};

function emptyRow() {
  return { id: Date.now() + Math.random(), name: "", quantity: 1, description: "" };
}

// Medical-owner screen: broadcast an urgent need to every purchaser (first
// to accept wins), and track the fate of requests already sent.
// Nebula reference: app screens under Urgent Request (medical owner side).
export default function UrgentRequestOwner() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([emptyRow()]);
  const [urgencyNote, setUrgencyNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [confirmCancelId, setConfirmCancelId] = useState(null);

  const pausedRef = useRef(document.hidden);

  const loadMine = useCallback(async () => {
    try {
      const res = await fetchJson("/urgent-request/mine");
      setRequests(res?.data || []);
    } catch (e) {
      // ponytail: sticky first error only, so a flaky poll tick doesn't
      // flicker the banner on every 5s cycle.
      setListError((prev) => prev || e.body?.message || e.message || "Could not load your requests.");
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
    loadMine();
    const timer = setInterval(() => {
      if (!pausedRef.current) loadMine();
    }, 5000);
    return () => clearInterval(timer);
  }, [loadMine]);

  const updateRow = (id, patch) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const addRow = () => setRows((prev) => [...prev, emptyRow()]);
  const removeRow = (id) => setRows((prev) => prev.filter((r) => r.id !== id));

  const submit = async () => {
    setSubmitError(null);
    const items = rows
      .map((r) => ({
        name: (r.name || "").trim(),
        quantity: Math.max(1, Number(r.quantity) || 1),
        description: (r.description || "").trim() || undefined,
      }))
      .filter((it) => it.name);

    if (items.length === 0) {
      setSubmitError("Add at least one medicine name.");
      return;
    }

    setSubmitting(true);
    try {
      await fetchJson("/urgent-request/create", {
        method: "POST",
        body: JSON.stringify({ items, urgencyNote: urgencyNote.trim() || undefined }),
      });
      setRows([emptyRow()]);
      setUrgencyNote("");
      await loadMine();
    } catch (e) {
      setSubmitError(e.body?.message || e.message || "Could not send the urgent request.");
    } finally {
      setSubmitting(false);
    }
  };

  const cancelRequest = async (id) => {
    setCancellingId(id);
    try {
      await fetchJson(`/urgent-request/${id}/cancel`, { method: "POST", body: JSON.stringify({}) });
      setConfirmCancelId(null);
      await loadMine();
    } catch (e) {
      setListError(e.body?.message || e.message || "Could not cancel the request.");
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <PageHeader title="Urgent Request" subtitle="Broadcast an urgent need to every purchaser" role="medical" />
      <div className="container mx-auto max-w-2xl px-4 py-8 sm:py-12">
        <Card padding="p-6 sm:p-8" elevated className="mb-8 rounded-4xl">
          <h2 className="text-2xl font-semibold text-slate-800 mb-6">What do you need?</h2>

          <div className="space-y-4 mb-6">
            {rows.map((row, index) => (
              <div key={row.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex-shrink-0 w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-sm font-bold text-slate-600">
                    {index + 1}
                  </div>
                  <input
                    value={row.name}
                    onChange={(e) => updateRow(row.id, { name: e.target.value })}
                    placeholder="Medicine name..."
                    className="flex-1 bg-transparent text-slate-800 placeholder-slate-400 focus:outline-none"
                  />
                  <input
                    type="number"
                    min={1}
                    value={row.quantity}
                    onChange={(e) =>
                      updateRow(row.id, { quantity: Math.max(1, Number(e.target.value) || 1) })
                    }
                    className="w-20 px-3 py-2 border border-slate-300 rounded-lg text-center bg-white outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  {rows.length > 1 && (
                    <button
                      onClick={() => removeRow(row.id)}
                      className="p-2 text-slate-400 hover:bg-orange-100 hover:text-orange-500 rounded-full transition-colors"
                      title="Remove item"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
                <input
                  value={row.description}
                  onChange={(e) => updateRow(row.id, { description: e.target.value })}
                  placeholder="Notes (optional)"
                  className="w-full ml-11 bg-transparent text-sm text-slate-600 placeholder-slate-400 focus:outline-none"
                />
              </div>
            ))}
          </div>

          <button
            onClick={addRow}
            className="flex items-center gap-2 px-4 py-2 mb-6 border-2 border-dashed border-slate-300 hover:border-sky-500 hover:bg-sky-50 text-slate-600 hover:text-sky-600 rounded-lg font-semibold transition-colors"
          >
            <Plus size={18} /> Add Item
          </button>

          <textarea
            value={urgencyNote}
            onChange={(e) => setUrgencyNote(e.target.value)}
            placeholder="Urgency note (optional) — e.g. patient waiting, needed within the hour"
            rows={2}
            className="w-full px-4 py-3 mb-6 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          />

          {submitError && (
            <div className="bg-orange-100 border-l-4 border-orange-500 rounded-r-lg p-4 mb-4 flex items-center gap-3">
              <AlertTriangle className="text-orange-500" size={20} />
              <div className="text-orange-800 font-medium">{submitError}</div>
            </div>
          )}

          <button
            onClick={submit}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-600 hover:to-sky-600 text-white rounded-lg font-semibold transition-colors shadow-sm disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="animate-spin" size={18} /> Sending...
              </>
            ) : (
              "Broadcast Urgent Request"
            )}
          </button>
        </Card>

        <h3 className="text-xl font-semibold text-slate-800 mb-4">My Requests</h3>

        {listError && (
          <div className="bg-orange-100 border-l-4 border-orange-500 rounded-r-lg p-4 mb-4 flex items-center gap-3">
            <AlertTriangle className="text-orange-500" size={20} />
            <div className="text-orange-800 font-medium">{listError}</div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-slate-400" size={32} />
          </div>
        ) : requests.length === 0 ? (
          <Card padding="p-8" className="text-center text-slate-500">
            No requests yet.
          </Card>
        ) : (
          <div className="space-y-4">
            {requests.map((r) => (
              <Card key={r._id} padding="p-5" elevated className="rounded-2xl">
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase ${
                      STATUS_STYLES[r.status] || STATUS_STYLES.pending
                    }`}
                  >
                    {r.status === "pending" && <Clock size={12} />}
                    {r.status === "accepted" && <CheckCircle2 size={12} />}
                    {r.status === "cancelled" && <XCircle size={12} />}
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
                      {it.description ? <span className="text-slate-400"> — {it.description}</span> : null}
                    </div>
                  ))}
                </div>
                {r.urgencyNote && (
                  <div className="text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mb-3">
                    {r.urgencyNote}
                  </div>
                )}

                {r.status === "pending" && (
                  confirmCancelId === r._id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-600">Cancel this request?</span>
                      <button
                        onClick={() => cancelRequest(r._id)}
                        disabled={cancellingId === r._id}
                        className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-sm font-semibold disabled:opacity-50"
                      >
                        {cancellingId === r._id ? "Cancelling..." : "Yes, cancel"}
                      </button>
                      <button
                        onClick={() => setConfirmCancelId(null)}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-sm font-semibold"
                      >
                        Keep it
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmCancelId(r._id)}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 text-sm font-semibold hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  )
                )}

                {r.status === "accepted" && (
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="text-sm text-slate-700">
                      Accepted by <span className="font-semibold">{r.purchaserName || "a purchaser"}</span>
                    </div>
                    {r.purchaserPhone && (
                      <a
                        href={`tel:${r.purchaserPhone}`}
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
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
