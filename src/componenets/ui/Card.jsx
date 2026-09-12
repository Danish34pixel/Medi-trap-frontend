import React from "react";

/**
 * Shared card surface matching Nebula's repeated card recipe: white/glass
 * background, rounded corners, and the one shadow value reused across nearly
 * every screen in the RN app (shadowOpacity 0.05-0.15, radius 8-20).
 */
export default function Card({
  children,
  className = "",
  glass = false,
  padding = "p-6",
  elevated = false,
  ...props
}) {
  const surface = glass
    ? "bg-white/85 backdrop-blur-sm"
    : "bg-white";

  return (
    <div
      {...props}
      className={`${surface} rounded-2xl border border-slate-100 ${
        elevated ? "shadow-card-lg" : "shadow-card"
      } ${padding} ${className}`}
    >
      {children}
    </div>
  );
}
