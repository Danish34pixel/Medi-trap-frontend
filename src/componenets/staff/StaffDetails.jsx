import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { User, Edit2, Trash2, ChevronLeft } from "lucide-react";
import { apiUrl } from "../config/api";
import { getCookie } from "../utils/cookies";

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

  const formattedAddress = (() => {
    if (!staff || !staff.address) return "N/A";
    if (typeof staff.address === "object") {
      const { street, city, state, pincode } = staff.address;
      return [street, city, state, pincode].filter(Boolean).join(", ") || "N/A";
    }
    return staff.address;
  })();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-100">
        <div className="w-full max-w-md bg-white p-8 rounded-4xl shadow-card-lg text-center">
          <div className="w-10 h-10 mx-auto mb-4 animate-spin rounded-full border-4 border-purple-200 border-t-role-staff" />
          <div className="text-slate-500 font-medium">
            Loading staff details...
          </div>
        </div>
      </div>
    );
  }

  if (error || !staff) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-100">
        <div className="w-full max-w-md bg-white p-8 rounded-4xl shadow-card-lg text-center">
          <div className="text-red-600 font-semibold mb-4">
            {error || "Staff not found."}
          </div>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-role-staff-from to-role-staff-to hover:brightness-105 transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const staffIdValue = staff.staffId || staff.id || "N/A";
  const approvalValue = (
    staff.approvalStatus || (staff.approved ? "approved" : "pending")
  ).toUpperCase();
  const worksForValue = `${
    staff.workForType === "medical" ? "Medical" : "Stockist"
  } - ${staff.workForName || "N/A"}`;
  const joiningDateValue =
    staff.joiningDate ||
    new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 w-11 h-11 rounded-full bg-white shadow-card flex items-center justify-center text-slate-800 hover:bg-slate-50 transition-colors"
          aria-label="Go back"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* ID Card */}
        <div className="bg-white rounded-4xl shadow-card-lg overflow-hidden relative border border-slate-100">
          {/* Decorative curves - top */}
          <div className="absolute top-0 right-0 w-full h-32 bg-gradient-to-br from-role-staff-from to-role-staff-to rounded-bl-full" />
          <div className="absolute top-0 right-0 w-3/4 h-24 bg-gradient-to-br from-role-staff-from to-role-staff-to opacity-80 rounded-bl-full" />

          {/* Header with company logo area */}
          <div className="relative pt-6 px-8 pb-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center ring-2 ring-white/40">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white drop-shadow-sm">
                  {stockistName || "MEDITRAP"}
                </h1>
                <p className="text-xs text-white/80">Staff Management System</p>
              </div>
            </div>
          </div>

          {/* Main content area */}
          <div className="relative px-8 pb-8">
            <div className="flex flex-col items-center text-center">
              {/* Photo Section */}
              <div className="relative -mt-2 mb-4">
                <div className="w-32 h-32 rounded-full border-4 border-role-staff shadow-xl overflow-hidden bg-slate-100 ring-4 ring-purple-100">
                  <img
                    src={
                      staff.image ||
                      staff.profileImageUrl ||
                      "https://via.placeholder.com/400"
                    }
                    alt="Staff"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute left-1/2 -translate-x-1/2 -bottom-4 bg-role-staff text-white px-4 py-1.5 rounded-full font-extrabold text-[11px] tracking-wider shadow-lg whitespace-nowrap">
                  STAFF ID CARD
                </div>
              </div>

              <h3 className="text-2xl font-extrabold text-purple-950 mt-4 mb-6">
                {staff.fullName || staff.name}
              </h3>

              <div className="w-full space-y-3 text-left">
                <DetailRow label="Staff ID" value={staffIdValue} />
                <DetailRow label="Approval" value={approvalValue} />
                <DetailRow label="Works For" value={worksForValue} />
                <DetailRow label="Joining Date" value={joiningDateValue} />
                <DetailRow
                  label="Contact"
                  value={staff.contact || staff.contactNo || staff.phone || "N/A"}
                />
                <DetailRow label="Email" value={staff.email || "N/A"} breakAll />
                <DetailRow label="Address" value={formattedAddress} />
              </div>
            </div>

            {/* Barcode Section */}
            <div className="flex justify-center mt-8">
              <div className="bg-white p-4 rounded-xl border border-slate-100">
                <div className="flex gap-px h-16 items-end">
                  {[
                    3, 7, 2, 8, 4, 9, 3, 5, 7, 2, 8, 4, 6, 3, 7, 2, 9, 4, 8, 3,
                    7, 2, 5, 8, 4, 9, 3, 6, 7, 2, 8, 5,
                  ].map((height, i) => (
                    <div
                      key={i}
                      className="bg-slate-900 w-1"
                      style={{ height: `${height * 10}%` }}
                    />
                  ))}
                </div>
                <div className="text-center text-xs text-slate-500 font-mono mt-1 tracking-widest">
                  {staffIdValue !== "N/A" ? staffIdValue : "000000000000"}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {user && user.role === "admin" ? (
              <div className="flex flex-col md:flex-row gap-3 mt-6">
                <button
                  onClick={() =>
                    alert(
                      "Feature coming soon: edit functionality will be available in the next update."
                    )
                  }
                  className="w-full md:flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-role-staff-from to-role-staff-to hover:brightness-105 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Details
                </button>
                <button
                  onClick={() =>
                    alert(
                      "Feature coming soon: delete functionality will be available in the next update."
                    )
                  }
                  className="w-full md:flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Member
                </button>
              </div>
            ) : (
              <div className="text-center text-sm text-slate-500 bg-slate-50 p-3 rounded-xl mt-6 font-medium">
                Review staff profile in management dashboard
              </div>
            )}
          </div>

          {/* Decorative curves - bottom */}
          <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-tl from-role-staff-from to-role-staff-to opacity-90 rounded-tr-full" />
          <div className="absolute bottom-0 left-0 w-2/3 h-16 bg-gradient-to-tl from-role-staff-from to-role-staff-to rounded-tr-full" />

          {/* Footer stripe */}
          <div className="h-2 bg-gradient-to-r from-role-staff-from via-role-staff to-role-staff-from relative z-10" />
        </div>

        {/* Bottom tagline */}
        <div className="text-center mt-6 text-xs text-slate-400 italic">
          Official Staff Identification Card
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, breakAll }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-slate-500 font-semibold w-28 shrink-0 text-sm">
        {label}
      </span>
      <span className="text-slate-300">:</span>
      <span
        className={`text-slate-800 font-semibold text-sm ${
          breakAll ? "break-all" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}
