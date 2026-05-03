import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { apiUrl } from "../config/api";

export default function StockistCardView() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const id = params.get("id");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  const submit = async (e) => {
    e && e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(apiUrl("/api/stockist/verify-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, password }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || "Invalid");
      setData(json.data);
    } catch (err) {
      setError(String(err.message || err));
    } finally {
      setLoading(false);
    }
  };

  if (data) {
    const addr = data.address || {};
    return (
      <div className="min-h-screen p-6 bg-slate-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow p-6 w-full max-w-md">
          <div className="flex items-center gap-4">
            <img
              src={data.profileImageUrl || "/vite.svg"}
              alt="profile"
              className="w-20 h-20 rounded-full object-cover"
            />
            <div>
              <h2 className="text-xl font-bold">{data.name}</h2>
              <div className="text-sm text-gray-600">{data.roleType}</div>
              <div className="text-sm text-gray-600">{data.firmName}</div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2">
            <div>
              <strong>Address:</strong> {addr.street || ""} {addr.city || ""}{" "}
              {addr.state || ""} {addr.pincode || ""}
            </div>
            <div>
              <strong>Blood Group:</strong> {data.bloodGroup || "N/A"}
            </div>
            <div>
              <strong>CNTX Number:</strong> {data.cntxNumber || "N/A"}
            </div>
            <div>
              <strong>Phone:</strong> {data.phone || "N/A"}
            </div>
            <div>
              <strong>Email:</strong> {data.email || "N/A"}
            </div>
          </div>

          <div className="mt-6 flex gap-2">
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded"
              onClick={() => navigate(-1)}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-slate-50 flex items-center justify-center">
      <form
        onSubmit={submit}
        className="bg-white rounded-xl shadow p-6 w-full max-w-md"
      >
        <h2 className="text-lg font-bold mb-2">Verify to view details</h2>
        <p className="text-sm text-gray-600 mb-4">
          Enter stockist password to view full details.
        </p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Stockist password"
          className="w-full rounded-xl border px-4 py-3 mb-3"
        />
        {error && <div className="text-red-500 mb-2">{error}</div>}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            {loading ? "Verifying..." : "Verify"}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 border rounded"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
