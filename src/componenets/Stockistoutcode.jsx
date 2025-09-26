import React, { useEffect, useState, useCallback, useMemo } from "react";
import { apiUrl } from "./config/api";
import { medicineReferencesStockist } from "./utils/normalizeMatching";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  Plus,
  Building2,
  Pill,
  Users,
  Loader2,
  AlertCircle,
  Filter,
  Download,
  Share,
} from "lucide-react";

import Btn from "./stockistComponents/Btn";
import Avatar from "./stockistComponents/Avatar";
import IdentityCard from "./stockistComponents/IdentityCard";
import StatsGrid from "./stockistComponents/StatsGrid";
import { motion } from "framer-motion";
import {
  CompanyCard,
  MedicineCard,
  StaffCard,
} from "./stockistComponents/ListCards";

// Loading skeleton component
const LoadingSkeleton = () => (
  <div className="animate-pulse space-y-4">
    <div className="flex items-center space-x-4">
      <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
      <div className="space-y-2">
        <div className="h-6 bg-gray-300 rounded w-48"></div>
        <div className="h-4 bg-gray-300 rounded w-32"></div>
      </div>
    </div>
    <div className="h-48 bg-gray-300 rounded"></div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-24 bg-gray-300 rounded"></div>
      ))}
    </div>
  </div>
);

// Error component
const ErrorMessage = ({ error, onRetry }) => (
  <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-sm border border-red-200">
    <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
    <h3 className="text-lg font-semibold text-gray-900 mb-2">
      Something went wrong
    </h3>
    <p className="text-gray-600 text-center mb-4">{error}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
      >
        Try Again
      </button>
    )}
  </div>
);

// Tab configuration
const TAB_CONFIG = [
  { key: "companies", label: "Companies", icon: Building2 },
  { key: "medicines", label: "Medicines", icon: Pill },
  { key: "staff", label: "Staff", icon: Users },
];

export default function StockistOutcode() {
  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation();
  const routeId =
    params.id || (location.state && location.state.stockistId) || null;

  // State management
  const [stockist, setStockist] = useState(null);
  const [companiesList, setCompaniesList] = useState([]);
  const [medicinesList, setMedicinesList] = useState([]);
  const [staffs, setStaffs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("companies");
  const [query, setQuery] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Memoized stats calculation
  const stats = useMemo(
    () => ({
      companies: companiesList.length,
      medicines: medicinesList.length,
      staff: staffs.length,
    }),
    [companiesList.length, medicinesList.length, staffs.length]
  );

  // Filter function with improved performance
  const filterByQuery = useCallback(
    (items, keys = ["name"]) => {
      if (!query) return items || [];
      const q = query.trim().toLowerCase();
      return (items || []).filter((item) => {
        try {
          return (
            keys.some(
              (key) =>
                item?.[key] && String(item[key]).toLowerCase().includes(q)
            ) || JSON.stringify(item).toLowerCase().includes(q)
          );
        } catch {
          return false;
        }
      });
    },
    [query]
  );

  // Memoized filtered data
  const filteredData = useMemo(
    () => ({
      companies: filterByQuery(companiesList, ["name", "companyName"]),
      medicines: filterByQuery(medicinesList, ["name", "medicineName"]),
      staff: filterByQuery(staffs, ["fullName", "name"]),
    }),
    [companiesList, medicinesList, staffs, filterByQuery]
  );

  // Load stockist data
  const loadStockistData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(apiUrl("/api/stockist"));
      const json = await res.json().catch(() => ({}));
      const list = json?.data || [];

      let target = null;
      if (routeId && routeId !== "me") {
        target = list.find((s) => String(s._id) === String(routeId));
      } else if (routeId === "me") {
        target = list.find((s) => s?._id);
      }

      if (!target && list.length > 0) target = list[0];

      if (!target) {
        throw new Error("Stockist not found");
      }

      setStockist(target);

      // Fetch related data
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const staffUrl = apiUrl(`/api/staff?stockist=${target._id}`);
      const staffOpts = token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : {};

      const [cRes, mRes, sRes] = await Promise.all([
        fetch(apiUrl("/api/company")),
        fetch(apiUrl("/api/medicine")),
        fetch(staffUrl, staffOpts),
      ]);

      const [cJson, mJson, sJson] = await Promise.all([
        cRes.json().catch(() => ({})),
        mRes.json().catch(() => ({})),
        sRes.json().catch(() => ({})),
      ]);

      const allCompanies = cJson?.data || [];
      const allMeds = mJson?.data || [];
      const staffList = sJson?.data || [];

      // Filter companies associated with this stockist
      const filteredCompanies = allCompanies.filter((company) => {
        try {
          if (Array.isArray(company.stockists) && company.stockists.length) {
            return company.stockists.some(
              (s) => String(s?._id || s) === String(target._id)
            );
          }

          const keys = [
            company.stockist,
            company.stockistId,
            company.seller,
            company.sellerId,
            company.vendor,
            company.vendorId,
            company.supplier,
            company.supplierId,
          ];

          return keys.some(
            (key) =>
              key && String(key._id || key.id || key) === String(target._id)
          );
        } catch {
          return false;
        }
      });

      // Filter medicines associated with this stockist
      const filteredMeds = allMeds.filter((med) =>
        medicineReferencesStockist(med, target._id)
      );

      setCompaniesList(filteredCompanies);
      setMedicinesList(filteredMeds);
      setStaffs(staffList);
    } catch (err) {
      console.error("Error loading stockist data:", err);
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [routeId]);

  // Generate QR code
  useEffect(() => {
    const idToUse = routeId || stockist?._id;
    if (!idToUse) return setQrDataUrl(null);

    (async () => {
      try {
        const mod = await import("qrcode");
        const QR = mod?.default || mod;
        const dataUrl = await QR.toDataURL(
          `${window.location.origin}/stockist-card?id=${idToUse}`
        );
        setQrDataUrl(dataUrl);
      } catch {
        setQrDataUrl(null);
      }
    })();
  }, [routeId, stockist]);

  // Load data on mount
  useEffect(() => {
    loadStockistData();
  }, [loadStockistData]);

  // Handlers
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStockistData();
    setRefreshing(false);
  };

  const handleBack = () => navigate(-1);

  const handleAddStaff = () => {
    navigate("/adminCreateStaff", {
      state: { stockistId: stockist._id },
    });
  };

  const handleExport = () => {
    // Implementation for exporting data
    console.log("Export functionality to be implemented");
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${stockist?.name || stockist?.companyName} - Stockist Profile`,
        url: window.location.href,
      });
    }
  };

  // Render functions
  const renderTabContent = () => {
    const data = filteredData[activeTab];

    if (data.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            {activeTab === "companies" && (
              <Building2 className="w-8 h-8 text-gray-400" />
            )}
            {activeTab === "medicines" && (
              <Pill className="w-8 h-8 text-gray-400" />
            )}
            {activeTab === "staff" && (
              <Users className="w-8 h-8 text-gray-400" />
            )}
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No {activeTab} found
          </h3>
          <p className="text-gray-500 text-center">
            {query
              ? `No ${activeTab} match your search criteria.`
              : `This stockist has no ${activeTab} yet.`}
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
        {activeTab === "companies" &&
          data.map((company) => (
            <motion.div
              key={company._id || company.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.28 }}
            >
              <CompanyCard c={company} onView={() => {}} onContact={() => {}} />
            </motion.div>
          ))}

        {activeTab === "medicines" &&
          data.map((medicine) => (
            <motion.div
              key={medicine._id || medicine.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.28 }}
            >
              <MedicineCard m={medicine} onView={() => {}} onOrder={() => {}} />
            </motion.div>
          ))}

        {activeTab === "staff" &&
          data.map((staff) => (
            <motion.div
              key={staff._id || staff.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.28 }}
            >
              <StaffCard
                st={staff}
                onView={() => {}}
                onDelete={() => {}}
                isAdminOrOwner={false}
              />
            </motion.div>
          ))}
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen p-4 lg:p-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <LoadingSkeleton />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen p-4 lg:p-6 bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full">
          <ErrorMessage error={error} onRetry={handleRefresh} />
        </div>
      </div>
    );
  }

  // No stockist selected
  if (!stockist) {
    return (
      <div className="min-h-screen p-4 lg:p-6 bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No stockist selected
          </h2>
          <p className="text-gray-500">
            Please select a stockist to view details.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 lg:p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar
                name={stockist.name || stockist.companyName}
                size={64}
                className="ring-4 ring-blue-50"
              />
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                  {stockist.name || stockist.companyName}
                </h1>
                <p className="text-gray-600 mt-1">
                  {stockist.email || stockist.phone}
                </p>
                {stockist.location && (
                  <p className="text-sm text-gray-500 mt-1">
                    {stockist.location}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <motion.button
                onClick={handleShare}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.98 }}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Share"
              >
                <Share size={18} />
              </motion.button>

              <motion.button
                onClick={handleExport}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.98 }}
                className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                title="Export"
              >
                <Download size={18} />
              </motion.button>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="rounded-md"
              >
                <Btn
                  onClick={handleBack}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <ArrowLeft size={16} />
                  <span className="hidden sm:inline">Back</span>
                </Btn>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Identity Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
          >
            <IdentityCard
              stockist={stockist}
              qrDataUrl={qrDataUrl}
              onPrint={() => window.print()}
            />
          </motion.div>
        </div>

        {/* Stats Grid */}
        <StatsGrid stats={stats} />

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {/* Tabs and Search */}
          <div className="border-b border-gray-200 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex flex-wrap gap-2">
                {TAB_CONFIG.map(({ key, label, icon: Icon }) => (
                  <motion.button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                      activeTab === key
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                    }`}
                  >
                    <Icon size={16} />
                    <span className="hidden sm:inline">{label}</span>
                    <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full">
                      {filteredData[key].length}
                    </span>
                  </motion.button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                  <input
                    type="text"
                    placeholder={`Search ${activeTab}...`}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all w-full lg:w-64"
                  />
                </div>

                {activeTab === "staff" && (
                  <button
                    onClick={handleAddStaff}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors whitespace-nowrap"
                  >
                    <Plus size={16} />
                    <span className="hidden sm:inline">Add Staff</span>
                  </button>
                )}

                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Refresh"
                >
                  <Loader2
                    size={16}
                    className={refreshing ? "animate-spin" : ""}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">{renderTabContent()}</div>
        </div>
      </div>
    </div>
  );
}
