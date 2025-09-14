// Screen.jsx
import React, { useEffect, useState } from "react";
import API_BASE from "./config/api";
import { useNavigate } from "react-router-dom";

const Screen = ({ navigation: navProp }) => {
  const navigate = (() => {
    try {
      return useNavigate();
    } catch {
      return null;
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
            const medsForStockist = medicines
              .filter((m) =>
                Array.isArray(m.stockists)
                  ? m.stockists.some((st) =>
                      String(st.stockist || st).includes(String(s._id))
                    )
                  : false
              )
              .map((m) => (m.name ? m.name : m.brandName || ""))
              .filter(Boolean);

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

            const companiesForStockist = companies
              .filter((c) => companyIds.has(String(c._id)))
              .map((c) => (c.name ? c.name : c.shortName || ""))
              .filter(Boolean);

            const items = (s.companies || companiesForStockist)
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

            const meds = (s.medicines || medsForStockist)
              .map((m) =>
                typeof m === "string"
                  ? m
                  : m && (m.name || m.brandName)
                  ? m.name || m.brandName
                  : ""
              )
              .filter(Boolean);

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
        }
      } catch (err) {
        console.warn("Screen: failed to load stockists", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

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
            onClick={() => navigation.navigate("/adminPanel")}
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
