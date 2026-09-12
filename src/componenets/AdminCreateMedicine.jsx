import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Pill,
  Building2,
  Package,
  CheckCircle2,
  Users,
  Search,
  X,
} from "lucide-react";
import { apiUrl } from "./config/api";
import { getCookie } from "./utils/cookies";
import Logo from "./Logo";
import PageHeader from "./ui/PageHeader";
import Card from "./ui/Card";
import Input from "./ui/Input";
import Btn from "./stockistComponents/Btn";

export default function AdminCreateMedicine() {
  const [form, setForm] = useState({ name: "", company: "", stockists: [] });
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [stockistsList, setStockistsList] = useState([]);
  const [companySearch, setCompanySearch] = useState("");
  const [stockistSearch, setStockistSearch] = useState("");
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

  const selectAllFilteredStockists = () => {
    const ids = filteredStockists.map((s) => s._id);
    setForm((f) => ({ ...f, stockists: [...new Set([...f.stockists, ...ids])] }));
  };

  const clearAllStockists = () => {
    setForm((f) => ({ ...f, stockists: [] }));
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
    <div className="min-h-screen bg-slate-50">
      <PageHeader title="Create Medicine" role="slate" showBack />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
        <Card padding="p-6 sm:p-8" elevated>
          {/* Header */}
          <div className="text-center mb-8">
            <Logo className="w-24 h-16 mx-auto mb-2" />
            <h1 className="text-2xl font-black text-slate-800">
              Add New Medicine
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Register medicine with company and stockist assignments
            </p>
          </div>

          <div className="space-y-8">
            {/* Medicine Name Section */}
            <div>
              <h2 className="text-base font-bold text-slate-700 mb-4 flex items-center gap-2">
                <Pill className="text-blue-500" size={18} />
                Medicine Details
              </h2>
              <Input
                label="Medicine Name"
                placeholder="Enter medicine name"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                required
              />
            </div>

            {/* Company Selection */}
            <div>
              <h2 className="text-base font-bold text-slate-700 mb-4 flex items-center gap-2">
                <Building2 className="text-indigo-500" size={18} />
                Company Assignment
              </h2>

              <div className="relative mb-4">
                <Input
                  icon={Search}
                  placeholder="Find company..."
                  value={companySearch}
                  onChange={(e) => setCompanySearch(e.target.value)}
                  className={companySearch ? "pr-10" : ""}
                />
                {companySearch && (
                  <button
                    onClick={() => setCompanySearch("")}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    type="button"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {companies.length === 0 ? (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-2xl text-center">
                    <p className="text-yellow-700 text-sm font-medium">No companies found.</p>
                  </div>
                ) : filteredCompanies.length === 0 ? (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-2xl text-center">
                    <p className="text-yellow-700 text-sm font-medium">No matching companies found.</p>
                  </div>
                ) : (
                  <div className="max-h-64 overflow-y-auto space-y-3">
                    {filteredCompanies.map((company) => (
                      <CompanyCard
                        key={company._id}
                        company={company}
                        isSelected={form.company === company._id}
                        onClick={() => setField("company", company._id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Stockists Selection */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-slate-700 flex items-center gap-2">
                  <Users className="text-emerald-500" size={18} />
                  Assign Stockists
                  <span className="text-xs font-normal text-slate-400">
                    (Optional)
                  </span>
                </h2>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={selectAllFilteredStockists}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
                  >
                    Select All
                  </button>
                  <span className="w-1 h-1 rounded-full bg-gray-300" />
                  <button
                    type="button"
                    onClick={clearAllStockists}
                    className="text-xs font-bold text-red-500 hover:text-red-600"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="relative mb-4">
                <Input
                  icon={Search}
                  placeholder="Search available stockists..."
                  value={stockistSearch}
                  onChange={(e) => setStockistSearch(e.target.value)}
                  className={stockistSearch ? "pr-10" : ""}
                />
                {stockistSearch && (
                  <button
                    onClick={() => setStockistSearch("")}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    type="button"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {stockistsList.length === 0 ? (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-2xl text-center">
                    <p className="text-yellow-700 text-sm font-medium">No stockists found.</p>
                  </div>
                ) : filteredStockists.length === 0 ? (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-2xl text-center">
                    <p className="text-yellow-700 text-sm font-medium">No matching stockists found.</p>
                  </div>
                ) : (
                  <div className="max-h-64 overflow-y-auto space-y-3">
                    {filteredStockists.map((stockist) => (
                      <StockistCard
                        key={stockist._id}
                        stockist={stockist}
                        isSelected={form.stockists.includes(stockist._id)}
                        onToggle={() => toggleStockist(stockist._id)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {form.stockists.length > 0 && (
                <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl">
                  <p className="text-emerald-700 text-sm font-medium">
                    Selected {form.stockists.length} stockist
                    {form.stockists.length === 1 ? "" : "s"}
                  </p>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <Btn
              type="submit"
              variant="primary"
              onClick={submit}
              disabled={loading}
              className="w-full py-4"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Creating Medicine...</span>
                </>
              ) : (
                <span>CREATE MEDICINE</span>
              )}
            </Btn>
          </div>
        </Card>
      </div>
    </div>
  );
}
