import React, { useEffect, useState } from "react";
import axios from "axios";
import { apiUrl } from "./config/api";
import { getCookie } from "./utils/cookies";

export default function StockistApprovals() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState({});

  useEffect(() => {
    let mounted = true;
    const fetchRequests = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = getCookie("token");
        const res = await axios.get(apiUrl("/api/purchasing-card/requests"), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (mounted) setRequests(res.data.data || []);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to load requests"
        );
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchRequests();
    return () => (mounted = false);
  }, []);

  const approve = async (id) => {
    try {
      setProcessing((p) => ({ ...p, [id]: true }));
      const token = getCookie("token");
      const res = await axios.post(
        apiUrl(`/api/purchasing-card/approve/${id}`),
        {},
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      if (res.data && res.data.success) {
        // Refresh list
        setRequests((rs) => rs.filter((r) => String(r._id) !== String(id)));
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Approval failed");
    } finally {
      setProcessing((p) => ({ ...p, [id]: false }));
    }
  };

  if (loading) return <div>Loading approval requests...</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!requests || requests.length === 0) return <div>No pending requests</div>;

  return (
    <div className="space-y-4">
      {requests.map((r) => (
        <div
          key={r._id}
          className="p-4 border rounded-lg bg-white shadow-sm flex items-center justify-between"
        >
          <div>
            <div className="font-semibold">
              {r.requester?.medicalName || r.requester?.email || "Unknown"}
            </div>
            <div className="text-sm text-gray-500">
              Requested on: {new Date(r.createdAt).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Request ID: {r._id}</div>
          </div>
          <div>
            <button
              onClick={() => approve(r._id)}
              disabled={processing[r._id]}
              className="px-4 py-2 bg-teal-500 text-white rounded-lg"
            >
              {processing[r._id] ? "Approving..." : "Approve"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
