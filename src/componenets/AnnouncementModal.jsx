import React, { useEffect, useRef, useState } from "react";
import { Bell, X } from "lucide-react";
import { useLocation } from "react-router-dom";
import { apiUrl } from "./config/api";
import { canViewAds } from "./utils/adEligibility";

const THREE_HOURS = 3 * 60 * 60 * 1000;
const COOLDOWN_PREFIX = "meditrap_announcement_cooldowns_";

const userKey = (user) =>
  String(user?._id || user?.id || user?.email || "unknown");

function readCooldowns(key) {
  try {
    const value = JSON.parse(
      localStorage.getItem(`${COOLDOWN_PREFIX}${key}`) || "{}",
    );
    return value && typeof value === "object" ? value : {};
  } catch {
    return {};
  }
}

function acknowledge(key, announcementId) {
  const cooldowns = readCooldowns(key);
  cooldowns[announcementId] = Date.now();
  localStorage.setItem(`${COOLDOWN_PREFIX}${key}`, JSON.stringify(cooldowns));
}

export default function AnnouncementModal() {
  const location = useLocation();
  const [announcement, setAnnouncement] = useState(null);
  const activeRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user") || "null");
        if (!canViewAds(user?.role)) return;
        const key = userKey(user);
        const cooldowns = readCooldowns(key);
        const token = localStorage.getItem("token");
        const response = await fetch(apiUrl("/announcements/active"), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!response.ok) return;
        const result = await response.json();
        const next = (result.data || []).find((item) => {
          const acknowledgedAt = Number(cooldowns[item._id]);
          return (
            !acknowledgedAt ||
            Number.isNaN(acknowledgedAt) ||
            Date.now() - acknowledgedAt >= THREE_HOURS
          );
        });
        if (mounted && next && !activeRef.current) {
          activeRef.current = { id: next._id, key };
          setAnnouncement(next);
        }
      } catch (error) {
        console.warn("Announcements are unavailable:", error.message);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [location.pathname]);

  const close = () => {
    if (!announcement || !activeRef.current) return;
    acknowledge(activeRef.current.key, activeRef.current.id);
    activeRef.current = null;
    setAnnouncement(null);
  };

  if (!announcement) return null;
  return (
    <div
      className="fixed inset-0 z-[55] flex items-center justify-center bg-slate-950/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Announcement"
    >
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <button
          type="button"
          onClick={close}
          aria-label="Close announcement"
          className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          <X size={18} />
        </button>
        <Bell className="h-8 w-8 text-cyan-600" />
        <p className="mt-4 text-xs font-bold uppercase tracking-wider text-cyan-600">
          Announcement
        </p>
        <h2 className="mt-2 pr-8 text-xl font-bold text-slate-900">
          {announcement.title}
        </h2>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
          {announcement.message}
        </p>
        <button
          type="button"
          onClick={close}
          className="mt-6 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
