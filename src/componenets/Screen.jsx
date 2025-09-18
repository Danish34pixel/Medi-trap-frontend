// Screen.jsx
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

  const generateRandomColor = (index) => {
    const colors = [
      ["#3B82F6", "#2563EB"], // blue
      ["#8B5CF6", "#7C3AED"], // purple
      ["#6366F1", "#4F46E5"], // indigo
      ["#EC4899", "#DB2777"], // pink
      ["#10B981", "#059669"], // green
      ["#F59E0B", "#D97706"], // yellow
      ["#EF4444", "#DC2626"], // red
    ];
    return colors[index % colors.length];
  };

  const makePhoneCall = (phoneNumber) => {
    if (!phoneNumber) return;
    window.location.href = `tel:${phoneNumber}`;
  };

  // ----- Render helpers -----
  const ListHeader = () => (
    <div className="px-4 pt-6">
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-slate-900">
          Marketing Directory
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Find the best marketing partners for your business
        </p>
            {isAdmin && (
          <button
            onClick={() => navigation.navigate("/adminpanel")}
            className="mt-3 inline-block bg-violet-600 text-white text-sm font-semibold px-4 py-2 rounded-lg"
          >
            Admin Panel
          </button>
        )}
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-sm text-slate-500">
            {sectionData.length} stockist{sectionData.length !== 1 ? "s" : ""}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Debug: loaded stockists = {sectionData.length}
          </div>
        </div>
      </div>
    </div>
  );

  const renderCard = (section, index) => {
    const [c1] = generateRandomColor(index);
    return (
      <article
        key={section._id || index}
        className="bg-white rounded-xl shadow-sm border border-sky-100 overflow-hidden mb-6"
        onClick={() => setSelectedSection(index)}
        role="button"
      >
        {section.image ? (
          <div className="relative h-44 w-full">
            <img
              src={section.image}
              alt={section.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/20" />
          </div>
        ) : (
          <div
            className="relative h-44 w-full flex items-center justify-center"
            style={{ backgroundColor: c1 }}
          >
            <div className="text-4xl font-extrabold text-white/90">
              {section.title?.charAt(0)}
            </div>
            <div className="absolute inset-0 bg-black/10" />
          </div>
        )}

        <div className="p-4">
          <h3 className="text-lg font-semibold text-sky-800 mb-2">
            {section.title}
          </h3>

          <div className="flex items-start gap-3 text-sm text-slate-600 mb-2">
            <div className="text-lg">📞</div>
            <div className="flex-1">{section.phone || "-"}</div>
          </div>

          <div className="flex items-start gap-3 text-sm text-slate-600 mb-3">
            <div className="text-lg">📍</div>
            <div className="flex-1">{section.address || "-"}</div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {section.items.slice(0, 2).map((it, idx) => (
              <span
                key={idx}
                className="px-3 py-1 rounded-full bg-slate-50 text-slate-700 text-sm"
              >
                {it}
              </span>
            ))}
            {section.items.length > 2 && (
              <span className="px-3 py-1 rounded-full bg-slate-50 text-slate-600 text-sm">
                +{section.items.length - 2} more
              </span>
            )}
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="text-sm text-emerald-600 font-medium">
              {section.Medicines ? `${section.Medicines.length} medicines` : ""}
            </div>
            <div className="flex items-center gap-2 text-sky-600">
              <span className="text-sm font-medium">View details</span>
              <span>🔍</span>
            </div>
          </div>
        </div>
      </article>
    );
  };

  const renderMainView = () => (
    <div className="max-w-6xl mx-auto">
      <ListHeader />
      {/* Debug toggle */}
      <div className="px-4 mb-4">
        <button
          onClick={() => setShowDebug((s) => !s)}
          className="px-3 py-2 bg-slate-100 rounded-md text-sm"
        >
          {showDebug ? "Hide" : "Show"} debug responses
        </button>
      </div>
      {/* Debug panel */}
      {showDebug && (
        <div className="px-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm text-sm text-slate-700">
            <div className="mb-2 font-semibold">
              Raw API Responses (trimmed)
            </div>
            <div className="mb-2">
              <div className="font-medium">Stockists:</div>
              <pre className="whitespace-pre-wrap max-h-40 overflow-auto text-xs">
                {JSON.stringify(
                  rawResponses.stockists && rawResponses.stockists.data
                    ? rawResponses.stockists.data.slice(0, 5)
                    : rawResponses.stockists,
                  null,
                  2
                )}
              </pre>
            </div>
            <div className="mb-2">
              <div className="font-medium">Medicines:</div>
              <pre className="whitespace-pre-wrap max-h-40 overflow-auto text-xs">
                {JSON.stringify(
                  rawResponses.medicines && rawResponses.medicines.data
                    ? rawResponses.medicines.data.slice(0, 5)
                    : rawResponses.medicines,
                  null,
                  2
                )}
              </pre>
            </div>
            <div className="mb-2">
              <div className="font-medium">Unmatched medicines (first 50):</div>
              <pre className="whitespace-pre-wrap max-h-40 overflow-auto text-xs">
                {JSON.stringify(unmatchedMedicines, null, 2)}
              </pre>
            </div>
            <div>
              <div className="font-medium">Companies:</div>
              <pre className="whitespace-pre-wrap max-h-40 overflow-auto text-xs">
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
      <div className="px-4 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sectionData.map((s, i) => renderCard(s, i))}
        </div>
      </div>
    </div>
  );

  const renderDetailView = () => {
    const currentSection = sectionData[selectedSection];
    if (!currentSection) return null;
    const [color1] = generateRandomColor(selectedSection || 0);

    return (
      <div className="max-w-4xl mx-auto px-4 pb-10">
        <div className="rounded-xl overflow-hidden mb-6">
          {currentSection.image ? (
            <div className="relative h-64">
              <img
                src={currentSection.image}
                alt={currentSection.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40" />
              <div className="absolute bottom-4 left-4 text-white">
                <h2 className="text-3xl font-bold">{currentSection.title}</h2>
                <p className="text-sm opacity-90">{currentSection.address}</p>
              </div>
            </div>
          ) : (
            <div className="relative h-64" style={{ backgroundColor: color1 }}>
              <div className="absolute inset-0 bg-black/20" />
              <div className="absolute bottom-4 left-4 text-white">
                <h2 className="text-3xl font-bold">{currentSection.title}</h2>
                <p className="text-sm opacity-90">{currentSection.address}</p>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-6xl font-extrabold text-white/40">
                  {currentSection.title?.charAt(0)}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between mb-6">
            <button
              onClick={() => setSelectedSection(null)}
              className="inline-flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg text-sm"
            >
              <span>🔙</span>
              <span className="text-sm font-medium">Back</span>
            </button>

            <button
              onClick={() => makePhoneCall(currentSection.phone)}
              className="inline-flex items-center gap-3 px-4 py-2 bg-sky-600 text-white rounded-lg"
            >
              <span className="text-lg">📞</span>
              <span>Call {currentSection.title}</span>
            </button>
          </div>

          <section className="mb-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-3">
              Contact Information
            </h3>
            {currentSection.phone && (
              <div className="flex items-start gap-4 mb-3">
                <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center">
                  📞
                </div>
                <div>
                  <div className="text-sm text-slate-500">Phone</div>
                  <div className="text-base font-medium text-slate-800">
                    {currentSection.phone}
                  </div>
                </div>
              </div>
            )}
            {currentSection.address && (
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center">
                  📍
                </div>
                <div>
                  <div className="text-sm text-slate-500">Address</div>
                  <div className="text-base font-medium text-slate-800">
                    {currentSection.address}
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="mb-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-3">
              Company
            </h3>
            <div className="bg-slate-50 rounded-lg p-4 space-y-3">
              {currentSection.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-sky-600 text-white flex items-center justify-center text-sm font-bold">
                    {idx + 1}
                  </div>
                  <div className="text-base text-slate-800">{item}</div>
                </div>
              ))}
            </div>

            {currentSection.Medicines &&
              currentSection.Medicines.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-md font-semibold text-slate-800 mb-3">
                    Medicines
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {currentSection.Medicines.map((m, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-sm"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}
          </section>
        </div>
      </div>
    );
  };

  const renderBottomNavigation = () => (
    <div className="fixed bottom-4 left-0 right-0 max-w-3xl mx-auto px-4">
      <div className="bg-white rounded-full shadow-lg flex justify-around py-2">
        <button className="flex flex-col items-center text-sky-600">
          <div className="text-xl">🏠</div>
          <div className="text-xs">Home</div>
        </button>
        <button className="flex flex-col items-center text-slate-500">
          <div className="text-xl">📋</div>
          <div className="text-xs">Categories</div>
        </button>
        <button className="flex flex-col items-center text-slate-500">
          <div className="text-xl">💾</div>
          <div className="text-xs">Saved</div>
        </button>
        <button
          className="flex flex-col items-center text-slate-500"
          onClick={() => navigation.navigate("/profile")}
        >
          <div className="text-xl">👤</div>
          <div className="text-xs">Profile</div>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-sky-50">
      <div className="pt-6 pb-24">
        {selectedSection === null ? renderMainView() : renderDetailView()}
      </div>

      {selectedSection === null && renderBottomNavigation()}
    </div>
  );
};

export default Screen;
