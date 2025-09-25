import React from "react";
import Avatar from "./Avatar";
import Logo from "../Logo";

export default function IdentityCard({ stockist, qrDataUrl, onPrint }) {
  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return "DD/MM/YEAR";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="w-full max-w-md bg-white rounded-lg shadow-xl border border-gray-200 print:shadow-none print:border-0">
      {/* Header with company logo */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white  rounded-t-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700"></div>
        <div className="relative z-10 mt-4 ml-1">
          <Logo className="h-[5vh] absolute mr-80" />
        </div>
      </div>

      <div className="p-6">
        {/* Profile section */}
        <div className="flex items-start gap-4 mb-6">
          <div className="flex-shrink-0">
            {stockist.profileImageUrl ? (
              <img
                src={stockist.profileImageUrl}
                alt={`${stockist.name} profile`}
                className="w-20 h-20 rounded-lg object-cover border-2 border-gray-200"
              />
            ) : (
              <div className="w-20 h-20 bg-gray-300 rounded-lg flex items-center justify-center">
                <Avatar name={stockist.name} size={80} />
              </div>
            )}
          </div>

          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              {stockist.contactPerson || stockist.name || "Unnamed"}
            </h2>
            <p className="text-red-600 font-medium text-sm">
              {stockist.roleType || stockist.designation || "Proprietor"}
            </p>
          </div>

          {/* QR Code */}
          <div className="flex-shrink-0">
            <div className="w-16 h-16 border border-gray-300 rounded">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="QR Code"
                  className="w-full h-full object-cover rounded"
                />
              ) : (
                <div className="w-full h-full bg-gray-100 rounded flex items-center justify-center">
                  <div className="w-8 h-8 bg-black rounded-sm opacity-80"></div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Information Grid */}
        <div className="space-y-4">
          {/* First Row */}
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div>
              <div className="font-medium text-gray-700 mb-1">ID No</div>
              <div className="text-gray-900">
                {stockist._id ? String(stockist._id).slice(-8) : "00000000"}
              </div>
            </div>
            <div>
              <div className="font-medium text-gray-700 mb-1">Joined Date</div>
              <div className="text-gray-900">
                {formatDate(stockist.createdAt || stockist.joinedDate)}
              </div>
            </div>
            <div>
              <div className="font-medium text-gray-700 mb-1">Email</div>
              <div className="text-gray-900 truncate">
                {stockist.email || "youremail@here"}
              </div>
            </div>
          </div>

          {/* Second Row */}
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div>
              <div className="font-medium text-gray-700 mb-1">D.O.B</div>
              <div className="text-gray-900">{formatDate(stockist.dob)}</div>
            </div>
            <div>
              <div className="font-medium text-gray-700 mb-1">
                License Expiry
              </div>
              <div className="text-gray-900">
                {formatDate(stockist.licenseExpiry)}
              </div>
            </div>
            <div>
              <div className="font-medium text-gray-700 mb-1">Phone</div>
              <div className="text-gray-900">
                {stockist.phone || stockist.contactNo || "000-000-123456"}
              </div>
            </div>
          </div>

          {/* Third Row: extra real fields */}
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div>
              <div className="font-medium text-gray-700 mb-1">Blood Group</div>
              <div className="text-gray-900">{stockist.bloodGroup || "-"}</div>
            </div>
            <div>
              <div className="font-medium text-gray-700 mb-1">CNTX No</div>
              <div className="text-gray-900">{stockist.cntxNumber || "-"}</div>
            </div>
            <div>
              <div className="font-medium text-gray-700 mb-1">Role</div>
              <div className="text-gray-900">{stockist.roleType || "-"}</div>
            </div>
          </div>
        </div>

        {/* Signature section */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex justify-between items-end">
            <div className="text-right">
              <div className="text-xs text-gray-500 mb-1">Yours Signature</div>
              <div className="text-xs font-medium text-gray-700">
                Yours Sincerely
              </div>
            </div>
          </div>
        </div>

        {/* Print button */}
        <div className="mt-4 print:hidden">
          <button
            onClick={onPrint}
            className="w-full px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg shadow hover:from-red-700 hover:to-red-800 transition-all duration-200 font-medium"
          >
            Print Card
          </button>
        </div>
      </div>
    </div>
  );
}
