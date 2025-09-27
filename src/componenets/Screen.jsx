import React, { useEffect, useState } from "react";
import API_BASE from "./config/api";
import {
  medicineReferencesStockist,
  medicineDisplayName,
  nameMatchesStockistItems,
  tokenOverlapScore,
} from "./utils/normalizeMatching";
import { useNavigate, useLocation } from "react-router-dom";

const Screen = ({ navigation: navProp }) => {
  const navigate = (() => {
    try {
      return useNavigate();
    } catch {
      return null;
    }
  })();

  const location = (() => {
    try {
      return useLocation();
    } catch {
      return { key: null };
    }
  })();

  // allow passing a navigation-like prop (backwards-compatible)
  const navigation = navProp || {
    navigate: (path) => {
      if (navigate) navigate(path);
      else window.location.href = path;
    },
    goBack: () => window.history.back(),
  };

  const [selectedSection, setSelectedSection] = useState(null); // index
  const [isAdmin, setIsAdmin] = useState(false);
  const [sectionData, setSectionData] = useState([]);
  const [rawResponses, setRawResponses] = useState({
    medicines: null,
    stockists: null,
    companies: null,
  });
  const [showDebug, setShowDebug] = useState(false);
  const [unmatchedMedicines, setUnmatchedMedicines] = useState([]);

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

        // store raw responses for debugging UI
        setRawResponses({
          medicines: jsonMedicine || null,
          stockists: jsonStockist || null,
          companies: jsonCompany || null,
        });

        // also print a small sample to the console to inspect shapes
        console.warn(
          "Screen DEBUG: medicines sample ->",
          medicines.slice(0, 5)
        );

        if (mounted && jsonStockist && jsonStockist.data) {
          const mapped = jsonStockist.data.map((s) => {
            let medsForStockist = medicines
              .filter((m) => medicineReferencesStockist(m, s._id))
              .map((m) => medicineDisplayName(m))
              .filter(Boolean);

            // Fallback: attempt name-based matching if id-based produced no results
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

            // Companies that are related via medicines/companyIds
            let companiesForStockist = companies
              .filter((c) => companyIds.has(String(c._id)))
              .map((c) => (c.name ? c.name : c.shortName || ""))
              .filter(Boolean);

            // deep scan a company object for any occurrence of the stockist id
            const deepScanCompanyReferences = (obj, sid) => {
              if (!obj) return false;
              const target = String(sid);
              const seen = new Set();

              const walk = (value) => {
                if (value == null) return false;
                if (seen.has(value)) return false;
                if (typeof value === "string" || typeof value === "number") {
                  return String(value) === target;
                }
                if (Array.isArray(value)) {
                  for (const item of value) if (walk(item)) return true;
                  return false;
                }
                if (typeof value === "object") {
                  if (seen.has(value)) return false;
                  seen.add(value);
                  for (const k of Object.keys(value))
                    if (walk(value[k])) return true;
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

            companiesForStockist = Array.from(
              new Set([...companiesForStockist, ...reverseCompanies])
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

            // Build medicines list for the stockist.
            // If the stockist provides a list of medicines by id/object, try to
            // resolve them against the fetched `medicines` array so we show names.
            let meds = [];
            if (Array.isArray(s.medicines) && s.medicines.length > 0) {
              meds = s.medicines
                .map((m) => {
                  // string names are fine
                  if (typeof m === "string") return m;
                  // object with name fields
                  if (m && (m.name || m.brandName))
                    return m.name || m.brandName;
                  // could be an id or an object with _id/id — try to resolve from fetched medicines
                  try {
                    const candidateId = m && (m._id || m.id || m);
                    if (candidateId && medicines && medicines.length > 0) {
                      const found = medicines.find(
                        (md) =>
                          String(md._id) === String(candidateId) ||
                          String(md._id) ===
                            String(
                              candidateId._id || candidateId.id || candidateId
                            )
                      );
                      if (found) return medicineDisplayName(found);
                    }
                  } catch (e) {
                    // ignore resolution errors and fallthrough to empty string
                  }
                  return "";
                })
                .filter(Boolean);
            } else {
              // fallback to previously computed medsForStockist (already names)
              meds = (medsForStockist || []).slice();
            }

            return {
              _id: s._id,
              title: s.name,
              phone: s.phone,
              address: s.address
                ? `${s.address.street || ""}${
                    s.address.city ? ", " + s.address.city : ""
                  }`
                : "",
              image: (s.logo && s.logo.url) || null,
              items,
              Medicines: meds,
            };
          });

          console.warn("Screen: loaded stockists ->", mapped.length);
          setSectionData(mapped);

          // compute unmatched medicines (those that don't match any stockist)
          try {
            const matchesStockist = (m, s) => {
              const name = medicineDisplayName(m) || "";
              // id-based
              if (medicineReferencesStockist(m, s._id)) return true;
              // stronger name-based
              if (nameMatchesStockistItems(name, s)) return true;
              // simple substring check against stockist medicines/items
              const stockistNames = new Set(
                (s.Medicines || s.medicines || s.items || []).map((x) =>
                  String(x).toLowerCase()
                )
              );
              const lname = name.toLowerCase();
              for (const n of stockistNames) {
                if (!n) continue;
                if (n.includes(lname) || lname.includes(n)) return true;
              }
              return false;
            };

            const unmatched = (medicines || []).filter((m) => {
              // if no stockist matches this medicine, include in unmatched
              for (const s of jsonStockist.data) {
                if (matchesStockist(m, s)) return false; // matched
              }
              return true; // unmatched by any stockist
            });

            // attempt auto-assignment for unmatched meds using token overlap
            const autoAssigned = [];
            const remaining = [];
            const THRESHOLD = 1; // minimal overlapping tokens to consider
            for (const m of unmatched) {
              let bestScore = 0;
              let bestStockistIndex = -1;
              jsonStockist.data.forEach((s, idx) => {
                const score = tokenOverlapScore(
                  medicineDisplayName(m) || "",
                  s
                );
                if (score > bestScore) {
                  bestScore = score;
                  bestStockistIndex = idx;
                }
              });
              if (bestScore >= THRESHOLD && bestStockistIndex >= 0) {
                autoAssigned.push({
                  medicine: medicineDisplayName(m),
                  stockistIndex: bestStockistIndex,
                  score: bestScore,
                });
              } else {
                remaining.push(m);
              }
            }

            // inject auto-assigned medicines into mapped stockists (client-side only)
            for (const a of autoAssigned) {
              const sIndex = a.stockistIndex;
              if (mapped[sIndex]) {
                mapped[sIndex].Medicines = mapped[sIndex].Medicines || [];
                if (!mapped[sIndex].Medicines.includes(a.medicine))
                  mapped[sIndex].Medicines.push(a.medicine);
              }
            }

            setUnmatchedMedicines(remaining.slice(0, 50)); // store a trimmed list
            console.warn(
              "Screen DEBUG: autoAssigned ->",
              autoAssigned.slice(0, 10)
            );
          } catch (e) {
            console.warn("Screen: error computing unmatched medicines", e);
          }
        }
      } catch (err) {
        console.warn("Screen: failed to load stockists", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [location && location.key]);

  // check admin from localStorage
  useEffect(() => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) return;
      const user = JSON.parse(userStr);
      setIsAdmin(user && user.role === "admin");
    } catch (err) {
      console.warn("Screen: error reading user from storage", err);
    }
  }, []);

  const generateHealthColor = (index) => {
    const colors = [
      ["#06B6D4", "#0891B2"], // cyan - primary health color
      ["#10B981", "#059669"], // emerald - wellness
      ["#8B5CF6", "#7C3AED"], // violet - medical
      ["#F59E0B", "#D97706"], // amber - care
      ["#EF4444", "#DC2626"], // red - emergency
      ["#3B82F6", "#2563EB"], // blue - trust
      ["#EC4899", "#DB2777"], // pink - community
    ];
    return colors[index % colors.length];
  };

  const makePhoneCall = (phoneNumber) => {
    if (!phoneNumber) return;
    window.location.href = `tel:${phoneNumber}`;
  };

  const getHealthIcon = (item) => {
    // Map common business categories to health-related icons
    const healthIcons = {
      // Medicine categories
      "cardiovascular": "❤️",
      "diabetes": "🩺", 
      "pain": "💊",
      "mental": "🧠",
      "pediatric": "👶",
      "emergency": "🚨",
      "chronic": "⚕️",
      "preventive": "🛡️",
      "oncology": "🎗️",
      "respiratory": "🫁",
      "dermatology": "🧴",
      "orthopedic": "🦴",
      "gastro": "🫄",
      "neurological": "🧠",
      "pharmacy": "💊",
      "hospital": "🏥",
      "clinic": "🏥",
      "medical": "⚕️",
      "health": "🩺",
      "care": "💊",
      "medicine": "💉",
      "drug": "💊",
      "pharma": "💊",
      "therapeutic": "🩹",
      "surgical": "🔬",
      "diagnostic": "🔬",
      "laboratory": "🧪",
      "radiology": "📷",
      "nutrition": "🍎",
      "wellness": "🌱",
      "fitness": "💪",
      "rehabilitation": "🏃‍♂️"
    };
    
    const itemLower = String(item).toLowerCase();
    for (const [key, icon] of Object.entries(healthIcons)) {
      if (itemLower.includes(key)) {
        return icon;
      }
    }
    return "💊"; // default health icon
  };

  // ----- Render helpers -----
  const ListHeader = () => (
    <div className="px-6 pt-8 pb-6 bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg">
            <span className="text-2xl">🏥</span>
          </div>
          <div>
            <span className="text-slate-700 text-lg font-semibold">Your Health Hub</span>
            <div className="text-sm text-slate-500">Trusted Healthcare Network</div>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center shadow-md">
            <span className="text-white text-lg">❤️</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/70 backdrop-blur-sm flex items-center justify-center shadow-md border border-white/50">
            <span className="text-slate-600 text-lg">♡</span>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 rounded-3xl p-8 mb-8 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute top-4 right-4 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-4 left-4 w-16 h-16 bg-white/10 rounded-full blur-lg"></div>
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-white text-2xl font-bold mb-3">Find Your Medical Partners</h1>
            <p className="text-cyan-100 text-base leading-relaxed">
              Connect with trusted healthcare suppliers & stockists
            </p>
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400 shadow-lg"></div>
                <span className="text-white/90 text-sm">24/7 Support</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-400 shadow-lg"></div>
                <span className="text-white/90 text-sm">Verified Partners</span>
              </div>
            </div>
          </div>
          <div className="text-6xl opacity-90 filter drop-shadow-lg">💊</div>
        </div>
      </div>

      {isAdmin && (
        <div className="mb-8">
          <button
            onClick={() => navigation.navigate("/adminpanel")}
            className="bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-bold px-8 py-4 rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200"
          >
            Admin Panel
          </button>
        </div>
      )}

      <div className="mb-8">
        <h3 className="text-xl font-bold text-slate-800 mb-6">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-3xl p-6 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                <span className="text-3xl">📋</span>
              </div>
              <div>
                <div className="text-white font-bold text-base">Order Refills</div>
                <div className="text-cyan-100 text-sm">Quick reorder system</div>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-orange-400 to-red-500 rounded-3xl p-6 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                <span className="text-3xl">💬</span>
              </div>
              <div>
                <div className="text-white font-bold text-base">Consult</div>
                <div className="text-orange-100 text-sm">Expert advice</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-2xl font-bold text-slate-800">Medical Suppliers</div>
          <div className="text-base text-slate-600 mt-1">
            {sectionData.length} trusted stockist{sectionData.length !== 1 ? "s" : ""} available
          </div>
          <div className="text-sm text-slate-400 mt-2">
            Debug: loaded stockists = {sectionData.length}
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl px-5 py-3 shadow-lg">
          <span className="text-white text-lg font-bold">{sectionData.length}</span>
        </div>
      </div>
    </div>
  );

  const renderCard = (section, index) => {
    const [c1, c2] = generateHealthColor(index);
    return (
      <article
        key={section._id || index}
        className="bg-white rounded-3xl shadow-lg border-0 overflow-hidden mb-6 mx-6 transform hover:scale-105 hover:shadow-2xl transition-all duration-300"
        onClick={() => setSelectedSection(index)}
        role="button"
      >
        {section.image ? (
          <div className="relative h-52 w-full">
            <img
              src={section.image}
              alt={section.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          </div>
        ) : (
          <div
            className="relative h-52 w-full flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
          >
            <div className="text-5xl font-extrabold text-white/90 drop-shadow-lg">
              {section.title?.charAt(0)}
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            <div className="absolute top-4 right-4 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
          </div>
        )}

        <div className="p-8">
          <h3 className="text-xl font-bold text-slate-800 mb-4">
            {section.title}
          </h3>

          <div className="flex items-start gap-4 text-base text-slate-600 mb-3">
            <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center">
              <span className="text-sm">📞</span>
            </div>
            <div className="flex-1 font-medium">{section.phone || "-"}</div>
          </div>

          <div className="flex items-start gap-4 text-base text-slate-600 mb-6">
            <div className="w-6 h-6 rounded-lg bg-green-100 flex items-center justify-center">
              <span className="text-sm">📍</span>
            </div>
            <div className="flex-1 font-medium">{section.address || "-"}</div>
          </div>

          <div className="mb-6">
            <div className="text-base text-slate-700 font-semibold mb-4">Company</div>
            <div className="flex flex-wrap gap-3">
              {section.items.slice(0, 2).map((it, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl px-4 py-3 border border-blue-100">
                  <span className="text-lg">{getHealthIcon(it)}</span>
                  <span className="text-slate-700 text-sm font-semibold">{it}</span>
                </div>
              ))}
              {section.items.length > 2 && (
                <div className="bg-gradient-to-r from-slate-100 to-slate-200 rounded-2xl px-4 py-3">
                  <span className="text-slate-600 text-sm font-semibold">+{section.items.length - 2} more</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-base pt-4 border-t border-slate-100">
            <div className="bg-gradient-to-r from-emerald-100 to-green-100 rounded-2xl px-4 py-2 border border-emerald-200">
              <span className="text-emerald-700 font-bold">
                {section.Medicines ? `${section.Medicines.length} medicines` : "0 medicines"}
              </span>
            </div>
            <div className="flex items-center gap-3 text-cyan-600">
              <span className="text-base font-bold">View details</span>
              <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center">
                <span className="text-lg">🔍</span>
              </div>
            </div>
          </div>
        </div>
      </article>
    );
  };

  const renderMainView = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/30">
      <ListHeader />
      
      {/* Debug toggle */}
      <div className="px-6 mb-6">
        <button
          onClick={() => setShowDebug((s) => !s)}
          className="px-6 py-3 bg-gradient-to-r from-slate-100 to-slate-200 rounded-2xl text-sm text-slate-600 font-semibold shadow-md hover:shadow-lg transition-all duration-200"
        >
          {showDebug ? "Hide" : "Show"} debug responses
        </button>
      </div>
      
      {/* Debug panel */}
      {showDebug && (
        <div className="px-6 mb-8">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-xl text-sm text-slate-700 border border-white/50">
            <div className="mb-4 font-bold text-lg text-slate-800">
              Raw API Responses (trimmed)
            </div>
            <div className="mb-4">
              <div className="font-semibold text-slate-800 mb-2">Stockists:</div>
              <pre className="whitespace-pre-wrap max-h-48 overflow-auto text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
                {JSON.stringify(
                  rawResponses.stockists && rawResponses.stockists.data
                    ? rawResponses.stockists.data.slice(0, 5)
                    : rawResponses.stockists,
                  null,
                  2
                )}
              </pre>
            </div>
            <div className="mb-4">
              <div className="font-semibold text-slate-800 mb-2">Medicines:</div>
              <pre className="whitespace-pre-wrap max-h-48 overflow-auto text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
                {JSON.stringify(
                  rawResponses.medicines && rawResponses.medicines.data
                    ? rawResponses.medicines.data.slice(0, 5)
                    : rawResponses.medicines,
                  null,
                  2
                )}
              </pre>
            </div>
            <div className="mb-4">
              <div className="font-semibold text-slate-800 mb-2">Unmatched medicines (first 50):</div>
              <pre className="whitespace-pre-wrap max-h-48 overflow-auto text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
                {JSON.stringify(unmatchedMedicines, null, 2)}
              </pre>
            </div>
            <div>
              <div className="font-semibold text-slate-800 mb-2">Companies:</div>
              <pre className="whitespace-pre-wrap max-h-48 overflow-auto text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
                {JSON.stringify(
                  rawResponses.companies && rawResponses.companies.data
                    ? rawResponses.companies.data.slice(0, 5)
                    : rawResponses.companies,
                  null,
                  2
                )}
              </pre>
            </div>
          </div>
        </div>
      )}
      
      <div className="pb-32">
        {sectionData.map((s, i) => renderCard(s, i))}
      </div>
    </div>
  );

  const renderDetailView = () => {
    const currentSection = sectionData[selectedSection];
    if (!currentSection) return null;
    const [color1, color2] = generateHealthColor(selectedSection || 0);

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/30">
        {/* Sticky Header */}
        <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b border-white/50 shadow-sm">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSelectedSection(null)}
                className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" className="text-slate-700">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              <div className="text-center">
                <div className="text-lg font-bold text-slate-800">{currentSection.title}</div>
                <div className="text-sm text-slate-500">Medical Supplier Details</div>
              </div>
              <div className="flex gap-2">
                <button className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-100 to-pink-100 flex items-center justify-center shadow-md">
                  <span className="text-red-600 text-lg">❤️</span>
                </button>
                <button className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center shadow-md">
                  <span className="text-blue-600 text-lg">📋</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 pb-32">
          {/* Hero Profile Section */}
          <div className="relative -mx-6 mb-8">
            <div className="relative h-80 overflow-hidden">
              {currentSection.image ? (
                <img
                  src={currentSection.image}
                  alt={currentSection.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full"
                  style={{ background: `linear-gradient(135deg, ${color1}, ${color2})` }}
                />
              )}
              
              {/* Overlay and floating elements */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="absolute top-6 right-6 w-32 h-32 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute bottom-20 left-8 w-24 h-24 bg-white/10 rounded-full blur-2xl animate-pulse delay-1000"></div>
              
              {/* Profile Info Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <div className="flex items-end gap-6">
                  <div className="w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-2xl border border-white/30">
                    <span className="text-4xl font-bold text-white">
                      {currentSection.title?.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h1 className="text-white text-3xl font-bold mb-2">{currentSection.title}</h1>
                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                        <div className="w-2 h-2 rounded-full bg-green-400"></div>
                        <span className="text-white text-sm font-medium">Verified</span>
                      </div>
                      <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                        <span className="text-yellow-400 text-sm">⭐</span>
                        <span className="text-white text-sm font-medium">4.8 Rating</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-white/90">
                      <span className="text-lg">📍</span>
                      <span className="text-base">{currentSection.address}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-6 mb-8 border border-white/50">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                onClick={() => makePhoneCall(currentSection.phone)}
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200"
              >
                <span className="text-2xl">📞</span>
                <span>Call Now</span>
              </button>
              <button className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200">
                <span className="text-2xl">💬</span>
                <span>Message</span>
              </button>
            </div>
            
            
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-3xl p-6 text-center shadow-xl">
              <div className="text-3xl mb-2">💊</div>
              <div className="text-white text-2xl font-bold">{currentSection.Medicines ? currentSection.Medicines.length : 0}</div>
              <div className="text-cyan-100 text-sm">Medicines</div>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-blue-600 rounded-3xl p-6 text-center shadow-xl">
              <div className="text-3xl mb-2">🏥</div>
              <div className="text-white text-2xl font-bold">{currentSection.items ? currentSection.items.length : 0}</div>
              <div className="text-orange-100 text-sm">Companies</div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 mb-8 border border-white/50">
            <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <span className="text-white text-lg">📞</span>
              </div>
              Contact Details
            </h3>
            <div className="space-y-6">
              {currentSection.phone && (
                <div className="flex items-center gap-6 p-6 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-3xl border border-blue-100 hover:scale-[1.02] transition-all duration-200">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg">
                    <span className="text-white text-2xl">📞</span>
                  </div>
                  <div>
                    <div className="text-blue-700 font-bold text-lg">Phone Number</div>
                    <div className="text-slate-800 text-xl font-bold mt-1">
                      {currentSection.phone}
                    </div>
                    <div className="text-blue-600 text-sm mt-1">Tap to call directly</div>
                  </div>
                </div>
              )}
              {currentSection.address && (
                <div className="flex items-center gap-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-3xl border border-green-100 hover:scale-[1.02] transition-all duration-200">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                    <span className="text-white text-2xl">📍</span>
                  </div>
                  <div>
                    <div className="text-green-700 font-bold text-lg">Address</div>
                    <div className="text-slate-800 text-xl font-bold mt-1">
                      {currentSection.address}
                    </div>
                    <div className="text-green-600 text-sm mt-1">View on map</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Specialties Section */}
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 mb-8 border border-white/50">
            <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <span className="text-white text-lg">🏥</span>
              </div>
              Comapany
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {currentSection.items.map((item, idx) => (
                <div key={idx} className="group relative overflow-hidden">
                  <div className="flex items-center gap-6 p-6 bg-gradient-to-r from-slate-50 via-blue-50 to-cyan-50 rounded-3xl border border-blue-100 shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300">
                        <span className="text-white text-2xl">{getHealthIcon(item)}</span>
                      </div>
                      <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="text-slate-800 text-xl font-bold">{item}</div>
                      <div className="text-slate-600 text-sm mt-1">Specialized medical services available</div>
                    </div>
                    <div className="text-cyan-600 text-2xl opacity-0 group-hover:opacity-100 transition-all duration-300">
                      →
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Available Medicines */}
          {currentSection.Medicines && currentSection.Medicines.length > 0 && (
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/50">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center">
                    <span className="text-white text-lg">💊</span>
                  </div>
                  Medicines
                </h3>
                <div className="bg-gradient-to-r from-emerald-100 to-green-100 rounded-full px-4 py-2 border border-emerald-200">
                  <span className="text-emerald-700 font-bold text-sm">
                    {currentSection.Medicines.length} items in stock
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {currentSection.Medicines.slice(0, 8).map((medicine, idx) => (
                  <div key={idx} className="group">
                    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl border border-emerald-100 hover:shadow-lg hover:scale-[1.02] transition-all duration-200">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-md">
                        <span className="text-white text-lg">💊</span>
                      </div>
                      <div className="flex-1">
                        <div className="text-emerald-800 font-bold text-lg">{medicine}</div>
                        <div className="text-emerald-600 text-sm">In stock • Available now</div>
                      </div>
                      
                    </div>
                  </div>
                ))}
                {currentSection.Medicines.length > 8 && (
                  <button className="w-full p-4 bg-gradient-to-r from-slate-100 to-slate-200 rounded-2xl text-slate-700 font-semibold hover:from-slate-200 hover:to-slate-300 transition-all duration-200">
                    View All {currentSection.Medicines.length} Medicines
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderBottomNavigation = () => (
    <div className="fixed bottom-8 left-6 right-6 z-50">
      <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/50">
        <div className="flex justify-around py-6">
          <button className="flex flex-col items-center text-cyan-600">
            <div className="w-14 h-14 rounded-3xl bg-gradient-to-br from-cyan-100 to-blue-100 flex items-center justify-center mb-2 shadow-lg">
              <span className="text-2xl">🏠</span>
            </div>
            <div className="text-sm font-bold">Home</div>
          </button>
          <button className="flex flex-col items-center text-slate-400">
            <div className="w-14 h-14 rounded-3xl bg-slate-100 flex items-center justify-center mb-2 shadow-md">
              <span className="text-2xl">📋</span>
            </div>
            <div className="text-sm font-medium">Categories</div>
          </button>
          <button className="flex flex-col items-center text-slate-400">
            <div className="w-14 h-14 rounded-3xl bg-slate-100 flex items-center justify-center mb-2 shadow-md">
              <span className="text-2xl">💾</span>
            </div>
            <div className="text-sm font-medium">Saved</div>
          </button>
          <button
            className="flex flex-col items-center text-slate-400"
            onClick={() => navigation.navigate("/profile")}
          >
            <div className="w-14 h-14 rounded-3xl bg-slate-100 flex items-center justify-center mb-2 shadow-md">
              <span className="text-2xl">👤</span>
            </div>
            <div className="text-sm font-medium">Profile</div>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {selectedSection === null ? renderMainView() : renderDetailView()}
      {selectedSection === null && renderBottomNavigation()}
    </div>
  );
};

export default Screen;