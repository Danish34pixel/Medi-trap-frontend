import React from "react";
import { QRCodeCanvas } from "qrcode.react";
import { useNavigate } from "react-router-dom";
import { X, MapPin, ExternalLink } from "lucide-react";
import API_BASE from "../config/api";
import Avatar from "../stockistComponents/Avatar";

const resolveImg = (img) => {
  if (!img) return null;
  try {
    if (img.startsWith("http")) return img;
  } catch (e) {}
  const path = img.startsWith("/") ? img : `/${img}`;
  return `${API_BASE}${path}`;
};

const formatAddress = (address) => {
  if (!address) return "N/A";
  if (typeof address === "object") {
    const { street, city, state, pincode } = address;
    return [street, city, state, pincode].filter(Boolean).join(", ") || "N/A";
  }
  return address;
};

export default function StaffModal({ staff, onClose }) {
  const navigate = useNavigate();
  if (!staff) return null;

  const frontendBase = window.location.origin.replace(/\/+$/, "");
  const url = `${frontendBase}/staff/${staff._id}`;
  const imgSrc = resolveImg(staff.image);

  const openFull = () => {
    onClose();
    navigate(`/staff/${staff._id}`);
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-4xl shadow-card-lg p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4 mb-4">
          {imgSrc ? (
            <img
              src={imgSrc}
              alt={staff.fullName}
              className="w-16 h-16 rounded-2xl object-cover bg-slate-100 shrink-0"
            />
          ) : (
            <div className="shrink-0">
              <Avatar name={staff.fullName} size={64} />
            </div>
          )}
          <div className="flex-1 min-w-0 pt-0.5">
            <h3 className="font-extrabold text-slate-800 text-lg truncate">
              {staff.fullName}
            </h3>
            <p className="text-sm text-slate-500 font-semibold">
              {staff.contact || "N/A"}
            </p>
            <p className="text-xs text-slate-400 truncate">
              {staff.email || "N/A"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 mb-6">
          <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
          <p className="text-xs text-slate-600 font-medium line-clamp-2">
            {formatAddress(staff.address)}
          </p>
        </div>

        <div className="flex items-center justify-between gap-5">
          <div className="p-2 bg-white rounded-2xl border border-slate-100 shadow-card shrink-0">
            <QRCodeCanvas value={url} size={90} />
          </div>
          <div className="flex-1">
            <button
              onClick={openFull}
              className="w-full h-12 rounded-xl font-bold text-white bg-gradient-to-r from-role-staff-from to-role-staff-to hover:brightness-105 transition flex items-center justify-center gap-2 mb-2"
            >
              Open Full Profile
              <ExternalLink className="w-4 h-4" />
            </button>
            <p className="text-center text-[11px] text-slate-400 font-semibold">
              Scan to view profile
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
