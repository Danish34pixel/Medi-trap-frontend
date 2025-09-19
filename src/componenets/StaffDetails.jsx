import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiUrl } from "./config/api";
import { QRCodeCanvas } from "qrcode.react";

export default function StaffDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user] = useState(() => {
    try {
      const u = localStorage.getItem("user");
      return u ? JSON.parse(u) : null;
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(apiUrl(`/api/staff/${id}`), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        // if unauthorized, redirect to login
        if (res.status === 401) {
          alert("Session expired or unauthorized — please sign in.");
          navigate("/login");
          return;
        }

        const d = await res.json().catch(() => ({}));
        if (res.ok) setStaff(d.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigate]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (!staff) return <div className="p-6 text-red-600">Staff not found</div>;

  const frontendBase = window.location.origin.replace(/\/+$/, "");
  const qrUrl = `${frontendBase}/staff/${staff._id}`;

  const imgSrc = staff.image?.startsWith("http")
    ? staff.image
    : `${window.location.origin.replace(/\/+$/, "")}${staff.image}`;

  return (
    <div className="min-h-screen flex items-start justify-center p-3 md:p-6 bg-slate-50">
      <div className="w-full max-w-xl bg-white p-4 md:p-6 rounded shadow">
        {/* Main Profile Section - Responsive Layout */}
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Mobile: Stack image and info vertically */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 flex-1">
            <img
              src={imgSrc}
              alt="photo"
              className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded"
            />
            <div className="text-center sm:text-left">
              <h3 className="text-lg sm:text-xl font-semibold">
                {staff.fullName}
              </h3>
              <div className="text-sm text-slate-600 mt-1">{staff.contact}</div>
              <div className="text-sm text-slate-600">{staff.email}</div>
              <div className="text-sm text-slate-600">{staff.address}</div>
            </div>
          </div>

          {/* QR Code - Centered on mobile, right-aligned on desktop */}
          <div className="flex justify-center md:ml-auto">
            <QRCodeCanvas
              value={qrUrl}
              size={120}
              className="sm:w-[140px] sm:h-[140px]"
            />
          </div>
        </div>

        {/* Identity Card Section */}
        <div className="mt-6">
          <h4 className="font-semibold mb-2">Identity Card</h4>
          <div className="border p-3 md:p-4 rounded">
            {/* Mobile: Stack vertically, Desktop: Keep horizontal */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <img
                src={imgSrc}
                alt="photo"
                className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded mx-auto sm:mx-0"
              />
              <div className="text-center sm:text-left flex-1">
                <div className="font-semibold text-sm sm:text-base">
                  {staff.fullName}
                </div>
                <div className="text-xs sm:text-sm text-slate-600">
                  {staff.contact}
                </div>
                <div className="text-xs sm:text-sm text-slate-600">
                  {staff.email}
                </div>
              </div>
              <div className="flex justify-center sm:ml-auto">
                <QRCodeCanvas
                  value={qrUrl}
                  size={80}
                  className="sm:w-[90px] sm:h-[90px]"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-4">
            {user &&
            (user.role === "admin" ||
              String(user._id) === String(staff.stockist)) ? (
              <div className="flex flex-col sm:flex-row gap-3">
                <button className="px-4 py-2 bg-blue-600 text-white rounded text-sm sm:text-base">
                  Edit
                </button>
                <button className="px-4 py-2 bg-red-600 text-white rounded text-sm sm:text-base">
                  Delete
                </button>
              </div>
            ) : (
              <div className="text-sm text-gray-500">
                You do not have permissions to modify this staff.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
