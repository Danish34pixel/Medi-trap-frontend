import React, { useEffect, useState } from "react";
import API_BASE from "./config/api";
import {
  medicineReferencesStockist,
  medicineDisplayName,
  nameMatchesStockistItems,
} from "./utils/normalizeMatching";
import { useNavigate } from "react-router-dom";

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
    const token = localStorage.getItem("token");
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

  // small UI datasets
  const filterOptions = [
    { value: "medicine", label: "Medicine", icon: "💊" },
    { value: "company", label: "Company", icon: "🏢" },
    { value: "stockist", label: "Stockist", icon: "🏪" },
  ];

  const navLinks = [
    { label: "Home", icon: "🏠" },
    { label: "About", icon: "ℹ️" },
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

  // render a stockist card
  const renderStockistCard = (item, idx) => (
    <div
      key={item._id || idx}
      className="bg-white rounded-xl p-5 mb-4 shadow-md border border-sky-100"
    >
      <h3 className="text-lg font-bold text-sky-700 mb-2">{item.title}</h3>

      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <Icon>📞</Icon>
          <span className="font-semibold text-slate-700 mr-1">Phone:</span>
          <span className="text-sky-600">{item.phone}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-base">📍</span>
          <span className="font-semibold text-slate-700 mr-1">Address:</span>
          <span className="text-slate-600">{item.address}</span>
        </div>
      </div>

      {filterType === "company" && item.items && (
        <div className="mb-3">
          <div className="flex items-center mb-2">
            <span className="mr-2">🏢</span>
            <span className="font-semibold text-slate-700">Companies:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {item.items.map((company, i) => {
              const matched =
                searchQuery &&
                company.toLowerCase().includes(searchQuery.toLowerCase());
              return (
                <span
                  key={i}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    matched
                      ? "bg-sky-200 border-2 border-sky-500 text-sky-800"
                      : "bg-sky-50 text-sky-700"
                  }`}
                >
                  {company}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {filterType === "medicine" && item.Medicines && (
        <div className="mb-3">
          <div className="flex items-center mb-2">
            <span className="mr-2">💊</span>
            <span className="font-semibold text-slate-700">Medicines:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {item.Medicines.map((med, i) => {
              const matched =
                searchQuery &&
                med.toLowerCase().includes(searchQuery.toLowerCase());
              return (
                <span
                  key={i}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    matched
                      ? "bg-green-200 border-2 border-green-500 text-green-800"
                      : "bg-green-50 text-green-700"
                  }`}
                >
                  {med}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {filterType === "stockist" && (
        <div className="mt-2">
          {item.items && (
            <>
              <div className="flex items-center mb-2">
                <span className="mr-2">🏢</span>
                <span className="font-semibold text-slate-700">Companies:</span>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {item.items.map((company, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-full text-sm font-medium bg-sky-50 text-sky-700"
                  >
                    {company}
                  </span>
                ))}
              </div>
            </>
          )}

          {item.Medicines && (
            <>
              <div className="flex items-center mb-2">
                <span className="mr-2">💊</span>
                <span className="font-semibold text-slate-700">Medicines:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {item.Medicines.map((med, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-full text-sm font-medium bg-green-50 text-green-700"
                  >
                    {med}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-sky-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between py-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-sky-100 flex items-center justify-center shadow">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                  <span className="text-xl">🏥</span>
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-sky-700">MedTrap</h1>
                <p className="text-sm text-slate-500 -mt-1">
                  Medical Solutions
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMenuOpen(true)}
              className="w-12 h-12 bg-white rounded-full shadow flex items-center justify-center"
              aria-label="open menu"
            >
              <Icon>☰</Icon>
            </button>
            <button
              onClick={() => navigation.navigate("/demand")}
              className="ml-2 px-3 py-2 bg-emerald-500 text-white rounded-md"
              aria-label="demand"
            >
              Demand
            </button>
          </div>
        </div>

        {/* Mobile menu modal */}
        {isMenuOpen && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 max-h-[80vh] overflow-auto">
              <div className="flex justify-end">
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 rounded-md"
                  aria-label="close menu"
                >
                  <Icon>✖</Icon>
                </button>
              </div>

              <nav className="mt-2 space-y-2">
                {navLinks.map((link, i) => (
                  <button
                    key={i}
                    onClick={() => setIsMenuOpen(false)}
                    className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-50"
                  >
                    <span>{link.icon}</span>
                    <span className="font-medium text-slate-700">
                      {link.label}
                    </span>
                  </button>
                ))}
              </nav>

              <div className="mt-4 pt-4 border-t border-slate-100">
                {userToken ? (
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      navigation.navigate("profile");
                    }}
                    className="w-full flex items-center gap-3 justify-center px-4 py-2 rounded-lg bg-violet-600 text-white"
                  >
                    <Icon>👤</Icon>
                    <span>Profile</span>
                  </button>
                ) : (
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        navigation.navigate("login");
                      }}
                      className="w-full flex items-center gap-3 justify-center px-4 py-2 rounded-lg bg-sky-500 text-white"
                    >
                      <Icon>🔐</Icon>
                      <span>Login</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        navigation.navigate("signup");
                      }}
                      className="w-full flex items-center gap-3 justify-center px-4 py-2 rounded-lg bg-emerald-500 text-white"
                    >
                      <Icon>👤➕</Icon>
                      <span>Sign Up</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Search section */}
        <div className="mt-4 bg-white rounded-2xl p-5 shadow-sm border border-sky-100">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-3 bg-sky-100 rounded-lg px-4 py-3 border border-sky-200">
                <Icon>🔍</Icon>
                <input
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  className="flex-1 bg-transparent outline-none text-slate-800"
                  placeholder={`Search for ${filterType}...`}
                />
                {searchQuery && (
                  <button onClick={clearResults} className="p-1 rounded">
                    <Icon>✖</Icon>
                  </button>
                )}
              </div>
            </div>

            <div>
              <button
                onClick={() => setShowFilterModal(true)}
                className="flex items-center gap-2 bg-sky-50 px-4 py-3 rounded-lg border border-sky-200"
              >
                <span>
                  {filterOptions.find((opt) => opt.value === filterType)?.icon}
                </span>
                <span className="font-medium">
                  {filterOptions.find((opt) => opt.value === filterType)?.label}
                </span>
                <span className="text-sm">▼</span>
              </button>
            </div>
          </div>

          {/* Filter modal */}
          {showFilterModal && (
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
              <div
                className="bg-white rounded-lg p-5 w-full max-w-md mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-bold text-center mb-3">
                  Select Filter Type
                </h3>
                <div className="space-y-2">
                  {filterOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleFilterTypeChange(opt.value)}
                      className={`w-full text-left px-4 py-3 rounded-lg ${
                        filterType === opt.value
                          ? "bg-sky-100 border border-sky-300"
                          : "bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span>{opt.icon}</span>
                        <span
                          className={`${
                            filterType === opt.value
                              ? "font-semibold text-sky-700"
                              : "text-slate-700"
                          }`}
                        >
                          {opt.label}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="mt-4 text-center">
                  <button
                    onClick={() => setShowFilterModal(false)}
                    className="px-4 py-2 rounded-md bg-slate-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="mt-3 bg-white border border-slate-100 rounded-lg shadow max-h-72 overflow-auto">
              <div className="px-4 py-2 text-sm text-slate-500 border-b border-slate-100">
                Click on any suggestion to see detailed results
              </div>
              <div className="divide-y">
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
                    } stockist${stockists.length > 1 ? "s" : ""}`;
                  } else if (filterType === "medicine") {
                    const stockists = sectionData.filter(
                      (sec) => sec.Medicines && sec.Medicines.includes(sug)
                    );
                    additionalInfo = `Available at ${
                      stockists.length
                    } stockist${stockists.length > 1 ? "s" : ""}`;
                  }

                  return (
                    <button
                      key={i}
                      onClick={() => handleSuggestionClick(sug)}
                      className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-50"
                    >
                      <div className="text-xl">
                        {filterType === "medicine"
                          ? "💊"
                          : filterType === "company"
                          ? "🏢"
                          : "🏪"}
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
                      <div className="text-sky-500 ml-2">→</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Debug / counts */}
        <div className="px-4 pt-4 text-sm text-slate-500">
          Debug: sectionData = {sectionData.length} stockists
        </div>

        {/* Results */}
        {selectedStockists.length > 0 && (
          <div className="px-4 mt-4">
            {isLoading && (
              <div className="flex items-center gap-3 bg-sky-100 p-3 rounded-lg mb-4">
                <div className="animate-spin border-2 border-sky-400 rounded-full w-4 h-4" />
                <div className="text-sky-700 font-medium">
                  Loading results...
                </div>
              </div>
            )}

            {searchQuery && (
              <div className="bg-sky-100 rounded-lg p-4 mb-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">🔍</div>
                  <div>
                    <div className="font-semibold text-sky-700">
                      Search Results for "{searchQuery}"
                    </div>
                    <div className="text-sm text-slate-600">
                      {selectedStockists.length} result
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
                    className="px-3 py-2 bg-sky-600 text-white rounded-md"
                  >
                    Show All{" "}
                    {filterType === "stockist"
                      ? "Stockists"
                      : filterType === "company"
                      ? "Companies"
                      : "Medicines"}
                  </button>
                </div>
              </div>
            )}

            <div className="mb-4">
              <div className="text-center">
                <h2 className="text-xl font-bold text-slate-800">
                  {searchQuery
                    ? `Search Results for "${searchQuery}"`
                    : filterType === "stockist"
                    ? "All Stockists"
                    : filterType === "company"
                    ? "All Companies"
                    : "All Medicines"}
                </h2>
                <div className="text-sm text-slate-500 mt-1">
                  {searchQuery
                    ? `Found ${selectedStockists.length} result${
                        selectedStockists.length > 1 ? "s" : ""
                      }`
                    : `Showing ${selectedStockists.length} stockists`}
                </div>
              </div>
              <div className="flex justify-end mt-3">
                <button
                  onClick={clearResults}
                  className="px-3 py-2 bg-slate-600 text-white rounded-md"
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
        <div className="px-4 mt-6 pb-10">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-4 bg-white rounded-xl p-5 shadow">
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                🏥
              </div>
              <div>
                <div className="font-semibold text-slate-800">Stockists</div>
                <div className="text-sm text-slate-500">
                  Find verified stockists
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-white rounded-xl p-5 shadow">
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                💊
              </div>
              <div>
                <div className="font-semibold text-slate-800">Medicines</div>
                <div className="text-sm text-slate-500">
                  Search all medicines
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-white rounded-xl p-5 shadow">
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                🏢
              </div>
              <div>
                <div className="font-semibold text-slate-800">Companies</div>
                <div className="text-sm text-slate-500">
                  Browse pharma companies
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
