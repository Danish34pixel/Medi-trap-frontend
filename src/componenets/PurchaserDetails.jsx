import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchJson, apiUrl, API_BASE } from "./config/api";
import { logout } from "./utils/authFlow";
import {
  User,
  LogOut,
  Siren,
  CreditCard,
  Activity,
  Shield,
  MapPin,
  PhoneCall,
  Check,
  FileText,
  Package,
  CheckCircle,
  Users,
  Layers,
  Grid,
  Search,
  X,
  Info,
  Box,
  Phone,
  ArrowUpLeft,
  Inbox,
} from "lucide-react";

const makeCandidates = (img) => {
  if (!img) return [];
  const candidates = [];
  if (img.startsWith("http")) candidates.push(img);
  candidates.push(`${API_BASE}${img.startsWith("/") ? img : `/${img}`}`);
  const viteBase = import.meta.env.BASE_URL || "/";
  candidates.push(`${viteBase.replace(/\/$/, "")}/${img.replace(/^\//, "")}`);
  return candidates;
};

const STOCKIST_COLORS = [
  "#3b82f6",
  "#10b981",
  "#8b5cf6",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
];
const getStockistColor = (index) =>
  STOCKIST_COLORS[index % STOCKIST_COLORS.length];

const PurchaserDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [purchaser, setPurchaser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("card"); // 'card' | 'medical'

  const [medicines, setMedicines] = useState([]);
  const [stockists, setStockists] = useState([]);
  const [selectedStockistId, setSelectedStockistId] = useState(null);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [medSearch, setMedSearch] = useState("");
  const [medLoading, setMedLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const fetchPurchaser = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetchJson(`/purchaser/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        setPurchaser(res.data || res);
        setError(null);
      } catch (err) {
        setError("Failed to fetch purchaser details");
      }
      setLoading(false);
    };
    fetchPurchaser();
  }, [id]);

  useEffect(() => {
    if (activeTab !== "medical") return;
    const fetchMedicalData = async () => {
      setMedLoading(true);
      try {
        const [medRes, stockistRes] = await Promise.all([
          fetchJson("/medicine?limit=500"),
          fetchJson("/stockist?limit=1000"),
        ]);
        setMedicines(medRes.data || medRes || []);
        setStockists(stockistRes.data || stockistRes || []);
      } catch (e) {
        console.warn("Failed to load medical dashboard data", e.message);
        setMedicines([]);
        setStockists([]);
      } finally {
        setMedLoading(false);
      }
    };
    fetchMedicalData();
  }, [activeTab]);

  const handleLogout = () => {
    try {
      localStorage.removeItem("pendingPurchaserId");
      localStorage.removeItem("pendingPurchasingRequestId");
    } catch (e) {}
    logout(navigate);
  };

  const formatCompanyName = (med) => {
    const raw = med.company?.name || med.company || med.manufacturer || "";
    if (!raw || typeof raw !== "string") return "Authorized Pharmacy";
    const isId = /^[0-9a-fA-F]{24}$/.test(raw.trim());
    return isId ? "Authorized Pharmacy" : raw;
  };

  const checkMedicineStockistMatch = (med, sid) => {
    if (!med || !sid) return false;

    const medRefs =
      med.stockists ||
      med.stockist ||
      med.stockistId ||
      med.seller ||
      med.sellerId ||
      [];
    const candidates = Array.isArray(medRefs) ? medRefs : [medRefs];
    if (
      candidates.some((c) => {
        if (!c) return false;
        const refId =
          c.stockist ||
          c.seller ||
          c.stockistId ||
          c.sellerId ||
          c._id ||
          c.id ||
          (typeof c === "string" ? c : null);
        return String(refId) === String(sid);
      })
    )
      return true;

    const stockist = stockists.find(
      (s) => String(s._id || s.id) === String(sid)
    );
    if (stockist) {
      const stockistMeds =
        stockist.medicines || stockist.Medicines || stockist.items || [];
      if (
        stockistMeds.some((m) => {
          if (!m) return false;
          const mId =
            m.medicine || m._id || m.id || (typeof m === "string" ? m : null);
          return String(mId) === String(med._id || med.id);
        })
      )
        return true;

      const medName = String(med.name || "")
        .toLowerCase()
        .trim();
      const genericName = String(med.genericName || "")
        .toLowerCase()
        .trim();

      const matchByName = stockistMeds.some((sm) => {
        const smName = String(
          typeof sm === "string" ? sm : sm.name || sm.brandName || ""
        )
          .toLowerCase()
          .trim();
        if (!smName) return false;

        const matchesPrimary =
          smName.includes(medName) || medName.includes(smName);
        const matchesGeneric =
          genericName &&
          (smName.includes(genericName) || genericName.includes(smName));

        return matchesPrimary || matchesGeneric;
      });
      if (matchByName) return true;
    }

    return false;
  };

  const getAvailableStockists = (med) => {
    if (!med) return [];
    return stockists.filter((s) =>
      checkMedicineStockistMatch(med, s._id || s.id)
    );
  };

  const medicinesList = Array.isArray(medicines) ? medicines : [];
  const filteredMedicines = medicinesList.filter((m) => {
    if (selectedStockistId) {
      const isMatch = checkMedicineStockistMatch(m, selectedStockistId);
      if (!isMatch) return false;
    }

    const q = medSearch.trim().toLowerCase();
    if (!q) return true;

    const tokens = [];
    const extract = (val) => {
      if (!val) return;
      if (typeof val === "string") {
        tokens.push(val.toLowerCase());
        return;
      }
      if (typeof val === "number") {
        tokens.push(String(val));
        return;
      }
      if (Array.isArray(val)) {
        val.forEach(extract);
        return;
      }
      if (typeof val === "object") {
        Object.values(val).forEach(extract);
      }
    };
    extract(m);

    return tokens.some((t) => t.includes(q));
  });

  const handleSearchChange = (text) => {
    setMedSearch(text);
    if (text.trim().length > 1) {
      const q = text.toLowerCase().trim();
      const matches = medicinesList
        .filter((m) => {
          const name = (m.name || "").toLowerCase();
          const gen = (m.genericName || "").toLowerCase();
          return name.includes(q) || gen.includes(q);
        })
        .slice(0, 5);
      setSuggestions(matches);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (m) => {
    setMedSearch(m.name);
    setShowSuggestions(false);
    setSelectedMedicine(m);
  };

  const closeMedicineModal = () => setSelectedMedicine(null);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-role-purchaser text-xl font-semibold animate-pulse">
          Loading...
        </div>
      </div>
    );
  if (error)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600 text-xl font-semibold">{error}</div>
      </div>
    );
  if (!purchaser)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-500 text-xl">No details found.</div>
      </div>
    );

  const photoCandidates = makeCandidates(purchaser.photo);
  const aadharCandidates = makeCandidates(purchaser.aadharImage);

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Top Bar */}
      <div className="bg-gradient-to-r from-role-purchaser-from to-role-purchaser-to text-white shadow-sm">
        <div className="max-w-4xl lg:max-w-6xl mx-auto flex items-center justify-between gap-3 px-5 py-4 lg:px-8 lg:py-5">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-white/20 flex items-center justify-center overflow-hidden flex-shrink-0 ring-2 ring-white/30">
              {purchaser.photo ? (
                <img
                  src={photoCandidates[0]}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const next = photoCandidates.find(
                      (c) => c !== e.currentTarget.src
                    );
                    if (next) e.currentTarget.src = next;
                  }}
                />
              ) : (
                <User className="w-[18px] h-[18px] lg:w-6 lg:h-6 text-white" />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-[15px] lg:text-lg truncate">
                {purchaser.fullName}
              </p>
              <p className="text-blue-100 text-[11px] lg:text-xs font-medium">
                Authorized Purchaser
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Entry point for the urgent-request accept flow (item 8) —
                nebula's Purchaser home has an "Urgent Requests" CTA. */}
            <button
              onClick={() => navigate("/purchaser/urgent-requests")}
              className="p-2 lg:px-4 lg:py-2 rounded-full lg:rounded-xl hover:bg-white/15 transition flex items-center gap-2 cursor-pointer"
              aria-label="Urgent requests"
            >
              <Siren className="w-[18px] h-[18px] text-blue-100" />
              <span className="hidden lg:inline text-xs font-semibold text-white">Urgent Requests</span>
            </button>
            <button
              onClick={handleLogout}
              className="p-2 lg:px-4 lg:py-2 rounded-full lg:rounded-xl hover:bg-white/15 transition flex items-center gap-2 cursor-pointer"
              aria-label="Log out"
            >
              <LogOut className="w-[18px] h-[18px] text-blue-100" />
              <span className="hidden lg:inline text-xs font-semibold text-white">Log Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl lg:max-w-6xl mx-auto flex">
          <button
            onClick={() => setActiveTab("card")}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 lg:py-4 text-sm lg:text-base font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === "card"
                ? "border-role-purchaser text-role-purchaser"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <CreditCard className="w-4 h-4 lg:w-5 lg:h-5" /> My Card
          </button>
          <button
            onClick={() => setActiveTab("medical")}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 lg:py-4 text-sm lg:text-base font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === "medical"
                ? "border-role-purchaser text-role-purchaser"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <Activity className="w-4 h-4 lg:w-5 lg:h-5" /> Medical
          </button>
        </div>
      </div>

      <div className="max-w-4xl lg:max-w-6xl mx-auto px-4 py-6 lg:px-8 lg:py-8">
        {/* ── TAB: ID CARD ── */}
        {activeTab === "card" && (
          <div className="bg-white rounded-4xl shadow-card-lg border border-slate-200 overflow-hidden">
            {/* Card Header */}
            <div className="relative px-6 sm:px-8 py-6 lg:px-10 lg:py-8 bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 overflow-hidden">
              <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="absolute -top-12 -left-12 w-36 h-36 border-[16px] border-white rounded-full" />
                <div className="absolute -bottom-8 -right-5 w-24 h-24 border-[12px] border-white rounded-full" />
              </div>
              <div className="relative flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-white font-black text-lg sm:text-xl lg:text-2xl tracking-wide truncate">
                    PURCHASER ID CARD
                  </h2>
                  <p className="text-blue-200 text-xs lg:text-sm font-semibold mt-1">
                    Authorized Purchaser
                  </p>
                </div>
                <div className="text-white font-mono text-xs sm:text-sm lg:text-base bg-white/20 px-3 sm:px-4 py-2 lg:px-5 lg:py-2.5 rounded-lg border border-white/30 flex-shrink-0">
                  ID: {(id || purchaser._id || "").slice(-8).toUpperCase()}
                </div>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-5 sm:p-8 lg:p-10">
              <div className="flex flex-col sm:flex-row lg:gap-10 gap-6">
                {/* Photo Section */}
                <div className="flex sm:flex-col items-center gap-4 sm:gap-0 sm:w-[110px] lg:w-[150px] flex-shrink-0">
                  <div className="relative">
                    <div className="w-[100px] h-[130px] sm:w-[110px] sm:h-[140px] lg:w-[140px] lg:h-[175px] rounded-2xl bg-slate-100 border-4 border-slate-200 overflow-hidden flex items-center justify-center shadow-md">
                      {purchaser.photo ? (
                        <img
                          src={photoCandidates[0]}
                          alt="Photo"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const next = photoCandidates.find(
                              (c) => c !== e.currentTarget.src
                            );
                            if (next) e.currentTarget.src = next;
                            else {
                              e.currentTarget.onerror = null;
                              e.currentTarget.style.display = "none";
                            }
                          }}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center w-full h-full bg-slate-100 text-slate-400 p-2">
                          <User className="w-10 h-10 lg:w-14 lg:h-14 text-slate-400 mb-1" />
                          <span className="text-[10px] lg:text-xs font-semibold text-slate-400">No Photo</span>
                        </div>
                      )}
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-green-500 text-white text-[9px] lg:text-[10px] font-bold px-2.5 py-1 rounded-xl border-2 border-white shadow-card">
                      VERIFIED
                    </div>
                  </div>
                  <div className="text-center sm:mt-3 lg:mt-4">
                    <div className="w-20 lg:w-24 h-0.5 bg-slate-800 mx-auto" />
                    <p className="text-[10px] lg:text-xs text-slate-500 mt-1 font-semibold">
                      Signature
                    </p>
                  </div>
                </div>

                {/* Info Section - 2 columns on Desktop */}
                <div className="flex-1 min-w-0 flex flex-col gap-3 lg:grid lg:grid-cols-2 lg:gap-6 lg:items-start">
                  <div className="border-b border-slate-100 lg:border border-slate-100 lg:bg-slate-50/70 lg:rounded-2xl lg:p-4 pb-2 lg:pb-4">
                    <label className="text-[9px] lg:text-xs text-slate-500 uppercase font-extrabold tracking-wider block mb-1">
                      Full Name
                    </label>
                    <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 truncate">
                      {purchaser.fullName}
                    </h1>
                  </div>

                  <div className="border-b border-slate-100 lg:border border-slate-100 lg:bg-slate-50/70 lg:rounded-2xl lg:p-4 pb-2 lg:pb-4">
                    <label className="text-[9px] lg:text-xs text-slate-500 uppercase font-extrabold tracking-wider block mb-1">
                      Contact Number
                    </label>
                    <div className="flex items-center gap-2 bg-slate-50 lg:bg-white rounded-lg px-3 py-2 w-fit border lg:border-slate-200">
                      <PhoneCall className="w-3.5 h-3.5 text-blue-600" />
                      <span className="text-slate-900 font-bold text-sm lg:text-base">
                        {purchaser.contactNo}
                      </span>
                    </div>
                  </div>

                  <div className="lg:col-span-2 lg:border border-slate-100 lg:bg-slate-50/70 lg:rounded-2xl lg:p-4">
                    <label className="text-[9px] lg:text-xs text-slate-500 uppercase font-extrabold tracking-wider block mb-1">
                      ID Number
                    </label>
                    <span className="text-slate-600 font-mono text-[11px] lg:text-sm font-semibold break-all">
                      {purchaser._id}
                    </span>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="mt-6 lg:mt-8">
                <label className="text-[9px] lg:text-xs text-slate-500 uppercase font-extrabold tracking-wider block mb-2">
                  Registered Address
                </label>
                <div className="flex items-start gap-3 bg-slate-50 border border-slate-100 rounded-xl lg:rounded-2xl px-4 py-3 lg:px-6 lg:py-4">
                  <MapPin className="w-4 h-4 lg:w-5 lg:h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-slate-700 font-medium leading-relaxed text-sm lg:text-base">
                    {purchaser.address}
                  </p>
                </div>
              </div>

              <div className="h-px bg-slate-100 my-6 lg:my-8" />

              {/* Aadhar Section */}
              <div>
                <div className="flex items-center gap-2 mb-3.5 lg:mb-4">
                  <Shield className="w-[18px] h-[18px] lg:w-5 lg:h-5 text-slate-800" />
                  <h3 className="text-[13px] lg:text-sm font-extrabold text-slate-800 tracking-wide">
                    GOVERNMENT ID VERIFICATION
                  </h3>
                </div>
                {purchaser.aadharImage ? (
                  <div className="bg-slate-50 rounded-2xl p-3.5 lg:p-5 border border-slate-200">
                    <img
                      src={aadharCandidates[0]}
                      alt="Aadhar"
                      className="w-full max-h-[180px] lg:max-h-[280px] object-contain rounded-xl bg-white border border-slate-100"
                      onError={(e) => {
                        const next = aadharCandidates.find(
                          (c) => c !== e.currentTarget.src
                        );
                        if (next) e.currentTarget.src = next;
                        else {
                          e.currentTarget.onerror = null;
                          e.currentTarget.style.display = "none";
                        }
                      }}
                    />
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <p className="text-xs lg:text-sm font-bold text-slate-600">
                        Aadhar Card (Verified)
                      </p>
                      <div className="flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-[10px] lg:text-xs font-bold flex-shrink-0">
                        <Check className="w-3.5 h-3.5" /> Verified
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-7 lg:p-10 flex flex-col items-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300">
                    <FileText className="w-8 h-8 lg:w-10 lg:h-10 text-slate-400" />
                    <span className="mt-2 text-slate-500 font-semibold text-sm lg:text-base">
                      No Government ID Uploaded
                    </span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between mt-7 lg:mt-10 pt-3.5 lg:pt-5 border-t border-slate-100">
                <div>
                  <p className="text-[9px] lg:text-xs text-slate-400 font-bold mb-0.5">
                    Issue Date
                  </p>
                  <p className="text-xs lg:text-sm font-bold text-slate-500">
                    {new Date().toLocaleDateString("en-IN")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] lg:text-xs text-slate-400 font-bold mb-0.5">
                    Valid Until
                  </p>
                  <p className="text-xs lg:text-sm font-bold text-slate-500">Permanent</p>
                </div>
              </div>
              <p className="text-center text-[10px] lg:text-xs text-slate-400 mt-3.5 lg:mt-5">
                This is an official purchaser identification card
              </p>
            </div>

            {/* Hologram strip */}
            <div
              className="h-1.5 w-full"
              style={{
                background:
                  "linear-gradient(to right, #60a5fa, #a855f7, #ec4899, #60a5fa)",
              }}
            />
          </div>
        )}

        {/* ── TAB: MEDICAL DASHBOARD ── */}
        {activeTab === "medical" && (
          <div>
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3 lg:gap-6 mb-6 lg:mb-8">
              <div className="rounded-2xl p-3.5 sm:p-4 lg:p-6 flex flex-col lg:flex-row items-center lg:justify-start gap-1.5 lg:gap-4 text-center lg:text-left shadow-card bg-gradient-to-br from-blue-700 to-blue-600">
                <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                  <Package className="w-5 h-5 lg:w-6 lg:h-6 text-blue-200" />
                </div>
                <div>
                  <span className="text-lg sm:text-xl lg:text-3xl font-bold text-white block">
                    {medicines.length}
                  </span>
                  <span className="text-[10px] sm:text-[11px] lg:text-xs font-semibold text-white/80">
                    Medicines
                  </span>
                </div>
              </div>

              <div className="rounded-2xl p-3.5 sm:p-4 lg:p-6 flex flex-col lg:flex-row items-center lg:justify-start gap-1.5 lg:gap-4 text-center lg:text-left shadow-card bg-gradient-to-br from-teal-600 to-teal-700">
                <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 lg:w-6 lg:h-6 text-teal-200" />
                </div>
                <div>
                  <span className="text-lg sm:text-xl lg:text-3xl font-bold text-white block">
                    Active
                  </span>
                  <span className="text-[10px] sm:text-[11px] lg:text-xs font-semibold text-white/80">
                    Card Status
                  </span>
                </div>
              </div>

              <div className="rounded-2xl p-3.5 sm:p-4 lg:p-6 flex flex-col lg:flex-row items-center lg:justify-start gap-1.5 lg:gap-4 text-center lg:text-left shadow-card bg-gradient-to-br from-purple-700 to-purple-800">
                <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 lg:w-6 lg:h-6 text-purple-200" />
                </div>
                <div>
                  <span className="text-lg sm:text-xl lg:text-3xl font-bold text-white block">
                    {stockists.length}
                  </span>
                  <span className="text-[10px] sm:text-[11px] lg:text-xs font-semibold text-white/80">
                    Stockists
                  </span>
                </div>
              </div>
            </div>

            {/* Partner Stockists */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-[18px] h-[18px] lg:w-5 lg:h-5 text-role-purchaser" />
                  <h2 className="text-base lg:text-lg font-extrabold text-slate-800">
                    Partner Stockists
                  </h2>
                </div>
                <span className="text-xs text-slate-400 font-semibold hidden lg:inline">
                  Scroll horizontally to view all ({stockists.length})
                </span>
              </div>
              <div className="flex gap-3 lg:gap-5 overflow-x-auto pb-2 pt-1 px-1 scroll-smooth no-scrollbar">
                <button
                  type="button"
                  onClick={() => setSelectedStockistId(null)}
                  className="flex flex-col items-center gap-2 w-20 lg:w-24 flex-shrink-0 cursor-pointer group"
                >
                  <div
                    className={`w-14 h-14 lg:w-16 lg:h-16 rounded-full flex items-center justify-center bg-slate-100 border-2 shadow-card transition-all group-hover:scale-105 ${
                      !selectedStockistId
                        ? "border-role-purchaser scale-105 ring-4 ring-blue-100"
                        : "border-slate-100 hover:border-slate-300"
                    }`}
                  >
                    <Grid
                      className={`w-5 h-5 lg:w-6 lg:h-6 ${
                        !selectedStockistId
                          ? "text-role-purchaser"
                          : "text-slate-500"
                      }`}
                    />
                  </div>
                  <span
                    className={`text-[11px] lg:text-xs font-semibold text-center truncate w-full ${
                      !selectedStockistId
                        ? "text-role-purchaser font-bold"
                        : "text-slate-500 group-hover:text-slate-800"
                    }`}
                  >
                    All
                  </span>
                </button>

                {stockists.map((s, idx) => {
                  const active = selectedStockistId === s._id;
                  const color = getStockistColor(idx);
                  const logoCandidates = makeCandidates(s.logo);
                  return (
                    <button
                      type="button"
                      key={s._id || idx}
                      onClick={() =>
                        setSelectedStockistId(active ? null : s._id)
                      }
                      className={`flex flex-col items-center gap-2 w-20 lg:w-24 flex-shrink-0 transition-all cursor-pointer group ${
                        active ? "scale-105" : ""
                      }`}
                    >
                      <div
                        className={`w-14 h-14 lg:w-16 lg:h-16 rounded-full flex items-center justify-center border-2 shadow-card overflow-hidden transition-all group-hover:scale-105 ${
                          active
                            ? "border-role-purchaser ring-4 ring-blue-100"
                            : "border-slate-100 hover:border-slate-300"
                        }`}
                        style={{ backgroundColor: `${color}15` }}
                      >
                        {s.logo ? (
                          <img
                            src={logoCandidates[0]}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const next = logoCandidates.find(
                                (c) => c !== e.currentTarget.src
                              );
                              if (next) e.currentTarget.src = next;
                            }}
                          />
                        ) : (
                          <span
                            className="text-xl lg:text-2xl font-bold"
                            style={{ color }}
                          >
                            {(s.name || "S").charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-[11px] lg:text-xs font-semibold text-center truncate w-full ${
                          active
                            ? "text-role-purchaser font-bold"
                            : "text-slate-500 group-hover:text-slate-800"
                        }`}
                      >
                        {s.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Medicine Search */}
            <div className="flex items-center gap-2 mb-3 mt-4 lg:mt-6">
              <Search className="w-[18px] h-[18px] lg:w-5 lg:h-5 text-role-purchaser" />
              <h2 className="text-base lg:text-lg font-extrabold text-slate-800">
                Search Medicines
              </h2>
            </div>
            <div className="relative mb-6">
              <div className="flex items-center gap-2 bg-white rounded-2xl px-3.5 py-3 lg:px-4 lg:py-3.5 border border-slate-200 shadow-card">
                <Search className="w-4 h-4 lg:w-5 lg:h-5 text-slate-400 flex-shrink-0" />
                <input
                  value={medSearch}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() =>
                    medSearch.length > 1 && setShowSuggestions(true)
                  }
                  placeholder="Search by name or company..."
                  className="flex-1 min-w-0 text-sm lg:text-base outline-none bg-transparent text-slate-800 placeholder-slate-400"
                />
                {medSearch.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setMedSearch("");
                      setShowSuggestions(false);
                    }}
                    className="flex-shrink-0 cursor-pointer"
                  >
                    <X className="w-4 h-4 lg:w-5 lg:h-5 text-slate-400" />
                  </button>
                )}
              </div>

              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-20 left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-200 shadow-card-lg overflow-hidden">
                  {suggestions.map((s, idx) => (
                    <button
                      type="button"
                      key={s._id || idx}
                      onClick={() => selectSuggestion(s)}
                      className="w-full flex items-center gap-3 px-3.5 py-3 lg:px-4 lg:py-3.5 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 text-left transition cursor-pointer"
                    >
                      <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm lg:text-base font-semibold text-slate-800 truncate">
                          {s.name}
                        </p>
                        {s.genericName && (
                          <p className="text-xs text-slate-500 truncate">
                            {s.genericName}
                          </p>
                        )}
                      </div>
                      <ArrowUpLeft className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Medicine List Grid on Desktop */}
            {medLoading ? (
              <div className="flex justify-center py-10">
                <div className="w-6 h-6 border-2 border-role-purchaser border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredMedicines.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 text-center bg-white rounded-2xl border border-slate-200">
                <Inbox className="w-10 h-10 text-slate-300" />
                <p className="text-slate-400 font-semibold text-[15px]">
                  {medSearch
                    ? "No medicines match your search"
                    : "No medicines available"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 lg:gap-4">
                {filteredMedicines.map((m, idx) => (
                  <button
                    type="button"
                    key={m._id || idx}
                    onClick={() => setSelectedMedicine(m)}
                    className="w-full flex items-center gap-3 bg-white rounded-2xl p-3.5 lg:p-4 border border-slate-200 shadow-card hover:shadow-card-lg transition text-left cursor-pointer"
                  >
                    <div className="w-11 h-11 lg:w-12 lg:h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <Box className="w-5 h-5 lg:w-6 lg:h-6 text-role-purchaser" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] lg:text-base font-bold text-slate-800 truncate">
                        {m.name}
                      </p>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {formatCompanyName(m)}
                      </p>
                    </div>
                    <span className="text-[10px] lg:text-xs font-bold text-green-700 bg-green-100 px-2.5 py-1 rounded-full flex-shrink-0">
                      Available
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Medicine Detail Modal */}
      {selectedMedicine && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-0 sm:px-4"
          onClick={closeMedicineModal}
        >
          <div
            className="w-full sm:max-w-lg bg-white rounded-t-[2rem] sm:rounded-[2rem] max-h-[85vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 p-6 border-b border-slate-100 flex-shrink-0">
              <div className="min-w-0">
                <h3 className="text-xl font-bold text-slate-800 truncate">
                  {selectedMedicine?.name}
                </h3>
                <p className="text-sm text-slate-500 mt-1 truncate">
                  {selectedMedicine?.manufacturer ||
                    selectedMedicine?.company?.name ||
                    "Manufacturer Details"}
                </p>
              </div>
              <button
                type="button"
                onClick={closeMedicineModal}
                className="p-2 bg-slate-100 rounded-xl hover:bg-slate-200 transition flex-shrink-0"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <div className="bg-blue-50 rounded-2xl p-4 mb-6 flex items-center gap-2">
                <Info className="w-4 h-4 text-role-purchaser flex-shrink-0" />
                <p className="text-sm">
                  <span className="font-bold text-blue-900">
                    Generic Name:
                  </span>{" "}
                  <span className="text-role-purchaser">
                    {selectedMedicine?.genericName || "N/A"}
                  </span>
                </p>
              </div>

              <h4 className="text-base font-extrabold text-slate-800 mb-4">
                Available at these Stockists
              </h4>

              {getAvailableStockists(selectedMedicine).length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-8 bg-slate-50 rounded-2xl">
                  <Info className="w-6 h-6 text-slate-400" />
                  <p className="text-sm text-slate-500 font-medium text-center px-6">
                    No stockist information specifically linked yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {getAvailableStockists(selectedMedicine).map((s, idx) => {
                    const color = getStockistColor(idx);
                    return (
                      <div
                        key={s._id || idx}
                        className="flex items-center gap-3 bg-white border border-slate-100 rounded-2xl p-3.5 shadow-card"
                      >
                        <div
                          className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${color}15` }}
                        >
                          <span
                            className="text-lg font-bold"
                            style={{ color }}
                          >
                            {(s.name || "S").charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[15px] font-bold text-slate-800 truncate">
                            {s.name}
                          </p>
                          <p className="text-xs text-slate-500 truncate mt-0.5">
                            {typeof s.address === "string"
                              ? s.address
                              : s.address?.city || s.address?.street
                              ? `${s.address.street || ""}${
                                  s.address.city
                                    ? (s.address.street ? ", " : "") +
                                      s.address.city
                                    : ""
                                }`
                              : "Location unavailable"}
                          </p>
                        </div>
                        {s.phone && (
                          <a
                            href={`tel:${s.phone}`}
                            className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0 hover:bg-emerald-100 transition"
                            aria-label={`Call ${s.name}`}
                          >
                            <Phone className="w-4 h-4 text-emerald-600" />
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <button
                type="button"
                onClick={closeMedicineModal}
                className="w-full mt-6 py-4 bg-slate-100 hover:bg-slate-200 rounded-2xl font-bold text-slate-600 transition"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default PurchaserDetails;
