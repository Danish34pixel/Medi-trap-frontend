import React, { useEffect, useMemo, useState } from "react";
import { Bell, BellOff, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchJson } from "./config/api";

// Web port of nebula/components/DemandNotificationsButton.jsx. Same fetch,
// same client-side filter intent, same localStorage-based (not server-side)
// read tracking. See report for the one deliberate deviation from nebula's
// filters (both were checked against the real backend statuses).

const STORAGE_KEY_PREFIX = "demandNotificationReadIds";

// Deep-link targets: the actual demand-inbox/demand-history screens
// (Stockist/DemandInbox.jsx, Routes/DemandHistory.jsx), which read this
// same ?demandId= to highlight the matching card.
const TARGET_ROUTE = {
  stockist: "/Stockist/demand-inbox",
  medical_owner: "/MedicalOwner/demand-history",
};

const formatTime = (date) => {
  if (!date) return "Unknown";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "Unknown";
  return parsed.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

// Builds the notification list for a stockist viewer from
// GET /api/demand?stockistId= (routes/demand.js already excludes
// status "pending" server-side, so a fresh incoming demand the stockist
// hasn't acted on yet is status "sent" — nebula's client-side filter for
// {sent, pending, new, created} is stale: "pending" never reaches this
// endpoint and "new"/"created" aren't in the SupplierDemand status enum at
// all (pending|sent|accepted|rejected|dispatched|completed), so "sent" is
// the only one that ever matches).
function buildStockistNotifications(list) {
  return (Array.isArray(list) ? list : [])
    .filter((d) => d && d._id && d.status === "sent")
    .map((d) => ({
      id: d._id,
      title: d.purchaserName || "Medical owner",
      subtitle: `${Array.isArray(d.items) ? d.items.length : 0} item(s) requested`,
      time: formatTime(d.sentAt || d.createdAt),
      createdAt: d.sentAt || d.createdAt,
    }));
}

// Builds the notification list for a medical-owner viewer from
// GET /api/demand?ownerId=. nebula filters top-level demand.status ===
// "received", but the backend has no "received" status anywhere
// (SupplierDemand enum is pending|sent|accepted|rejected|dispatched|
// completed) and this endpoint's response shape doesn't even have a
// top-level status — each Demand has a `supplierDemands` array, one per
// stockist, each with its own status. The moment an owner actually needs a
// notification is when a stockist accepts their demand, so we flatten to
// one notification per supplierDemand with status "accepted" — the closest
// correct equivalent to nebula's intent ("Marked received by stockist").
function buildOwnerNotifications(list) {
  const out = [];
  for (const d of Array.isArray(list) ? list : []) {
    for (const sd of Array.isArray(d?.supplierDemands) ? d.supplierDemands : []) {
      if (sd.status !== "accepted") continue;
      out.push({
        id: sd._id,
        title: sd.stockistName || "Stockist",
        subtitle: `Accepted ${Array.isArray(sd.items) ? sd.items.length : 0} item(s)`,
        time: formatTime(sd.acceptedAt || d.createdAt),
        createdAt: sd.acceptedAt || d.createdAt,
      });
    }
  }
  return out;
}

function readReadIds(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * userRole: "stockist" or "medical_owner" (matches TARGET_ROUTE keys above).
 * userId: the current user's _id/id, used to build the query string.
 */
export default function DemandNotificationsButton({ userRole, userId }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [readIds, setReadIds] = useState([]);

  const storageKey = `${STORAGE_KEY_PREFIX}_${userRole}`;

  useEffect(() => {
    if (!userRole || !userId) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");
      try {
        const endpoint =
          userRole === "stockist"
            ? `/demand?stockistId=${encodeURIComponent(userId)}`
            : `/demand?ownerId=${encodeURIComponent(userId)}`;
        const response = await fetchJson(endpoint);
        const list = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
            ? response.data
            : [];
        const derived =
          userRole === "stockist"
            ? buildStockistNotifications(list)
            : buildOwnerNotifications(list);
        derived.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        if (!cancelled) {
          setNotifications(derived);
          setReadIds(readReadIds(storageKey));
        }
      } catch (err) {
        // Never let a failed fetch crash the host page.
        if (!cancelled) setError(err?.message || "Failed to load notifications.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userRole, userId, storageKey]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !readIds.includes(n.id)).length,
    [notifications, readIds],
  );

  const markReadAndNavigate = (notification) => {
    const nextRead = Array.from(new Set([...readIds, notification.id]));
    setReadIds(nextRead);
    try {
      localStorage.setItem(storageKey, JSON.stringify(nextRead));
    } catch {
      // ignore storage failures
    }
    setOpen(false);
    const target = TARGET_ROUTE[userRole] || "/";
    navigate(`${target}?demandId=${encodeURIComponent(notification.id)}`);
  };

  if (!userRole) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Demand notifications"
        className="fixed right-5 top-20 z-40 inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white shadow-card hover:bg-slate-50"
      >
        <span className="relative">
          <Bell size={18} className="text-slate-700" />
          {unreadCount > 0 && (
            <span className="absolute -right-3 -top-3 min-w-5 rounded-full bg-red-500 px-1.5 py-0.5 text-center text-[10px] font-bold leading-4 text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex justify-end bg-slate-950/35"
          role="dialog"
          aria-modal="true"
          aria-label="Demand notifications"
          onClick={() => setOpen(false)}
        >
          <div
            className="h-full w-full max-w-sm bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Demand Notifications</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {userRole === "stockist"
                ? "New demands sent to you"
                : "Acceptance updates from stockists"}
            </p>

            <div className="mt-4">
              {loading ? (
                <p className="text-sm text-slate-500">Loading...</p>
              ) : error ? (
                <p className="text-sm text-red-600">{error}</p>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-slate-400">
                  <BellOff size={32} />
                  <p className="text-sm">No new demand notifications</p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {notifications.map((n) => (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => markReadAndNavigate(n)}
                        className="flex w-full items-start gap-3 py-3 text-left"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-800">{n.title}</p>
                          <p className="mt-0.5 text-xs text-slate-600">{n.subtitle}</p>
                          <p className="mt-1 text-[11px] text-slate-400">{n.time}</p>
                        </div>
                        {!readIds.includes(n.id) && (
                          <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-red-500" />
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
