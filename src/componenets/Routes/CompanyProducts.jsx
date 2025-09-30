import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiUrl } from "../config/api";
import { Pill, ArrowLeft } from "lucide-react";

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
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        // fetch company (if available) and medicines, then filter client-side
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

        // Simple association heuristics: medicines may have .company, .manufacturer, or companyId
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
            // try matching by company name if company found
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

  const title = company ? company.name : `Company ${id}`;

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white shadow flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold">{title} — Products</h1>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm">
          {loading && <div className="text-sm text-gray-500">Loading...</div>}
          {error && <div className="text-sm text-red-500">{error}</div>}

          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {medicines.length === 0 && (
                <div className="text-sm text-gray-500 p-6">
                  No products found for this company.
                </div>
              )}
              {medicines.map((m) => (
                <div
                  key={m._id || m.id || m.name}
                  className="bg-white rounded-xl p-4 border shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold">
                      <Pill className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {m.name || m.title || m.medicineName}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {m.company || m.manufacturer || ""}
                      </p>
                      <div className="mt-2 text-sm text-gray-700">
                        Price: {m.price || "—"}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
