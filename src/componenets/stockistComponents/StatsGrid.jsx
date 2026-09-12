import React from "react";
import { Briefcase, Package, Users } from "lucide-react";

// Matches Nebula's stockist-dashboard.jsx StatCard trio exactly:
// Companies (orange/amber), Medicines (blue/cyan), Staff (purple/fuchsia).
const STAT_CONFIG = [
  {
    key: "companies",
    label: "Companies",
    icon: Briefcase,
    gradient: "from-orange-400 via-amber-500 to-yellow-500",
    tint: "from-white to-orange-50",
    border: "border-orange-100",
  },
  {
    key: "medicines",
    label: "Medicines",
    icon: Package,
    gradient: "from-blue-500 via-cyan-500 to-teal-500",
    tint: "from-white to-blue-50",
    border: "border-blue-100",
  },
  {
    key: "staff",
    label: "Staff Members",
    icon: Users,
    gradient: "from-purple-500 via-fuchsia-500 to-pink-500",
    tint: "from-white to-purple-50",
    border: "border-purple-100",
  },
];

/**
 * Three gradient stat cards matching Nebula's stockist-dashboard StatCard
 * (Companies / Medicines / Staff), each with a colored icon badge.
 */
export default function StatsGrid({ stats = {} }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {STAT_CONFIG.map(({ key, label, icon: Icon, gradient, tint, border }) => (
        <div
          key={key}
          className={`bg-gradient-to-br ${tint} rounded-3xl p-6 shadow-card hover:shadow-card-lg transition-all duration-300 border-2 ${border} group`}
        >
          <div
            className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-xl mb-4 group-hover:rotate-6 transition-transform`}
          >
            <Icon className="w-7 h-7 text-white" />
          </div>
          <div className="text-3xl font-black text-gray-900 mb-1">
            {stats[key] ?? 0}
          </div>
          <div className="text-sm text-gray-600 font-bold uppercase tracking-wide">
            {label}
          </div>
        </div>
      ))}
    </div>
  );
}
