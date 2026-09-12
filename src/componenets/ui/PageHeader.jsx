import React from "react";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ROLE_GRADIENTS = {
  purchaser: "from-role-purchaser-from to-role-purchaser-to",
  stockist: "from-role-stockist-from to-role-stockist-to",
  medical: "from-role-medical-from to-role-medical-to",
  staff: "from-role-staff-from to-role-staff-to",
  slate: "from-slate-900 to-slate-800",
  none: "",
};

/**
 * Back-button + title header used at the top of nearly every Nebula screen
 * (each RN screen hand-rolls its own header since `headerShown: false` is
 * set globally there) — recreated here as one shared component.
 */
export default function PageHeader({
  title,
  subtitle,
  role = "none",
  onBack,
  showBack = true,
  right,
  className = "",
}) {
  const navigate = useNavigate();
  const gradient = ROLE_GRADIENTS[role] || ROLE_GRADIENTS.none;
  const isGradient = role !== "none";

  return (
    <div
      className={`flex items-center gap-3 px-5 py-4 ${
        isGradient ? `bg-gradient-to-r ${gradient} text-white` : "bg-white text-slate-900 border-b border-slate-100"
      } ${className}`}
    >
      {showBack && (
        <button
          onClick={onBack || (() => navigate(-1))}
          className={`p-2 rounded-full transition-colors ${
            isGradient ? "hover:bg-white/15" : "hover:bg-slate-100"
          }`}
          aria-label="Go back"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}
      <div className="flex-1 min-w-0">
        <h1 className="text-lg font-bold truncate">{title}</h1>
        {subtitle && (
          <p className={`text-xs truncate ${isGradient ? "text-white/80" : "text-slate-500"}`}>
            {subtitle}
          </p>
        )}
      </div>
      {right}
    </div>
  );
}
