import React, { useEffect, useState } from "react";
import API_BASE from "./config/api";
import { getCookie } from "./utils/cookies";
import {
  medicineReferencesStockist,
  medicineDisplayName,
  nameMatchesStockistItems,
} from "./utils/normalizeMatching";
import { useNavigate } from "react-router-dom";
import Logo from "./Logo";

const Icon = ({ children }) => <span className="text-lg">{children}</span>;

export default function Nav({ navigation: navProp }) {
  const navigate = (() => {
    try {
      return useNavigate();
    } catch {
      return null;
    }
  })();

  // navigation helper (accepts same signature used elsewhere)
  const navigation = navProp || {
    navigate: (path) => {
      if (navigate) navigate(path);
      else window.location.href = path;
    },
    goBack: () => window.history.back(),
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filterType, setFilterType] = useState("company");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedStockists, setSelectedStockists] = useState([]);
  const [showAllResults, setShowAllResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [userToken, setUserToken] = useState(null);
  const [sectionData, setSectionData] = useState([]);

  // fetch stockists, medicines, companies and map into sectionData
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [resStockist, resMedicine, resCompany] = await Promise.all([
          fetch(`${API_BASE}/api/stockist`),
          fetch(`${API_BASE}/api/medicine`),
          fetch(`${API_BASE}/api/company`),
        ]);
        const [jsonStockist, jsonMedicine, jsonCompany] = await Promise.all([
          resStockist.json(),
          resMedicine.json(),
          resCompany.json(),
        ]);

        const medicines = (jsonMedicine && jsonMedicine.data) || [];
        const companies = (jsonCompany && jsonCompany.data) || [];

        if (mounted && jsonStockist && jsonStockist.data) {
          const mapped = jsonStockist.data.map((s) => {
            let medsForStockist = medicines
              .filter((m) => medicineReferencesStockist(m, s._id))
              .map((m) => medicineDisplayName(m))
              .filter(Boolean);

            // Fallback: if no medicines were found by id references, try matching by name
            if (
              (!medsForStockist || medsForStockist.length === 0) &&
              medicines.length > 0
            ) {
              const stockistNames = new Set(
                (s.Medicines || s.medicines || s.items || []).map((x) =>
                  String(x).toLowerCase()
                )
              );
              const fallback = medicines
                .filter((m) => {
                  const name = medicineDisplayName(m) || "";
                  if (!name) return false;
                  if (nameMatchesStockistItems(name, s)) return true;
                  const lname = name.toLowerCase();
                  for (const n of stockistNames) {
                    if (!n) continue;
                    if (n.includes(lname) || lname.includes(n)) return true;
                  }
                  return false;
                })
                .map((m) => medicineDisplayName(m))
                .filter(Boolean);
              if (fallback.length > 0) medsForStockist = fallback;
            }

            const companyIds = new Set(
              medicines
                .filter((m) =>
                  Array.isArray(m.stockists)
                    ? m.stockists.some((st) =>
                        String(st.stockist || st).includes(String(s._id))
                      )
                    : false
                )
                .map((m) =>
                  m.company && (m.company._id || m.company)
                    ? String(m.company._id || m.company)
                    : null
                )
                .filter(Boolean)
            );

            // Also derive company ids that the stockist advertises (s.companies may contain ids or objects)
            const companyIdsFromStockist = new Set(
              (s.companies || s.items || [])
                .map((c) => {
                  if (!c) return null;
                  if (typeof c === "string") return String(c);
                  if (c._id) return String(c._id);
                  if (c.id) return String(c.id);
                  return null;
                })
                .filter(Boolean)
            );

            // If we still have no meds, try matching medicines by their `company` field against the stockist's companies
            if (
              (!medsForStockist || medsForStockist.length === 0) &&
              companyIdsFromStockist.size > 0
            ) {
              const byCompany = medicines
                .filter((m) => {
                  const comp = m.company && (m.company._id || m.company);
                  return comp && companyIdsFromStockist.has(String(comp));
                })
                .map((m) => medicineDisplayName(m))
                .filter(Boolean);
              if (byCompany.length > 0)
                medsForStockist = [
                  ...new Set([...(medsForStockist || []), ...byCompany]),
                ];
            }

            // Companies that are related via medicines/companyIds
            let companiesForStockist = companies
              .filter((c) => companyIds.has(String(c._id)))
              .map((c) => (c.name ? c.name : c.shortName || ""))
              .filter(Boolean);

            // we will compute reverseCompanies later using a deep-scan helper

            // Resolve explicit companies listed on the stockist (may be ids or objects)
            const explicitItems = (
              Array.isArray(s.companies) ? s.companies : []
            )
              .map((c) => {
                if (typeof c === "string") {
                  const found = companies.find(
                    (co) => String(co._id) === c || co.id === c
                  );
                  return found ? found.name || found.shortName || c : c;
                }
                if (c && (c.name || c.shortName)) return c.name || c.shortName;
                return "";
              })
              .filter(Boolean);

            // Combine explicit list with computed companiesFromMedicines/reverse scan and dedupe by name
            const items = Array.from(
              new Set([
                ...(explicitItems || []),
                ...(companiesForStockist || []),
              ])
            );

            // Resolve any medicine entries that might be IDs or embedded objects
            // by looking up the fetched `medicines` array. Fall back to name lists.
            let meds = [];
            if (Array.isArray(s.medicines) && s.medicines.length > 0) {
              meds = s.medicines
                .map((m) => {
                  if (typeof m === "string") return m;
                  if (m && (m.name || m.brandName))
                    return m.name || m.brandName;
                  try {
                    const candidateId = m && (m._id || m.id || m);
                    if (candidateId && medicines && medicines.length > 0) {
                      const found = medicines.find(
                        (md) =>
                          String(md._id) === String(candidateId) ||
                          String(md._id) ===
                            String(
                              (candidateId &&
                                (candidateId._id || candidateId.id)) ||
                                candidateId
                            )
                      );
                      if (found) return medicineDisplayName(found);
                    }
                  } catch (e) {
                    // ignore resolution errors
                  }
                  return "";
                })
                .filter(Boolean);
            } else {
              // fallback to previously computed medsForStockist (already names)
              meds = (medsForStockist || []).slice();
            }

            // deep scan a company object for any occurrence of the stockist id
            const deepScanCompanyReferences = (obj, sid) => {
              if (!obj) return false;
              const target = String(sid);
              const seen = new Set();

              const walk = (value) => {
                if (value == null) return false;
                if (seen.has(value)) return false;
                // primitives
                if (typeof value === "string" || typeof value === "number") {
                  if (String(value) === target) return true;
                  return false;
                }
                if (Array.isArray(value)) {
                  for (const item of value) if (walk(item)) return true;
                  return false;
                }
                if (typeof value === "object") {
                  // guard against cycles
                  if (seen.has(value)) return false;
                  seen.add(value);
                  for (const k of Object.keys(value)) {
                    if (walk(value[k])) return true;
                  }
                  return false;
                }
                return false;
              };

              return walk(obj);
            };

            const reverseCompanies = companies
              .filter((c) => deepScanCompanyReferences(c, s._id))
              .map((c) => (c.name ? c.name : c.shortName || ""))
              .filter(Boolean);
            return {
              _id: s._id,
              title: s.name,
              phone: s.phone,
              address: s.address
                ? `${s.address.street || ""}, ${s.address.city || ""}`
                : "",
              items,
              Medicines: meds,
            };
          });
          setSectionData(mapped);
          console.warn("Nav: loaded stockists ->", mapped.length);
        }
      } catch (err) {
        console.warn("Nav: failed to load stockists", err);
      }
    })();
    return () => (mounted = false);
  }, []);

  // read token
  useEffect(() => {
    const token = getCookie("token");
    setUserToken(token);
  }, []);

  // helpers to gather all unique values for a given filter type
  const getAllItems = (type) => {
    if (type === "company") {
      const allCompanies = new Set();
      const norm = (s) =>
        String(s || "")
          .toLowerCase()
          .trim();
      sectionData.forEach((section) =>
        section.items?.forEach((item) => allCompanies.add(norm(item)))
      );
      return Array.from(allCompanies);
    } else if (type === "stockist") {
      return sectionData.map((section) => section.title);
    } else if (type === "medicine") {
      const allMedicines = new Set();
      sectionData.forEach((section) =>
        section.Medicines?.forEach((med) => allMedicines.add(med))
      );
      return Array.from(allMedicines);
    }
    return [];
  };

  // change filter type and pre-populate selectedStockists for "show all"
  const handleFilterTypeChange = (newType) => {
    setFilterType(newType);
    setSearchQuery("");
    setSelectedStockists([]);
    setShowAllResults(true);
    setShowFilterModal(false);

    const allItems = getAllItems(newType);
    if (newType === "stockist") {
      setSelectedStockists(sectionData);
    } else if (newType === "company") {
      const companyStockists = [];
      const norm = (s) =>
        String(s || "")
          .toLowerCase()
          .trim();
      allItems.forEach((company) => {
        const stockists = sectionData.filter((section) =>
          (section.items || []).some((it) => norm(it) === company)
        );
        companyStockists.push(...stockists);
      });
      setSelectedStockists([...new Set(companyStockists)]);
    } else if (newType === "medicine") {
      const medicineStockists = [];
      allItems.forEach((medicine) => {
        const stockists = sectionData.filter(
          (section) => section.Medicines && section.Medicines.includes(medicine)
        );
        medicineStockists.push(...stockists);
      });
      setSelectedStockists([...new Set(medicineStockists)]);
    }
  };

  // suggestions logic
  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    const resultSet = new Set();

    if (!q) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (filterType === "company") {
      const norm = (s) =>
        String(s || "")
          .toLowerCase()
          .trim();
      sectionData.forEach((section) =>
        section.items?.forEach((item) => {
          if (norm(item).includes(q)) resultSet.add(norm(item));
        })
      );
    } else if (filterType === "stockist") {
      sectionData.forEach((section) => {
        if (section.title.toLowerCase().includes(q))
          resultSet.add(section.title);
      });
    } else if (filterType === "medicine") {
      sectionData.forEach((section) =>
        section.Medicines?.forEach((med) => {
          if (med.toLowerCase().includes(q)) resultSet.add(med);
        })
      );
    }

    const results = [...resultSet];
    setSuggestions(results);
    setShowSuggestions(results.length > 0);

    // For company queries, always run a normalized substring match against stockist items
    if (filterType === "company") {
      const norm = (s) =>
        String(s || "")
          .toLowerCase()
          .trim();
      if (q) {
        const matches = sectionData.filter((section) =>
          (section.items || []).some((it) => norm(it).includes(q))
        );
        setSelectedStockists(matches);
        setShowAllResults(false);
        // keep suggestions visible if any
        setShowSuggestions(results.length > 0);
        setIsLoading(false);
      }
    }
  }, [searchQuery, filterType, sectionData]);

  const handleSuggestionClick = (suggestion) => {
    setIsLoading(true);
    setSearchQuery(suggestion);
    setShowSuggestions(false);

    setTimeout(() => {
      let stockists = [];
      if (filterType === "stockist") {
        stockists = sectionData.filter(
          (section) => section.title === suggestion
        );
      } else if (filterType === "company") {
        const norm = (s) =>
          String(s || "")
            .toLowerCase()
            .trim();
        // suggestion is normalized; find stockists whose items contain a matching normalized name
        stockists = sectionData.filter((section) =>
          (section.items || []).some((it) => norm(it) === suggestion)
        );
      } else if (filterType === "medicine") {
        stockists = sectionData.filter(
          (section) =>
            section.Medicines && section.Medicines.includes(suggestion)
        );
      }
      setSelectedStockists(stockists);
      setShowAllResults(false);
      setIsLoading(false);
    }, 300);
  };

  const handleSearchChange = (text) => {
    setSearchQuery(text);
    if (text === "") {
      setShowAllResults(true);
      const allItems = getAllItems(filterType);
      if (filterType === "stockist") {
        setSelectedStockists(sectionData);
      } else if (filterType === "company") {
        const companyStockists = [];
        const norm = (s) =>
          String(s || "")
            .toLowerCase()
            .trim();
        allItems.forEach((company) => {
          const stockists = sectionData.filter((section) =>
            (section.items || []).some((it) => norm(it) === company)
          );
          companyStockists.push(...stockists);
        });
        setSelectedStockists([...new Set(companyStockists)]);
      } else if (filterType === "medicine") {
        const medicineStockists = [];
        allItems.forEach((medicine) => {
          const stockists = sectionData.filter(
            (section) =>
              section.Medicines && section.Medicines.includes(medicine)
          );
          medicineStockists.push(...stockists);
        });
        setSelectedStockists([...new Set(medicineStockists)]);
      }
    }
  };

  const clearResults = () => {
    setSearchQuery("");
    setSelectedStockists([]);
    setShowSuggestions(false);
    setShowAllResults(false);
  };

  // health-themed filter options
  const filterOptions = [
    { value: "medicine", label: "Medicine", icon: "💊" },
    { value: "company", label: "Company", icon: "🏥" },
    { value: "stockist", label: "Supplier", icon: "⚕️" },
  ];

  // health-themed nav links
  const navLinks = [
    { label: "Home", icon: "🏠" },
    { label: "Health Info", icon: "🩺" },
    { label: "Contact", icon: "📞" },
  ];

  // initialize to company on mount
  useEffect(() => handleFilterTypeChange("company"), []); // eslint-disable-line

  // ensure selectedStockists is populated when sectionData changes
  useEffect(() => {
    if (!sectionData || sectionData.length === 0) return;
    if (selectedStockists && selectedStockists.length > 0) return;

    const allItems = getAllItems(filterType);
    if (filterType === "stockist") {
      setSelectedStockists(sectionData);
    } else if (filterType === "company") {
      const companyStockists = [];
      const norm = (s) =>
        String(s || "")
          .toLowerCase()
          .trim();
      allItems.forEach((company) => {
        const stockists = sectionData.filter((section) =>
          (section.items || []).some((it) => norm(it) === company)
        );
        companyStockists.push(...stockists);
      });
      setSelectedStockists([...new Set(companyStockists)]);
    } else if (filterType === "medicine") {
      const medicineStockists = [];
      allItems.forEach((medicine) => {
        const stockists = sectionData.filter(
          (section) => section.Medicines && section.Medicines.includes(medicine)
        );
        medicineStockists.push(...stockists);
      });
      setSelectedStockists([...new Set(medicineStockists)]);
    }
    setShowAllResults(true);
    // eslint-disable-next-line
  }, [sectionData]);

  // get health-themed icon for items
  const getHealthIcon = (item) => {
    const healthIcons = {
      cardiovascular: "❤️",
      diabetes: "🩺",
      pain: "💊",
      mental: "🧠",
      pediatric: "👶",
      emergency: "🚨",
      chronic: "⚕️",
      preventive: "🛡️",
      oncology: "🎗️",
      respiratory: "🫁",
      dermatology: "🧴",
      orthopedic: "🦴",
      pharmacy: "💊",
      hospital: "🏥",
      clinic: "🏥",
      medical: "⚕️",
      health: "🩺",
      care: "💊",
      medicine: "💉",
      drug: "💊",
      pharma: "💊",
      therapeutic: "🩹",
      surgical: "🔬",
      diagnostic: "🔬",
      laboratory: "🧪",
      radiology: "📷",
      nutrition: "🍎",
      wellness: "🌱",
      fitness: "💪",
      rehabilitation: "🏃‍♂️",
    };

    const itemLower = String(item).toLowerCase();
    for (const [key, icon] of Object.entries(healthIcons)) {
      if (itemLower.includes(key)) {
        return icon;
      }
    }
    return "💊"; // default health icon
  };

  // render enhanced stockist card with micro-interactions
  const renderStockistCard = (item, idx) => (
    <div
      key={item._id || idx}
      className="group relative bg-white/80 backdrop-blur-sm rounded-3xl p-6 mb-6 shadow-lg border border-slate-200/50 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 overflow-hidden"
    >
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-50/50 via-blue-50/30 to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-5">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                <span className="text-white font-bold">
                  {item.title?.charAt(0)}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 group-hover:text-blue-700 transition-colors duration-300">
                  {item.title}
                </h3>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-emerald-600 font-semibold">
                    VERIFIED
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-3 group/contact hover:bg-cyan-50 rounded-xl p-2 transition-all duration-200">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center justify-center shadow-md">
                  <span className="text-white text-sm">📞</span>
                </div>
                <span className="text-slate-700 font-medium group-hover/contact:text-cyan-700">
                  {item.phone}
                </span>
              </div>
              <div className="flex items-start gap-3 group/address hover:bg-slate-50 rounded-xl p-2 transition-all duration-200">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-slate-400 to-slate-500 flex items-center justify-center shadow-md">
                  <span className="text-white text-sm">📍</span>
                </div>
                <span className="text-slate-600 flex-1 group-hover/address:text-slate-800">
                  {item.address}
                </span>
              </div>
            </div>
          </div>

          {/* Pulse indicator */}
          <div className="relative">
            <div className="w-4 h-4 bg-emerald-400 rounded-full shadow-lg"></div>
            <div className="absolute inset-0 w-4 h-4 bg-emerald-400 rounded-full animate-ping opacity-75"></div>
          </div>
        </div>

        {filterType === "company" && item.items && (
          <div className="mb-5">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 flex items-center justify-center mr-3 shadow-lg">
                <span className="text-white">🏥</span>
              </div>
              <span className="font-bold text-slate-800">
                Healthcare Partners:
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {item.items.map((company, i) => {
                const matched =
                  searchQuery &&
                  company.toLowerCase().includes(searchQuery.toLowerCase());
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                      matched
                        ? "bg-gradient-to-r from-cyan-100 to-blue-100 border-2 border-cyan-400 text-cyan-800 shadow-lg scale-105"
                        : "bg-gradient-to-r from-slate-50 to-slate-100 text-slate-700 hover:shadow-md hover:scale-105"
                    }`}
                  >
                    <span className="text-lg">{getHealthIcon(company)}</span>
                    <span>{company}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {filterType === "medicine" && item.Medicines && (
          <div className="mb-5">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-emerald-400 to-green-500 flex items-center justify-center mr-3 shadow-lg">
                <span className="text-white">💊</span>
              </div>
              <span className="font-bold text-slate-800">
                Available Medicines:
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {item.Medicines.map((med, i) => {
                const matched =
                  searchQuery &&
                  med.toLowerCase().includes(searchQuery.toLowerCase());
                return (
                  <div
                    key={i}
                    className={`relative flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-300 ${
                      matched
                        ? "bg-gradient-to-r from-emerald-100 to-green-100 border-2 border-emerald-400 text-emerald-800 shadow-lg scale-105"
                        : "bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 hover:shadow-md hover:scale-105"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-emerald-400 to-green-500 flex items-center justify-center shadow-md">
                      <span className="text-white text-lg">💊</span>
                    </div>
                    <span className="flex-1">{med}</span>
                    {matched && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {filterType === "stockist" && (
          <div className="space-y-5">
            {item.items && (
              <div>
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 flex items-center justify-center mr-3 shadow-lg">
                    <span className="text-white">🏥</span>
                  </div>
                  <span className="font-bold text-slate-800">
                    Healthcare Partners:
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {item.items.map((company, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-slate-50 to-slate-100 text-slate-700 hover:shadow-md hover:scale-105 transition-all duration-300"
                    >
                      <span className="text-lg">{getHealthIcon(company)}</span>
                      <span>{company}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {item.Medicines && (
              <div>
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-emerald-400 to-green-500 flex items-center justify-center mr-3 shadow-lg">
                    <span className="text-white">💊</span>
                  </div>
                  <span className="font-bold text-slate-800">
                    Medicine Catalog:
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {item.Medicines.map((med, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 hover:shadow-md hover:scale-105 transition-all duration-300"
                    >
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-emerald-400 to-green-500 flex items-center justify-center shadow-md">
                        <span className="text-white text-lg">💊</span>
                      </div>
                      <span className="flex-1">{med}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Interactive bottom bar */}
        <div className="mt-6 pt-4 border-t border-slate-200/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <span>Live inventory</span>
            </div>
            <button className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
              Contact Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-6">
        {/* Enhanced Header with floating effects */}
        <div className="flex items-center justify-between py-8">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-24 h-10 flex items-center justify-center shadow-xl">
                  <Logo />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 via-blue-700 to-cyan-600 bg-clip-text text-transparent">
                  Meditrap
                </h1>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>

                  <div className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full font-semibold">
                    LIVE
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMenuOpen(true)}
              className="w-12 h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center border border-slate-200 hover:shadow-xl hover:scale-105 transition-all duration-200"
              aria-label="open menu"
            >
              <Icon>☰</Icon>
            </button>
          </div>
        </div>

        {/* Mobile menu modal */}
        {isMenuOpen && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-3xl p-6 w-full max-w-md mx-4 max-h-[80vh] overflow-auto">
              <div className="flex justify-end">
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 rounded-2xl bg-slate-100"
                  aria-label="close menu"
                >
                  <Icon>✖</Icon>
                </button>
              </div>

              <nav className="mt-4 space-y-2">
                {navLinks.map((link, i) => (
                  <button
                    key={i}
                    onClick={() => setIsMenuOpen(false)}
                    className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-50 hover:bg-slate-100"
                  >
                    <span className="text-lg">{link.icon}</span>
                    <span className="font-medium text-slate-700">
                      {link.label}
                    </span>
                  </button>
                ))}
              </nav>

              <div className="mt-6 pt-4 border-t border-slate-100">
                {userToken ? (
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      navigation.navigate("profile");
                    }}
                    className="w-full flex items-center gap-3 justify-center px-4 py-3 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg"
                  >
                    <Icon>👤</Icon>
                    <span className="font-semibold">Profile</span>
                  </button>
                ) : (
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        navigation.navigate("login");
                      }}
                      className="w-full flex items-center gap-3 justify-center px-4 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg"
                    >
                      <Icon>🔐</Icon>
                      <span className="font-semibold">Login</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        navigation.navigate("signup");
                      }}
                      className="w-full flex items-center gap-3 justify-center px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg"
                    >
                      <Icon>👤➕</Icon>
                      <span className="font-semibold">Sign Up</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Search section */}
        <div className="mt-6 bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 bg-slate-50 rounded-2xl px-4 py-4 border border-slate-200">
                <div className="w-6 h-6 rounded-full bg-cyan-100 flex items-center justify-center">
                  <span className="text-cyan-600 text-sm">🔍</span>
                </div>
                <input
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  className="flex-1 bg-transparent outline-none text-slate-800 placeholder-slate-500"
                  placeholder={`Search for ${filterType}...`}
                />
                {searchQuery && (
                  <button
                    onClick={clearResults}
                    className="p-1 rounded-lg hover:bg-slate-200"
                  >
                    <Icon>✖</Icon>
                  </button>
                )}
              </div>
            </div>

            <div>
              <button
                onClick={() => setShowFilterModal(true)}
                className="flex items-center gap-3 bg-slate-50 px-4 py-4 rounded-2xl border border-slate-200 hover:bg-slate-100"
              >
                <span className="text-lg">
                  {filterOptions.find((opt) => opt.value === filterType)?.icon}
                </span>
                <span className="font-medium text-slate-700">
                  {filterOptions.find((opt) => opt.value === filterType)?.label}
                </span>
                <span className="text-sm text-slate-500">▼</span>
              </button>
            </div>
          </div>

          {/* Filter modal */}
          {showFilterModal && (
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
              <div
                className="bg-white rounded-3xl p-6 w-full max-w-md mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-bold text-center mb-4 text-slate-800">
                  Select Search Category
                </h3>
                <div className="space-y-2">
                  {filterOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleFilterTypeChange(opt.value)}
                      className={`w-full text-left px-4 py-4 rounded-2xl ${
                        filterType === opt.value
                          ? "bg-cyan-100 border-2 border-cyan-300"
                          : "bg-slate-50 hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{opt.icon}</span>
                        <span
                          className={`font-medium ${
                            filterType === opt.value
                              ? "text-cyan-800"
                              : "text-slate-700"
                          }`}
                        >
                          {opt.label}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="mt-6 text-center">
                  <button
                    onClick={() => setShowFilterModal(false)}
                    className="px-6 py-2 rounded-2xl bg-slate-200 text-slate-700 hover:bg-slate-300"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="mt-4 bg-white border border-slate-200 rounded-2xl shadow-lg max-h-72 overflow-auto">
              <div className="px-4 py-3 text-sm text-slate-500 border-b border-slate-100 bg-slate-50 rounded-t-2xl">
                Click on any suggestion to see detailed results
              </div>
              <div className="divide-y divide-slate-100">
                {suggestions.map((sug, i) => {
                  let phone = null;
                  let additionalInfo = "";

                  if (filterType === "stockist") {
                    const stockist = sectionData.find(
                      (sec) => sec.title === sug
                    );
                    phone = stockist ? stockist.phone : null;
                    additionalInfo = stockist
                      ? `${stockist.items?.length || 0} companies, ${
                          stockist.Medicines?.length || 0
                        } medicines`
                      : "";
                  } else if (filterType === "company") {
                    const stockists = sectionData.filter(
                      (sec) => sec.items && sec.items.includes(sug)
                    );
                    additionalInfo = `Available at ${
                      stockists.length
                    } supplier${stockists.length > 1 ? "s" : ""}`;
                  } else if (filterType === "medicine") {
                    const stockists = sectionData.filter(
                      (sec) => sec.Medicines && sec.Medicines.includes(sug)
                    );
                    additionalInfo = `Available at ${
                      stockists.length
                    } supplier${stockists.length > 1 ? "s" : ""}`;
                  }

                  return (
                    <button
                      key={i}
                      onClick={() => handleSuggestionClick(sug)}
                      className="w-full text-left px-4 py-4 flex items-center gap-3 hover:bg-slate-50"
                    >
                      <div className="w-10 h-10 rounded-2xl bg-cyan-100 flex items-center justify-center">
                        <span className="text-cyan-600">
                          {filterType === "medicine"
                            ? "💊"
                            : filterType === "company"
                            ? "🏥"
                            : "⚕️"}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-slate-700">{sug}</div>
                        {additionalInfo && (
                          <div className="text-sm text-slate-500">
                            {additionalInfo}
                          </div>
                        )}
                      </div>
                      {phone && (
                        <div className="text-sm text-slate-600 font-semibold">
                          {phone}
                        </div>
                      )}
                      <div className="text-cyan-500 ml-2">→</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Debug / counts */}
        <div className="px-6 pt-4 text-sm text-slate-500">
          Debug: sectionData = {sectionData.length} medical suppliers
        </div>

        {/* Results */}
        {selectedStockists.length > 0 && (
          <div className="px-6 mt-6">
            {isLoading && (
              <div className="flex items-center gap-3 bg-cyan-100 p-4 rounded-2xl mb-4">
                <div className="animate-spin border-2 border-cyan-400 rounded-full w-5 h-5 border-t-transparent" />
                <div className="text-cyan-700 font-medium">
                  Loading results...
                </div>
              </div>
            )}

            {searchQuery && (
              <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-2xl p-6 mb-6 border border-cyan-200">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-100 flex items-center justify-center">
                      <span className="text-2xl text-cyan-600">🔍</span>
                    </div>
                    <div>
                      <div className="font-bold text-cyan-800 text-lg">
                        Search Results for "{searchQuery}"
                      </div>
                      <div className="text-sm text-slate-600">
                        {selectedStockists.length} medical supplier
                        {selectedStockists.length > 1 ? "s" : ""} found
                      </div>
                    </div>
                  </div>
                  <div>
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        handleFilterTypeChange(filterType);
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-2xl font-semibold shadow-lg"
                    >
                      Show All{" "}
                      {filterType === "stockist"
                        ? "Suppliers"
                        : filterType === "company"
                        ? "Companies"
                        : "Medicines"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="mb-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-slate-800">
                  {searchQuery
                    ? `Search Results for "${searchQuery}"`
                    : filterType === "stockist"
                    ? "All Medical Suppliers"
                    : filterType === "company"
                    ? "All Healthcare Companies"
                    : "All Medicines"}
                </h2>
                <div className="text-sm text-slate-500 mt-2">
                  {searchQuery
                    ? `Found ${selectedStockists.length} result${
                        selectedStockists.length > 1 ? "s" : ""
                      }`
                    : `Showing ${selectedStockists.length} medical suppliers`}
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <button
                  onClick={clearResults}
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded-2xl hover:bg-slate-300"
                >
                  Clear Results
                </button>
              </div>
            </div>

            <div>
              {selectedStockists.map((s, i) => renderStockistCard(s, i))}
            </div>
          </div>
        )}

        {/* Quick stats */}
        <div className="px-6 mt-8 pb-12"></div>
      </div>
    </div>
  );
}
