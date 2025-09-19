import React, { useEffect, useState } from "react";
import { apiUrl } from "./config/api";
import { medicineReferencesStockist } from "./utils/normalizeMatching";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  Users,
  Building,
  Box,
  Trash2,
  Eye,
  Plus,
  Search,
  MapPin,
  Mail,
  Phone,
  ArrowLeft,
  Filter,
  ChevronDown,
} from "lucide-react";

export default function StockistOutcode() {
  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation();
  const routeId =
    params.id || (location.state && location.state.stockistId) || null;

  const [stockist, setStockist] = useState(null);
  const [companiesList, setCompaniesList] = useState([]);
  const [medicinesList, setMedicinesList] = useState([]);
  const [staffs, setStaffs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("companies");

  // Enhanced UI states
  const [query, setQuery] = useState("");
  const [showOnlyMyStockist, setShowOnlyMyStockist] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Read logged in user and token
  const rawUser = localStorage.getItem("user");
  const rawToken = localStorage.getItem("token");
  let user = null;
  try {
    user = rawUser ? JSON.parse(rawUser) : null;
  } catch (e) {
    user = null;
  }

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(apiUrl("/api/stockist"));
        const json = await res.json().catch(() => ({}));
        const list = (json && json.data) || [];

        let target = null;
        if (routeId && routeId !== "me") {
          target = list.find((s) => String(s._id) === String(routeId));
        } else if (routeId === "me") {
          if (user && user._id)
            target = list.find((s) => String(s._id) === String(user._id));
        }

        if (!target && user && user.role === "stockist") {
          target = list.find(
            (s) =>
              (s.email && user.email && s.email === user.email) ||
              (s._id && String(s._id) === String(user._id))
          );
        }

        if (!target && !routeId && list.length > 0) target = list[0];

        if (!target) {
          setError("Stockist not found");
          setLoading(false);
          return;
        }

        if (mounted) setStockist(target || null);

        let staffUrl = null;
        if (
          user &&
          user.role === "stockist" &&
          (!routeId ||
            routeId === "me" ||
            String(user._id) === String(target._id))
        ) {
          staffUrl = apiUrl("/api/staff?stockist=me");
        } else {
          staffUrl = apiUrl(`/api/staff?stockist=${target._id}`);
        }

        const staffRes = await fetch(staffUrl, {
          headers: rawToken ? { Authorization: `Bearer ${rawToken}` } : {},
        });
        const staffJson = await staffRes.json().catch(() => ({}));
        const staffList = staffJson.data || [];
        if (mounted) setStaffs(staffList);

        try {
          const [cRes, mRes] = await Promise.all([
            fetch(apiUrl("/api/company")),
            fetch(apiUrl("/api/medicine")),
          ]);

          const cJson = await cRes.json().catch(() => ({}));
          const mJson = await mRes.json().catch(() => ({}));

          const allCompanies = (cJson && cJson.data) || [];
          const allMeds = (mJson && mJson.data) || [];

          const filteredCompanies = allCompanies.filter((c) => {
            try {
              if (Array.isArray(c.stockists) && c.stockists.length > 0) {
                return c.stockists.some(
                  (s) => String((s && (s._id || s)) || s) === String(target._id)
                );
              }
              const possible = [
                c.stockist,
                c.stockistId,
                c.seller,
                c.sellerId,
                c.vendor,
                c.vendorId,
                c.supplier,
                c.supplierId,
              ];
              for (const f of possible) {
                if (!f) continue;
                const cand = f && (f._id || f.id || f);
                if (String(cand) === String(target._id)) return true;
              }
            } catch (e) {
              // ignore
            }
            return false;
          });

          const filteredMeds = allMeds.filter((med) =>
            medicineReferencesStockist(med, target._id)
          );

          if (mounted) {
            setCompaniesList(filteredCompanies);
            setMedicinesList(filteredMeds);
          }
        } catch (e) {
          // ignore optional lists errors
        }
      } catch (err) {
        console.error("StockistOutcode load error", err);
        if (mounted) setError(String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => (mounted = false);
  }, [routeId]);

  const isOwner = () =>
    user &&
    user.role === "stockist" &&
    stockist &&
    String(user._id) === String(stockist._id);
  const isAdmin = () =>
    user && (user.role === "admin" || user.role === "superadmin");

  // Enhanced Avatar component
  const Avatar = ({ name, size = 64 }) => {
    const initials = (name || "")
      .split(" ")
      .map((s) => (s ? s[0] : ""))
      .join("")
      .slice(0, 2)
      .toUpperCase();

    return (
      <div
        className="flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold shadow-lg ring-4 ring-blue-100"
        style={{ width: size, height: size }}
      >
        {initials || "S"}
      </div>
    );
  };

  const stats = {
    companies:
      (companiesList && companiesList.length) ||
      (Array.isArray(stockist?.companies) && stockist.companies.length) ||
      0,
    medicines:
      (medicinesList && medicinesList.length) ||
      (Array.isArray(stockist?.Medicines) && stockist.Medicines.length) ||
      (Array.isArray(stockist?.medicines) && stockist.medicines.length) ||
      0,
    staff: (staffs && staffs.length) || 0,
  };

  // Enhanced filter function
  const filterByQuery = (items, labelKeys = ["name"]) => {
    if (!query || query.trim() === "") return items;
    const q = query.trim().toLowerCase();
    return items.filter((it) => {
      if (!it) return false;
      if (typeof it === "string") return it.toLowerCase().includes(q);
      for (const k of labelKeys) {
        if (it[k] && String(it[k]).toLowerCase().includes(q)) return true;
      }
      try {
        if (JSON.stringify(it).toLowerCase().includes(q)) return true;
      } catch (e) {}
      return false;
    });
  };

  // Enhanced loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border animate-pulse">
            <div className="p-8">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-3"></div>
                  <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                </div>
              </div>
            </div>
            <div className="border-t bg-gray-50 p-6">
              <div className="grid grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="text-center">
                    <div className="h-8 bg-gray-200 rounded w-12 mx-auto mb-2"></div>
                    <div className="h-4 bg-gray-100 rounded w-16 mx-auto"></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-32 bg-gray-100 rounded-lg"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-sm border p-8 text-center max-w-md">
          <div className="text-red-500 mb-4">
            <Box size={48} className="mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!stockist) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-sm border p-8 text-center max-w-md">
          <div className="text-gray-400 mb-4">
            <Users size={48} className="mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Stockist Selected
          </h3>
          <p className="text-gray-600">
            Please select a stockist to view details.
          </p>
        </div>
      </div>
    );
  }

  const companiesSource =
    companiesList && companiesList.length
      ? companiesList
      : stockist.companies || [];
  const medicinesSource =
    medicinesList && medicinesList.length
      ? medicinesList
      : stockist.Medicines || stockist.medicines || [];

  const companies = filterByQuery(
    companiesSource.map((c) => (typeof c === "string" ? { name: c } : c || {})),
    ["name", "companyName", "title", "email", "phone"]
  );

  const medicines = filterByQuery(
    medicinesSource.map((m) => (typeof m === "string" ? { name: m } : m || {})),
    ["name", "medicineName", "title", "manufacturer", "company"]
  );

  const visibleStaff = filterByQuery(staffs || [], [
    "fullName",
    "name",
    "firstName",
    "lastName",
    "contact",
    "phone",
    "email",
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Header */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="relative bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-8">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="flex items-start gap-6">
                <Avatar
                  name={stockist.name || stockist.title || stockist.companyName}
                  size={72}
                />
                <div className="text-white">
                  <h1 className="text-3xl font-bold mb-2">
                    {stockist.name || stockist.title || stockist.companyName}
                  </h1>
                  <div className="space-y-2">
                    {stockist.phone && (
                      <div className="flex items-center gap-2 text-blue-100">
                        <Phone size={16} />
                        <span>{stockist.phone || stockist.contactNo}</span>
                      </div>
                    )}
                    {stockist.email && (
                      <div className="flex items-center gap-2 text-blue-100">
                        <Mail size={16} />
                        <span>{stockist.email}</span>
                      </div>
                    )}
                    {(stockist.city || stockist.location) && (
                      <div className="flex items-center gap-2 text-blue-100">
                        <MapPin size={16} />
                        <span>{stockist.city || stockist.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {(isAdmin() || isOwner()) && (
                  <button
                    onClick={() => navigate("/adminCreateStaff")}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-lg font-medium shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105"
                  >
                    <Plus size={18} /> Add Staff
                  </button>
                )}
                <button
                  onClick={() => window.history.back()}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur text-white rounded-lg font-medium hover:bg-white/20 transition-all duration-200"
                >
                  <ArrowLeft size={18} /> Back
                </button>
              </div>
            </div>
          </div>

          {/* Enhanced Stats Section */}
          <div className="border-t bg-white px-8 py-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
                  <Building className="text-blue-600" size={24} />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {stats.companies}
                </div>
                <div className="text-sm font-medium text-gray-500">
                  Companies
                </div>
              </div>

              <div className="text-center p-6 bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl border border-emerald-100">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-lg mb-4">
                  <Box className="text-emerald-600" size={24} />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {stats.medicines}
                </div>
                <div className="text-sm font-medium text-gray-500">
                  Medicines
                </div>
              </div>

              <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl border border-purple-100">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mb-4">
                  <Users className="text-purple-600" size={24} />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {stats.staff}
                </div>
                <div className="text-sm font-medium text-gray-500">
                  Staff Members
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Controls Section */}
          <div className="border-t bg-gray-50 px-8 py-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              {/* Search Bar */}
              <div className="relative flex-1 lg:max-w-md">
                <Search
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={`Search ${activeTab}...`}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
                />
              </div>

              {/* Tab Navigation */}
              <div className="flex items-center gap-4">
                <div className="flex bg-white rounded-lg p-1 shadow-sm border">
                  <button
                    onClick={() => setActiveTab("companies")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      activeTab === "companies"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                    }`}
                  >
                    <Building size={16} /> Companies
                  </button>
                  <button
                    onClick={() => setActiveTab("medicines")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      activeTab === "medicines"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                    }`}
                  >
                    <Box size={16} /> Medicines
                  </button>
                  <button
                    onClick={() => setActiveTab("staff")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      activeTab === "staff"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                    }`}
                  >
                    <Users size={16} /> Staff
                  </button>
                </div>

                {/* Filter Toggle */}
                <div className="relative">
                  <button
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all duration-200"
                  >
                    <Filter size={16} />
                    Filter
                    <ChevronDown
                      size={16}
                      className={`transform transition-transform ${
                        isFilterOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isFilterOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border z-10">
                      <div className="p-4">
                        <label className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            checked={showOnlyMyStockist}
                            onChange={(e) =>
                              setShowOnlyMyStockist(e.target.checked)
                            }
                          />
                          <span className="text-sm font-medium text-gray-700">
                            Only my stockist
                          </span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Content Section */}
        <div className="mt-8">
          {activeTab === "companies" && (
            <div>
              {!companies || companies.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
                  <Building className="mx-auto text-gray-300 mb-4" size={48} />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Companies Found
                  </h3>
                  <p className="text-gray-500">
                    {query
                      ? "No companies match your search criteria."
                      : "No companies are currently listed for this stockist."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {companies.map((c, i) => {
                    const title =
                      c.name || c.title || c.companyName || "Untitled Company";
                    const subtitle = c.email || c.phone || c.contact || "";

                    return (
                      <div
                        key={i}
                        className="bg-white rounded-xl shadow-sm border hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden group"
                      >
                        <div className="p-6">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                              {title.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 mb-1 truncate group-hover:text-blue-600 transition-colors">
                                {title}
                              </h3>
                              {subtitle && (
                                <p className="text-sm text-gray-500 truncate">
                                  {subtitle}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="mt-6 flex gap-2">
                            <button
                              onClick={() => {}}
                              className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              View Details
                            </button>
                            <button
                              onClick={() => {}}
                              className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                            >
                              Contact
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === "medicines" && (
            <div>
              {!medicines || medicines.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
                  <Box className="mx-auto text-gray-300 mb-4" size={48} />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Medicines Found
                  </h3>
                  <p className="text-gray-500">
                    {query
                      ? "No medicines match your search criteria."
                      : "No medicines are currently listed for this stockist."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {medicines.map((m, i) => {
                    const title =
                      m.name ||
                      m.medicineName ||
                      m.title ||
                      "Untitled Medicine";
                    const subtitle = m.company || m.manufacturer || "";

                    return (
                      <div
                        key={i}
                        className="bg-white rounded-xl shadow-sm border hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden group"
                      >
                        <div className="p-6">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                              {title.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 mb-1 truncate group-hover:text-emerald-600 transition-colors">
                                {title}
                              </h3>
                              {subtitle && (
                                <p className="text-sm text-gray-500 truncate">
                                  {subtitle}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="mt-6 flex gap-2">
                            <button
                              onClick={() => {}}
                              className="flex items-center justify-center gap-2 flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              <Eye size={14} /> Details
                            </button>
                            <button
                              onClick={() => {}}
                              className="flex-1 px-3 py-2 text-sm font-medium text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
                            >
                              Order
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === "staff" && (
            <div>
              {!visibleStaff || visibleStaff.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
                  <Users className="mx-auto text-gray-300 mb-4" size={48} />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Staff Members Found
                  </h3>
                  <p className="text-gray-500">
                    {query
                      ? "No staff members match your search criteria."
                      : "No staff members are currently listed for this stockist."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {visibleStaff.map((st) => (
                    <div
                      key={st._id}
                      className="bg-white rounded-xl shadow-sm border hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                    >
                      <div className="p-6">
                        <div className="flex items-start gap-4 mb-6">
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                            {(
                              (
                                st.fullName ||
                                st.name ||
                                st.firstName ||
                                ""
                              ).slice(0, 2) || "S"
                            ).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 mb-1 truncate">
                              {st.fullName ||
                                st.name ||
                                `${st.firstName || ""} ${
                                  st.lastName || ""
                                }`.trim() ||
                                "Unnamed Staff"}
                            </h3>
                            <p className="text-sm text-gray-500 truncate">
                              {st.contact ||
                                st.contactNo ||
                                st.phone ||
                                st.contact ||
                                "No contact info"}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            className="flex items-center justify-center gap-2 flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            onClick={() => navigate(`/staff/${st._id}`)}
                          >
                            <Eye size={14} /> View
                          </button>

                          {(isAdmin() || isOwner()) && (
                            <button
                              className="flex items-center justify-center px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                              onClick={async () => {
                                if (
                                  !window.confirm(
                                    "Are you sure you want to delete this staff member?"
                                  )
                                )
                                  return;
                                try {
                                  const res = await fetch(
                                    apiUrl(`/api/staff/${st._id}`),
                                    {
                                      method: "DELETE",
                                      headers: rawToken
                                        ? {
                                            Authorization: `Bearer ${rawToken}`,
                                          }
                                        : {},
                                    }
                                  );
                                  if (res.ok) {
                                    setStaffs((s) =>
                                      s.filter(
                                        (x) => String(x._id) !== String(st._id)
                                      )
                                    );
                                  } else {
                                    const j = await res
                                      .json()
                                      .catch(() => ({}));
                                    alert(
                                      (j && j.message) ||
                                        `Failed to delete (${res.status})`
                                    );
                                  }
                                } catch (e) {
                                  alert(String(e));
                                }
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
