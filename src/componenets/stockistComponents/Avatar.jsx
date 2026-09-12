import React from "react";

// Rotating gradient "squircle" avatar matching Nebula's stockist/staff avatar
// treatment (stockist-dashboard.jsx Avatar + IdentityCard.jsx Avatar both use
// a rounded-square badge with initials, not a plain circle).
const GRADIENTS = [
  "from-violet-500 via-purple-500 to-fuchsia-500",
  "from-blue-500 via-cyan-500 to-teal-500",
  "from-pink-500 via-rose-500 to-red-500",
  "from-emerald-500 via-green-500 to-lime-500",
];

export default function Avatar({ name, size = 64, online = false, className = "" }) {
  const initials = (name || "")
    .split(" ")
    .map((s) => (s ? s[0] : ""))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const colorIndex = name ? name.charCodeAt(0) % GRADIENTS.length : 0;

  return (
    <div className="relative inline-block shrink-0">
      <div
        className={`flex items-center justify-center bg-gradient-to-br ${GRADIENTS[colorIndex]} text-white font-bold shadow-card ring-2 ring-white ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.32, borderRadius: size / 3 }}
      >
        {initials || "?"}
      </div>
      {online && (
        <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-400 border-2 border-white rounded-full" />
      )}
    </div>
  );
}
