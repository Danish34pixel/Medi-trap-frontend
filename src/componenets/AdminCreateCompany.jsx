import React, { useState, useEffect } from "react";
import {
  Building2,
  Package,
  Users,
  Plus,
  CheckCircle2,
  Heart,
  Pill,
  ShieldCheck,
  UserCheck,
  ArrowLeft,
} from "lucide-react";
import axios from "axios";
import { apiUrl } from "./config/api";

export default function AdminCreateCompany() {
  const [form, setForm] = useState({ name: "", stockists: [] });
  const [loading, setLoading] = useState(false);
  const [stockistsList, setStockistsList] = useState([]);
  const [stockistsLoading, setStockistsLoading] = useState(true);
  const [stockistsError, setStockistsError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const fetchStockists = async () => {
      setStockistsLoading(true);
      setStockistsError(null);
      try {
        const res = await axios.get(apiUrl("/api/stockist"));
        if (mounted) setStockistsList(res.data.data || []);
      } catch (err) {
        if (mounted)
          setStockistsError(
            err.response?.data?.message ||
              err.message ||
              "Failed to load stockists"
          );
      } finally {
        if (mounted) setStockistsLoading(false);
      }
    };

    fetchStockists();
    return () => {
      mounted = false;
    };
  }, []);

  const setField = (path, value) => {
    setForm((f) => ({ ...f, [path]: value }));
  };

  const toggleStockist = (id) => {
    setForm((f) => ({
      ...f,
      stockists: f.stockists.includes(id)
        ? f.stockists.filter((s) => s !== id)
        : [...f.stockists, id],
    }));
  };

  const submit = async (e) => {
    e && e.preventDefault();
    setLoading(true);
    try {
      const token =
        typeof document !== "undefined" && document.cookie.includes("token=")
          ? null
          : null;

      // Prefer cookie token, fall back to localStorage
      const cookieToken = (() => {
        try {
          const m = document.cookie.match(/(?:^|; )token=([^;]+)/);
          return m ? decodeURIComponent(m[1]) : null;
        } catch (e) {
          return null;
        }
      })();

      const authToken =
        cookieToken ||
        (typeof localStorage !== "undefined"
          ? localStorage.getItem("token")
          : null);

      const payload = {
        name: form.name,
        stockists: form.stockists,
      };

      const headers = {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      };

      const res = await axios.post(apiUrl("/api/company"), payload, {
        headers,
      });
      if (res && res.status >= 200 && res.status < 300) {
        alert("Success — company created");
        // navigate back if using react-router
        try {
          window.history.back();
        } catch (e) {}
      } else {
        alert(
          (res && res.data && res.data.message) || "Failed to create company"
        );
      }
    } catch (err) {
      console.error("Create company failed:", err);
      alert(
        err.response?.data?.message || err.message || "Failed to create company"
      );
    } finally {
      setLoading(false);
    }
  };

  const StockistCard = ({ stockist, isSelected, onToggle }) => (
    <div
      onClick={onToggle}
      className="group relative cursor-pointer transition-all duration-200 transform hover:scale-[1.02]"
    >
      <div
        className={`
        relative bg-white rounded-2xl border-2 transition-all duration-200 p-4 shadow-sm
        ${
          isSelected
            ? "border-teal-400 shadow-lg shadow-teal-500/20 bg-teal-50/30"
            : "border-gray-200 hover:border-teal-300 hover:shadow-md"
        }
      `}
      >
        <div className="flex items-center space-x-4">
          <div
            className={`
            p-3 rounded-xl transition-all duration-200 flex-shrink-0
            ${
              isSelected
                ? "bg-gradient-to-br from-teal-400 to-teal-500 shadow-lg"
                : "bg-gray-100 group-hover:bg-teal-100"
            }
          `}
          >
            <Package
              size={20}
              className={`transition-colors duration-200 ${
                isSelected
                  ? "text-white"
                  : "text-gray-600 group-hover:text-teal-600"
              }`}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3
              className={`font-semibold text-sm transition-colors duration-200 truncate ${
                isSelected
                  ? "text-teal-700"
                  : "text-gray-800 group-hover:text-gray-900"
              }`}
            >
              {stockist.name}
            </h3>
            <p
              className={`text-xs transition-colors duration-200 truncate ${
                isSelected ? "text-teal-600" : "text-gray-500"
              }`}
            >
              {stockist.email}
            </p>
            <p
              className={`text-xs transition-colors duration-200 ${
                isSelected ? "text-teal-500" : "text-gray-400"
              }`}
            >
              📍 {stockist.location}
            </p>
          </div>
          <div
            className={`
            w-6 h-6 rounded-full border-2 transition-all duration-200 flex items-center justify-center flex-shrink-0
            ${
              isSelected
                ? "border-teal-500 bg-teal-500 shadow-lg"
                : "border-gray-300 group-hover:border-teal-400"
            }
          `}
          >
            {isSelected && <CheckCircle2 size={14} className="text-white" />}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-teal-50/50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-md mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <h1 className="text-lg font-semibold text-gray-800">
              Create Company
            </h1>
            <div className="w-8"></div> {/* Spacer */}
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 py-6 space-y-6">
        {/* Welcome Card */}
        <div className="bg-gradient-to-r from-teal-400 to-teal-500 rounded-3xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold mb-1">Your Health Hub</h2>
              <p className="text-teal-100 text-sm">Register New Company</p>
            </div>
            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
              <Building2 size={24} className="text-white" />
            </div>
          </div>
          <div className="flex items-center gap-2 text-teal-100 text-sm">
            <ShieldCheck size={16} />
            <span>Secure & Verified Platform</span>
          </div>
        </div>

        {/* Company Details Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-orange-100 rounded-xl">
                <Building2 size={20} className="text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">
                Company Details
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  placeholder="Enter company name"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all duration-200"
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-teal-400 rounded-2xl p-4 text-white">
              <div className="flex items-center justify-between mb-2">
                <UserCheck size={20} />
                <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                  Active
                </span>
              </div>
              <p className="text-sm font-medium">Assign Stockists</p>
              <p className="text-xs text-teal-100">Manage distribution</p>
            </div>
            <div className="bg-orange-400 rounded-2xl p-4 text-white">
              <div className="flex items-center justify-between mb-2">
                <Pill size={20} />
                <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                  Setup
                </span>
              </div>
              <p className="text-sm font-medium">Product Catalog</p>
              <p className="text-xs text-orange-100">Add medicines</p>
            </div>
          </div>
        </div>

        {/* Stockists Assignment */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-100 rounded-xl">
                  <Users size={20} className="text-teal-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Assign Stockists
                  </h3>
                  <p className="text-xs text-gray-500">
                    Optional - Select partners
                  </p>
                </div>
              </div>
              <div className="bg-teal-50 px-3 py-1 rounded-full">
                <span className="text-xs font-medium text-teal-600">
                  {form.stockists.length} selected
                </span>
              </div>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto">
              {stockistsList.length === 0 ? (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-2xl text-center">
                  <p className="text-yellow-700 text-sm font-medium">
                    No stockists found.
                  </p>
                </div>
              ) : (
                stockistsList.map((stockist) => (
                  <StockistCard
                    key={stockist._id}
                    stockist={stockist}
                    isSelected={form.stockists.includes(stockist._id)}
                    onToggle={() => toggleStockist(stockist._id)}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Health Tips Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Heart size={18} className="text-red-500" />
            Health Tips
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <div className="bg-blue-100 p-3 rounded-xl mb-2 mx-auto w-fit">
                <Pill size={16} className="text-blue-600" />
              </div>
              <p className="text-xs font-medium text-gray-700">Stay Hydrated</p>
              <p className="text-xs text-gray-500">Drink Water</p>
            </div>
            <div className="text-center">
              <div className="bg-orange-100 p-3 rounded-xl mb-2 mx-auto w-fit">
                <Heart size={16} className="text-orange-600" />
              </div>
              <p className="text-xs font-medium text-gray-700">New Moms</p>
              <p className="text-xs text-gray-500">Care Guide</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 p-3 rounded-xl mb-2 mx-auto w-fit">
                <ShieldCheck size={16} className="text-green-600" />
              </div>
              <p className="text-xs font-medium text-gray-700">Check Labels</p>
              <p className="text-xs text-gray-500">Read carefully</p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pb-6">
          <button
            type="submit"
            onClick={submit}
            className={`w-full font-semibold py-4 px-6 rounded-2xl transition-all duration-300 shadow-lg ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-teal-400 to-teal-500 hover:from-teal-500 hover:to-teal-600 active:scale-95 shadow-teal-500/25"
            } text-white`}
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-3">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Creating Company...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3">
                <Plus size={20} />
                <span>CREATE COMPANY</span>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Bottom Navigation Simulation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-md mx-auto px-6 py-4">
          <div className="flex items-center justify-around">
            <div className="flex flex-col items-center">
              <div className="p-2 bg-teal-100 rounded-xl">
                <Building2 size={16} className="text-teal-600" />
              </div>
              <span className="text-xs text-teal-600 font-medium mt-1">
                Companies
              </span>
            </div>
            <div className="flex flex-col items-center">
              <Package size={16} className="text-gray-400" />
              <span className="text-xs text-gray-400 mt-1">Products</span>
            </div>
            <div className="flex flex-col items-center">
              <Users size={16} className="text-gray-400" />
              <span className="text-xs text-gray-400 mt-1">Stockists</span>
            </div>
            <div className="flex flex-col items-center">
              <Heart size={16} className="text-gray-400" />
              <span className="text-xs text-gray-400 mt-1">Health</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
