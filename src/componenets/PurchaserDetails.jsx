import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchJson, apiUrl } from "./config/api";
import API_BASE from "./config/api";

// small helper to resolve candidate URLs and provide fallback
const makeCandidates = (img) => {
  if (!img) return [];
  const candidates = [];
  if (img.startsWith("http")) candidates.push(img);
  candidates.push(`${API_BASE}${img.startsWith("/") ? img : `/${img}`}`);
  const viteBase = import.meta.env.BASE_URL || "/";
  candidates.push(`${viteBase.replace(/\/$/, "")}/${img.replace(/^\//, "")}`);
  return candidates;
};

const PurchaserDetails = () => {
  const { id } = useParams();
  const [purchaser, setPurchaser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPurchaser = async () => {
      setLoading(true);
      try {
        const res = await fetchJson(`/purchaser/${id}`);
        setPurchaser(res.data || res);
        setError(null);
      } catch (err) {
        setError("Failed to fetch purchaser details");
      }
      setLoading(false);
    };
    fetchPurchaser();
  }, [id]);

  if (loading) return <div className="text-sky-600 py-4">Loading...</div>;
  if (error) return <div className="text-red-600 py-4">{error}</div>;
  if (!purchaser)
    return <div className="text-slate-500 py-4">No details found.</div>;

  return (
    <div className="bg-sky-50 min-h-screen py-8">
      <div className="max-w-md mx-auto px-4">
        <div className="bg-white rounded-2xl shadow p-6 border border-sky-100 flex flex-col items-center gap-4">
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-sky-300 bg-sky-50 flex items-center justify-center">
            {purchaser.photo ? (
              (() => {
                const candidates = makeCandidates(purchaser.photo);
                return (
                  <img
                    src={candidates[0]}
                    alt="Photo"
                    className="object-cover w-full h-full"
                    onError={(e) => {
                      // try next candidate
                      const next = candidates.find(
                        (c) => c !== e.currentTarget.src
                      );
                      if (next) {
                        e.currentTarget.src = next;
                      } else {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src =
                          "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><rect width='100%' height='100%' fill='%23e6eefc'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%236b8bd7' font-size='20'>Photo</text></svg>";
                      }
                    }}
                  />
                );
              })()
            ) : (
              <span className="text-5xl">🧑‍💼</span>
            )}
          </div>
          <div className="text-2xl font-bold text-sky-700">
            {purchaser.fullName}
          </div>
          <div className="text-slate-600 text-center">{purchaser.address}</div>
          <div className="text-slate-700 font-medium">
            {purchaser.contactNo}
          </div>
          <div className="w-full flex flex-col items-center gap-2 mt-4">
            <div className="font-semibold text-sky-600">Aadhar Image</div>
            {purchaser.aadharImage ? (
              (() => {
                const candidates = makeCandidates(purchaser.aadharImage);
                return (
                  <img
                    src={candidates[0]}
                    alt="Aadhar"
                    className="w-48 h-32 object-cover rounded border border-sky-200"
                    onError={(e) => {
                      const next = candidates.find(
                        (c) => c !== e.currentTarget.src
                      );
                      if (next) e.currentTarget.src = next;
                      else {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src =
                          "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='160'><rect width='100%' height='100%' fill='%23f8fafc'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%2399a6b2' font-size='18'>No image</text></svg>";
                      }
                    }}
                  />
                );
              })()
            ) : (
              <span className="text-slate-400">No Aadhar image</span>
            )}
          </div>
          <div className="mt-2 text-xs text-slate-400">ID: {purchaser._id}</div>
        </div>
      </div>
    </div>
  );
};

export default PurchaserDetails;
