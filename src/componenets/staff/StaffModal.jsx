import React from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Link } from "react-router-dom";

export default function StaffModal({ staff, onClose }) {
  if (!staff) return null;
  const frontendBase = window.location.origin.replace(/\/+$/, "");
  const url = `${frontendBase}/staff/${staff._id}`;
  const imgSrc = staff.image?.startsWith("http")
    ? staff.image
    : `${window.location.origin}${staff.image}`;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded p-6 w-full max-w-md">
        <div className="flex items-start gap-4">
          <img
            src={imgSrc}
            alt="photo"
            className="w-20 h-20 object-cover rounded"
          />
          <div className="flex-1">
            <div className="font-semibold text-lg">{staff.fullName}</div>
            <div className="text-sm text-slate-600">{staff.contact}</div>
            <div className="text-sm text-slate-600">{staff.email}</div>
            <div className="text-sm text-slate-600">{staff.address}</div>
          </div>
          <button onClick={onClose} className="text-slate-500">
            Close
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div>
            <QRCodeCanvas value={url} size={120} />
          </div>
          <div className="flex flex-col gap-2">
            <Link
              to={`/staff/${staff._id}`}
              className="px-4 py-2 bg-emerald-600 text-white rounded text-center"
            >
              Open Full
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
