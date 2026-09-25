import React, { useEffect, useMemo, useState } from "react";
import { Pill, Search, X, Loader2, Info } from "lucide-react";
import { fetchJson } from "../config/api";
import PageHeader from "../ui/PageHeader";
import Card from "../ui/Card";
import Input from "../ui/Input";

// Admin medicine CRUD (item 6). Ground truth from monster/routes/medicine.js:
// only GET / (list), POST / (admin create) and POST /quick (quick-create)
// exist — there is no PUT or DELETE route for medicines at all. Edit/delete
// are therefore a genuine backend gap, not something this page fakes; this
// is a read-only catalog view (the "view medicine" part of the request)
// with the create screens linked from AdminPanel for the write side.
export default function MedicineManagement() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let mounted = true;
    fetchJson("/medicine?limit=1000")
      .then((res) => {
        if (mounted) setMedicines(res?.data || []);
      })
      .catch((e) => {
        if (mounted) setError(e.message || "Failed to load medicines.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return medicines;
    return medicines.filter(
      (m) =>
        (m.name || "").toLowerCase().includes(q) ||
        (m.genericName || "").toLowerCase().includes(q) ||
        (m.companyName || "").toLowerCase().includes(q),
    );
  }, [medicines, search]);

  return (
    <div className="min-h-screen bg-slate-50">
      <PageHeader
        title="Manage Medicines"
        subtitle="Catalog view"
        role="slate"
      />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-700">
          <Info size={18} className="flex-shrink-0 mt-0.5" />
          <p>
            The backend doesn&apos;t expose an edit or delete endpoint for
            medicines yet &mdash; this is a read-only catalog. Use{" "}
            <span className="font-semibold">Create Medicine</span> from the
            admin menu to add new entries.
          </p>
        </div>

        <div className="relative">
          <Input
            icon={Search}
            placeholder="Search medicines, generic name, or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              type="button"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500">
            No medicines found.
          </div>
        )}

        {!loading &&
          filtered.map((m) => (
            <Card key={m._id} padding="p-4" className="flex items-center gap-4">
              <div className="p-2.5 bg-rose-100 rounded-xl">
                <Pill size={20} className="text-rose-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-800 truncate">
                  {m.name}
                </h3>
                <p className="text-xs text-slate-500 truncate">
                  {m.genericName ? `${m.genericName} · ` : ""}
                  {m.companyName || "No company"}
                </p>
              </div>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  m.active !== false
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {m.active !== false ? "Active" : "Inactive"}
              </span>
            </Card>
          ))}
      </div>
    </div>
  );
}
