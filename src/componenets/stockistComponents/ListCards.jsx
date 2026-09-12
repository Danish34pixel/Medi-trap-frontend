import React from "react";
import { Building2, Pill, Phone } from "lucide-react";
import Avatar from "./Avatar";

/**
 * Shared list cards matching Nebula's CompanyCard / MedicineCard / StaffCard
 * from stockist-dashboard.jsx (orange for companies, blue for medicines,
 * purple for staff).
 */
export function CompanyCard({ company, productCount = 0 }) {
  const goToCompany = () => {
    if (company?._id) window.location.href = `/company/${company._id}/products`;
  };

  return (
    <div className="bg-gradient-to-br from-white to-orange-50 rounded-3xl p-6 shadow-card hover:shadow-card-lg transition-all duration-300 border-2 border-orange-100 group">
      <div className="flex items-center gap-4 mb-5">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 via-amber-500 to-yellow-500 flex items-center justify-center shadow-xl group-hover:rotate-6 transition-transform shrink-0">
          <Building2 className="w-8 h-8 text-white" />
        </div>
        <div className="min-w-0">
          <h3 className="font-black text-gray-900 text-lg mb-1 truncate">
            {company?.name ||
              company?.companyName ||
              company?.title ||
              company?.shortName ||
              "Company"}
          </h3>
          <p className="text-sm text-gray-600 font-semibold">
            {productCount} products
          </p>
        </div>
      </div>
      <button
        onClick={goToCompany}
        className="w-full py-3.5 bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 text-white rounded-2xl text-sm font-bold hover:shadow-xl transform hover:scale-105 transition-all"
      >
        {company?._id ? "View Details →" : "No Details"}
      </button>
    </div>
  );
}

export function MedicineCard({ medicine }) {
  return (
    <div className="bg-gradient-to-br from-white to-blue-50 rounded-3xl p-6 shadow-card hover:shadow-card-lg transition-all duration-300 border-2 border-blue-100 group">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500 flex items-center justify-center shadow-xl group-hover:rotate-6 transition-transform shrink-0">
          <Pill className="w-8 h-8 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-black text-gray-900 text-lg mb-1 truncate">
            {medicine?.name}
          </h3>
          <p className="text-sm text-gray-600 font-semibold truncate">
            {medicine?.company?.name || medicine?.companyName || ""}
          </p>
        </div>
      </div>
      {medicine?.price ? (
        <div className="inline-block px-5 py-2.5 bg-gradient-to-r from-emerald-400 to-green-500 rounded-xl shadow-md">
          <span className="text-white font-black text-base">
            {medicine.price}
          </span>
        </div>
      ) : null}
    </div>
  );
}

export function StaffCard({ staff, onView }) {
  const goToStaff = () => {
    if (onView) return onView(staff);
    if (staff?._id) window.location.href = `/staff/${staff._id}`;
  };

  return (
    <div className="bg-gradient-to-br from-white to-purple-50 rounded-3xl p-6 shadow-card hover:shadow-card-lg transition-all duration-300 border-2 border-purple-100 group hover:scale-[1.02] transform">
      <div className="flex items-center gap-4 mb-5">
        <Avatar
          name={staff?.fullName || staff?.name || "S"}
          size={64}
          className="group-hover:scale-110 transition-transform"
        />
        <div className="min-w-0 flex-1">
          <h3 className="font-black text-gray-900 text-lg mb-1 truncate">
            {staff?.fullName || staff?.name}
          </h3>
          <p className="text-sm text-purple-600 font-bold">
            {staff?.role || "Staff Member"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-700 mb-4 font-semibold bg-white px-4 py-2 rounded-xl">
        <Phone className="w-4 h-4 text-gray-400 shrink-0" />
        <span className="truncate">
          {staff?.phone || staff?.contact || "No phone"}
        </span>
      </div>
      <button
        onClick={goToStaff}
        className="w-full py-3.5 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 text-white rounded-2xl text-sm font-bold hover:shadow-xl transform hover:scale-105 transition-all"
      >
        View Profile →
      </button>
    </div>
  );
}
