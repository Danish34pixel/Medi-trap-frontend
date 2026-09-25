import React, { useEffect, useMemo, useState } from "react";
import { Building2, Search, X, Pencil, Loader2, CheckCircle2 } from "lucide-react";
import { fetchJson } from "../config/api";
import PageHeader from "../ui/PageHeader";
import Card from "../ui/Card";
import Input from "../ui/Input";

// Admin company CRUD (item 5). The backend (monster/routes/company.js) only
// exposes GET /company, POST /company (create — see AdminCreateCompany.jsx)
// and PUT /company/:id (admin-only edit). There is no DELETE endpoint for
// companies at all, so "delete" is intentionally not offered here — the
// `active` flag (toggled through the same PUT) is the real backend-
// supported way to take a company out of circulation.
export default function CompanyManagement() {
  const [companies, setCompanies] = useState([]);
  const [stockists, setStockists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null); // company being edited, or null

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [companyRes, stockistRes] = await Promise.all([
        fetchJson("/company?limit=1000"),
        fetchJson("/stockist?limit=1000"),
      ]);
      setCompanies(companyRes?.data || []);
      setStockists(stockistRes?.data || []);
    } catch (e) {
      setError(e.message || "Failed to load companies.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter((c) => (c.name || "").toLowerCase().includes(q));
  }, [companies, search]);

  return (
    <div className="min-h-screen bg-slate-50">
      <PageHeader
        title="Manage Companies"
        subtitle="Edit company details and stockist links"
        role="slate"
      />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        <div className="relative">
          <Input
            icon={Search}
            placeholder="Search companies..."
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
            No companies found.
          </div>
        )}

        {!loading &&
          filtered.map((company) => (
            <Card key={company._id} padding="p-4" className="flex items-center gap-4">
              <div className="p-2.5 bg-orange-100 rounded-xl">
                <Building2 size={20} className="text-orange-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-800 truncate">
                    {company.name}
                  </h3>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      company.active !== false
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {company.active !== false ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 truncate">
                  {(company.stockistNames || []).length} stockist
                  {(company.stockistNames || []).length === 1 ? "" : "s"} linked
                </p>
              </div>
              <button
                onClick={() => setEditing(company)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-700"
                title="Edit company"
              >
                <Pencil size={18} />
              </button>
            </Card>
          ))}
      </div>

      {editing && (
        <EditCompanyModal
          company={editing}
          stockists={stockists}
          onClose={() => setEditing(null)}
          onSaved={(updated) => {
            setCompanies((prev) =>
              prev.map((c) => (c._id === updated._id ? updated : c)),
            );
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function EditCompanyModal({ company, stockists, onClose, onSaved }) {
  const [name, setName] = useState(company.name || "");
  const [description, setDescription] = useState(company.description || "");
  const [active, setActive] = useState(company.active !== false);
  const [selectedIds, setSelectedIds] = useState(
    (company.stockists || []).map(String),
  );
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const filteredStockists = stockists.filter((s) =>
    (s.name || "").toLowerCase().includes(search.toLowerCase()),
  );

  const toggle = (id) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const save = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Company name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetchJson(`/company/${company._id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: name.trim(),
          description,
          active,
          stockists: selectedIds,
        }),
      });
      onSaved(res.data);
    } catch (e) {
      setError(e.message || "Failed to save company.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <form
        onSubmit={save}
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-800">Edit Company</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <Input
            label="Company Name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <div>
            <label className="text-sm font-medium text-slate-600 mb-1 block">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium text-slate-700">
              Active (visible to medical owners/purchasers)
            </span>
          </label>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-600">
                Linked Stockists
              </label>
              <span className="text-xs text-slate-400">
                {selectedIds.length} selected
              </span>
            </div>
            <Input
              icon={Search}
              placeholder="Search stockists..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mb-2"
            />
            <div className="max-h-48 overflow-y-auto space-y-1 border border-slate-200 rounded-xl p-2">
              {filteredStockists.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4">
                  No stockists match.
                </p>
              )}
              {filteredStockists.map((s) => {
                const selected = selectedIds.includes(s._id);
                return (
                  <button
                    type="button"
                    key={s._id}
                    onClick={() => toggle(s._id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                      selected
                        ? "bg-teal-50 text-teal-700"
                        : "hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    <span className="truncate">{s.name}</span>
                    {selected && <CheckCircle2 size={16} />}
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:brightness-105 transition disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
