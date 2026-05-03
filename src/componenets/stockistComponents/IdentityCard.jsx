import React from "react";

// --- Utility Components ---
const Logo = ({ className }) => (
  <div className={`font-bold text-xl ${className}`}>LUVOX PVT LTD</div>
);

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

export default function IdentityCard({ stockist, qrDataUrl }) {
  const handlePrint = () => {
    const printContents = document.getElementById('id-card-print-area');
    if (!printContents) return window.print();
    const printWindow = window.open('', '', 'height=800,width=800');
    printWindow.document.write('<html><head><title>ID Card</title>');
    document.querySelectorAll('link[rel="stylesheet"], style').forEach((node) => {
      printWindow.document.write(node.outerHTML);
    });
    printWindow.document.write('</head><body style="background:white;margin:0;padding:0;">');
    printWindow.document.write('<div id="print-root" style="margin:0;padding:0;">');
    printWindow.document.write(printContents.innerHTML);
    printWindow.document.write('</div>');
    printWindow.document.write('<script>window.onload = function() { setTimeout(function() { window.focus(); window.print(); window.close(); }, 300); };</script>');
    printWindow.document.write('</body></html>');
    printWindow.document.close();
  };

  return (
    <div className="w-full max-w-sm mx-auto p-4 print:p-0 print:max-w-full print:m-0">
      
      <style>{`
        @media print {
            * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }

            @page {
                size: 53.98mm 85.6mm; 
                orientation: portrait;
                margin: 0;
            }
            
            .print\\:hidden, .print-only-card:not(#id-card-print-area) {
              display: none !important;
            }

            body.print-only-card {
                padding: 0 !important;
                margin: 0 !important;
                display: block !important;
                overflow: hidden !important;
                width: 53.98mm !important; 
                height: 85.6mm !important;
            }

            #id-card-print-area {
                width: 53.98mm;
                height: 85.6mm;
                margin: 0;
                padding: 0;
                box-shadow: none !important;
                border: none !important;
                display: block !important;
            }
            
            #id-card-print-area > div {
                width: 100%;
                height: 100%;
                border-radius: 0 !important;
                box-shadow: none !important;
                border: none !important;
                page-break-inside: avoid;
            }
        }
      `}</style>

      <div 
        id="id-card-print-area" 
        className="w-[280px] h-[480px] mx-auto shadow-2xl transition-all duration-300"
      >
        <div className="bg-white rounded-2xl overflow-hidden border-2 border-gray-200 w-full h-full flex flex-col">
          
          {/* Header */}
          <div className="flex-shrink-0 bg-gradient-to-r from-blue-900 to-blue-800 px-2 py-1.5 flex flex-col items-center justify-center text-center">
            <Logo className="text-white text-[10px] font-extrabold tracking-wider" />
            <div className="bg-yellow-400 text-blue-900 px-2 py-0.5 rounded-full mt-1 text-[7px] font-black uppercase">
              Authorized
            </div>
          </div>
          
          {/* Accent Stripe */}
          <div className="flex-shrink-0 h-1 bg-gradient-to-r from-yellow-400 to-yellow-500"></div>
          
          {/* Main Content */}
          <div className="p-3 flex flex-col items-center flex-grow">
            
            {/* Photo Section - FULLY ROUNDED */}
            <div className="relative mb-2">
              {/* Corner Brackets */}
              <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-blue-600"></div>
              <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-blue-600"></div>
              <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-blue-600"></div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-blue-600"></div>
              
              {stockist?.profileImageUrl ? (
                <img
                  src={stockist?.profileImageUrl}
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover border-2 border-white shadow-lg"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center border-2 border-white shadow-lg">
                  <Avatar name={renderValue(stockist?.name, "")} size={48} />
                </div>
              )}
            </div>
            
            {/* Role Badge */}
            <div className="inline-block bg-blue-900 text-white px-2 py-0.5 text-[8px] font-bold uppercase mb-1">
              {stockist?.roleType || stockist?.designation || "Employee"}
            </div>
            
            {/* Name */}
            <h1 className="text-sm font-black text-gray-900 uppercase leading-tight text-center px-1 mb-2">
              {renderValue(stockist?.contactPerson || stockist?.name, "Employee Name")}
            </h1>
            <div className="h-0.5 w-12 bg-gradient-to-r from-blue-600 to-yellow-400 mb-2"></div>

            {/* ID Number */}
            <div className="w-full bg-gray-50 border-l-4 border-blue-600 px-2 py-1.5 rounded-r mb-2">
              <p className="text-[7px] text-gray-500 font-semibold uppercase leading-tight">ID Number</p>
              <p className="text-xs font-bold text-blue-900 font-mono leading-tight">
                {stockist?._id ? String(stockist._id).slice(-8).toUpperCase() : "00000000"}
              </p>
            </div>
            
            {/* Contact Info */}
            <div className="w-full space-y-1 text-[9px] mb-1.5">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-semibold uppercase text-[7px]">Phone</span>
                <span className="font-bold text-gray-900">
                  {renderValue(stockist?.phone || stockist?.contactNo, "—")}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col">
                  <span className="text-gray-500 font-semibold uppercase text-[7px]">DOB</span>
                  <span className="font-bold text-gray-900">{formatDate(stockist?.dob)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-500 font-semibold uppercase text-[7px]">Blood</span>
                  <span className="font-bold text-gray-900">{stockist?.bloodGroup || "—"}</span>
                </div>
              </div>
            </div>

            {/* QR Code - CLEARLY VISIBLE */}
            <div className="w-full flex flex-col items-center my-2 bg-gray-50 py-2 rounded">
              <div className="bg-white p-1.5 rounded border-2 border-blue-600 shadow">
                {qrDataUrl ? (
                  <img 
                    src={qrDataUrl} 
                    alt="QR Code" 
                    className="w-16 h-16"
                    style={{ display: 'block' }}
                  />
                ) : (
                  <div className="w-16 h-16 bg-white" style={{ display: 'block' }}>
                    <svg width="64" height="64" viewBox="0 0 29 29" style={{ display: 'block', width: '100%', height: '100%' }}>
                      <rect width="29" height="29" fill="white"/>
                      <g fill="black">
                        <rect x="0" y="0" width="9" height="9" fill="none" stroke="black" strokeWidth="1"/>
                        <rect x="20" y="0" width="9" height="9" fill="none" stroke="black" strokeWidth="1"/>
                        <rect x="0" y="20" width="9" height="9" fill="none" stroke="black" strokeWidth="1"/>
                        <rect x="2" y="2" width="5" height="5"/>
                        <rect x="22" y="2" width="5" height="5"/>
                        <rect x="2" y="22" width="5" height="5"/>
                        <rect x="10" y="0" width="1" height="1"/>
                        <rect x="12" y="0" width="1" height="1"/>
                        <rect x="14" y="0" width="1" height="1"/>
                        <rect x="10" y="2" width="1" height="1"/>
                        <rect x="14" y="2" width="1" height="1"/>
                        <rect x="16" y="2" width="1" height="1"/>
                        <rect x="12" y="4" width="1" height="1"/>
                        <rect x="16" y="4" width="1" height="1"/>
                        <rect x="10" y="6" width="1" height="1"/>
                        <rect x="14" y="6" width="1" height="1"/>
                        <rect x="18" y="6" width="1" height="1"/>
                        <rect x="12" y="8" width="1" height="1"/>
                        <rect x="16" y="8" width="1" height="1"/>
                        <rect x="0" y="10" width="1" height="1"/>
                        <rect x="4" y="10" width="1" height="1"/>
                        <rect x="6" y="10" width="1" height="1"/>
                        <rect x="10" y="10" width="9" height="9"/>
                        <rect x="20" y="10" width="1" height="1"/>
                        <rect x="24" y="10" width="1" height="1"/>
                        <rect x="28" y="10" width="1" height="1"/>
                        <rect x="2" y="12" width="1" height="1"/>
                        <rect x="6" y="12" width="1" height="1"/>
                        <rect x="20" y="12" width="1" height="1"/>
                        <rect x="26" y="12" width="1" height="1"/>
                        <rect x="0" y="14" width="1" height="1"/>
                        <rect x="4" y="14" width="1" height="1"/>
                        <rect x="8" y="14" width="1" height="1"/>
                        <rect x="20" y="14" width="1" height="1"/>
                        <rect x="22" y="14" width="1" height="1"/>
                        <rect x="28" y="14" width="1" height="1"/>
                        <rect x="2" y="16" width="1" height="1"/>
                        <rect x="6" y="16" width="1" height="1"/>
                        <rect x="20" y="16" width="1" height="1"/>
                        <rect x="24" y="16" width="1" height="1"/>
                        <rect x="0" y="18" width="1" height="1"/>
                        <rect x="4" y="18" width="1" height="1"/>
                        <rect x="8" y="18" width="1" height="1"/>
                        <rect x="20" y="18" width="1" height="1"/>
                        <rect x="26" y="18" width="1" height="1"/>
                        <rect x="10" y="20" width="1" height="1"/>
                        <rect x="12" y="20" width="1" height="1"/>
                        <rect x="16" y="20" width="1" height="1"/>
                        <rect x="18" y="20" width="1" height="1"/>
                        <rect x="20" y="20" width="1" height="1"/>
                        <rect x="22" y="20" width="1" height="1"/>
                        <rect x="24" y="20" width="1" height="1"/>
                        <rect x="28" y="20" width="1" height="1"/>
                        <rect x="10" y="22" width="1" height="1"/>
                        <rect x="14" y="22" width="1" height="1"/>
                        <rect x="18" y="22" width="1" height="1"/>
                        <rect x="20" y="22" width="1" height="1"/>
                        <rect x="24" y="22" width="1" height="1"/>
                        <rect x="26" y="22" width="1" height="1"/>
                        <rect x="12" y="24" width="1" height="1"/>
                        <rect x="16" y="24" width="1" height="1"/>
                        <rect x="20" y="24" width="1" height="1"/>
                        <rect x="22" y="24" width="1" height="1"/>
                        <rect x="28" y="24" width="1" height="1"/>
                        <rect x="10" y="26" width="1" height="1"/>
                        <rect x="14" y="26" width="1" height="1"/>
                        <rect x="22" y="26" width="1" height="1"/>
                        <rect x="26" y="26" width="1" height="1"/>
                        <rect x="12" y="28" width="1" height="1"/>
                        <rect x="16" y="28" width="1" height="1"/>
                        <rect x="18" y="28" width="1" height="1"/>
                        <rect x="20" y="28" width="1" height="1"/>
                        <rect x="24" y="28" width="1" height="1"/>
                        <rect x="28" y="28" width="1" height="1"/>
                      </g>
                    </svg>
                  </div>
                )}
              </div>
              <p className="text-[7px] text-gray-700 font-bold uppercase mt-1">SCAN ID</p>
            </div>
            
            {/* Signature */}
            <div className="w-full text-center">
              <div className="w-20 border-b border-gray-400 mx-auto mb-0.5"></div>
              <p className="text-gray-500 font-semibold uppercase text-[7px]">Authorized Sign</p>
            </div>

          </div>
          
          {/* Footer */}
          <div className="flex-shrink-0 bg-gradient-to-r from-blue-900 to-blue-800 px-2 py-1 text-[7px] text-blue-200 text-center leading-tight">
            <p className="font-semibold truncate mb-0.5">
              {renderValue(stockist?.address || stockist?.location, "N/A")}
            </p>
            <p className="font-bold">www.luvox.com</p>
          </div>

        </div>
      </div>
      
      {/* Print Button */}
      <div className="w-[203px] mx-auto">
        <button
          onClick={handlePrint}
          className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all font-bold uppercase tracking-wide text-sm print:hidden flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print ID Card 
        </button>
      </div>
    </div>
  );
}