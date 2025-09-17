import React, { useEffect, useState } from "react";
import {
  Plus,
  Trash2,
  Package,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import API_BASE from "./config/api";
import {
  medicineReferencesStockist,
  medicineDisplayName,
  nameMatchesStockistItems,
  tokenOverlapScore,
} from "./utils/normalizeMatching";

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
          fetch(`${API_BASE}/api/medicine`),
          fetch(`${API_BASE}/api/stockist`),
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

  // Core grouping logic: For each demand line, find medicines that match (by name, fuzzy) and group by stockist
  const createDemand = async () => {
    setLoading(true);
    setError(null);
    try {
      // Build groups by searching medicines and stockists.
      const groups = {};

      const normalizeQuery = (s) => (s || "").toString().trim();

      for (const line of lines) {
        const thisDebug = {
          query: line.name,
          foundMeds: [],
          candidateStockists: [],
          assignedTo: null,
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

        // If we have matched medicines, prefer grouping by stockist references on those meds
        for (const med of foundMeds) {
          // Try to find a stockist that the medicine references
          let matchedStockist = null;
          if (Array.isArray(stockists) && stockists.length > 0) {
            matchedStockist = stockists.find((s) =>
              medicineReferencesStockist(med, s._id)
            );
            // fallback: maybe stockist lists contain the med name
            if (!matchedStockist) {
              const mName = medicineDisplayName(med) || "";
              matchedStockist = stockists.find((s) =>
                nameMatchesStockistItems(mName, s)
              );
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
            groups[label].push({ line, medicine: med });
            assigned = true;
            thisDebug.assignedTo = label;
          }
        }

        if (assigned) continue;

        // If not assigned from medicines, try to find a stockist directly by the query
        if (Array.isArray(stockists) && stockists.length > 0) {
          // first try strong name match
          let matchedStockist = stockists.find((s) =>
            nameMatchesStockistItems(q, s)
          );

          // then token-overlap scoring
          if (!matchedStockist) {
            let bestScore = 0;
            let best = null;
            for (const s of stockists) {
              const score = tokenOverlapScore(q, s);
              if (score > bestScore) {
                bestScore = score;
                best = s;
              }
            }
            // accept minimal overlap of 1 token as a suggestion
            if (bestScore >= 1) matchedStockist = best;
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
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-full mb-4">
            <Package size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create Today's Demand
          </h1>
          <p className="text-gray-600">
            Add medicine requirements and organize by stockists
          </p>
        </div>

        {/* Main Form Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              Medicine Requirements
            </h2>
            <div className="text-sm text-gray-500">
              {lines.length} item{lines.length !== 1 ? "s" : ""}
            </div>
          </div>

          {/* Medicine Lines */}
          <div className="space-y-4 mb-6">
            {lines.map((line, index) => (
              <div key={line.id} className="group">
                <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                    {index + 1}
                  </div>

                  <div className="flex-1">
                    <input
                      value={line.name}
                      onChange={(e) =>
                        updateLine(line.id, { name: e.target.value })
                      }
                      placeholder="Enter medicine name..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>

                  <div className="flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-gray-700">
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
                        className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-center"
                      />
                    </div>
                  </div>

                  {lines.length > 1 && (
                    <button
                      onClick={() => removeLine(line.id)}
                      className="flex-shrink-0 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      title="Remove item"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={addLine}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              <Plus size={18} />
              Add Item
            </button>
            <button
              onClick={createDemand}
              className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <div className="flex items-center gap-3">
              <AlertTriangle className="text-red-500" size={20} />
              <div className="text-red-700 font-medium">{error}</div>
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
              <CheckCircle2 className="text-green-500" size={24} />
              Grouped Demand Results
            </h3>

            {Object.keys(result).length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package size={48} className="mx-auto mb-4 opacity-50" />
                <p>No results to display</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(result).map(([group, items]) => (
                  <div
                    key={group}
                    className="border border-gray-200 rounded-lg overflow-hidden"
                  >
                    <div
                      className={`px-6 py-4 font-semibold text-white ${
                        group === "unmatched"
                          ? "bg-amber-500"
                          : "bg-gradient-to-r from-blue-500 to-blue-600"
                      }`}
                    >
                      {group === "unmatched" ? (
                        <div className="flex items-center gap-2">
                          <AlertTriangle size={20} />
                          Unmatched / Not Found
                        </div>
                      ) : (
                        group
                      )}
                      <div className="text-sm opacity-90 mt-1">
                        {items.length} item{items.length !== 1 ? "s" : ""}
                      </div>
                    </div>

                    <div className="divide-y divide-gray-100">
                      {items.map((it, i) => (
                        <div
                          key={i}
                          className="px-6 py-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 mb-1">
                                {it.line.name}
                              </div>
                              {it.medicine && (
                                <div className="text-sm text-green-600">
                                  ✓ Matches:{" "}
                                  {it.medicine.name ||
                                    it.medicine.title ||
                                    it.medicine.medicineName ||
                                    it.medicine._id}
                                </div>
                              )}
                              {!it.medicine && group !== "unmatched" && (
                                <div className="text-sm text-gray-500">
                                  No direct medicine match
                                </div>
                              )}
                            </div>
                            <div className="flex-shrink-0">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
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

        {/* Debug Panel */}
        {debugInfo && debugInfo.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
            <h4 className="font-semibold mb-3">Debug: matching details</h4>
            <div className="space-y-3 text-sm text-gray-700">
              {debugInfo.map((d, i) => (
                <div key={i} className="p-3 border rounded">
                  <div className="font-medium">Query: {d.query}</div>
                  <div>Found medicines: {d.foundMeds.join(", ") || "none"}</div>
                  <div>
                    Candidate stockists:{" "}
                    {d.candidateStockists.join(", ") || "none"}
                  </div>
                  <div>Assigned to: {d.assignedTo || "none"}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
