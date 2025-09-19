import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Package,
  Users,
  Sparkles,
  CheckCircle2,
  Plus,
  Factory,
} from "lucide-react";
import { apiUrl } from "./config/api";

export default function AdminCreateCompany() {
  const [form, setForm] = useState({ name: "", stockists: [] });
  const [loading, setLoading] = useState(false);
  const [stockistsList, setStockistsList] = useState([]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [particles, setParticles] = useState([]);

  const navigate = useNavigate();

  // Track mouse movement for interactive effects
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Generate floating particles
  useEffect(() => {
    const generateParticles = () => {
      const newParticles = [];
      for (let i = 0; i < 12; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 3 + 1,
          opacity: Math.random() * 0.3 + 0.1,
          duration: Math.random() * 4 + 3,
        });
      }
      setParticles(newParticles);
    };
    generateParticles();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(apiUrl("/api/stockist"));
        const json = await res.json().catch(() => ({}));
        // backend returns { success: true, data: [...] }
        const list = (json && json.data) || [];
        if (res.ok && Array.isArray(list)) setStockistsList(list);
      } catch (e) {
        console.error("Failed to load stockists", e);
      }
    })();
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
      const token = localStorage.getItem("token");
      const res = await fetch(apiUrl("/api/company"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(form),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          (data && data.message) || JSON.stringify(data) || res.statusText;
        window.alert(`Error: ${msg}`);
      } else {
        window.alert("Success — company created");
        navigate ? navigate(-1) : window.history.back();
      }
    } catch (err) {
      window.alert(`Error: ${String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const StockistCard = ({ stockist, isSelected, onToggle }) => (
    <div
      onClick={onToggle}
      className="group relative cursor-pointer transition-all duration-300 transform hover:scale-105 hover:-translate-y-1"
    >
      <div
        className={`
        relative bg-white/80 backdrop-blur-xl rounded-2xl border transition-all duration-300 p-6
        ${
          isSelected
            ? "border-emerald-400/50 shadow-xl shadow-emerald-500/20 bg-emerald-50/50"
            : "border-white/40 hover:border-emerald-300/30 hover:shadow-lg hover:shadow-emerald-500/10"
        }
      `}
      >
        <div className="flex items-center space-x-4">
          <div
            className={`
            p-3 rounded-2xl transition-all duration-300
            ${
              isSelected
                ? "bg-gradient-to-r from-emerald-500 to-teal-600 shadow-lg"
                : "bg-slate-100 group-hover:bg-emerald-100"
            }
          `}
          >
            <Package
              size={20}
              className={`transition-colors duration-300 ${
                isSelected
                  ? "text-white"
                  : "text-slate-600 group-hover:text-emerald-600"
              }`}
            />
          </div>
          <div className="flex-1">
            <h3
              className={`font-semibold transition-colors duration-300 ${
                isSelected
                  ? "text-emerald-700"
                  : "text-slate-700 group-hover:text-slate-800"
              }`}
            >
              {stockist.name}
            </h3>
            <p
              className={`text-sm transition-colors duration-300 ${
                isSelected ? "text-emerald-600" : "text-slate-500"
              }`}
            >
              {stockist.email}
            </p>
          </div>
          <div
            className={`
            w-6 h-6 rounded-lg border-2 transition-all duration-300 flex items-center justify-center
            ${
              isSelected
                ? "border-emerald-500 bg-emerald-500"
                : "border-slate-300 group-hover:border-emerald-400"
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
    <div className="min-h-screen relative overflow-hidden">
      {/* Light gradient background */}
      <div
        className="absolute inset-0 transition-all duration-1000"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, 
            rgba(99, 102, 241, 0.08), 
            rgba(139, 92, 246, 0.05), 
            rgba(168, 85, 247, 0.03), 
            transparent 50%),
            linear-gradient(135deg, 
            #f8fafc 0%, 
            #f1f5f9 25%, 
            #e2e8f0 50%, 
            #cbd5e1 75%, 
            #94a3b8 100%)`,
        }}
      />

      {/* Floating particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-1 h-1 bg-blue-400/40 rounded-full animate-ping"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            opacity: particle.opacity,
            animationDuration: `${particle.duration}s`,
            animationDelay: `${particle.id * 0.2}s`,
          }}
        />
      ))}

      {/* Background shapes */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative flex items-start justify-center min-h-screen py-8 px-4">
        <div className="w-full max-w-4xl">
          {/* Main container */}
          <div className="relative bg-white/80 backdrop-blur-2xl rounded-3xl border border-white/60 shadow-2xl shadow-slate-200/50 p-8 sm:p-12">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 blur-sm animate-pulse"></div>
            <div className="absolute inset-[1px] rounded-3xl bg-white/90 backdrop-blur-xl"></div>

            <div className="relative z-10">
              {/* Header */}
              <div className="text-center mb-12 relative">
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                  <Sparkles className="text-blue-400 animate-pulse" size={24} />
                </div>
                <div className="absolute -top-3 left-1/3 transform -translate-x-1/2">
                  <Building2
                    className="text-indigo-400 animate-bounce delay-300"
                    size={16}
                  />
                </div>
                <div className="absolute -top-3 right-1/3 transform translate-x-1/2">
                  <Factory
                    className="text-purple-400 animate-bounce delay-700"
                    size={16}
                  />
                </div>

                <div className="inline-flex items-center justify-center p-4 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-3xl backdrop-blur-xl border border-white/30 mb-6">
                  <Building2 className="w-8 h-8 text-blue-500 animate-pulse" />
                </div>

                <h1 className="text-4xl sm:text-5xl font-black mb-4 relative">
                  <span className="bg-gradient-to-r from-slate-700 via-slate-600 to-slate-500 bg-clip-text text-transparent">
                    Create Company
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-purple-500/20 bg-clip-text text-transparent blur-sm animate-pulse delay-500"></div>
                </h1>

                <p className="text-slate-500 text-lg font-light">
                  Register a new company and assign stockists
                </p>
              </div>

              {/* Form */}
              <div onSubmit={submit} className="space-y-8">
                {/* Company Name Section */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/3 to-indigo-500/3 rounded-3xl blur-xl"></div>
                  <div className="relative bg-white/60 backdrop-blur-xl rounded-3xl border border-white/40 p-8 shadow-lg shadow-slate-200/20">
                    <h2 className="text-xl font-bold text-slate-600 mb-6 flex items-center gap-3">
                      <Building2 className="text-blue-500" size={20} />
                      Company Details
                    </h2>

                    <div className="group relative">
                      <label className="block text-sm font-semibold text-slate-600 mb-3 flex items-center gap-2">
                        <Building2 size={16} className="text-blue-500" />
                        Company Name
                      </label>
                      <input
                        type="text"
                        placeholder="Enter company name"
                        className="w-full bg-white/90 backdrop-blur-xl border border-slate-200/50 rounded-2xl px-5 py-4 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all duration-300 hover:border-slate-300/50 hover:bg-white group-hover:shadow-lg group-hover:shadow-blue-500/10"
                        value={form.name}
                        onChange={(e) => setField("name", e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Stockists Assignment */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/3 to-teal-500/3 rounded-3xl blur-xl"></div>
                  <div className="relative bg-white/60 backdrop-blur-xl rounded-3xl border border-white/40 p-8 shadow-lg shadow-slate-200/20">
                    <h2 className="text-xl font-bold text-slate-600 mb-6 flex items-center gap-3">
                      <Users className="text-emerald-500" size={20} />
                      Assign to Stockists
                      <span className="text-sm font-normal text-slate-500">
                        (Optional)
                      </span>
                    </h2>

                    <div className="space-y-4">
                      {stockistsList.length === 0 ? (
                        <div className="p-6 bg-yellow-50/80 border border-yellow-200/50 rounded-2xl backdrop-blur-xl">
                          <p className="text-yellow-700 font-medium">
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

                    {form.stockists.length > 0 && (
                      <div className="mt-6 p-4 bg-emerald-50/80 border border-emerald-200/50 rounded-2xl backdrop-blur-xl">
                        <p className="text-emerald-700 font-medium">
                          Selected {form.stockists.length} stockist
                          {form.stockists.length === 1 ? "" : "s"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-8">
                  <button
                    type="submit"
                    onClick={submit}
                    className={`group relative w-full text-white font-bold py-5 px-8 rounded-2xl transition-all duration-500 transform hover:scale-105 overflow-hidden border border-white/30 ${
                      loading
                        ? "bg-gradient-to-r from-blue-400/70 to-indigo-500/70 cursor-not-allowed"
                        : "bg-gradient-to-r from-blue-500 via-indigo-600 to-blue-700 hover:shadow-2xl hover:shadow-blue-500/25"
                    }`}
                    disabled={loading}
                  >
                    {/* Animated background */}
                    {!loading && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                    )}

                    {/* Button content */}
                    <div className="relative flex items-center justify-center gap-3">
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span className="text-lg tracking-wider">
                            Creating Company...
                          </span>
                        </>
                      ) : (
                        <>
                          <Building2 size={20} />
                          <span className="text-lg tracking-wider">
                            CREATE COMPANY
                          </span>
                        </>
                      )}
                    </div>

                    {/* Glowing border effect */}
                    {!loading && (
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/30 via-indigo-500/30 to-blue-500/30 blur-md -z-10 animate-pulse"></div>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
