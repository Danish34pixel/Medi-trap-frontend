import React, { useEffect, useState } from "react";
import {
  Plus,
  Trash2,
  Package,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import API_BASE, { apiUrl } from "./config/api";
import {
  medicineReferencesStockist,
  medicineDisplayName,
  nameMatchesStockistItems,
  tokenOverlapScore,
} from "./utils/normalizeMatching";
import Logo from "./Logo";

export default function Demand() {
  const [lines, setLines] = useState([{ id: Date.now(), name: "", qty: 0 }]);
  const [medicines, setMedicines] = useState([]);
  const [stockists, setStockists] = useState([]);
  const [result, setResult] = useState(null);
  const [debugInfo, setDebugInfo] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const SAVE_KEY = "savedDemand";

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
      { id: Date.now() + Math.random(), name: "", qty: 0 },
    ]);
  const removeLine = (id) =>
    setLines((prev) => prev.filter((l) => l.id !== id));

  // Core grouping logic: For each demand line, find medicines that match and check stockist availability
  const createDemand = async () => {
    setLoading(true);
    setError(null);
    try {
      // Build groups by searching medicines and stockists.
      const groups = {};

      const normalizeQuery = (s) => (s || "").toString().trim();

      // First, check if stockists have medicines listed in their inventory
      const checkStockistInventory = (medicine, stockist) => {
        // Check if medicine exists in stockist's Medicines array
        if (stockist.Medicines && Array.isArray(stockist.Medicines)) {
          return stockist.Medicines.some(med => 
            med.toLowerCase() === medicine.toLowerCase() ||
            (medicine.name && med.toLowerCase() === medicine.name.toLowerCase())
          );
        }
        return false;
      };

      for (const line of lines) {
        const thisDebug = {
          query: line.name,
          foundMeds: [],
          candidateStockists: [],
          assignedTo: null,
          availability: []
        };
        const q = normalizeQuery(line.name);
        if (!q) {
          groups["unmatched"] = groups["unmatched"] || [];
          groups["unmatched"].push({ line });
          continue;
        }

        // Try to find matching medicines in DB first (exact -> includes)
        const qLower = q.toLowerCase();
        let foundMeds = [];
        if (Array.isArray(medicines) && medicines.length > 0) {
          const exact = medicines.filter((m) => {
            const mn = (m.name || m.medicineName || m.title || "")
              .toString()
              .toLowerCase();
            return mn === qLower;
          });
          const includes = medicines.filter((m) => {
            const mn = (m.name || m.medicineName || m.title || "")
              .toString()
              .toLowerCase();
            return mn.includes(qLower) && mn !== qLower;
          });
          foundMeds = exact.length ? exact : includes;
          thisDebug.foundMeds = foundMeds.map(
            (m) => medicineDisplayName(m) || String(m._id)
          );
        }

        let assigned = false;

        // If we have matched medicines, check stockist availability
        for (const med of foundMeds) {
          // Find stockists that have this medicine in their inventory
          let availableStockists = [];
          if (Array.isArray(stockists) && stockists.length > 0) {
            availableStockists = stockists.filter(s => {
              // Check if medicine is explicitly listed in stockist's inventory
              const hasInInventory = checkStockistInventory(med, s);
              // Or if medicine references this stockist
              const isReferenced = medicineReferencesStockist(med, s._id);
              return hasInInventory || isReferenced;
            });
            
            // Add availability info to debug
            thisDebug.availability = availableStockists.map(s => s.name || s.title);

            // Process each available stockist
            for (const matchedStockist of availableStockists) {

              const label = matchedStockist.title || matchedStockist.name || matchedStockist._id;
              thisDebug.candidateStockists.push(label);
              groups[label] = groups[label] || [];
              groups[label].push({ 
                line, 
                medicine: med,
                available: true, // Mark as available since we confirmed it's in inventory
                quantity: line.qty
              });
              assigned = true;
              thisDebug.assignedTo = label;
            }
          }
        }

        if (assigned) {
          thisDebug.status = "Found with availability";
          continue;
        }

        // If not assigned yet, check stockists' medicine lists directly
        if (!assigned && Array.isArray(stockists) && stockists.length > 0) {
          // Find stockists that list this medicine in their inventory
          const stockistsWithMedicine = stockists.filter(s => 
            checkStockistInventory({ name: q }, s)
          );

          // If direct inventory match found, use those stockists
          if (stockistsWithMedicine.length > 0) {
            for (const matchedStockist of stockistsWithMedicine) {
              const label = matchedStockist.title || matchedStockist.name || matchedStockist._id;
              thisDebug.candidateStockists.push(label);
              groups[label] = groups[label] || [];
              groups[label].push({ 
                line, 
                medicine: { name: q },
                available: true,
                quantity: line.qty
              });
              assigned = true;
              thisDebug.assignedTo = label;
            }
          }

          if (matchedStockist) {
            thisDebug.candidateStockists.push(
              matchedStockist.title ||
                matchedStockist.name ||
                matchedStockist._id
            );
            const label =
              matchedStockist.title ||
              matchedStockist.name ||
              matchedStockist._id;
            groups[label] = groups[label] || [];
            // we may not have a medicine object to attach; attach just the line
            groups[label].push({ line, medicine: null });
            assigned = true;
            thisDebug.assignedTo = label;
          }
        }

        if (!assigned) {
          groups["unmatched"] = groups["unmatched"] || [];
          groups["unmatched"].push({ line });
          thisDebug.assignedTo = "unmatched";
        }
        setDebugInfo((d) => [...d, thisDebug]);
      }

      setResult(groups);
      // persist to localStorage so the results survive refreshes (no TTL)
      try {
        localStorage.setItem(
          SAVE_KEY,
          JSON.stringify({ groups, createdAt: Date.now() })
        );
      } catch (e) {
        console.warn("Could not save demand to localStorage", e);
      }
    } catch (e) {
      console.error(e);
      setError("Could not create demand. See console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
  <div className="container mx-auto max-w-2xl px-4 py-12">
    {/* Header */}
    <header className="text-center mb-10">
      <Logo className="w-20 h-20 mx-auto mb-4" alt="MedTrap Logo" />
      <p className="text-slate-500 text-lg">
        Create a new medicine demand list for your stockists.
      </p>
    </header>

    {/* Main Form Card */}
    <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 mb-8">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-semibold text-slate-800">
          Medicine Requirements
        </h2>
        <div className="text-sm font-medium text-center text-white bg-teal-500 rounded-full px-6 py-1">
          {lines.length} item{lines.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Medicine Lines */}
      <div className="space-y-4 mb-8">
        {lines.map((line, index) => (
          <div
            key={line.id}
            className="group flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200 transition-all hover:border-teal-400 hover:bg-white"
          >
            <div className="flex-shrink-0 w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-sm font-bold text-slate-600">
              {index + 1}
            </div>

            <div className="flex-1">
              <input
                value={line.name}
                onChange={(e) =>
                  updateLine(line.id, { name: e.target.value })
                }
                placeholder="Enter medicine name..."
                className="w-full bg-transparent text-slate-800 placeholder-slate-400 focus:outline-none"
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
                  className="w-20 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all text-center bg-white"
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
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={addLine}
          className="flex w-full sm:w-auto items-center justify-center gap-2 px-6 py-3 border-2 border-dashed border-slate-300 hover:border-teal-500 hover:bg-teal-50 text-slate-600 hover:text-teal-600 rounded-lg font-semibold transition-colors"
        >
          <Plus size={18} />
          Add Item
        </button>
        <button
          onClick={createDemand}
          className="flex w-full sm:w-auto items-center justify-center gap-2 px-8 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-semibold transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
    </div>

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
      <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
        <h3 className="text-2xl font-semibold text-slate-800 mb-6 flex items-center gap-3">
          <CheckCircle2 className="text-teal-500" size={28} />
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
                      : "bg-gradient-to-r from-teal-500 to-cyan-500"
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
                        className="flex items-center gap-2 px-3 py-2.5 bg-white text-teal-600 rounded-2xl hover:bg-teal-50 transition-all font-bold shadow-lg hover:scale-105"
                      >
                        <span className="text-xl">📞</span>
                        
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
                            <div className="text-sm text-teal-600 flex items-center gap-1.5">
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
      </div>
    )}

    
  </div>
</div>
  );
}
