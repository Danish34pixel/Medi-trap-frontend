import React, { useEffect, useState } from "react";
import { apiUrl } from "./config/api";
import { medicineReferencesStockist } from "./utils/normalizeMatching";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import Btn from "./stockistComponents/Btn";
import Avatar from "./stockistComponents/Avatar";
import IdentityCard from "./stockistComponents/IdentityCard";
import StatsGrid from "./stockistComponents/StatsGrid";
import {
  CompanyCard,
  MedicineCard,
  StaffCard,
} from "./stockistComponents/ListCards";

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
  const [query, setQuery] = useState("");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(apiUrl("/api/stockist"));
        const json = await res.json().catch(() => ({}));
        const list = (json && json.data) || [];
        let target = null;
        if (routeId && routeId !== "me")
          target = list.find((s) => String(s._id) === String(routeId));
        else if (routeId === "me") target = list.find((s) => s && s._id);
        if (!target && list.length > 0) target = list[0];
        if (!target) {
          setError("Stockist not found");
          setLoading(false);
          return;
        }
        if (mounted) setStockist(target);

        // include auth token for staff endpoint (protected)
        const token =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const staffUrl = apiUrl(`/api/staff?stockist=${target._id}`);
        const staffOpts = token
          ? { headers: { Authorization: `Bearer ${token}` } }
          : {};

        const [cRes, mRes, sRes] = await Promise.all([
          fetch(apiUrl("/api/company")),
          fetch(apiUrl("/api/medicine")),
          fetch(staffUrl, staffOpts),
        ]);
        const cJson = await cRes.json().catch(() => ({}));
        const mJson = await mRes.json().catch(() => ({}));
        const sJson = await sRes.json().catch(() => ({}));
        const allCompanies = (cJson && cJson.data) || [];
        const allMeds = (mJson && mJson.data) || [];
        const staffList = (sJson && sJson.data) || [];

        const filteredCompanies = allCompanies.filter((c) => {
          try {
            if (Array.isArray(c.stockists) && c.stockists.length)
              return c.stockists.some(
                (s) => String((s && (s._id || s)) || s) === String(target._id)
              );
            const keys = [
              c.stockist,
              c.stockistId,
              c.seller,
              c.sellerId,
              c.vendor,
              c.vendorId,
              c.supplier,
              c.supplierId,
            ];
            return keys.some(
              (k) => !!k && String(k._id || k.id || k) === String(target._id)
            );
          } catch (e) {
            return false;
          }
        });

        const filteredMeds = allMeds.filter((med) =>
          medicineReferencesStockist(med, target._id)
        );

        if (mounted) {
          setCompaniesList(filteredCompanies);
          setMedicinesList(filteredMeds);
          setStaffs(staffList);
        }
      } catch (err) {
        console.error(err);
        if (mounted) setError(String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [routeId]);

  const [qrDataUrl, setQrDataUrl] = useState(null);
  useEffect(() => {
    const idToUse = routeId || (stockist && stockist._id);
    if (!idToUse) return setQrDataUrl(null);
    (async () => {
      try {
        const mod = await import("qrcode");
        const QR = mod && (mod.default || mod);
        const dataUrl = await QR.toDataURL(
          `${window.location.origin}/stockist-card?id=${idToUse}`
        );
        setQrDataUrl(dataUrl);
      } catch (e) {
        setQrDataUrl(null);
      }
    })();
  }, [routeId, stockist]);

  const stats = {
    companies: companiesList.length,
    medicines: medicinesList.length,
    staff: staffs.length,
  };

  const filterByQuery = (items, keys = ["name"]) => {
    if (!query) return items || [];
    const q = query.trim().toLowerCase();
    return (items || []).filter((it) => {
      try {
        return (
          keys.some(
            (k) => it && it[k] && String(it[k]).toLowerCase().includes(q)
          ) || JSON.stringify(it).toLowerCase().includes(q)
        );
      } catch (e) {
        return false;
      }
    });
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!stockist) return <div className="p-6">No stockist selected</div>;

  const companies = filterByQuery(companiesList, ["name", "companyName"]);
  const medicines = filterByQuery(medicinesList, ["name", "medicineName"]);
  const visibleStaff = filterByQuery(staffs, ["fullName", "name"]);

  return (
    <div className="min-h-screen p-6 bg-slate-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Avatar name={stockist.name || stockist.companyName} size={64} />
            <div>
              <h2 className="text-2xl font-bold">
                {stockist.name || stockist.companyName}
              </h2>
              <div className="text-sm text-gray-600">
                {stockist.email || stockist.phone}
              </div>
            </div>
          </div>
          <div>
            <Btn onClick={() => navigate(-1)}>
              <ArrowLeft size={14} /> Back
            </Btn>
          </div>
        </div>

        <div className="mb-6">
          <IdentityCard
            stockist={stockist}
            qrDataUrl={qrDataUrl}
            onPrint={() => window.print()}
          />
        </div>

        <StatsGrid stats={stats} />

        <div className="mt-6">
          <div className="flex gap-2 mb-4">
            <button
              className={`px-3 py-2 rounded ${
                activeTab === "companies" ? "bg-sky-600 text-white" : "bg-white"
              }`}
              onClick={() => setActiveTab("companies")}
            >
              Companies ({companies.length})
            </button>
            <button
              className={`px-3 py-2 rounded ${
                activeTab === "medicines" ? "bg-sky-600 text-white" : "bg-white"
              }`}
              onClick={() => setActiveTab("medicines")}
            >
              Medicines ({medicines.length})
            </button>
            <button
              className={`px-3 py-2 rounded ${
                activeTab === "staff" ? "bg-sky-600 text-white" : "bg-white"
              }`}
              onClick={() => setActiveTab("staff")}
            >
              Staff ({visibleStaff.length})
            </button>
            <input
              className="ml-auto px-3 py-2 border rounded"
              placeholder="Search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {activeTab === "companies" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {companies.length === 0 && (
                <div className="p-6 bg-white rounded">No companies</div>
              )}
              {companies.map((c) => (
                <CompanyCard
                  key={c._id || c.id}
                  c={c}
                  onView={() => {}}
                  onContact={() => {}}
                />
              ))}
            </div>
          )}

          {activeTab === "medicines" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {medicines.length === 0 && (
                <div className="p-6 bg-white rounded">No medicines</div>
              )}
              {medicines.map((m) => (
                <MedicineCard
                  key={m._id || m.id}
                  m={m}
                  onView={() => {}}
                  onOrder={() => {}}
                />
              ))}
            </div>
          )}

          {activeTab === "staff" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {visibleStaff.length === 0 && (
                <div className="p-6 bg-white rounded">No staff</div>
              )}
              {visibleStaff.map((s) => (
                <StaffCard
                  key={s._id || s.id}
                  st={s}
                  onView={() => {}}
                  onDelete={() => {}}
                  isAdminOrOwner={false}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
