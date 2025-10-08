import React from "react";
import { QRCodeCanvas } from "qrcode.react";
import { useNavigate } from "react-router-dom";
import API_BASE, { apiUrl } from "../config/api";

export default function StaffCard({ staff, onOpen }) {
  const frontendBase = window.location.origin.replace(/\/+$/, "");
  const url = `${frontendBase}/staff/${staff._id}`;

  const imgSrc = staff.image?.startsWith("http")
    ? staff.image
    : apiUrl(staff.image);

  const go = () => {
    if (onOpen) return onOpen(staff);
    // fallback to navigation when no onOpen provided
    try {
      const navigate = useNavigate();
      navigate(`/staff/${staff._id}`);
    } catch (e) {
      window.location.href = `/staff/${staff._id}`;
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={go}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") go();
      }}
      className="border rounded p-4 flex gap-4 items-center cursor-pointer hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-300"
    >
      <img
        src={imgSrc}
        alt="photo"
        className="w-20 h-20 object-cover rounded"
      />
      <div className="flex-1">
        <div className="font-semibold">{staff.fullName}</div>
        <div className="text-sm text-slate-600">{staff.contact}</div>
      </div>
      <div
        className="flex flex-col items-center gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        <div aria-hidden>
          <QRCodeCanvas value={url} size={90} />
        </div>
      </div>
    </div>
  );
}
