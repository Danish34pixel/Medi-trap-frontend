import React, { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiUrl } from "./config/api";
import { canViewAds } from "./utils/adEligibility";

export default function AnnouncementButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const [count, setCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    const loadCount = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user") || "null");
        if (!canViewAds(user?.role)) return;
        const token = localStorage.getItem("token");
        const response = await fetch(apiUrl("/announcements/unread-count"), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!response.ok) return;
        const result = await response.json();
        if (mounted) setCount(Number(result.count) || 0);
      } catch (error) {
        console.warn("Announcement count unavailable:", error.message);
      }
    };
    loadCount();
    return () => {
      mounted = false;
    };
  }, [location.pathname]);

  try {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (!canViewAds(user?.role)) return null;
  } catch {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => navigate("/announcement")}
      aria-label="Announcements"
      className="fixed right-5 top-5 z-40 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-card hover:bg-slate-50"
    >
      <span className="relative">
        <Bell size={18} />
        {count > 0 && (
          <span className="absolute -right-3 -top-3 min-w-5 rounded-full bg-cyan-600 px-1.5 py-0.5 text-center text-[10px] font-bold leading-4 text-white">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </span>
      <span className="hidden sm:inline">Announcements</span>
    </button>
  );
}
