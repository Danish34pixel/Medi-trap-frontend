import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Pill,
  Building2,
  Package,
  User,
  Mail,
  Sparkles,
  CheckCircle2,
  Users,
  Plus,
} from "lucide-react";
import { apiUrl } from "./config/api";
import { getCookie } from "./utils/cookies";
import Logo from "./Logo";

export default function AdminCreateMedicine() {
  const [form, setForm] = useState({ name: "", company: "", stockists: [] });
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [stockistsList, setStockistsList] = useState([]);
  const [companySearch, setCompanySearch] = useState("");
  const [stockistSearch, setStockistSearch] = useState("");
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [particles, setParticles] = useState([]);
  const filteredCompanies = companies.filter((company) =>
    (company.name || "").toLowerCase().includes(companySearch.toLowerCase()) ||
    (company.email || "").toLowerCase().includes(companySearch.toLowerCase())
  );

  const filteredStockists = stockistsList.filter((stockist) =>
    (stockist.name || "").toLowerCase().includes(stockistSearch.toLowerCase()) ||
    (stockist.email || "").toLowerCase().includes(stockistSearch.toLowerCase()) ||
    (stockist.location || "").toLowerCase().includes(stockistSearch.toLowerCase())
  );

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
        getCookie("token") ||
        (typeof localStorage !== "undefined"
          ? localStorage.getItem("token")
          : null);
      const res = await fetch(apiUrl("/api/medicine/quick"), {
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
        window.alert("Success — medicine created");
        navigate ? navigate(-1) : window.history.back();
      }
    } catch (err) {
      window.alert(`Error: ${String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const resC = await fetch(apiUrl("/api/company"));
        const jsonC = await resC.json().catch(() => ({}));
        const companiesData = (jsonC && jsonC.data) || [];
        if (resC.ok && Array.isArray(companiesData))
          setCompanies(companiesData);

        const resS = await fetch(apiUrl("/api/stockist"));
        const jsonS = await resS.json().catch(() => ({}));
        const stockistsData = (jsonS && jsonS.data) || [];
        if (resS.ok && Array.isArray(stockistsData))
          setStockistsList(stockistsData);
      } catch (e) {
        console.error("Failed to load companies/stockists", e);
      }
    })();
  }, []);

  const CompanyCard = ({ company, isSelected, onClick }) => (
    <div
      onClick={onClick}
      className={`group relative cursor-pointer transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 ${
        isSelected ? "z-10" : ""
      }`}
    >
      <div
        className={`
        relative bg-white/80 backdrop-blur-xl rounded-2xl border transition-all duration-300 p-6
        ${
          isSelected
            ? "border-blue-400/50 shadow-xl shadow-blue-500/20 bg-blue-50/50"
            : "border-white/40 hover:border-blue-300/30 hover:shadow-lg hover:shadow-blue-500/10"
        }
      `}
      >
        <div className="flex items-center space-x-4">
          <div
            className={`
            p-3 rounded-2xl transition-all duration-300
            ${
              isSelected
                ? "bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg"
                : "bg-slate-100 group-hover:bg-blue-100"
            }
          `}
          >
            <Building2
              size={20}
              className={`transition-colors duration-300 ${
                isSelected
                  ? "text-white"
                  : "text-slate-600 group-hover:text-blue-600"
              }`}
            />
          </div>
          <div className="flex-1">
            <h3
              className={`font-semibold transition-colors duration-300 ${
                isSelected
                  ? "text-blue-700"
                  : "text-slate-700 group-hover:text-slate-800"
              }`}
            >
              {company.name}
            </h3>
            <p
              className={`text-sm transition-colors duration-300 ${
                isSelected ? "text-blue-600" : "text-slate-500"
              }`}
            >
              {company.email}
            </p>
          </div>
          <div
            className={`
            w-6 h-6 rounded-full border-2 transition-all duration-300 flex items-center justify-center
            ${
              isSelected
                ? "border-blue-500 bg-blue-500"
                : "border-slate-300 group-hover:border-blue-400"
            }
          `}
          >
            {isSelected && <CheckCircle2 size={14} className="text-white" />}
          </div>
        </div>
      </div>
    </div>
  );

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
                
                
                <Logo className="w-26 h-20 mx-auto mb-4" />

                <h1 className="text-4xl sm:text-5xl font-black mb-4 relative">
                  <span className="bg-gradient-to-r from-slate-700 via-slate-600 to-slate-500 bg-clip-text text-transparent">
                    Create Medicine
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-purple-500/20 bg-clip-text text-transparent blur-sm animate-pulse delay-500"></div>
                </h1>

                <p className="text-slate-500 text-lg font-light">
                  Add new medicine with company and stockist assignments
                </p>
              </div>

              {/* Form */}
              <div className="space-y-8">
                {/* Medicine Name Section */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/3 to-indigo-500/3 rounded-3xl blur-xl"></div>
                  <div className="relative bg-white/60 backdrop-blur-xl rounded-3xl border border-white/40 p-8 shadow-lg shadow-slate-200/20">
                    <h2 className="text-xl font-bold text-slate-600 mb-6 flex items-center gap-3">
                      <Pill className="text-blue-500" size={20} />
                      Medicine Details
                    </h2>

                    <div className="group relative">
                      <label className="block text-sm font-semibold text-slate-600 mb-3 flex items-center gap-2">
                        <Pill size={16} className="text-blue-500" />
                        Medicine Name
                      </label>
                      <input
                        type="text"
                        placeholder="Enter medicine name"
                        className="w-full bg-white/90 backdrop-blur-xl border border-slate-200/50 rounded-2xl px-5 py-4 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all duration-300 hover:border-slate-300/50 hover:bg-white group-hover:shadow-lg group-hover:shadow-blue-500/10"
                        value={form.name}
                        onChange={(e) => setField("name", e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Company Selection */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/3 to-purple-500/3 rounded-3xl blur-xl"></div>
                  <div className="relative bg-white/60 backdrop-blur-xl rounded-3xl border border-white/40 p-8 shadow-lg shadow-slate-200/20">
                    <h2 className="text-xl font-bold text-slate-600 mb-6 flex items-center gap-3">
                      <Building2 className="text-indigo-500" size={20} />
                      Select Company
                    </h2>

                    {/* Search Bar for Company */}
                    <div className="mb-4">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search companies by name or email..."
                          value={companySearch}
                          onChange={(e) => setCompanySearch(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-gray-800 
                            placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 
                            focus:border-transparent transition-all duration-200"
                        />
                        {companySearch && (
                          <button
                            onClick={() => setCompanySearch("")}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 
                              hover:text-gray-600 focus:outline-none"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      {companies.length === 0 ? (
                        <div className="p-6 bg-yellow-50/80 border border-yellow-200/50 rounded-2xl backdrop-blur-xl">
                          <p className="text-yellow-700 font-medium">No companies found.</p>
                        </div>
                      ) : filteredCompanies.length === 0 ? (
                        <div className="p-6 bg-yellow-50/80 border border-yellow-200/50 rounded-2xl backdrop-blur-xl">
                          <p className="text-yellow-700 font-medium">No matching companies found.</p>
                        </div>
                      ) : (
                        <>
                          {/* Always show all companies in a scrollable area */}
                          <div className="max-h-64 overflow-y-auto space-y-4">
                            {filteredCompanies.map((company) => (
                              <CompanyCard
                                key={company._id}
                                company={company}
                                isSelected={form.company === company._id}
                                onClick={() => setField("company", company._id)}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stockists Selection */}
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

                    {/* Search Bar for Stockists */}
                    <div className="mb-4">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search stockists by name, email or location..."
                          value={stockistSearch}
                          onChange={(e) => setStockistSearch(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-gray-800 
                            placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 
                            focus:border-transparent transition-all duration-200"
                        />
                        {stockistSearch && (
                          <button
                            onClick={() => setStockistSearch("")}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 
                              hover:text-gray-600 focus:outline-none"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      {stockistsList.length === 0 ? (
                        <div className="p-6 bg-yellow-50/80 border border-yellow-200/50 rounded-2xl backdrop-blur-xl">
                          <p className="text-yellow-700 font-medium">No stockists found.</p>
                        </div>
                      ) : filteredStockists.length === 0 ? (
                        <div className="p-6 bg-yellow-50/80 border border-yellow-200/50 rounded-2xl backdrop-blur-xl">
                          <p className="text-yellow-700 font-medium">No matching stockists found.</p>
                        </div>
                      ) : (
                        <>
                          {/* Always show all stockists in a scrollable area */}
                          <div className="max-h-64 overflow-y-auto space-y-4">
                            {filteredStockists.map((stockist) => (
                              <StockistCard
                                key={stockist._id}
                                stockist={stockist}
                                isSelected={form.stockists.includes(stockist._id)}
                                onToggle={() => toggleStockist(stockist._id)}
                              />
                            ))}
                          </div>
                        </>
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
                            Creating Medicine...
                          </span>
                        </>
                      ) : (
                        <>
                          
                          <span className="text-lg tracking-wider">
                            CREATE MEDICINE
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
