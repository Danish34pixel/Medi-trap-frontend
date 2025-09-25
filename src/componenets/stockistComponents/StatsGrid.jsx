import React from "react";
import {
  Building,
  Box,
  Users,
  TrendingUp,
  Activity,
  Award,
} from "lucide-react";

export default function StatsGrid({ stats }) {
  return (
    <div className="bg-gradient-to-r from-white via-gray-50 to-white px-8 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl opacity-0 group-hover:opacity-10 transition-all duration-300"></div>
          <div className="relative text-center p-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-100 hover:border-blue-200 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl mb-6 shadow-xl group-hover:shadow-2xl transition-all duration-300">
              <Building className="text-white" size={28} />
            </div>
            <div className="text-4xl font-black text-gray-900 mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {stats.companies}
            </div>
            <div className="text-sm font-bold text-gray-600 uppercase tracking-wider">
              Companies
            </div>
            <div className="absolute top-4 right-4">
              <TrendingUp size={16} className="text-blue-400" />
            </div>
          </div>
        </div>

        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-green-500 rounded-2xl opacity-0 group-hover:opacity-10 transition-all duration-300"></div>
          <div className="relative text-center p-8 bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl border-2 border-emerald-100 hover:border-emerald-200 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-500 rounded-2xl mb-6 shadow-xl group-hover:shadow-2xl transition-all duration-300">
              <Box className="text-white" size={28} />
            </div>
            <div className="text-4xl font-black text-gray-900 mb-2 bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
              {stats.medicines}
            </div>
            <div className="text-sm font-bold text-gray-600 uppercase tracking-wider">
              Medicines
            </div>
            <div className="absolute top-4 right-4">
              <Activity size={16} className="text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-violet-500 rounded-2xl opacity-0 group-hover:opacity-10 transition-all duration-300"></div>
          <div className="relative text-center p-8 bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl border-2 border-purple-100 hover:border-purple-200 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-violet-500 rounded-2xl mb-6 shadow-xl group-hover:shadow-2xl transition-all duration-300">
              <Users className="text-white" size={28} />
            </div>
            <div className="text-4xl font-black text-gray-900 mb-2 bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
              {stats.staff}
            </div>
            <div className="text-sm font-bold text-gray-600 uppercase tracking-wider">
              Staff Members
            </div>
            <div className="absolute top-4 right-4">
              <Award size={16} className="text-purple-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
