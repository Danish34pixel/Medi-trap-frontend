import React from "react";
import Logo from "../Logo";

const Avatar = ({ name, size = 48, className = "" }) => {
  const initials =
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";

  const colors = [
    "from-orange-400 to-pink-400",
    "from-cyan-400 to-blue-400",
    "from-purple-400 to-pink-400",
    "from-green-400 to-cyan-400",
  ];
  const colorIndex = name?.charCodeAt(0) % colors.length || 0;

  return (
    <div
      className={`rounded-full bg-gradient-to-br ${colors[colorIndex]} flex items-center justify-center text-white font-bold ${className}`}
      style={{ width: size, height: size, fontSize: size / 2.5 }}
    >
      {initials}
    </div>
  );
};

function formatDate(d) {
  if (!d) return "—";
  try {
    const dt = new Date(d);
    if (isNaN(dt)) return "—";
    return dt.toLocaleDateString();
  } catch {
    return "—";
  }
}

function renderValue(val, fallback = "—") {
  if (val === null || val === undefined) return fallback;
  if (typeof val === "string" || typeof val === "number") return String(val);
  if (Array.isArray(val)) return val.join(", ");
  if (typeof val === "object") {
    // common address shape
    const { street, city, state, pincode } = val || {};
    if (street || city || state || pincode) {
      return [street, city, state, pincode].filter(Boolean).join(", ");
    }
    if (val.name) return renderValue(val.name, fallback);
    const parts = Object.values(val).filter(
      (v) => v !== null && v !== undefined
    );
    if (parts.length) return parts.join(", ");
    return fallback;
  }
  return String(val);
}

export default function IdentityCard({ stockist, qrDataUrl, onPrint }) {
  return (
    <div className="w-full max-w-4xl bg-white overflow-hidden mx-auto print:shadow-none relative">
      {/* Decorative waves at top */}
      <div className="relative bg-gradient-to-r from-blue-600 to-blue-700 h-32 overflow-hidden">
        <div className="absolute top-0 right-0 w-2/3 h-full">
          <svg
            className="absolute top-0 right-0 h-full w-full"
            viewBox="0 0 800 200"
            preserveAspectRatio="none"
          >
            <path
              d="M0,0 L800,0 L800,200 Q600,150 400,180 T0,160 Z"
              fill="rgba(59, 130, 246, 0.3)"
            />
            <path
              d="M0,20 L800,20 L800,200 Q600,160 400,190 T0,170 Z"
              fill="rgba(29, 78, 216, 0.2)"
              className="opacity-70"
            />
          </svg>
        </div>
        <div className="relative z-10 px-6 py-4 flex items-center justify-between">
          <Logo className="h-8 w-auto filter invert brightness-0 invert" />
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-col md:flex-row gap-8 px-8 py-6 -mt-12 relative z-20">
        {/* Left side - Photo */}
        <div className="flex flex-col items-center md:w-1/3">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full transform scale-110 opacity-20"></div>
            {stockist?.profileImageUrl ? (
              <img
                src={stockist?.profileImageUrl}
                alt={`${renderValue(stockist?.name, "profile")} profile`}
                className="relative w-44 h-44 rounded-full object-cover border-8 border-white shadow-2xl"
              />
            ) : (
              <div className="relative w-44 h-44 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center border-8 border-white shadow-2xl">
                <Avatar name={renderValue(stockist?.name, "")} size={120} />
              </div>
            )}
          </div>
        </div>

        {/* Right side - Details */}
        <div className="flex-1 md:w-2/3 bg-white rounded-2xl p-6">
          {/* ID Badge */}
          <div className="inline-block bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2 rounded-full mb-4 shadow-lg">
            <span className="font-bold text-sm uppercase tracking-wide">
              {stockist?.roleType || stockist?.designation || "ID CARD"}
            </span>
          </div>

          {/* Name */}
          <h2 className="text-4xl font-extrabold text-blue-900 mb-2 uppercase tracking-wide">
            {renderValue(
              stockist?.contactPerson || stockist?.name,
              "EMPLOYEE NAME"
            )}
          </h2>

          {/* Details grid */}
          <div className="space-y-3 mt-6">
            <div className="flex items-center border-b border-gray-200 pb-2">
              <span className="font-bold text-gray-700 w-32">Student Id</span>
              <span className="text-gray-900 font-semibold">
                : {stockist?._id ? String(stockist._id).slice(-8) : "00000000"}
              </span>
            </div>
            <div className="flex items-center border-b border-gray-200 pb-2">
              <span className="font-bold text-gray-700 w-32">Date</span>
              <span className="text-gray-900 font-semibold">
                : {formatDate(stockist?.dob)}
              </span>
            </div>
            <div className="flex items-center border-b border-gray-200 pb-2">
              <span className="font-bold text-gray-700 w-32">Address</span>
              <span className="text-gray-900 font-semibold">
                : {renderValue(stockist?.address || stockist?.location, "N/A")}
              </span>
            </div>
            <div className="flex items-center border-b border-gray-200 pb-2">
              <span className="font-bold text-gray-700 w-32">Phone</span>
              <span className="text-gray-900 font-semibold">
                :{" "}
                {renderValue(
                  stockist?.phone || stockist?.contactNo,
                  "000-000-123456"
                )}
              </span>
            </div>
            <div className="flex items-center">
              <span className="font-bold text-gray-700 w-32">Blood Group</span>
              <span className="text-gray-900 font-semibold">
                : {stockist?.bloodGroup || "-"}
              </span>
            </div>
          </div>

          {/* Barcode/QR section */}
          <div className="mt-6 flex justify-end">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="Barcode"
                className="h-16 object-contain"
              />
            ) : (
              <div className="h-16 w-48 bg-gray-200 flex items-center justify-center rounded">
                <div className="flex gap-0.5">
                  {[...Array(30)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-black"
                      style={{ height: `${Math.random() * 40 + 20}px` }}
                    ></div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Decorative waves at bottom */}
      <div className="relative bg-gradient-to-r from-blue-600 to-blue-700 h-20 overflow-hidden mt-4">
        <svg
          className="absolute bottom-0 left-0 w-full h-full"
          viewBox="0 0 800 100"
          preserveAspectRatio="none"
        >
          <path
            d="M0,100 L0,40 Q200,20 400,40 T800,40 L800,100 Z"
            fill="rgba(59, 130, 246, 0.3)"
          />
          <path
            d="M0,100 L0,50 Q200,30 400,50 T800,50 L800,100 Z"
            fill="rgba(29, 78, 216, 0.2)"
          />
        </svg>
      </div>

      {/* Print button */}
      <div className="mt-6 print:hidden px-8 pb-6">
        <button
          onClick={onPrint}
          className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-bold uppercase tracking-wide"
        >
          Print Card
        </button>
      </div>
    </div>
  );
}
