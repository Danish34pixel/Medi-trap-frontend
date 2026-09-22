import React, { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { apiUrl } from "./config/api";
import { useLocation } from "react-router-dom";
import { canViewAds } from "./utils/adEligibility";

const TWO_HOURS = 2 * 60 * 60 * 1000;
const COOLDOWN_KEY_PREFIX = "meditrap_ad_cooldowns_";

function getUserKey(user) {
  return String(user?._id || user?.id || user?.email || "unknown").trim();
}

function getCooldowns(userKey) {
  try {
    const stored = localStorage.getItem(`${COOLDOWN_KEY_PREFIX}${userKey}`);
    const parsed = stored ? JSON.parse(stored) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveCooldown(userKey, adId) {
  const cooldowns = getCooldowns(userKey);
  cooldowns[adId] = Date.now();
  localStorage.setItem(
    `${COOLDOWN_KEY_PREFIX}${userKey}`,
    JSON.stringify(cooldowns),
  );
}

export default function AdModal() {
  const location = useLocation();
  const [ad, setAd] = useState(null);
  const [canClose, setCanClose] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const activeAdRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user") || "null");
        if (!canViewAds(user?.role)) return;
        const userKey = getUserKey(user);
        const cooldowns = getCooldowns(userKey);
        const token = localStorage.getItem("token");
        const response = await fetch(apiUrl("/ads/active"), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!response.ok) return;
        const result = await response.json();
        const eligibleAds = (result.data || []).filter((item) => {
          const lastClosedAt = Number(cooldowns[item._id]);
          return (
            !lastClosedAt ||
            Number.isNaN(lastClosedAt) ||
            Date.now() - lastClosedAt >= TWO_HOURS
          );
        });
        if (mounted && !activeAdRef.current && eligibleAds.length) {
          const nextAd = eligibleAds[0];
          setAd(nextAd);
          activeAdRef.current = { ad: nextAd, userKey };
          setCanClose(false);
          setImageFailed(false);
        }
      } catch (error) {
        console.warn("Ads are unavailable:", error.message);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [location.pathname]);

  useEffect(() => {
    if (!ad) return undefined;
    const timer = window.setTimeout(() => setCanClose(true), 5000);
    return () => window.clearTimeout(timer);
  }, [ad]);

  const closeAd = () => {
    if (!ad || !canClose) return;
    const activeAd = activeAdRef.current;
    if (activeAd?.ad?._id === ad._id) {
      saveCooldown(activeAd.userKey, ad._id);
    }
    activeAdRef.current = null;
    setAd(null);
  };

  if (!ad) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Advertisement"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl safe-area-inset-bottom">
        <div className="h-56 bg-slate-100 flex items-center justify-center">
          {imageFailed ? (
            <span className="text-sm text-slate-400">Image unavailable</span>
          ) : (
            <img
              src={ad.image}
              alt={ad.title}
              onError={() => setImageFailed(true)}
              className="h-full w-full object-cover"
            />
          )}
        </div>
        <div className="p-6">
          <p className="text-xs font-bold uppercase tracking-wider text-cyan-600">
            Advertisement
          </p>
          <h2 className="mt-2 text-xl font-bold text-slate-900">{ad.title}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {ad.description}
          </p>
          {(ad.stockists || []).length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-slate-700">
                Available at:
              </p>
              <ul className="mt-1 list-disc pl-5 text-sm text-slate-600">
                {ad.stockists.map((stockist) => (
                  <li key={stockist._id || stockist}>
                    {stockist.name || stockist.contactPerson || "Stockist"}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {canClose && (
            <button
              type="button"
              onClick={closeAd}
              aria-label="Close advertisement"
              className="absolute right-3 bottom-3 rounded-full bg-slate-100 p-2 text-slate-600 hover:bg-slate-200"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
