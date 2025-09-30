import React, { useEffect, useState, useCallback, useMemo } from "react";
import { apiUrl } from "./config/api";
import {
  ArrowLeft,
  Search,
  Building2,
  Pill,
  Users,
  Loader2,
  AlertCircle,
  Package,
} from "lucide-react";
import IdentityCard from "./stockistComponents/IdentityCard";

// Small Avatar helper
const Avatar = ({ name, size = 48, className = "" }) => {
  const initials =
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";

  const colors = [
    "from-orange-400 to-pink-400",
    "from-cyan-400 to-blue-400",
    "from-purple-400 to-pink-400",
    "from-green-400 to-cyan-400",
  ];
  const colorIndex = name?.charCodeAt(0) % colors.length || 0;

  return (
    <div
      className={`rounded-full bg-gradient-to-br ${colors[colorIndex]} flex items-center justify-center text-white font-bold ${className}`}
      style={{ width: size, height: size, fontSize: size / 2.5 }}
    >
      {initials}
    </div>
  );
};

const LoadingSkeleton = () => (
  <div className="animate-pulse space-y-6 p-6">
    <div className="flex items-center space-x-4">
      <div className="w-16 h-16 bg-gray-200 rounded-full" />
      <div className="space-y-2 flex-1">
        <div className="h-6 bg-gray-200 rounded-full w-48" />
        <div className="h-4 bg-gray-200 rounded-full w-32" />
      </div>
    </div>
    <div className="h-48 bg-gray-200 rounded-3xl" />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-32 bg-gray-200 rounded-3xl" />
      ))}
    </div>
  </div>
);

const ErrorMessage = ({ error, onRetry }) => (
  <div className="flex flex-col items-center justify-center p-8 bg-white rounded-3xl shadow-sm">
    <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
      <AlertCircle className="w-8 h-8 text-red-500" />
    </div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">
      Something went wrong
    </h3>
    <p className="text-gray-500 text-center mb-4 text-sm">{error}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="px-6 py-2.5 bg-gradient-to-r from-cyan-400 to-blue-500 text-white rounded-full hover:shadow-lg transition-all text-sm font-medium"
      >
        Try Again
      </button>
    )}
  </div>
);

const CompanyCard = ({ company }) => {
  const goToCompany = () => {
    if (company?._id) window.location.href = `/company/${company._id}/products`;
  };

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 to-pink-400 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">
              {company.name}
            </h3>
            <p className="text-xs text-gray-500">
              {company.products ?? 0} products
            </p>
          </div>
        </div>
      </div>
      <button
        onClick={goToCompany}
        className="w-full py-2.5 bg-gradient-to-r from-cyan-400 to-blue-500 text-white rounded-full text-sm font-medium hover:shadow-md transition-all"
      >
        {company?._id ? "View Details" : "No Details"}
      </button>
    </div>
  );
};

const MedicineCard = ({ medicine }) => {
  // Add-to-cart removed (non-working) — medicine cards now show details only

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
            <Pill className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-sm">
              {medicine.name}
            </h3>
            <p className="text-xs text-gray-500">{medicine.company || ""}</p>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between mb-3">
        <div className="px-3 py-1.5 bg-orange-50 rounded-full">
          <span className="text-orange-600 font-bold text-sm">
            {medicine.price || ""}
          </span>
        </div>
        <span className="text-xs text-gray-500">
          Stock: {medicine.stock ?? 0}
        </span>
      </div>
      {/* Add-to-cart removed. */}
    </div>
  );
};

const StaffCard = ({ staff }) => {
  const goToStaff = () => {
    if (staff?._id) window.location.href = `/staff/${staff._id}`;
  };

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center gap-3 mb-4">
        <Avatar name={staff.fullName || staff.name || "S"} size={48} />
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-sm">
            {staff.fullName || staff.name}
          </h3>
          <p className="text-xs text-gray-500">{staff.role}</p>
        </div>
      </div>
      <div className="text-xs text-gray-600 mb-3">{staff.phone || ""}</div>
      <button
        onClick={goToStaff}
        className="w-full py-2.5 bg-gradient-to-r from-orange-400 to-yellow-500 text-white rounded-full text-sm font-medium hover:shadow-md transition-all"
      >
        View Profile
      </button>
    </div>
  );
};

const StatsCard = ({ icon: Icon, label, value, gradient }) => (
  <div className="bg-white rounded-3xl p-6 shadow-sm">
    <div
      className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-3`}
    >
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
    <div className="text-sm text-gray-500">{label}</div>
  </div>
);

export default function PharmacyStockist() {
  const [stockist, setStockist] = useState(null);
  const [companiesList, setCompaniesList] = useState([]);
  const [medicinesList, setMedicinesList] = useState([]);
  const [staffs, setStaffs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("medicines");
  const [query, setQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [rawResponses, setRawResponses] = useState({});

  const stats = useMemo(
    () => ({
      companies: companiesList.length,
      medicines: medicinesList.length,
      staff: staffs.length,
    }),
    [companiesList.length, medicinesList.length, staffs.length]
  );

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
    }),
    [companiesList, medicinesList, staffs, filterByQuery]
  );

  useEffect(() => {
    let mounted = true;

    const safeJson = async (res) => {
      try {
        if (!res) return null;
        if (!res.ok)
          return { ok: false, status: res.status, body: await res.text() };
        return await res.json();
      } catch (e) {
        return null;
      }
    };

    const parsePossible = (json) => {
      if (!json) return null;
      if (Array.isArray(json)) return json;
      if (json.data && Array.isArray(json.data)) return json.data;
      if (json.items && Array.isArray(json.items)) return json.items;
      if (json.payload && Array.isArray(json.payload)) return json.payload;
      if (json.stockists && Array.isArray(json.stockists))
        return json.stockists;
      if (json._id || json.id || json.name) return [json];
      return null;
    };

    (async () => {
      setLoading(true);
      setError("");
      try {
        let token = null;
        try {
          token = localStorage.getItem("token");
        } catch (e) {
          // ignore
        }
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const [rStockist, rCompanies, rMedicines, rStaff] = await Promise.all([
          fetch(apiUrl("/api/stockist"), { headers }),
          fetch(apiUrl("/api/company"), { headers }),
          fetch(apiUrl("/api/medicine"), { headers }),
          fetch(apiUrl("/api/staff"), { headers }),
        ]);

        const [jStockist, jCompanies, jMedicines, jStaff] = await Promise.all([
          safeJson(rStockist),
          safeJson(rCompanies),
          safeJson(rMedicines),
          safeJson(rStaff),
        ]);

        if (!mounted) return;

        setRawResponses({ jStockist, jCompanies, jMedicines, jStaff });

        if (
          [rStockist, rCompanies, rMedicines, rStaff].some(
            (r) => r && r.status === 401
          )
        ) {
          setError(
            "Some data requires authentication. Please login to see protected content."
          );
        }

        const parsedStockists = parsePossible(jStockist) || [];
        setStockist(parsedStockists[0] || null);

        setCompaniesList(parsePossible(jCompanies) || []);
        setMedicinesList(parsePossible(jMedicines) || []);
        setStaffs(parsePossible(jStaff) || []);
      } catch (err) {
        console.error("Stockist fetch error:", err);
        if (mounted)
          setError("Failed to load data. Check your API or network.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
    window.location.reload();
  };

  // Generate QR image URL for the current stockist (if available).
  // Uses the Google Chart API to create a QR image URL without extra dependencies.
  const qrDataUrl = (() => {
    try {
      if (!stockist || !stockist._id) return null;
      const shareUrl = `${window.location.origin}/stockist/${stockist._id}`;
      // Use api.qrserver.com which reliably returns an image for the given data
      // Example: https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=HELLO
      return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
        shareUrl
      )}`;
    } catch (e) {
      return null;
    }
  })();

  const TAB_CONFIG = [
    {
      key: "medicines",
      label: "Medicines",
      icon: Pill,
      gradient: "from-cyan-400 to-blue-500",
    },
    {
      key: "companies",
      label: "Companies",
      icon: Building2,
      gradient: "from-orange-400 to-pink-400",
    },
    {
      key: "staff",
      label: "Staff",
      icon: Users,
      gradient: "from-purple-400 to-pink-400",
    },
  ];

  const renderTabContent = () => {
    const data = filteredData[activeTab];
    if (!data || data.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-12 bg-gray-50 rounded-3xl">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
            {activeTab === "companies" && (
              <Building2 className="w-8 h-8 text-gray-300" />
            )}
            {activeTab === "medicines" && (
              <Pill className="w-8 h-8 text-gray-300" />
            )}
            {activeTab === "staff" && (
              <Users className="w-8 h-8 text-gray-300" />
            )}
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-2">
            No {activeTab} found
          </h3>
          <p className="text-gray-500 text-center text-sm">
            {query
              ? `No ${activeTab} match your search.`
              : `No ${activeTab} available yet.`}
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {activeTab === "companies" &&
          data.map((company) => (
            <CompanyCard
              key={company._id || company.id || company.name}
              company={company}
            />
          ))}
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
      <div className="min-h-screen p-4 lg:p-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <LoadingSkeleton />
        </div>
      </div>
    );
  if (error)
    return (
      <div className="min-h-screen p-4 lg:p-6 bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="max-w-md w-full">
          <ErrorMessage error={error} onRetry={handleRefresh} />
        </div>
      </div>
    );

  return (
    <div className="min-h-screen p-4 lg:p-6 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white rounded-3xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <Avatar
              name={stockist?.name || "Stockist"}
              size={64}
              className="shadow-md"
            />
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                {stockist?.name || "Unnamed Stockist"}
              </h1>
              <p className="text-sm text-gray-500">{stockist?.email || "—"}</p>
              {stockist?.location && (
                <p className="text-xs text-gray-400 mt-1">
                  {stockist.location}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* <div className="bg-gradient-to-br from-cyan-400 to-blue-500 rounded-3xl shadow-lg p-8 text-white">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm opacity-90 mb-1">Your Health Hub</p>
              <h2 className="text-xl font-bold">
                {stockist?.companyName || "—"}
              </h2>
            </div>
            <Package className="w-8 h-8 opacity-80" />
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="opacity-75 mb-1">Phone</p>
              <p className="font-semibold">{stockist?.phone || "—"}</p>
            </div>
            <div>
              <p className="opacity-75 mb-1">ID</p>
              <p className="font-semibold">
                {stockist ? stockist._id?.slice(0, 8) : "—"}
              </p>
            </div>
          </div>
        </div> */}
        <IdentityCard
          stockist={stockist}
          qrDataUrl={qrDataUrl}
          onPrint={() => window.print()}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatsCard
            icon={Building2}
            label="Companies"
            value={stats.companies}
            gradient="from-orange-400 to-pink-400"
          />
          <StatsCard
            icon={Pill}
            label="Medicines"
            value={stats.medicines}
            gradient="from-cyan-400 to-blue-500"
          />
          <StatsCard
            icon={Users}
            label="Staff Members"
            value={stats.staff}
            gradient="from-purple-400 to-pink-400"
          />
        </div>

        <div className="bg-white rounded-3xl shadow-sm">
          <div className="p-6 border-b border-gray-100">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex gap-2 overflow-x-auto pb-2">
                {TAB_CONFIG.map(({ key, label, icon: Icon, gradient }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all whitespace-nowrap text-sm ${
                      activeTab === key
                        ? `bg-gradient-to-r ${gradient} text-white shadow-md`
                        : "text-gray-600 bg-gray-100 hover:bg-gray-200"
                    }`}
                  >
                    <Icon size={16} />
                    <span>{label}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        activeTab === key ? "bg-white/30" : "bg-white"
                      }`}
                    >
                      {filteredData[key].length}
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1 lg:flex-none">
                  <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                  <input
                    type="text"
                    placeholder={`Search ${activeTab}...`}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="pl-10 pr-4 py-2.5 border border-gray-200 bg-gray-50 rounded-full focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 outline-none transition-all w-full lg:w-64 text-sm"
                  />
                </div>

                {/* Add Staff action removed (not implemented) */}

                <button
                  onClick={handleRefresh}
                  className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <Loader2
                    size={18}
                    className={`text-gray-600 ${
                      refreshing ? "animate-spin" : ""
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">{renderTabContent()}</div>
        </div>

        <div className="px-2">
          <button
            onClick={() => setShowDebug((s) => !s)}
            className="text-sm text-gray-500 underline"
          >
            {showDebug ? "Hide" : "Show"} debug responses
          </button>
          {showDebug && (
            <pre className="mt-4 p-4 bg-white rounded-2xl border overflow-auto text-xs max-h-64">
              {JSON.stringify(rawResponses, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
