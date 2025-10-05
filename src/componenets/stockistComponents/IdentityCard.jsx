import React from "react";
import Avatar from "./Avatar";
import Logo from "../Logo";

export default function IdentityCard({ stockist = {}, qrDataUrl, onPrint }) {
  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return "DD/MM/YYYY";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    // Responsive ID Card — stacks vertically on small screens and lays out
    // horizontally from `sm` and above. Avoid fixed heights so the card can
    // scale naturally across breakpoints.
    <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-gray-300 overflow-hidden mx-auto print:shadow-none print:border-0">
      {/* --- Top Header / Company Strip --- */}
      <div className="flex items-center justify-between px-4 py-2 bg-blue-800 text-white">
        <Logo className="h-6 w-auto filter invert" />{" "}
        {/* Inverting logo for dark background */}
        <div className="text-right"></div>
      </div>

      {/* --- Main Content Area (Photo, Details, QR) --- */}
      <div className="flex flex-col sm:flex-row p-4">
        {/* --- Left Column: Photo & Role --- */}
        <div className="flex flex-col items-center sm:w-1/3 w-full sm:pr-3 sm:border-r border-gray-100 pb-4 sm:pb-0">
          {/* Profile Photo */}
          <div className="flex-shrink-0 mb-2">
            {stockist?.profileImageUrl ? (
              <img
                src={stockist?.profileImageUrl}
                alt={`${stockist?.name || "profile"} profile`}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-gray-200 shadow-md"
              />
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-300 rounded-full flex items-center justify-center border-4 border-gray-200">
                <Avatar name={stockist?.name || ""} size={56} />
              </div>
            )}
          </div>

          {/* Name and Designation */}
          <div className="text-center w-full">
            <p className="text-xs font-semibold text-blue-800 uppercase leading-tight mt-1">
              {stockist?.roleType || stockist?.designation || "DESIGNATION"}
            </p>
          </div>
        </div>

        {/* --- Right Column: Details & QR/Signature --- */}
        <div className="flex flex-col sm:w-2/3 w-full sm:pl-4">
          {/* Main Name/ID */}
          <h2 className="text-lg md:text-xl font-extrabold text-gray-900 truncate leading-tight">
            {stockist?.contactPerson || stockist?.name || "Employee Name"}
          </h2>
          <p className="text-xs text-gray-500 mb-3">
            ID: **{stockist?._id ? String(stockist._id).slice(-8) : "00000000"}
            **
          </p>

          {/* Information Grid (Two columns, small gap) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs flex-grow">
            {/* Row 1 */}
            <div>
              <div className="font-medium text-gray-500">Joined</div>
              <div className="font-semibold text-gray-900">
                {formatDate(stockist?.createdAt || stockist?.joinedDate)}
              </div>
            </div>
            <div>
              <div className="font-medium text-gray-500">D.O.B</div>
              <div className="font-semibold text-gray-900">
                {formatDate(stockist?.dob)}
              </div>
            </div>

            {/* Row 2 */}
            <div>
              <div className="font-medium text-gray-500">Phone</div>
              <div className="font-semibold text-gray-900">
                {stockist?.phone || stockist?.contactNo || "000-000-123456"}
              </div>
            </div>
            <div>
              <div className="font-medium text-gray-500">Blood Group</div>
              <div className="font-semibold text-gray-900">
                {stockist?.bloodGroup || "-"}
              </div>
            </div>
          </div>

          {/* Bottom Row: QR Code and Signature */}
          <div className="flex items-end justify-between mt-2 pt-2 border-t border-gray-100">
            {/* QR Code */}
            <div className="w-12 h-12 sm:w-14 sm:h-14 border border-gray-300 rounded-sm p-0.5">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="QR Code"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-100 rounded-sm"></div>
              )}
            </div>

            {/* Signature Placeholder */}
            <div className="text-right">
              <div className="h-6 w-24 border-b border-gray-400 mb-1"></div>
              <p className="text-[10px] text-gray-600">Authorized Signature</p>
            </div>
          </div>
        </div>
      </div>

      {/* Print button (outside the ID card view) */}
      <div className="mt-4 print:hidden p-4">
        <button
          onClick={onPrint}
          className="w-full px-4 py-2 bg-gradient-to-r from-blue-700 to-blue-800 text-white rounded-lg shadow hover:from-blue-800 hover:to-blue-900 transition-all duration-200 font-medium"
        >
          Print Card
        </button>
      </div>
    </div>
  );
}
