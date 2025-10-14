import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchJson, apiUrl, API_BASE } from "./config/api";

const makeCandidates = (img) => {
  if (!img) return [];
  const candidates = [];
  if (img.startsWith("http")) candidates.push(img);
  candidates.push(`${API_BASE}${img.startsWith("/") ? img : `/${img}`}`);
  const viteBase = import.meta.env.BASE_URL || "/";
  candidates.push(`${viteBase.replace(/\/$/, "")}/${img.replace(/^\//, "")}`);
  return candidates;
};

const DashboardButton = () => {
  const navigate = useNavigate();
  return (
    <button
      className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white font-bold py-2.5 px-8 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
      onClick={() => navigate("/dashboard")}
    >
      ← Dashboard
    </button>
  );
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
        const token = localStorage.getItem("token");
        const res = await fetchJson(`/purchaser/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        setPurchaser(res.data || res);
        setError(null);
      } catch (err) {
        setError("Failed to fetch purchaser details");
      }
      setLoading(false);
    };
    fetchPurchaser();
  }, [id]);

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="text-sky-600 text-xl font-semibold animate-pulse">Loading...</div></div>;
  if (error) return <div className="flex items-center justify-center min-h-screen"><div className="text-red-600 text-xl font-semibold">{error}</div></div>;
  if (!purchaser) return <div className="flex items-center justify-center min-h-screen"><div className="text-slate-500 text-xl">No details found.</div></div>;

  return (
    <div className="bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 min-h-screen py-6 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4 flex justify-center">
          <DashboardButton />
        </div>
        
        {/* ID Card Style */}
        <div className="bg-white rounded-2xl shadow-2xl border-2 border-slate-300 overflow-hidden transform hover:scale-[1.01] transition-transform duration-300">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 px-8 py-4 relative">
            <div className="absolute top-0 left-0 w-full h-full opacity-10">
              <div className="absolute top-2 left-4 w-32 h-32 border-2 border-white rounded-full"></div>
              <div className="absolute bottom-2 right-4 w-24 h-24 border-2 border-white rounded-full"></div>
            </div>
            <div className="relative flex items-center justify-between">
              <div>
                <h2 className="text-white font-bold text-2xl tracking-wide">PURCHASER ID CARD</h2>
                <p className="text-blue-200 text-sm font-medium mt-1">Authorized Purchaser</p>
              </div>
              <div className="text-white font-mono text-sm bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm border border-white/30">
                ID: {purchaser._id?.slice(-8).toUpperCase()}
              </div>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-8">
            <div className="grid md:grid-cols-3 gap-8">
              {/* Photo Section */}
              <div className="flex flex-col items-center">
                <div className="relative mb-4">
                  <div className="w-40 h-48 rounded-lg overflow-hidden border-4 border-slate-300 shadow-xl bg-slate-100">
                    {purchaser.photo ? (
                      (() => {
                        const candidates = makeCandidates(purchaser.photo);
                        return (
                          <img
                            src={candidates[0]}
                            alt="Photo"
                            className="object-cover w-full h-full"
                            onError={(e) => {
                              const next = candidates.find((c) => c !== e.currentTarget.src);
                              if (next) {
                                e.currentTarget.src = next;
                              } else {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='192'><rect width='100%' height='100%' fill='%23e2e8f0'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%2364748b' font-size='20'>PHOTO</text></svg>";
                              }
                            }}
                          />
                        );
                      })()
                    ) : (
                      <div className="flex items-center justify-center w-full h-full bg-slate-200">
                        <span className="text-6xl">👤</span>
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                    VERIFIED
                  </div>
                </div>
                <div className="text-center">
                  <div className="w-32 h-1 bg-slate-800 mx-auto"></div>
                  <p className="text-xs text-slate-500 mt-1 font-medium">Signature</p>
                </div>
              </div>

              {/* Details Section */}
              <div className="md:col-span-2 space-y-6">
                {/* Name */}
                <div className="border-b-2 border-slate-200 pb-4">
                  <label className="text-xs text-slate-500 uppercase font-bold tracking-wider block mb-1">Full Name</label>
                  <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{purchaser.fullName}</h1>
                </div>

                {/* Contact Details */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs text-slate-500 uppercase font-bold tracking-wider block mb-2">Contact Number</label>
                    <div className="flex items-center gap-2 bg-slate-50 border-2 border-slate-200 rounded-lg px-4 py-3">
                      <span className="text-blue-600 text-lg">📱</span>
                      <span className="text-slate-900 font-bold text-lg">{purchaser.contactNo}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 uppercase font-bold tracking-wider block mb-2">ID Number</label>
                    <div className="bg-slate-50 border-2 border-slate-200 rounded-lg px-4 py-3">
                      <span className="text-slate-900 font-mono text-sm font-bold">{purchaser._id}</span>
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="text-xs text-slate-500 uppercase font-bold tracking-wider block mb-2">Registered Address</label>
                  <div className="bg-slate-50 border-2 border-slate-200 rounded-lg px-4 py-3">
                    <div className="flex items-start gap-2">
                      <span className="text-blue-600 text-lg mt-0.5">📍</span>
                      <p className="text-slate-900 font-medium leading-relaxed">{purchaser.address}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Aadhar Section */}
            <div className="mt-8 pt-8 border-t-2 border-slate-200">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">🆔</span>
                <h3 className="text-lg font-bold text-slate-900 uppercase tracking-wide">Government ID Verification</h3>
              </div>
              {purchaser.aadharImage ? (
                (() => {
                  const candidates = makeCandidates(purchaser.aadharImage);
                  return (
                    <div className="bg-slate-50 rounded-xl p-4 border-2 border-slate-200 shadow-inner">
                      <img
                        src={candidates[0]}
                        alt="Aadhar"
                        className="w-full max-h-64 object-contain rounded-lg bg-white border-2 border-slate-300 shadow-md"
                        onError={(e) => {
                          const next = candidates.find((c) => c !== e.currentTarget.src);
                          if (next) e.currentTarget.src = next;
                          else {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='300'><rect width='100%' height='100%' fill='%23f1f5f9'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%2394a3b8' font-size='24'>ID Document Not Available</text></svg>";
                          }
                        }}
                      />
                      <div className="mt-3 flex items-center justify-between">
                        <p className="text-sm text-slate-600 font-semibold">Aadhar Card (Verified)</p>
                        <div className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold">
                          <span>✓</span> Verified
                        </div>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="bg-slate-50 rounded-xl p-8 border-2 border-dashed border-slate-300 text-center">
                  <div className="text-6xl mb-3 opacity-20">📄</div>
                  <span className="text-slate-400 font-medium">No Government ID Uploaded</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <div>
                <p className="font-semibold">Issue Date: {new Date().toLocaleDateString('en-IN')}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">Valid Until: Permanent</p>
                <p className="text-slate-400 mt-1">This is an official purchaser identification card</p>
              </div>
            </div>
          </div>

          {/* Holographic Strip Effect */}
          <div className="h-2 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400"></div>
        </div>
      </div>
    </div>
  );
};
export default PurchaserDetails;