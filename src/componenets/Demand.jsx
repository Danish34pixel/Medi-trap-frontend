import React, { useEffect, useState } from "react";
import {
  Plus,
  Trash2,
  Package,
  AlertTriangle,
  CheckCircle2,
  Phone,
} from "lucide-react";
import API_BASE, { apiUrl } from "./config/api";
import { medicineDisplayName } from "./utils/normalizeMatching";
import PageHeader from "./ui/PageHeader";
import Card from "./ui/Card";

export default function Demand() {
  const [lines, setLines] = useState([
    { id: Date.now(), name: "", qty: 0, medicineId: null },
  ]);
  const [medicines, setMedicines] = useState([]);
  const [stockists, setStockists] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [focusedLineId, setFocusedLineId] = useState(null);
  const SAVE_KEY = "savedDemand";

  // Autosuggest — returns the actual medicine objects (not just names) so a
  // click can store the real _id alongside the display text.
  const getSuggestions = (value) => {
    const q = (value || "").toString().trim().toLowerCase();
    if (q.length < 2) return [];
    const seen = new Set();
    const out = [];
    for (const m of medicines || []) {
      const name = medicineDisplayName(m).trim();
      if (!name) continue;
      const key = name.toLowerCase();
      if (!key.includes(q) || seen.has(key)) continue;
      seen.add(key);
      out.push({ _id: m._id, name });
      if (out.length >= 5) break;
    }
    return out;
  };

  useEffect(() => {
    // fetch medicines and stockists if backend available
    const fetchData = async () => {
      try {
        const [mRes, sRes] = await Promise.all([
          fetch(apiUrl(`/api/medicine`)),
          fetch(apiUrl(`/api/stockist`)),
        ]);

        if (mRes && mRes.ok) {
          const mJson = await mRes.json();
          setMedicines(mJson.data || []);
        }
        if (sRes && sRes.ok) {
          const sJson = await sRes.json();
          setStockists(sJson.data || []);
        }
      } catch (e) {
        // backend might not be available in dev; keep empty lists
        console.warn("Could not fetch medicines/stockists", e);
      }
    };

    fetchData();

    // load saved demand from localStorage (if any) so results persist across refresh
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.groups) setResult(parsed.groups);
      }
    } catch (e) {
      // ignore parse errors
    }
  }, []);

  const updateLine = (id, patch) => {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  };

  const addLine = () =>
    setLines((prev) => [
      ...prev,
      { id: Date.now() + Math.random(), name: "", qty: 0, medicineId: null },
    ]);
  const removeLine = (id) =>
    setLines((prev) => prev.filter((l) => l.id !== id));

  // Sends the demand to the backend, which does the medicine/stockist
  // matching + auto-distribution server-side (routes/demand.js POST /create)
  // and persists it. Previously this function only ran a duplicated,
  // client-side version of that matching logic and never called the
  // backend at all — nothing was ever saved to MongoDB.
  const createDemand = async () => {
    setLoading(true);
    setError(null);
    try {
      const items = lines
        .map((l) => ({
          name: (l.name || "").trim(),
          qty: Math.max(1, Number(l.qty) || 1),
          medicineId: l.medicineId || undefined,
        }))
        .filter((it) => it.name);

      if (items.length === 0) {
        setError("Add at least one medicine name.");
        return;
      }

      const token = localStorage.getItem("token");
      const res = await fetch(apiUrl("/api/demand/create"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ items }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.success) {
        console.error("Create demand failed:", res.status, body);
        setError(body.message || `Could not create demand (${res.status}).`);
        return;
      }

      // Reshape the server's per-medicine inventory view into per-stockist
      // groups for display, keeping the existing results UI unchanged.
      const groups = {};
      for (const inv of body.data.inventory || []) {
        const entry = {
          line: { name: inv.requestedAs, qty: inv.qty },
          medicine: inv.medicineId
            ? { _id: inv.medicineId, name: inv.medicineName }
            : null,
        };
        if (!inv.stockists || inv.stockists.length === 0) {
          groups.unmatched = groups.unmatched || [];
          groups.unmatched.push(entry);
          continue;
        }
        for (const st of inv.stockists) {
          const label = st.name || String(st.id);
          groups[label] = groups[label] || [];
          groups[label].push(entry);
        }
      }

      setResult(groups);
      try {
        localStorage.setItem(
          SAVE_KEY,
          JSON.stringify({ groups, createdAt: Date.now() })
        );
      } catch (e) {
        console.warn("Could not save demand to localStorage", e);
      }
    } catch (e) {
      console.error("Create demand error:", e);
      setError("Could not create demand. See console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
  <PageHeader
    title="Create Demand"
    subtitle="Build a medicine request for your stockists"
    role="slate"
  />
  <div className="container mx-auto max-w-2xl px-4 py-8 sm:py-12">

    {/* Main Form Card */}
    <Card padding="p-6 sm:p-8" elevated className="mb-8 rounded-4xl">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-semibold text-slate-800">
          Medicine Requirements
        </h2>
        <div className="text-sm font-medium text-center text-white bg-slate-800 rounded-full px-6 py-1">
          {lines.length} item{lines.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Medicine Lines */}
      <div className="space-y-4 mb-8">
        {lines.map((line, index) => {
          const suggestions =
            focusedLineId === line.id ? getSuggestions(line.name) : [];
          return (
          <div key={line.id} className="relative">
            <div
              className="group flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200 transition-all hover:border-sky-400 hover:bg-white"
            >
              <div className="flex-shrink-0 w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-sm font-bold text-slate-600">
                {index + 1}
              </div>

              <div className="flex-1">
                <input
                  value={line.name}
                  onChange={(e) =>
                    updateLine(line.id, { name: e.target.value, medicineId: null })
                  }
                  onFocus={() => setFocusedLineId(line.id)}
                  onBlur={() =>
                    setTimeout(() => setFocusedLineId(null), 150)
                  }
                  placeholder="Enter medicine name..."
                  className="w-full bg-transparent text-slate-800 placeholder-slate-400 focus:outline-none"
                  autoComplete="off"
                />
              </div>

              <div className="flex-shrink-0">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-slate-600 hidden sm:block">
                    Qty:
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={line.qty}
                    onChange={(e) =>
                      updateLine(line.id, {
                        qty: Number(
                          e.target.value === "" ? 0 : e.target.value
                        ),
                      })
                    }
                    className="w-20 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition-all text-center bg-white"
                  />
                </div>
              </div>

              {lines.length > 1 && (
                <button
                  onClick={() => removeLine(line.id)}
                  className="flex-shrink-0 p-2 text-slate-400 hover:bg-orange-100 hover:text-orange-500 rounded-full transition-colors opacity-50 group-hover:opacity-100"
                  title="Remove item"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>

            {suggestions.length > 0 && (
              <div className="absolute left-0 right-0 mt-1 z-20 bg-white border border-slate-200 rounded-xl shadow-card-lg overflow-hidden">
                {suggestions.map((s, idx) => (
                  <button
                    type="button"
                    key={s._id || `${line.id}-${idx}`}
                    // onMouseDown (not onClick) fires before the input's
                    // onBlur, so the selection registers even though the
                    // blur handler removes this dropdown from the DOM.
                    onMouseDown={(e) => {
                      e.preventDefault();
                      updateLine(line.id, { name: s.name, medicineId: s._id || null });
                      setFocusedLineId(null);
                    }}
                    className={`block w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-700 transition-colors ${
                      idx !== suggestions.length - 1
                        ? "border-b border-slate-100"
                        : ""
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={addLine}
          className="flex w-full sm:w-auto items-center justify-center gap-2 px-6 py-3 border-2 border-dashed border-slate-300 hover:border-sky-500 hover:bg-sky-50 text-slate-600 hover:text-sky-600 rounded-lg font-semibold transition-colors"
        >
          <Plus size={18} />
          Add Item
        </button>
        <button
          onClick={createDemand}
          className="flex w-full sm:w-auto items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-600 hover:to-sky-600 text-white rounded-lg font-semibold transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              Processing...
            </>
          ) : (
            <>
              <CheckCircle2 size={18} />
              Create Demand
            </>
          )}
        </button>
      </div>
    </Card>

    {/* Error Display */}
    {error && (
      <div className="bg-orange-100 border-l-4 border-orange-500 rounded-r-lg p-4 mb-8">
        <div className="flex items-center gap-3">
          <AlertTriangle className="text-orange-500" size={20} />
          <div className="text-orange-800 font-medium">{error}</div>
        </div>
      </div>
    )}

    {/* Results */}
    {result && (
      <Card padding="p-6 sm:p-8" elevated className="rounded-4xl">
        <h3 className="text-2xl font-semibold text-slate-800 mb-6 flex items-center gap-3">
          <CheckCircle2 className="text-sky-500" size={28} />
          Grouped Demand Results
        </h3>

        {Object.keys(result).length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Package size={48} className="mx-auto mb-4 opacity-40" />
            <p className="text-lg">No results to display</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(result).map(([group, items]) => (
              <div
                key={group}
                className="border border-slate-200 rounded-xl overflow-hidden"
              >
                <div
                  className={`px-6 py-4 font-semibold text-white ${
                    group === "unmatched"
                      ? "bg-gradient-to-r from-amber-500 to-orange-500"
                      : "bg-gradient-to-r from-cyan-500 to-sky-500"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-lg">
                        {group === "unmatched" && <AlertTriangle size={20} />}
                        {group === "unmatched" ? "Unmatched / Not Found" : group}
                      </div>
                      <div className="text-sm opacity-90 mt-1 font-normal">
                        {items.length} item{items.length !== 1 ? "s" : ""}
                      </div>
                    </div>
                    {group !== "unmatched" && stockists.find(s => (s.name === group || s.title === group))?.phone && (
                      <button
                        onClick={() => {
                          const stockist = stockists.find(s => s.name === group || s.title === group);
                          if (stockist?.phone) {
                            window.location.href = `tel:${stockist.phone}`;
                          }
                        }}
                        className="flex items-center gap-2 px-3 py-2.5 bg-white text-sky-600 rounded-2xl hover:bg-sky-50 transition-all font-bold shadow-lg hover:scale-105"
                      >
                        <Phone size={16} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="divide-y divide-slate-100">
                  {items.map((it, i) => (
                    <div
                      key={i}
                      className="px-6 py-4 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-slate-900 mb-1">
                            {it.line.name}
                          </div>
                          {it.medicine && (
                            <div className="text-sm text-sky-600 flex items-center gap-1.5">
                              <CheckCircle2 size={14}/>
                              <span>
                                Matches:{" "}
                                {it.medicine.name ||
                                  it.medicine.title ||
                                  it.medicine.medicineName ||
                                  it.medicine._id}
                              </span>
                            </div>
                          )}
                          {!it.medicine && group !== "unmatched" && (
                            <div className="text-sm text-slate-500">
                              No direct medicine match
                            </div>
                          )}
                        </div>
                        <div className="flex-shrink-0 ml-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                            Qty: {it.line.qty}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    )}


  </div>
</div>
  );
}
