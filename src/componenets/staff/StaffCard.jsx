import React from "react";
import { QRCodeCanvas } from "qrcode.react";
import { useNavigate } from "react-router-dom";
import API_BASE from "../config/api";
import Avatar from "../stockistComponents/Avatar";

// normalize image URL: accept absolute URLs (cloudinary) or relative paths from backend
const resolveImg = (img) => {
  if (!img) return null;
  try {
    if (img.startsWith("http")) return img;
  } catch (e) {}
  const path = img.startsWith("/") ? img : `/${img}`;
  return `${API_BASE}${path}`;
};

export default function StaffCard({ staff, onOpen }) {
  const navigate = useNavigate();
  const frontendBase = window.location.origin.replace(/\/+$/, "");
  const url = `${frontendBase}/staff/${staff._id}`;
  const imgSrc = resolveImg(staff.image);

  const go = () => {
    if (onOpen) return onOpen(staff);
    navigate(`/staff/${staff._id}`);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={go}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") go();
      }}
      className="bg-white rounded-2xl p-4 flex gap-4 items-center cursor-pointer border border-slate-100 shadow-card hover:shadow-card-lg hover:border-purple-200 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-role-staff"
    >
      <div className="relative shrink-0">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={staff.fullName}
            className="w-16 h-16 rounded-xl object-cover"
          />
        ) : (
          <Avatar name={staff.fullName} size={64} />
        )}
        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-semibold text-slate-800 truncate">
          {staff.fullName}
        </div>
        <div className="text-sm text-slate-500 truncate">{staff.contact}</div>
        <div className="text-xs text-slate-400 truncate">{staff.email}</div>
      </div>

      <div
        className="flex flex-col items-center gap-2 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="hidden sm:flex bg-white p-1 rounded-lg border border-slate-100">
          <QRCodeCanvas value={url} size={56} />
        </div>
        <div className="text-xs font-medium text-emerald-600">Active</div>
      </div>
    </div>
  );
}
