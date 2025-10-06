import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { User, Edit, Trash2 } from "lucide-react";
import { apiUrl } from "./config/api";
import { getCookie } from "./utils/cookies";

export default function StaffIDCard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [user, setUser] = useState(() => {
    try {
      const u = localStorage.getItem("user");
      return u ? JSON.parse(u) : null;
    } catch (e) {
      return null;
    }
  });

  const [stockistName, setStockistName] = useState(null);

  // Resolve stockist/company name: prefer populated staff.stockist object,
  // otherwise try to fetch stockist by id, otherwise fall back to local user.
  useEffect(() => {
    (async () => {
      try {
        if (!staff) return;
        // if staff.stockist is an object with a name/companyName, use it
        const s = staff.stockist;
        if (s && typeof s === "object") {
          setStockistName(s.name || s.companyName || s.title || null);
          return;
        }
        // if staff.stockist is a string id, try per-id endpoint first. If the
        // remote backend hasn't been updated and returns 404, fall back to
        // fetching the stockist list and matching by id (safer for older deploys).
        if (s && typeof s === "string") {
          try {
            const token = getCookie("token") || localStorage.getItem("token");
            // Try single-stockist endpoint first
            const singleRes = await fetch(apiUrl(`/api/stockist/${s}`), {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (singleRes.ok) {
              const singleJson = await singleRes.json().catch(() => ({}));
              if (singleJson && singleJson.data) {
                setStockistName(
                  singleJson.data.name ||
                    singleJson.data.companyName ||
                    singleJson.data.title ||
                    null
                );
                return;
              }
            }
            // If singleRes returned 404 or didn't provide data, fall back to list
            const listRes = await fetch(apiUrl(`/api/stockist`), {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            const lj = await listRes.json().catch(() => ({}));
            const list = (lj && lj.data) || [];
            const found = Array.isArray(list)
              ? list.find((it) => String(it._id) === String(s))
              : null;
            if (found) {
              setStockistName(
                found.name || found.companyName || found.title || null
              );
              return;
            }
          } catch (e) {
            // ignore and fallback
          }
        }
        // fallback to local user fields
        setStockistName(
          user && (user.name || user.companyName || user.title)
            ? user.name || user.companyName || user.title
            : null
        );
      } catch (e) {
        // ignore
      }
    })();
  }, [staff]);

  useEffect(() => {
    (async () => {
      if (!id) {
        setError("Staff id missing in route.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const token = getCookie("token") || localStorage.getItem("token");
        const res = await fetch(apiUrl(`/api/staff/${id}`), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError((j && j.message) || "Failed to load staff.");
          setStaff(null);
        } else {
          setStaff((j && j.data) || null);
        }
      } catch (e) {
        setError(String(e));
        setStaff(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white p-8 rounded-xl shadow text-center">
          <div className="w-10 h-10 mx-auto mb-4 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
          <div>Loading staff...</div>
        </div>
      </div>
    );
  }

  if (error || !staff) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white p-8 rounded-xl shadow text-center">
          <div className="text-red-600 font-semibold mb-2">
            {error || "Staff not found."}
          </div>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-blue-100">
      <div className="w-full max-w-2xl">
        {/* ID Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden relative">
          {/* Decorative curves - top */}
          <div className="absolute top-0 right-0 w-full h-32 bg-gradient-to-br from-blue-600 to-blue-700 rounded-bl-full"></div>
          <div className="absolute top-0 right-0 w-3/4 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-bl-full"></div>

          {/* Header with company logo area */}
          <div className="relative pt-6 px-8 pb-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  {stockistName || "YOUR COMPANY"}
                </h1>
                <p className="text-xs text-gray-500">Staff Management System</p>
              </div>
            </div>
          </div>

          {/* Main content area */}
          <div className="relative px-8 pb-8">
            <div className="flex flex-col md:flex-row md:gap-8 items-start">
              {/* Photo Section */}
              <div className="flex-shrink-0 mb-6 md:mb-0 md:mr-4">
                <div className="relative">
                  <div className="w-36 h-36 md:w-48 md:h-48 rounded-full border-4 border-blue-600 shadow-xl overflow-hidden bg-gray-100 ring-4 ring-blue-100">
                    <img
                      src={
                        staff.image ||
                        staff.profileImageUrl ||
                        "https://via.placeholder.com/400"
                      }
                      alt="Staff Photo"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>

              {/* Staff Details */}
              <div className="flex-1 pt-2">
                <div className="bg-blue-600 text-white px-6 py-2 rounded-full inline-block mb-6 font-bold text-lg tracking-wide">
                  STAFF ID CARD
                </div>

                <h3 className="text-3xl md:text-4xl font-bold text-blue-900 mb-6 md:mb-8">
                  {staff.fullName || staff.name}
                </h3>

                <div className="space-y-4">
                  <div className="flex items-start gap-2">
                    <span className="text-gray-700 font-semibold min-w-32">
                      Staff ID
                    </span>
                    <span className="text-gray-700">:</span>
                    <span className="text-gray-900 font-medium">
                      {staff.staffId || staff.id || "N/A"}
                    </span>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="text-gray-700 font-semibold min-w-32">
                      Date
                    </span>
                    <span className="text-gray-700">:</span>
                    <span className="text-gray-900 font-medium">
                      {staff.joiningDate ||
                        new Date().toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                    </span>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="text-gray-700 font-semibold min-w-32">
                      Contact
                    </span>
                    <span className="text-gray-700">:</span>
                    <span className="text-gray-900 font-medium">
                      {staff.contact || staff.contactNo || staff.phone}
                    </span>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="text-gray-700 font-semibold min-w-32">
                      Email
                    </span>
                    <span className="text-gray-700">:</span>
                    <span className="text-gray-900 font-medium break-all">
                      {staff.email}
                    </span>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="text-gray-700 font-semibold min-w-32">
                      Address
                    </span>
                    <span className="text-gray-700">:</span>
                    <span className="text-gray-900 font-medium">
                      {(staff.address && staff.address.street) ||
                        staff.address ||
                        staff.city}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Barcode Section */}
            <div className="flex justify-end mt-8">
              <div className="bg-white p-4 rounded-lg">
                <div className="flex gap-px h-24 items-end">
                  {[
                    3, 7, 2, 8, 4, 9, 3, 5, 7, 2, 8, 4, 6, 3, 7, 2, 9, 4, 8, 3,
                    7, 2, 5, 8, 4, 9, 3, 6, 7, 2, 8, 5,
                  ].map((height, i) => (
                    <div
                      key={i}
                      className="bg-black w-1"
                      style={{ height: `${height * 10}%` }}
                    />
                  ))}
                </div>
                <div className="text-center text-xs text-gray-600 font-mono mt-1">
                  {staff.staffId || staff.id || "000000000000"}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {user && user.role === "admin" ? (
              <div className="flex flex-col md:flex-row gap-3 mt-6">
                <button className="w-full md:flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-medium transition-all shadow-md hover:shadow-lg">
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button className="w-full md:flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-medium transition-all shadow-md hover:shadow-lg">
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            ) : (
              <div className="text-center text-sm text-gray-500 bg-gray-50 p-3 rounded-lg mt-6">
                You do not have permissions to modify this staff member
              </div>
            )}
          </div>

          {/* Decorative curves - bottom */}
          <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-tl from-blue-600 to-blue-700 rounded-tr-full"></div>
          <div className="absolute bottom-0 left-0 w-2/3 h-16 bg-gradient-to-tl from-blue-500 to-blue-600 rounded-tr-full"></div>

          {/* Footer stripe */}
          <div className="h-3 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 relative z-10"></div>
        </div>

        {/* Bottom tagline */}
        <div className="text-center mt-6 text-sm text-gray-500">
          Official Staff Identification Card
        </div>
      </div>
    </div>
  );
}
