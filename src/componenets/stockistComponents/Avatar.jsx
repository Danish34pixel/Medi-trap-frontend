import React from "react";

export default function Avatar({ name, size = 64, online = false }) {
  const initials = (name || "")
    .split(" ")
    .map((s) => (s ? s[0] : ""))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="relative">
      <div
        className={`flex items-center justify-center rounded-full bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 text-white font-bold shadow-2xl ring-4 ring-white/20 hover:ring-white/40 transition-all duration-300 hover:scale-110 ${
          online ? "ring-green-400" : ""
        }`}
        style={{ width: size, height: size, fontSize: size * 0.25 }}
      >
        {initials || "S"}
      </div>
      {online && (
        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full animate-pulse"></div>
      )}
    </div>
  );
}
