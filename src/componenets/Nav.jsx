import React, { useEffect, useState, useRef } from "react";
import API_BASE, { apiUrl } from "./config/api";
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
  const [openCardId, setOpenCardId] = useState(null);
  const cardRefs = useRef({});
  const [navOpacity, setNavOpacity] = useState(1);
  const scrollTick = useRef(false);

  useEffect(() => {
    const onScroll = () => {
      if (scrollTick.current) return;
      scrollTick.current = true;
      window.requestAnimationFrame(() => {
        try {
          const y = window.scrollY || window.pageYOffset || 0;
          // fade over first 300px of scroll but never fully disappear
          const val = Math.max(0.6, Math.min(1, 1 - y / 300));
          setNavOpacity(val);
        } catch (e) {}
        scrollTick.current = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // fetch stockists, medicines, companies and map into sectionData
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [resStockist, resMedicine, resCompany] = await Promise.all([
          fetch(apiUrl(`/api/stockist`)),
          fetch(apiUrl(`/api/medicine`)),
          fetch(apiUrl(`/api/company`)),
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

            let companiesForStockist = companies
              .filter((c) => companyIds.has(String(c._id)))
              .map((c) => (c.name ? c.name : c.shortName || ""))
              .filter(Boolean);

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

            const items = Array.from(
              new Set([
                ...(explicitItems || []),
                ...(companiesForStockist || []),
              ])
            );

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
                  } catch (e) {}
                  return "";
                })
                .filter(Boolean);
            } else {
              meds = (medsForStockist || []).slice();
            }

            const deepScanCompanyReferences = (obj, sid) => {
              if (!obj) return false;
              const target = String(sid);
              const seen = new Set();

              const walk = (value) => {
                if (value == null) return false;
                if (seen.has(value)) return false;
                if (typeof value === "string" || typeof value === "number") {
                  if (String(value) === target) return true;
                  return false;
                }
                if (Array.isArray(value)) {
                  for (const item of value) if (walk(item)) return true;
                  return false;
                }
                if (typeof value === "object") {
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
        }
      } catch (err) {
        console.warn("Nav: failed to load stockists", err);
      }
    })();
    return () => (mounted = false);
  }, []);

  useEffect(() => {
    const token = getCookie("token");
    setUserToken(token);
  }, []);

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

  const filterOptions = [
    { value: "medicine", label: "Medicine", icon: "💊" },
    { value: "company", label: "Company", icon: "🏥" },
    { value: "stockist", label: "Supplier", icon: "⚕️" },
  ];

  const navLinks = [
    { label: "Home", icon: "🏠", path: "/" },
    { label: "Demand", icon: "�", path: "/demand" },
    { label: "Saved", icon: "�", path: "/saved" },
    { label: "Profile", icon: "👤", path: "/profile" },
  ];

  useEffect(() => handleFilterTypeChange("company"), []); // eslint-disable-line

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
    return "💊";
  };

  const handleToggleCard = (itemId) => {
    setOpenCardId(openCardId === itemId ? null : itemId);
  };

  const renderStockistCard = (item, idx) => (
    <div
      key={item._id || idx}
      ref={(el) => {
        if (el && item?._id) cardRefs.current[item._id] = el;
      }}
      className={`bg-white rounded-2xl shadow-lg border border-slate-100 p-4 transition-all duration-300 mb-5 ${openCardId === item._id ? 'ring-2 ring-cyan-400' : 'shadow-md'}`}
    >
      {/* --- Card Header --- */}
      <div className="flex items-start gap-4 mb-4">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center shadow-md shadow-cyan-500/20">
          <span className="text-white font-bold text-2xl">{item.title?.charAt(0)}</span>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-slate-800">{item.title}</h3>
          <p className="text-sm text-slate-500">{item.address}</p>
        </div>
        <button
            onClick={() => {
              try {
                navigation.navigate(`/stockist/${item._id}`);
              } catch (e) {
                window.location.href = `/stockist/${item._id}`;
              }
            }}
            className="text-cyan-500 font-bold text-2xl h-8 w-8 flex items-center justify-center rounded-full hover:bg-cyan-50"
        >
          ›
        </button>
      </div>

      {/* --- Medicine & Company Lists --- */}
      {filterType === "medicine" && item.Medicines && (
        <div className="mb-4">
          <h4 className="text-xs uppercase font-semibold text-slate-500 mb-2">Available Medicines</h4>
          <div className="flex flex-wrap gap-2">
            {item.Medicines.map((med, i) => {
              const isMatched = searchQuery && med.toLowerCase().includes(searchQuery.toLowerCase());
              return (
                <div
                  key={i}
                  className={`px-3 py-1 rounded-full text-sm font-semibold transition-all ${
                    isMatched
                      ? 'bg-orange-500 text-white shadow-md'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {med}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {filterType === "company" && item.items && (
        <div className="mb-4">
          <h4 className="text-xs uppercase font-semibold text-slate-500 mb-2">Partner Companies</h4>
          <div className="flex flex-wrap gap-2">
            {item.items.map((company, i) => {
              const isMatched = searchQuery && company.toLowerCase().includes(searchQuery.toLowerCase());
              return (
                <div
                  key={i}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold transition-all ${
                    isMatched
                      ? 'bg-orange-500 text-white shadow-md'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  <span>{getHealthIcon(company)}</span>
                  <span>{company}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
       {filterType === "stockist" && (
        <div className="space-y-4 mb-4">
          {item.items && (
            <div>
              <h4 className="text-xs uppercase font-semibold text-slate-500 mb-2">Partner Companies</h4>
                <div className="flex flex-wrap gap-2">
                  {item.items.map((company, i) => (
                    <div key={i} className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-slate-100 text-slate-700">
                      <span>{getHealthIcon(company)}</span>
                      <span>{company}</span>
                    </div>
                  ))}
                </div>
            </div>
          )}
          {item.Medicines && (
            <div>
              <h4 className="text-xs uppercase font-semibold text-slate-500 mb-2">Medicine Catalog</h4>
                <div className="flex flex-wrap gap-2">
                  {item.Medicines.map((med, i) => (
                    <div key={i} className="px-3 py-1 rounded-full text-sm font-semibold bg-slate-100 text-slate-700">
                      {med}
                    </div>
                  ))}
                </div>
            </div>
          )}
        </div>
      )}


      {/* --- Card Footer & Actions --- */}
      <div className="border-t border-slate-200 pt-3">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-2">
             <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
             <span className="text-xs text-green-600 font-bold">Verified</span>
           </div>
            <button
                onClick={() => handleToggleCard(item._id)}
                className="bg-cyan-500 text-white font-bold text-sm px-5 py-2.5 rounded-lg shadow-md shadow-cyan-500/20 hover:bg-cyan-600 transition-all"
            >
                {openCardId === item._id ? "Hide Contact" : "Contact Now"}
            </button>
        </div>

        {/* --- Render Contact Card --- */}
        {renderContactCard(item)}
      </div>
    </div>
  );

  const renderContactCard = (item) => {
    if (openCardId !== item._id) return null;
    
    return (
      <div className="bg-white p-4 rounded-2xl shadow-md border border-slate-100">
      <div className="flex items-center gap-4">
        {/* Left side: Contact Information */}
        <div className="flex-1">
          <div className="text-xs font-bold uppercase text-slate-500 mb-1">
            Contact Details
          </div>
          <h4 className="text-lg font-bold text-slate-800">
            {item.title}
          </h4>
          <p className="text-sm text-slate-500 mt-1">
            {item.address}
          </p>
          <p className="text-sm font-semibold text-cyan-600 mt-1">
            {item.phone}
          </p>
        </div>

        {/* Right side: Action Buttons */}
        <div className="flex flex-col gap-2">
          <a
            href={`tel:${item.phone || ""}`}
            className="w-12 h-12 bg-cyan-500 text-white rounded-xl font-bold text-2xl flex items-center justify-center shadow-lg shadow-cyan-500/20 hover:bg-cyan-600 transform hover:-translate-y-0.5 transition-all"
            aria-label="Call"
          >
            <span>📞</span>
          </a>
          
         
        </div>
      </div>
    </div>
    );
  };

  return (
    <div
      className="bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50"
      style={{ opacity: navOpacity, transition: "opacity 300ms ease-out" }}
    >
      <div className="max-w-4xl mx-auto px-6">
        <div className="flex items-center justify-between py-8 ml-10">
          <div className="flex  ">
            <div className="relative">
              <div className="w-32  flex items-center justify-center">
                <Logo className="h-15 w-15 " />
              <img className="mb-3" src="logo.png" alt="" />
              </div>
            </div>
            <div>
              
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMenuOpen(true)}
              className="w-12 h-12 bg-white rounded-2xl shadow-xl flex items-center justify-center border-2 border-violet-200 hover:shadow-2xl hover:scale-110 transition-all duration-200"
              aria-label="open menu"
            >
              <Icon>☰</Icon>
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-8 w-full max-w-md mx-4 max-h-[85vh] overflow-auto shadow-2xl border-2 border-violet-200">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-gray-900">Menu</h2>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-3 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 hover:shadow-lg transition-all"
                  aria-label="close menu"
                >
                  <Icon>✖</Icon>
                </button>
              </div>

              <nav className="space-y-3">
                {navLinks.map((link, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setIsMenuOpen(false);
                      navigation.navigate(link.path);
                    }}
                    className="w-full text-left flex items-center gap-4 px-5 py-4 rounded-2xl bg-gradient-to-r from-violet-50 to-purple-50 hover:from-violet-100 hover:to-purple-100 border-2 border-violet-200 transition-all hover:scale-105 hover:shadow-lg"
                  >
                    <span className="text-2xl">{link.icon}</span>
                    <span className="font-bold text-gray-900 text-lg">
                      {link.label}
                    </span>
                  </button>
                ))}
              </nav>

              <div className="mt-8 pt-6 border-t-2 border-gray-200">
                {userToken ? (
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      navigation.navigate("/profile");
                    }}
                    className="w-full flex items-center gap-3 justify-center px-6 py-4 rounded-2xl bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 text-white shadow-2xl hover:shadow-2xl hover:scale-105 transition-all font-black text-lg"
                  >
                    <Icon>👤</Icon>
                    <span>My Profile</span>
                  </button>
                ) : (
                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        navigation.navigate("/login");
                      }}
                      className="w-full flex items-center gap-3 justify-center px-6 py-4 rounded-2xl bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 text-white shadow-2xl hover:shadow-2xl hover:scale-105 transition-all font-black text-lg"
                    >
                      <Icon>🔐</Icon>
                      <span>Login</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        navigation.navigate("/signup");
                      }}
                      className="w-full flex items-center gap-3 justify-center px-6 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 text-white shadow-2xl hover:shadow-2xl hover:scale-105 transition-all font-black text-lg"
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

        <div className=" bg-white rounded-3xl p-8 shadow-2xl border-2 border-violet-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-4 bg-gradient-to-r from-violet-50 to-purple-50 rounded-2xl px-5 py-4 border-2 border-violet-200">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 flex items-center justify-center shadow-lg">
                  <span className="text-white text-lg">🔍</span>
                </div>
                <input
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  className="flex-1 bg-transparent outline-none text-gray-900 placeholder-gray-500 font-semibold"
                  placeholder={`Search for ${filterType}...`}
                />
                {searchQuery && (
                  <button
                    onClick={clearResults}
                    className="p-2 rounded-xl hover:bg-violet-100 transition-all"
                  >
                    <Icon>✖</Icon>
                  </button>
                )}
              </div>
            </div>

            <div>
              <button
                onClick={() => setShowFilterModal(true)}
                className="flex items-center gap-3 bg-gradient-to-r from-violet-50 to-purple-50 px-6 py-4 rounded-2xl border-2 border-violet-200 hover:from-violet-100 hover:to-purple-100 transition-all hover:scale-105"
              >
                <span className="text-2xl">
                  {filterOptions.find((opt) => opt.value === filterType)?.icon}
                </span>
                <span className="font-bold text-gray-900">
                  {filterOptions.find((opt) => opt.value === filterType)?.label}
                </span>
                <span className="text-sm text-gray-600">▼</span>
              </button>
            </div>
          </div>

          {showFilterModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div
                className="bg-white rounded-3xl p-8 w-full max-w-md mx-4 shadow-2xl border-2 border-violet-200"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-2xl font-black text-center mb-6 text-gray-900">
                  Select Search Category
                </h3>
                <div className="space-y-3">
                  {filterOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleFilterTypeChange(opt.value)}
                      className={`w-full text-left px-6 py-5 rounded-2xl transition-all hover:scale-105 ${
                        filterType === opt.value
                          ? "bg-gradient-to-r from-violet-400 to-purple-400 border-2 border-violet-500 shadow-2xl"
                          : "bg-gradient-to-r from-violet-50 to-purple-50 hover:from-violet-100 hover:to-purple-100 border-2 border-violet-200"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-2xl">{opt.icon}</span>
                        <span
                          className={`font-black text-lg ${
                            filterType === opt.value
                              ? "text-white"
                              : "text-gray-900"
                          }`}
                        >
                          {opt.label}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="mt-8 text-center">
                  <button
                    onClick={() => setShowFilterModal(false)}
                    className="px-8 py-3 rounded-2xl bg-gradient-to-r from-gray-200 to-gray-300 text-gray-800 hover:from-gray-300 hover:to-gray-400 font-bold transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {showSuggestions && suggestions.length > 0 && (
            <div className="mt-6 bg-white border-2 border-violet-200 rounded-2xl shadow-2xl max-h-96 overflow-auto">
              <div className="px-6 py-4 text-sm text-gray-600 border-b-2 border-violet-100 bg-gradient-to-r from-violet-50 to-purple-50 rounded-t-2xl font-bold">
                Click on any suggestion to see detailed results
              </div>
              <div className="divide-y-2 divide-violet-100">
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
                      className="w-full text-left px-6 py-5 flex items-center gap-4 hover:bg-gradient-to-r hover:from-violet-50 hover:to-purple-50 transition-all"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center shadow-lg">
                        <span className="text-white text-xl">
                          {filterType === "medicine"
                            ? "💊"
                            : filterType === "company"
                            ? "🏥"
                            : "⚕️"}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-gray-900 text-base">
                          {sug}
                        </div>
                        {additionalInfo && (
                          <div className="text-sm text-gray-600 font-semibold">
                            {additionalInfo}
                          </div>
                        )}
                      </div>
                      {phone && (
                        <div className="text-sm text-gray-700 font-bold">
                          {phone}
                        </div>
                      )}
                      <div className="text-violet-600 ml-2 text-xl">→</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {selectedStockists.length > 0 && (
          <div className="mt-8">
            {isLoading && (
              <div className="flex items-center gap-4 bg-gradient-to-r from-cyan-100 to-blue-100 p-6 rounded-2xl mb-6 shadow-lg border-2 border-cyan-300">
                <div className="animate-spin border-4 border-cyan-500 rounded-full w-8 h-8 border-t-transparent" />
                <div className="text-cyan-800 font-black text-lg">
                  Loading results...
                </div>
              </div>
            )}

            {searchQuery && (
              <div className="bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 rounded-3xl p-8 mb-8 shadow-2xl border-2 border-violet-500">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-xl">
                      <span className="text-4xl">🔍</span>
                    </div>
                    <div>
                      <div className="font-black text-white text-2xl mb-1">
                        Search Results for "{searchQuery}"
                      </div>
                      <div className="text-sm text-violet-100 font-bold">
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
                      className="px-6 py-3 bg-white text-violet-700 rounded-2xl font-black shadow-xl hover:shadow-2xl hover:scale-110 transition-all"
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

            <div className="mb-8">
              <div className="text-center mb-6">
                <h2 className="text-3xl font-black bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent">
                  {searchQuery
                    ? `Search Results for "${searchQuery}"`
                    : filterType === "stockist"
                    ? "All Medical Suppliers"
                    : filterType === "company"
                    ? "All Healthcare Companies"
                    : "All Medicines"}
                </h2>
                <div className="text-sm text-gray-600 mt-3 font-semibold">
                  {searchQuery
                    ? `Found ${selectedStockists.length} result${
                        selectedStockists.length > 1 ? "s" : ""
                      }`
                    : `Showing ${selectedStockists.length} medical suppliers`}
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={clearResults}
                  className="px-6 py-3 bg-gradient-to-r from-gray-200 to-gray-300 text-gray-800 rounded-2xl hover:from-gray-300 hover:to-gray-400 font-bold transition-all"
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

        <div className="pb-12"></div>
      </div>
    </div>
  );
}
