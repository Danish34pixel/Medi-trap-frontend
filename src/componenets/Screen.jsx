import React, { useEffect, useState } from "react";
import API_BASE, { apiUrl } from "./config/api";
import {
  medicineReferencesStockist,
  medicineDisplayName,
  nameMatchesStockistItems,
  tokenOverlapScore,
} from "./utils/normalizeMatching";
import { useNavigate, useLocation } from "react-router-dom";
import { Phone, MapPin, Eye } from "lucide-react";

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
  const [fullscreenStockist, setFullscreenStockist] = useState(null); // index for fullscreen modal
  const [isAdmin, setIsAdmin] = useState(false);
  const [sectionData, setSectionData] = useState([]);
  // debug UI removed: rawResponses and showDebug state intentionally discarded
  const [unmatchedMedicines, setUnmatchedMedicines] = useState([]);

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

        // (debug data removed in production UI)

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

          // loaded stockists -> mapped.length
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
          } catch (e) {
            // ignore unmatched computation errors in production UI
          }
        }
      } catch (err) {
        // failed to load stockists (errors are intentionally silent in UI)
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
      // ignore storage parse errors silently
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
      gastro: "🫄",
      neurological: "🧠",
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

  // ----- Render helpers -----
  const ListHeader = () => (
    <div className="px-6 pt-8 pb-6 bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg">
            <span className="text-2xl">🏥</span>
          </div>
          <div>
            <span className="text-slate-700 text-lg font-semibold">
              Your Stockists
            </span>
            <div className="text-sm text-slate-500">
              Trusted Healthcare Network
            </div>
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
            <h1 className="text-white text-2xl font-bold mb-3">
              Find Your Medical Partners
            </h1>
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
        {/* <h3 className="text-xl font-bold text-slate-800 mb-6">Quick Actions</h3> */}
        {/* <div className="grid grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-3xl p-6 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                <span className="text-3xl">📋</span>
              </div>
              <div>
                <div className="text-white font-bold text-base">
                  Order Refills
                </div>
                <div className="text-cyan-100 text-sm">
                  Quick reorder system
                </div>
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
        </div> */}
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-2xl font-bold text-slate-800">
            Medical Suppliers
          </div>
          <div className="text-base text-slate-600 mt-1">
            {sectionData.length} trusted stockist
            {sectionData.length !== 1 ? "s" : ""} available
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl px-5 py-3 shadow-lg">
          <span className="text-white text-lg font-bold">
            {sectionData.length}
          </span>
        </div>
      </div>
    </div>
  );

  const renderCard = (section, index) => {
    const [c1, c2] = generateHealthColor(index);
    return (
      <article
        key={section._id || index}
        className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden mb-6 mx-6 transform hover:scale-105 hover:shadow-2xl transition-all duration-300 backdrop-blur-sm" // Added backdrop-blur-sm for a softer look
        onClick={() => setFullscreenStockist(index)}
        role="button"
      >
        {section.image ? (
          <div className="relative h-52 w-full">
            <img
              src={section.image}
              alt={section.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-gray-900/20 to-transparent" />{" "}
            {/* Subtle dark gradient */}
          </div>
        ) : (
          <div
            className="relative h-52 w-full flex items-center justify-center p-4 rounded-b-2xl" // Added padding for the content
            style={{
              background: `linear-gradient(135deg, ${c1 || "#00C4B3"}, ${
                c2 || "#007BFF"
              })`,
            }} // Using default vibrant colors
          >
            <div
              className="absolute inset-0 opacity-20"
              style={{
                background: `linear-gradient(135deg, ${c1 || "#00C4B3"}, ${
                  c2 || "#007BFF"
                })`,
                filter: "blur(30px)",
              }}
            ></div>{" "}
            {/* Background blur effect for depth */}
            <div className="relative z-10 text-6xl font-extrabold font-poppins text-white drop-shadow-lg opacity-90">
              {section.title?.charAt(0)}
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />{" "}
            {/* Lighter overlay */}
            {/* Decorative elements for the background feel */}
            <div className="absolute top-4 right-4 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
            <div className="absolute bottom-4 left-4 w-10 h-10 bg-white/10 rounded-full blur-xl"></div>
          </div>
        )}

        <div className="p-8">
          <h3 className="text-2xl font-poppins font-bold text-gray-800 mb-4 tracking-tight">
            {section.title}
          </h3>

          {/* Phone Number */}
          <div className="flex items-start gap-4 text-base font-inter text-gray-700 mb-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
              <Phone className="text-base" />
            </div>
            <div className="flex-1 font-medium pt-0.5">
              {section.phone || "N/A"}
            </div>
          </div>

          {/* Address */}
          <div className="flex items-start gap-4 text-base font-inter text-gray-700 mb-6">
            <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 shadow-sm">
              <MapPin className="text-base" />
            </div>
            <div className="flex-1 font-medium pt-0.5">
              {section.address || "N/A"}
            </div>
          </div>

          {/* Company Items / Services */}
          <div className="mb-6">
            <div className="text-base font-poppins text-gray-700 font-semibold mb-3">
              Services
            </div>
            <div className="flex flex-wrap gap-3">
              {section.items.slice(0, 2).map((it, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-teal-50 rounded-full px-4 py-2 border border-blue-100 shadow-sm"
                >
                  <span className="text-base text-blue-600">
                    {getHealthIcon(it)}
                  </span>
                  <span className="text-gray-700 text-sm font-medium font-inter">
                    {it}
                  </span>
                </div>
              ))}
              {section.items.length > 2 && (
                <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-full px-4 py-2 shadow-sm">
                  <span className="text-gray-600 text-sm font-medium font-inter">
                    +{section.items.length - 2} more
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Footer with Medicines Count and View Details */}
          <div className="flex items-center justify-between text-base pt-6 border-t border-gray-100 mt-6">
            <div className="bg-gradient-to-r from-lime-100 to-green-100 rounded-full px-4 py-2 border border-lime-200 shadow-sm">
              <span className="text-lime-700 font-bold font-poppins text-sm">
                {section.Medicines
                  ? `${section.Medicines.length} medicines`
                  : "0 medicines"}
              </span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent card click from triggering twice
                setFullscreenStockist(index); // Re-trigger or navigate
              }}
              className="flex items-center gap-3 text-purple-600 hover:text-purple-700 transition-colors duration-200 group"
            >
              <span className="text-base font-bold font-inter">
                View details
              </span>
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 shadow-sm group-hover:scale-110 transition-transform duration-200">
                <Eye className="text-lg" />
              </div>
            </button>
          </div>
        </div>
      </article>
    );
  };

  const renderMainView = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/30">
      <ListHeader />

      {/* debug panel removed */}

      <div className="pb-32">{sectionData.map((s, i) => renderCard(s, i))}</div>
    </div>
  );

  // Accepts an optional section and index for reuse
  const renderDetailView = (
    section = sectionData[selectedSection],
    idx = selectedSection
  ) => {
    const currentSection = section;
    if (!currentSection) return null;
    const [color1, color2] = generateHealthColor(idx || 0);

    return (
      <div className="min-h-screen bg-slate-50 font-sans">
        {/* --- Sticky Header --- */}
        <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-slate-200">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              {/* Back Button */}

              {/* Title */}
              <div className="text-center">
                <div className="text-lg font-bold text-slate-800">
                  {currentSection.title}
                </div>
              </div>
              {/* Favorite Button */}
            </div>
          </div>
        </div>

        {/* --- Main Content Body --- */}
        <div className="p-4 space-y-6 pb-24">
          {/* --- Supplier Info Card --- */}
          <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-5">
            <div className="flex items-start gap-4">
              <div className="relative">
                {currentSection.image ? (
                  <img
                    src={currentSection.image}
                    alt={currentSection.title}
                    className="w-20 h-20 object-cover rounded-xl"
                  />
                ) : (
                  <div
                    className="w-20 h-20 rounded-xl flex items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, ${color1}, ${color2})`,
                    }}
                  >
                    <span className="text-3xl font-bold text-white">
                      {currentSection.title?.charAt(0)}
                    </span>
                  </div>
                )}
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center border-2 border-white">
                  <span className="text-white text-xs">✓</span>
                </div>
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-bold text-slate-800 mb-1">
                  {currentSection.title}
                </h1>
                <p className="text-slate-500 text-sm mb-2">
                  {currentSection.address}
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-orange-100 text-orange-600 rounded-full px-2 py-0.5 text-xs font-semibold">
                    <span>⭐</span>
                    <span>4.8</span>
                  </div>
                  <div className="text-slate-400 text-sm">(209 Reviews)</div>
                </div>
              </div>
            </div>
          </div>

          {/* --- Quick Actions (Call/Message) --- */}
          <div className="grid gap-4">
            <button
              onClick={() => makePhoneCall(currentSection.phone)}
              className="bg-cyan-500 text-white py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 hover:bg-cyan-600 transform hover:-translate-y-0.5 transition-all"
            >
              <span className="text-xl">📞</span>
              <span>Call Now</span>
            </button>
            {/* <button className="bg-orange-500 text-white py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 hover:bg-orange-600 transform hover:-translate-y-0.5 transition-all">
            <span className="text-xl">💬</span>
            <span>Message</span>
          </button> */}
          </div>

          {/* --- Companies Section --- */}
          <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-5">
            <h3 className="text-lg font-bold text-slate-800 mb-4">
              Partner Companies
            </h3>
            <div className="space-y-3">
              {currentSection.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl"
                >
                  <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center">
                    <span className="text-lg text-cyan-600">
                      {getHealthIcon(item)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-slate-700">{item}</div>
                  </div>
                  <div className="text-slate-400 text-2xl">›</div>
                </div>
              ))}
            </div>
          </div>

          {/* --- Available Medicines Section --- */}
          {currentSection.Medicines && currentSection.Medicines.length > 0 && (
            <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800">
                  Medicines In Stock
                </h3>
                <div className="bg-cyan-100 text-cyan-700 rounded-full px-3 py-1 text-xs font-bold">
                  {currentSection.Medicines.length} items
                </div>
              </div>
              <div className="space-y-2">
                {currentSection.Medicines.slice(0, 5).map((medicine, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-4 p-3 border-b border-slate-100 last:border-b-0"
                  >
                    <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                      <span className="text-lg text-orange-600">💊</span>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-slate-700">
                        {medicine}
                      </div>
                      <div className="text-sm text-slate-500">Available</div>
                    </div>
                  </div>
                ))}
                {currentSection.Medicines.length > 5 && (
                  <button className="w-full mt-3 p-3 bg-slate-100 rounded-xl text-slate-700 font-semibold hover:bg-slate-200 transition-all">
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
          <button
            onClick={() => navigation.navigate("/demand")}
            className="flex flex-col items-center text-slate-400 hover:text-cyan-600 transition-colors"
          >
            <div className="w-14 h-14 rounded-3xl bg-slate-100 hover:bg-gradient-to-br hover:from-cyan-100 hover:to-blue-100 flex items-center justify-center mb-2 shadow-md transition-all">
              <span className="text-2xl">📋</span>
            </div>
            <div className="text-sm font-medium">Demand</div>
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
      {fullscreenStockist === null ? (
        <>
          {selectedSection === null ? renderMainView() : renderDetailView()}
          {selectedSection === null && renderBottomNavigation()}
        </>
      ) : (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            zIndex: 9999,
            background: "white",
            overflowY: "auto",
          }}
        >
          <button
            onClick={() => setFullscreenStockist(null)}
            style={{ position: "absolute", top: 8, right: 24, zIndex: 10000 }}
            className="bg-red-500 text-white rounded-full px-3 py-1 shadow-lg hover:bg-red-600"
          >
            Close
          </button>
          {fullscreenStockist !== null &&
            renderDetailViewForFullscreen(fullscreenStockist)}
        </div>
      )}
    </div>
  );

  // Helper for fullscreen modal detail view
  function renderDetailViewForFullscreen(idx) {
    const currentSection = sectionData[idx];
    if (!currentSection) return null;
    return renderDetailView(currentSection, idx);
  }
};

export default Screen;
