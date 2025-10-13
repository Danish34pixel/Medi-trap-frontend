import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiUrl } from "../config/api";
import { getCookie } from "../utils/cookies";
import { Pill, ArrowLeft, Package, ShoppingBag } from "lucide-react";

export default function CompanyProducts() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const token = getCookie("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const [rCompany, rMedicines] = await Promise.all([
          fetch(apiUrl(`/api/company`), { headers }),
          fetch(apiUrl(`/api/medicine`), { headers }),
        ]);

        const jCompany = await rCompany.json().catch(() => ({}));
        const jMedicines = await rMedicines.json().catch(() => ({}));

        if (!mounted) return;

        const companies =
          jCompany && jCompany.data
            ? jCompany.data
            : Array.isArray(jCompany)
            ? jCompany
            : [];
        const found = companies.find(
          (c) => String(c._id) === String(id) || String(c.id) === String(id)
        );
        setCompany(found || null);

        const meds =
          jMedicines && jMedicines.data
            ? jMedicines.data
            : Array.isArray(jMedicines)
            ? jMedicines
            : [];

        const filtered = meds.filter((m) => {
          try {
            if (!m) return false;
            if (
              m.company &&
              (String(m.company) === String(id) ||
                (m.company._id && String(m.company._id) === String(id)))
            )
              return true;
            if (
              m.manufacturer &&
              (String(m.manufacturer) === String(id) ||
                (m.manufacturer._id &&
                  String(m.manufacturer._id) === String(id)))
            )
              return true;
            if (m.companyId && String(m.companyId) === String(id)) return true;
            if (
              found &&
              m.company &&
              typeof m.company === "string" &&
              String(m.company)
                .toLowerCase()
                .includes((found.name || "").toLowerCase())
            )
              return true;
            return false;
          } catch (e) {
            return false;
          }
        });

        setMedicines(filtered);
      } catch (e) {
        console.error("CompanyProducts fetch error", e);
        setError("Failed to load products for this company.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => (mounted = false);
  }, [id]);

  const title = company ? company.name : `Company`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="group mb-6 inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm hover:shadow-md transition-all duration-200 text-gray-700 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Back</span>
          </button>

          <div className="bg-white rounded-3xl shadow-lg p-8 border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                <Package className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
                <p className="text-gray-500 mt-1">Product Catalog</p>
              </div>
            </div>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-200 rounded-full"></div>
              <div className="w-16 h-16 border-4 border-blue-500 rounded-full animate-spin border-t-transparent absolute top-0 left-0"></div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-red-600 text-xl">!</span>
            </div>
            <div>
              <p className="text-red-800 font-medium">Error</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-600">
                <ShoppingBag className="w-5 h-5" />
                <span className="text-sm font-medium">
                  {medicines.length}{" "}
                  {medicines.length === 1 ? "Product" : "Products"} Available
                </span>
              </div>
            </div>

            {medicines.length === 0 ? (
              <div className="bg-white rounded-3xl shadow-lg p-16 text-center border border-gray-100">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No Products Found
                </h3>
                <p className="text-gray-500">
                  This company doesn't have any products listed yet.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {medicines.map((m) => (
                  <div
                    key={m._id || m.id || m.name}
                    className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-200"
                  >
                    <div className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                          <Pill className="w-7 h-7 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg text-gray-900 mb-1 group-hover:text-blue-600 transition-colors line-clamp-2">
                            {m.name || m.title || m.medicineName}
                          </h3>
                          <p className="text-sm text-gray-500 mb-3 line-clamp-1">
                            {(() => {
                              const cand =
                                (m.company && (m.company.name || m.company)) ||
                                (m.manufacturer &&
                                  (m.manufacturer.name || m.manufacturer)) ||
                                m.companyName ||
                                m.manufacturerName;
                              // if cand looks like an ID (24 hex chars) hide it
                              if (
                                typeof cand === "string" &&
                                /^[0-9a-fA-F]{24}$/.test(cand)
                              )
                                return "";
                              return cand || "";
                            })()}
                          </p>
                        </div>
                      </div>

                      {/* price removed per request */}
                    </div>

                    <div className="h-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
