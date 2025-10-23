import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { apiUrl } from "../config/api";
import { getCookie } from "../utils/cookies";
import {
  ArrowLeft,
  Search,
  Building2,
  Pill,
  Users,
  Loader2,
  AlertCircle,
  Package,
  Sparkles,
} from "lucide-react";
import IdentityCard from "../stockistComponents/IdentityCard";
import StockistApprovals from "./StockistApprovals";
import { motion } from "framer-motion";

// Enhanced Avatar with modern gradients
const Avatar = ({ name, size = 48, className = "" }) => {
  const initials =
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";

  const colors = [
    "from-violet-500 via-purple-500 to-fuchsia-500",
    "from-blue-500 via-cyan-500 to-teal-500",
    "from-pink-500 via-rose-500 to-red-500",
    "from-emerald-500 via-green-500 to-lime-500",
  ];
  const colorIndex = name?.charCodeAt(0) % colors.length || 0;

  return (
    <div
      className={`rounded-2xl bg-gradient-to-br ${colors[colorIndex]} flex items-center justify-center text-white font-bold shadow-xl ring-4 ring-white ${className}`}
      style={{ width: size, height: size, fontSize: size / 2.5 }}
    >
      {initials}
    </div>
  );
};

const LoadingSkeleton = () => (
  <div className="animate-pulse space-y-6 p-6">
    <div className="flex items-center space-x-4">
      <div className="w-20 h-20 bg-gradient-to-br from-violet-200 to-purple-300 rounded-2xl" />
      <div className="space-y-3 flex-1">
        <div className="h-8 bg-gradient-to-r from-violet-200 to-purple-300 rounded-xl w-56" />
        <div className="h-5 bg-gradient-to-r from-violet-200 to-purple-300 rounded-lg w-40" />
      </div>
    </div>
    <div className="h-56 bg-gradient-to-br from-blue-200 via-cyan-200 to-teal-200 rounded-3xl" />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="h-40 bg-gradient-to-br from-pink-200 via-rose-200 to-red-200 rounded-3xl"
        />
      ))}
    </div>
  </div>
);

const ErrorMessage = ({ error, onRetry }) => (
  <div className="flex flex-col items-center justify-center p-10 bg-gradient-to-br from-white to-red-50 rounded-3xl shadow-2xl border-2 border-red-200">
    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center mb-5 shadow-lg">
      <AlertCircle className="w-10 h-10 text-white" />
    </div>
    <h3 className="text-xl font-black text-gray-900 mb-2">
      Oops! Something Went Wrong
    </h3>
    <p className="text-gray-600 text-center mb-5 text-sm max-w-sm">{error}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="px-8 py-3.5 bg-gradient-to-r from-red-500 via-rose-500 to-pink-500 text-white rounded-2xl hover:shadow-2xl transform hover:scale-105 transition-all text-sm font-bold"
      >
        Try Again
      </button>
    )}
  </div>
);

const CompanyCard = ({ company, productCount = 0 }) => {
  const goToCompany = () => {
    if (company?._id) window.location.href = `/company/${company._id}/products`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="bg-gradient-to-br from-white to-orange-50 rounded-3xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-orange-100 group transform"
    >
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 via-amber-500 to-yellow-500 flex items-center justify-center shadow-xl group-hover:rotate-6 transition-transform">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="font-black text-gray-900 text-lg mb-1">
              {company.name}
            </h3>
            <p className="text-sm text-gray-600 font-semibold">
              {productCount} products
            </p>
          </div>
        </div>
      </div>
      <button
        onClick={goToCompany}
        className="w-full py-3.5 bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 text-white rounded-2xl text-sm font-bold hover:shadow-xl transform hover:scale-105 transition-all"
      >
        {company?._id ? "View Details →" : "No Details"}
      </button>
    </motion.div>
  );
};

const MedicineCard = ({ medicine }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ scale: 1.02 }}
    transition={{ type: "spring", stiffness: 300, damping: 20 }}
    className="bg-gradient-to-br from-white to-blue-50 rounded-3xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-blue-100 group transform"
  >
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500 flex items-center justify-center shadow-xl group-hover:rotate-6 transition-transform">
          <Pill className="w-8 h-8 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-black text-gray-900 text-lg mb-1">
            {medicine.name}
          </h3>
          <p className="text-sm text-gray-600 font-semibold">
            {medicine.company?.name || medicine.companyName || ""}
          </p>
        </div>
      </div>
    </div>
    <div className="flex items-center justify-between">
      {medicine.price ? (
        <div className="px-5 py-2.5 bg-gradient-to-r from-emerald-400 to-green-500 rounded-xl shadow-md">
          <span className="text-white font-black text-base">
            {medicine.price}
          </span>
        </div>
      ) : null}
    </div>
  </motion.div>
);

const StaffCard = ({ staff }) => {
  const goToStaff = () => {
    if (staff?._id) window.location.href = `/staff/${staff._id}`;
  };

  return (
    <div className="bg-gradient-to-br from-white to-purple-50 rounded-3xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-purple-100 group hover:scale-105 transform">
      <div className="flex items-center gap-4 mb-5">
        <Avatar
          name={staff.fullName || staff.name || "S"}
          size={64}
          className="group-hover:scale-110 transition-transform"
        />
        <div className="flex-1">
          <h3 className="font-black text-gray-900 text-lg mb-1">
            {staff.fullName || staff.name}
          </h3>
          <p className="text-sm text-purple-600 font-bold">{staff.role}</p>
        </div>
      </div>
      <div className="text-sm text-gray-700 mb-4 font-semibold bg-white px-4 py-2 rounded-xl">
        {staff.phone || "No phone"}
      </div>
      <button
        onClick={goToStaff}
        className="w-full py-3.5 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 text-white rounded-2xl text-sm font-bold hover:shadow-xl transform hover:scale-105 transition-all"
      >
        View Profile →
      </button>
    </div>
  );
};

// Stats component removed as it's now inline in the main component

export default function PharmacyStockist() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const routeId = searchParams.get("id") || null;
  // track auth token so we can render a minimal UI when user is logged out
  const [tokenPresent, setTokenPresent] = useState(!!getCookie("token"));
  const [stockist, setStockist] = useState(null);
  const [companiesList, setCompaniesList] = useState([]);
  const [medicinesList, setMedicinesList] = useState([]);
  const [staffs, setStaffs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("medicines");
  const [query, setQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const stats = useMemo(
    () => ({
      companies: companiesList.length,
      medicines: medicinesList.length,
      staff: staffs.length,
    }),
    [companiesList.length, medicinesList.length, staffs.length]
  );

  const displayName = useMemo(() => {
    if (!stockist) return "Unnamed Stockist";
    return (
      stockist.medicalName ||
      stockist.contactPerson ||
      stockist.name ||
      stockist.companyName ||
      stockist.ownerName ||
      stockist.fullName ||
      stockist.email ||
      stockist.phone ||
      "Unnamed Stockist"
    );
  }, [stockist]);

  const filterByQuery = useCallback(
    (items, keys = ["name"]) => {
      if (!query) return items || [];
      const q = query.trim().toLowerCase();
      return (items || []).filter((item) =>
        keys.some((key) =>
          String(item?.[key] || "")
            .toLowerCase()
            .includes(q)
        )
      );
    },
    [query]
  );

  const filteredData = useMemo(
    () => ({
      companies: filterByQuery(companiesList, ["name"]),
      medicines: filterByQuery(medicinesList, ["name"]),
      staff: filterByQuery(staffs, ["fullName", "name"]),
      approvals: [],
    }),
    [companiesList, medicinesList, staffs, filterByQuery]
  );

  const medicineReferencesStockist = (med, stockistId) => {
    if (!med) return false;
    const candidates = [];
    try {
      if (Array.isArray(med.stockists)) candidates.push(...med.stockists);
      if (med.stockist) candidates.push(med.stockist);
      if (med.stockistId) candidates.push(med.stockistId);
      if (med.seller) candidates.push(med.seller);
      if (med.sellerId) candidates.push(med.sellerId);
      if (med.vendor) candidates.push(med.vendor);
      if (med.vendorId) candidates.push(med.vendorId);
      if (med.supplier) candidates.push(med.supplier);
      if (med.supplierId) candidates.push(med.supplierId);
    } catch {}
    return candidates.some((c) => {
      const id = c?._id || c?.id || c;
      return String(id) === String(stockistId);
    });
  };

  const loadStockistData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const token = getCookie("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // Try to avoid fetching the entire stockist list when we can identify
      // the current user's stockist. Parse stored user from localStorage
      // early so we can attempt a single-stockist fetch via /api/stockist/:id.
      let storedUser = null;
      try {
        storedUser =
          typeof window !== "undefined"
            ? JSON.parse(localStorage.getItem("user") || "null")
            : null;
      } catch {}

      if (storedUser && storedUser.user) storedUser = storedUser.user;

      // prefer explicit route id, else try stored user ids
      const candidateIds = [];
      if (routeId && routeId !== "me") candidateIds.push(routeId);
      if (storedUser) {
        [storedUser._id, storedUser.id, storedUser.userId]
          .filter(Boolean)
          .forEach((v) => candidateIds.push(String(v)));
      }

      let list = [];
      // attempt to fetch a single stockist if we have any candidate id
      if (candidateIds.length > 0) {
        for (const idToFetch of candidateIds) {
          try {
            const singleRes = await fetch(apiUrl(`/api/stockist/${idToFetch}`), {
              headers,
            });
            const singleJson = await singleRes.json().catch(() => ({}));
            if (singleJson && singleJson.data) {
              list = [singleJson.data];
              break;
            }
          } catch (e) {
            // ignore and try next candidate
          }
        }
      }

      // fallback: if we couldn't fetch a single stockist, fetch the list
      if (list.length === 0) {
        const res = await fetch(apiUrl("/api/stockist"), { headers });
        const json = await res.json().catch(() => ({}));
        list = json?.data || [];
      }

      let target = null;

  const userIds = new Set();
      const userEmails = new Set();
      const userPhones = new Set();
      if (storedUser) {
        [storedUser._id, storedUser.id, storedUser?.userId]
          .filter(Boolean)
          .forEach((v) => userIds.add(String(v)));
        (storedUser.email ? [storedUser.email] : [])
          .filter(Boolean)
          .forEach((e) => userEmails.add(String(e).toLowerCase()));
        (storedUser.phone ? [storedUser.phone] : [])
          .filter(Boolean)
          .forEach((p) => userPhones.add(String(p)));
      }

      const matchStockistWithUser = (s) => {
        if (s._id && userIds.has(String(s._id))) return true;
        if (s.id && userIds.has(String(s.id))) return true;
        const emailsToCheck = [s.email, s.ownerEmail, s.user?.email];
        for (const e of emailsToCheck.filter(Boolean)) {
          if (userEmails.has(String(e).toLowerCase())) return true;
        }
        const phonesToCheck = [s.phone, s.contactPhone, s.mobile];
        for (const p of phonesToCheck.filter(Boolean)) {
          if (userPhones.has(String(p))) return true;
        }
        return false;
      };

      if (routeId && routeId !== "me") {
        target = list.find(
          (s) =>
            String(s._id) === String(routeId) ||
            String(s.id) === String(routeId)
        );
      } else {
        if (storedUser) target = list.find((s) => matchStockistWithUser(s));
        if (!target && list.length > 0) target = list[0];
      }

      if (
        !target &&
        storedUser &&
        (storedUser.medicalName ||
          storedUser.druglicenseNo ||
          storedUser.ownerName ||
          storedUser.companyName)
      ) {
        target = storedUser;
      }

      if (!target) throw new Error("Stockist not found");

      setStockist(target);

      const [cRes, mRes, sRes] = await Promise.all([
        fetch(apiUrl("/api/company"), { headers }),
        fetch(apiUrl("/api/medicine"), { headers }),
        fetch(apiUrl(`/api/staff?stockist=${target._id}`), { headers }),
      ]);

      const [cJson, mJson, sJson] = await Promise.all([
        cRes.json().catch(() => ({})),
        mRes.json().catch(() => ({})),
        sRes.json().catch(() => ({})),
      ]);

      const allCompanies = cJson?.data || [];
      const allMeds = mJson?.data || [];
      const staffList = sJson?.data || [];

      const filteredCompanies = allCompanies.filter((company) => {
        try {
          if (Array.isArray(company.stockists))
            return company.stockists.some(
              (s) => String(s?._id || s) === String(target._id)
            );
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

  useEffect(() => {
    loadStockistData();
  }, [loadStockistData]);

  // update token presence when storage changes or window regains focus
  useEffect(() => {
    const checkToken = () => setTokenPresent(!!getCookie("token"));
    const onStorage = (e) => {
      if (e.key === "token" || e.key === null) checkToken();
    };
    const onFocus = () => checkToken();
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onFocus);
    // also poll once in case history navigation changed cookies (some browsers)
    const t = setInterval(checkToken, 1000);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
      clearInterval(t);
    };
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
    window.location.reload();
  };

  const handleLogout = () => {
    try {
      // Clear local storage user object
      try {
        localStorage.removeItem("user");
      } catch (e) {}
      // Clear token cookie by setting expiry in the past
      try {
        document.cookie =
          "token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
      } catch (e) {}
      // Optionally clear other keys
      try {
        localStorage.removeItem("token");
      } catch (e) {}
    } finally {
      // navigate to login
      try {
        navigate("/stockist-login");
      } catch {
        window.location.href = "/stockist-login";
      }
    }
  };

  const qrDataUrl = useMemo(() => {
    if (!stockist?._id) return null;
    const shareUrl = `${window.location.origin}/stockist/${stockist._id}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
      shareUrl
    )}`;
  }, [stockist]);

  const TAB_CONFIG = [
    {
      key: "medicines",
      label: "Medicines",
      icon: Pill,
      color: "text-blue-600",
      bgColor: "bg-gradient-to-br from-blue-50 to-cyan-50",
      activeColor: "bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500",
      hoverEffect: "hover:shadow-blue-200",
    },
    {
      key: "companies",
      label: "Companies",
      icon: Building2,
      color: "text-orange-600",
      bgColor: "bg-gradient-to-br from-orange-50 to-amber-50",
      activeColor:
        "bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500",
      hoverEffect: "hover:shadow-orange-200",
    },
    {
      key: "staff",
      label: "Staff",
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-gradient-to-br from-purple-50 to-fuchsia-50",
      activeColor:
        "bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500",
      hoverEffect: "hover:shadow-purple-200",
    },
    {
      key: "approvals",
      label: "Approvals",
      icon: Package,
      color: "text-emerald-600",
      bgColor: "bg-gradient-to-br from-emerald-50 to-green-50",
      activeColor:
        "bg-gradient-to-r from-emerald-500 via-green-500 to-lime-500",
      hoverEffect: "hover:shadow-emerald-200",
    },
  ];

  const renderTabContent = () => {
    if (activeTab === "approvals") {
      return (
        <div className="grid grid-cols-1 gap-4">
          <StockistApprovals />
        </div>
      );
    }
    const data = filteredData[activeTab];
    if (!data || data.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-20 bg-gradient-to-br from-gray-50 via-white to-gray-100 rounded-3xl border-2 border-dashed border-gray-300">
          <div className="w-24 h-24 bg-gradient-to-br from-white to-gray-100 rounded-3xl flex items-center justify-center mb-6 shadow-xl">
            {activeTab === "companies" && (
              <Building2 className="w-12 h-12 text-gray-400" />
            )}
            {activeTab === "medicines" && (
              <Pill className="w-12 h-12 text-gray-400" />
            )}
            {activeTab === "staff" && (
              <Users className="w-12 h-12 text-gray-400" />
            )}
          </div>
          <h3 className="text-xl font-black text-gray-900 mb-2">
            No {activeTab} found
          </h3>
          <p className="text-gray-500 text-center text-sm max-w-md">
            {query
              ? `No ${activeTab} match your search criteria.`
              : `No ${activeTab} available at the moment.`}
          </p>
        </div>
      );
    }

    const companyProductCounts = (function () {
      const map = new Map();
      try {
        (medicinesList || []).forEach((med) => {
          // med.company may be an object, id string, or companyName
          const compId = med.company?._id || med.company?.id || med.company;
          if (compId) {
            const k = String(compId);
            map.set(k, (map.get(k) || 0) + 1);
          } else if (med.companyName) {
            const k = `name:${String(med.companyName).toLowerCase()}`;
            map.set(k, (map.get(k) || 0) + 1);
          }
        });
      } catch {}
      return map;
    })();

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {activeTab === "companies" &&
          data.map((company) => {
            const idKey = company._id || company.id;
            const nameKey = `name:${(company.name || "").toLowerCase()}`;
            const count = idKey
              ? companyProductCounts.get(String(idKey)) || 0
              : companyProductCounts.get(nameKey) || 0;
            return (
              <CompanyCard
                key={company._id || company.id || company.name}
                company={company}
                productCount={count}
              />
            );
          })}
        {activeTab === "medicines" &&
          data.map((medicine) => (
            <MedicineCard
              key={medicine._id || medicine.id || medicine.name}
              medicine={medicine}
            />
          ))}
        {activeTab === "staff" &&
          data.map((st) => (
            <StaffCard key={st._id || st.id || st.fullName} staff={st} />
          ))}
      </div>
    );
  };

  if (loading)
    return (
      <div className="min-h-screen p-4 lg:p-8 bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50">
        <div className="max-w-7xl mx-auto">
          <LoadingSkeleton />
        </div>
      </div>
    );
  if (error)
    return (
      <div className="min-h-screen p-4 lg:p-8 bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 flex items-center justify-center">
        <div className="max-w-md w-full">
          <ErrorMessage error={error} onRetry={handleRefresh} />
        </div>
      </div>
    );

  // If token is missing (user logged out), show a minimal focused login card
  if (!tokenPresent) {
    return (
      <div className="min-h-screen p-4 lg:p-8 bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="p-8 bg-white rounded-3xl shadow-2xl border-2 border-gray-100 text-center">
            <h3 className="text-xl font-black text-gray-900 mb-3">
              You're logged out
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              To view this page please sign in again.
            </p>
            <button
              onClick={() => {
                try {
                  navigate("/stockist-login");
                } catch {
                  window.location.href = "/stockist-login";
                }
              }}
              className="w-full py-3.5 bg-gradient-to-r from-cyan-400 to-cyan-500 text-white rounded-2xl font-bold shadow-lg hover:shadow-2xl"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen p-2 lg:p-8 bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 overflow-x-hidden"
      style={{ touchAction: "pan-y" }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header Card */}
        <div className="bg-gradient-to-br from-white to-violet-50 rounded-3xl shadow-2xl p-8 border-2 border-violet-100">
          <div className="flex items-center ">
            <div className="flex-1">
              <h1 className="text-2xl font-black bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent mb-1">
                {displayName}
              </h1>
              <p className="text-base text-gray-700 font-bold">
                {stockist?.email || stockist?.contactPerson || "—"}
              </p>
              {stockist?.location && (
                <p className="text-sm text-gray-500 mt-1 font-semibold">
                  📍 {stockist.location}
                </p>
              )}
            </div>

            {/* Logout on the right side of header */}
            <div className="ml-auto flex items-center gap-3">
              <button
                onClick={handleLogout}
                className="hidden md:inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-2xl text-sm font-bold hover:shadow-2xl transform hover:scale-105 transition-all"
              >
                Logout
              </button>

              <button
                onClick={handleLogout}
                className="md:hidden w-12 h-12 rounded-2xl bg-gradient-to-r from-red-500 to-rose-500 flex items-center justify-center text-white hover:shadow-2xl transition-all"
                aria-label="Logout"
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h5a2 2 0 012 2v1"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* ID Card */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.01 }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
        >
          <IdentityCard
            stockist={
              stockist
                ? {
                    ...stockist,
                    contactPerson:
                      stockist.contactPerson ||
                      stockist.medicalName ||
                      displayName,
                  }
                : stockist
            }
            qrDataUrl={qrDataUrl}
            onPrint={() => window.print()}
          />
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 px-4 py-3">
          <div className="bg-gradient-to-br from-white to-orange-50 rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-orange-100 group">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 via-amber-500 to-yellow-500 flex items-center justify-center shadow-xl mb-4 group-hover:rotate-6 transition-transform">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <div className="text-3xl font-black bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-1">
              {stats.companies}
            </div>
            <div className="text-sm text-gray-600 font-bold uppercase tracking-wide">
              Companies
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-blue-50 rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-blue-100 group">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500 flex items-center justify-center shadow-xl mb-4 group-hover:rotate-6 transition-transform">
              <Pill className="w-7 h-7 text-white" />
            </div>
            <div className="text-3xl font-black bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-1">
              {stats.medicines}
            </div>
            <div className="text-sm text-gray-600 font-bold uppercase tracking-wide">
              Medicines
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-purple-50 rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-purple-100 group">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 via-fuchsia-500 to-pink-500 flex items-center justify-center shadow-xl mb-4 group-hover:rotate-6 transition-transform">
              <Users className="w-7 h-7 text-white" />
            </div>
            <div className="text-3xl font-black bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-1">
              {stats.staff}
            </div>
            <div className="text-sm text-gray-600 font-bold uppercase tracking-wide">
              Staff Members
            </div>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-2xl border-2 border-gray-100">
          <div className="p-6 border-b-2 border-gray-100">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              {/* Tabs */}
              <div className="flex gap-2 flex-wrap py-2">
                {TAB_CONFIG.map(
                  ({ key, label, icon: Icon, color, bgColor, activeColor }) => (
                    <button
                      key={key}
                      onClick={() => setActiveTab(key)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-full transition-all whitespace-nowrap text-sm ${
                        activeTab === key
                          ? `${activeColor} text-white`
                          : `${bgColor} ${color}`
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="font-medium">{label}</span>
                      {filteredData[key].length > 0 && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            activeTab === key
                              ? "bg-white/20 text-white"
                              : "bg-white text-gray-600"
                          }`}
                        >
                          {filteredData[key].length}
                        </span>
                      )}
                    </button>
                  )
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1 lg:flex-none">
                  <Search
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <input
                    type="text"
                    placeholder={`Search ${activeTab}...`}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="pl-12 pr-5 py-3.5 border-2 border-gray-200 bg-white rounded-2xl focus:ring-4 focus:ring-violet-200 focus:border-violet-400 outline-none transition-all w-full lg:w-80 text-sm font-semibold shadow-sm"
                  />
                </div>

                <button
                  onClick={() => navigate("/adminCreateStaff")}
                  className="hidden md:inline-flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 text-white rounded-2xl text-sm font-bold hover:shadow-2xl transform hover:scale-105 transition-all"
                >
                  <Users className="w-5 h-5" />
                  Add Staff
                </button>

                <button
                  onClick={() => navigate("/adminCreateStaff")}
                  className="md:hidden w-12 h-12 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white hover:shadow-2xl transition-all"
                  aria-label="Add staff"
                >
                  <Users className="w-5 h-5" />
                </button>

                <button
                  onClick={handleRefresh}
                  className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center hover:shadow-xl transition-all hover:scale-110 transform"
                >
                  <Loader2
                    size={22}
                    className={`text-gray-700 ${
                      refreshing ? "animate-spin" : ""
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          <div className="p-8">{renderTabContent()}</div>
        </div>
      </div>
    </div>
  );
}
