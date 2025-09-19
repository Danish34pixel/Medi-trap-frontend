import React, { useEffect, useState } from "react";
import { apiUrl } from "./config/api";
import { medicineReferencesStockist } from "./utils/normalizeMatching";
import { useNavigate, useParams, useLocation } from "react-router-dom";

// Stockist detail page: show companies, medicines and staff for a stockist.
// Behavior:
// - If route param `id` is provided, view that stockist (admins allowed).
// - If `id` === "me" or not provided and user is a stockist, show current user's stockist data.
// - Staff list is fetched from /api/staff?stockist=me (for the logged-in stockist) or ?stockist=<id> for admin viewing another.

const Stockistoutcode = () => {
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

  // read logged in user and token
  const rawUser = localStorage.getItem("user");
  const rawToken = localStorage.getItem("token");
  let user = null;
  try {
    user = rawUser ? JSON.parse(rawUser) : null;
  } catch (e) {
    user = null;
  }

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        // Fetch all stockists and find the requested one (backend has only GET /api/stockist)
        const res = await fetch(apiUrl("/api/stockist"));
        const json = await res.json().catch(() => ({}));
        const list = (json && json.data) || [];

        // Determine which stockist to show
        let target = null;
        if (routeId && routeId !== "me") {
          target = list.find((s) => String(s._id) === String(routeId));
        } else if (routeId === "me") {
          // Try to find by user._id if stockist stored in User model
          if (user && user._id)
            target = list.find((s) => String(s._id) === String(user._id));
        }
        // fallback: if user is stockist, try to match by email or name
        if (!target && user && user.role === "stockist") {
          target = list.find(
            (s) =>
              (s.email && user.email && s.email === user.email) ||
              (s._id && String(s._id) === String(user._id))
          );
        }
        // If still no target and routeId not provided, just take first (graceful fallback)
        if (!target && !routeId && list.length > 0) target = list[0];

        if (!target) {
          setError("Stockist not found");
          setLoading(false);
          return;
        }

        if (mounted) setStockist(target || null);

        // Fetch staff for this stockist. If the logged-in user is viewing their own stockist view,
        // we can use ?stockist=me which the backend maps to req.user._id when authenticated.
        // If we're just viewing as admin, use the id.
        let staffUrl = null;
        if (
          user &&
          user.role === "stockist" &&
          (!routeId ||
            routeId === "me" ||
            String(user._id) === String(target._id))
        ) {
          staffUrl = apiUrl("/api/staff?stockist=me");
        } else {
          staffUrl = apiUrl(`/api/staff?stockist=${target._id}`);
        }

        // include token if present (authenticated requests)
        const staffRes = await fetch(staffUrl, {
          headers: rawToken ? { Authorization: `Bearer ${rawToken}` } : {},
        });
        const staffJson = await staffRes.json().catch(() => ({}));
        const staffList = staffJson.data || [];
        if (mounted) setStaffs(staffList);

        // Fetch companies and medicines from their collections and filter for this stockist
        try {
          const [cRes, mRes] = await Promise.all([
            fetch(apiUrl("/api/company")),
            fetch(apiUrl("/api/medicine")),
          ]);

          const cJson = await cRes.json().catch(() => ({}));
          const mJson = await mRes.json().catch(() => ({}));

          const allCompanies = (cJson && cJson.data) || [];
          const allMeds = (mJson && mJson.data) || [];

          const filteredCompanies = allCompanies.filter((c) => {
            // company may store stockist references under several fields
            try {
              if (Array.isArray(c.stockists) && c.stockists.length > 0) {
                return c.stockists.some(
                  (s) => String((s && (s._id || s)) || s) === String(target._id)
                );
              }
              const possible = [
                c.stockist,
                c.stockistId,
                c.seller,
                c.sellerId,
                c.vendor,
                c.vendorId,
                c.supplier,
                c.supplierId,
              ];
              for (const f of possible) {
                if (!f) continue;
                const cand = f && (f._id || f.id || f);
                if (String(cand) === String(target._id)) return true;
              }
            } catch (e) {
              // ignore
            }
            return false;
          });

          const filteredMeds = allMeds.filter((med) =>
            medicineReferencesStockist(med, target._id)
          );

          if (mounted) {
            setCompaniesList(filteredCompanies);
            setMedicinesList(filteredMeds);
          }
        } catch (e) {
          // ignore fetch errors for these optional lists
        }
      } catch (err) {
        console.error("Stockistoutcode load error", err);
        if (mounted) setError(String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => (mounted = false);
  }, [routeId]);

  // Helpers
  const isOwner = () =>
    user &&
    user.role === "stockist" &&
    stockist &&
    String(user._id) === String(stockist._id);
  const isAdmin = () =>
    user && (user.role === "admin" || user.role === "superadmin");

  if (loading) return <div className="p-6">Loading stockist...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!stockist) return <div className="p-6">No stockist selected.</div>;

  // Normalize lists (companies/medicines keys may differ across documents)
  // Prefer lists fetched from the collections and filtered for this stockist.
  // Fall back to embedded arrays on the stockist document when available.
  const companies =
    Array.isArray(companiesList) && companiesList.length > 0
      ? companiesList
          .map((c) => c.name || c.title || c.companyName || JSON.stringify(c))
          .filter(Boolean)
      : Array.isArray(stockist.companies)
      ? stockist.companies
          .map((c) =>
            typeof c === "string"
              ? c
              : c.name || c.shortName || JSON.stringify(c)
          )
          .filter(Boolean)
      : Array.isArray(stockist.items)
      ? stockist.items
      : [];

  const medicines =
    Array.isArray(medicinesList) && medicinesList.length > 0
      ? medicinesList
          .map((m) => m.name || m.medicineName || m.title || JSON.stringify(m))
          .filter(Boolean)
      : Array.isArray(stockist.Medicines)
      ? stockist.Medicines
      : Array.isArray(stockist.medicines)
      ? stockist.medicines
          .map((m) =>
            typeof m === "string"
              ? m
              : m.name || m.medicineName || JSON.stringify(m)
          )
          .filter(Boolean)
      : [];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">
              {stockist.name || stockist.title || stockist.companyName}
            </h2>
            <div className="text-sm text-gray-600">
              {stockist.phone || stockist.contactNo || ""}
            </div>
            <div className="text-sm text-gray-600">{stockist.email || ""}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">
              {companies.length} companies • {medicines.length} medicines
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-slate-700 mb-3">Companies</h3>
            {companies.length === 0 ? (
              <div className="text-sm text-slate-500">
                No companies listed for this stockist.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {companies.map((c, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-sky-50 text-sky-700 rounded-full text-sm"
                  >
                    {c}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="font-semibold text-slate-700 mb-3">Medicines</h3>
            {medicines.length === 0 ? (
              <div className="text-sm text-slate-500">
                No medicines listed for this stockist.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {medicines.map((m, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm"
                  >
                    {m}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6">
          <h3 className="font-semibold text-slate-700 mb-3">Staff</h3>
          {staffs.length === 0 ? (
            <div className="text-sm text-slate-500">
              No staff members found for this stockist.
            </div>
          ) : (
            <div className="space-y-3">
              {staffs.map((st) => (
                <div
                  key={st._id}
                  className="flex items-center justify-between bg-white p-3 border rounded-lg shadow-sm"
                >
                  <div>
                    <div className="font-medium">
                      {st.name || `${st.firstName || ""} ${st.lastName || ""}`}
                    </div>
                    <div className="text-sm text-gray-500">
                      {st.phone || st.contactNo || st.contact}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {(isAdmin() || isOwner()) && (
                      <button
                        className="px-3 py-1 rounded bg-red-600 text-white text-sm"
                        onClick={async () => {
                          if (!window.confirm("Delete this staff member?"))
                            return;
                          try {
                            const res = await fetch(
                              apiUrl(`/api/staff/${st._id}`),
                              {
                                method: "DELETE",
                                headers: rawToken
                                  ? { Authorization: `Bearer ${rawToken}` }
                                  : {},
                              }
                            );
                            if (res.ok) {
                              setStaffs((s) =>
                                s.filter(
                                  (x) => String(x._id) !== String(st._id)
                                )
                              );
                            } else {
                              const j = await res.json().catch(() => ({}));
                              alert(
                                (j && j.message) ||
                                  `Failed to delete (${res.status})`
                              );
                            }
                          } catch (e) {
                            alert(String(e));
                          }
                        }}
                      >
                        Delete
                      </button>
                    )}
                    <button
                      className="px-3 py-1 rounded bg-sky-100 text-sky-700 text-sm"
                      onClick={() => navigate(`/staff/${st._id}`)}
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4">
            {(isAdmin() || isOwner()) && (
              <button
                className="px-4 py-2 rounded bg-emerald-500 text-white"
                onClick={() => navigate("/adminCreateStaff")}
              >
                Add Staff
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stockistoutcode;
