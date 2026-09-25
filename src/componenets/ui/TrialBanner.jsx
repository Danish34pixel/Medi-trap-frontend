import React from "react";
import { Clock } from "lucide-react";

// Ported from nebula/components/TrialBanner.jsx.
export default function TrialBanner({ daysLeft }) {
  if (daysLeft == null) return null;

  return (
    <div className="flex items-center justify-center gap-2 bg-amber-100 border-b border-amber-200 py-2.5 px-4">
      <Clock className="w-4 h-4 text-amber-800" />
      <span className="text-amber-800 font-semibold text-sm">
        Free trial &mdash; {daysLeft} {daysLeft === 1 ? "day" : "days"} left
      </span>
    </div>
  );
}
