import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiUrl } from "./config/api";
import { QRCodeCanvas } from "qrcode.react";

export default function StaffDetails() {
  const { id } = useParams();
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
        const res = await fetch(apiUrl(`/api/staff/${id}`));
        const d = await res.json().catch(() => ({}));
        if (res.ok) setStaff(d.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (!staff) return <div className="p-6 text-red-600">Staff not found</div>;

  const frontendBase = window.location.origin.replace(/\/+$/, "");
  const qrUrl = `${frontendBase}/staff/${staff._id}`;

  const imgSrc = staff.image?.startsWith("http")
    ? staff.image
    : `${window.location.origin.replace(/\/+$/, "")}${staff.image}`;

  return (
    <div className="min-h-screen flex items-start justify-center p-6 bg-slate-50">
      <div className="w-full max-w-xl bg-white p-6 rounded shadow">
        <div className="flex items-center gap-4">
          <img
            src={imgSrc}
            alt="photo"
            className="w-28 h-28 object-cover rounded"
          />
          <div>
            <h3 className="text-xl font-semibold">{staff.fullName}</h3>
            <div className="text-sm text-slate-600">{staff.contact}</div>
            <div className="text-sm text-slate-600">{staff.email}</div>
            <div className="text-sm text-slate-600">{staff.address}</div>
          </div>
          <div className="ml-auto">
            <QRCodeCanvas value={qrUrl} size={140} />
          </div>
        </div>

        <div className="mt-6">
          <h4 className="font-semibold mb-2">Identity Card</h4>
          <div className="border p-4 rounded flex items-center gap-4">
            <img
              src={staff.image}
              alt="photo"
              className="w-20 h-20 object-cover rounded"
            />
            <div>
              <div className="font-semibold">{staff.fullName}</div>
              <div className="text-sm text-slate-600">{staff.contact}</div>
              <div className="text-sm text-slate-600">{staff.email}</div>
            </div>
            <div className="ml-auto">
              <QRCodeCanvas value={qrUrl} size={90} />
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            {user &&
            (user.role === "admin" ||
              String(user._id) === String(staff.stockist)) ? (
              <>
                <button className="px-4 py-2 bg-blue-600 text-white rounded">
                  Edit
                </button>
                <button className="px-4 py-2 bg-red-600 text-white rounded">
                  Delete
                </button>
              </>
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
