import React from "react";

// --- Utility Components (Unchanged) ---
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

// --- NEW PORTRAIT CARD COMPONENT ---

export default function IdentityCard({ stockist, qrDataUrl }) {
  const handlePrint = () => {
    const printContents = document.getElementById('id-card-print-area');
    if (!printContents) return window.print();
    const printWindow = window.open('', '', 'height=800,width=800');
    printWindow.document.write('<html><head><title>ID Card</title>');
    // Copy all <link rel="stylesheet"> and <style> tags
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
    // Responsive Wrapper for screen view
    <div className="w-full max-w-sm mx-auto p-4 print:p-0 print:max-w-full print:m-0">
      
      <style>{`
        /* --- FIX: Small Portrait Dimensions & Real Colors --- */
        @media print {
            /* 1. FORCE REAL COLORS */
            * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }

            /* 2. FIX: Portrait CR80 Size (53.98mm W x 85.6mm H) */
            @page {
                /* Set page size to Portrait ID Card Dimensions */
                size: 53.98mm 85.6mm; 
                orientation: portrait;
                margin: 0;
            }
            
            /* Hide the main print wrapper on screen print context */
            .print\\:hidden, .print-only-card:not(#id-card-print-area) {
              display: none !important;
            }

            /* 3. Enforce body size for single-page print area */
            body.print-only-card {
                padding: 0 !important;
                margin: 0 !important;
                display: block !important;
                overflow: hidden !important;
                /* Set body size to the exact ID card dimensions (Portrait CR80) */
                width: 53.98mm !important; 
                height: 85.6mm !important;
            }

            /* 4. Ensure the card container fits the fixed page size */
            #id-card-print-area {
                width: 53.98mm;
                height: 85.6mm;
                margin: 0;
                padding: 0;
                box-shadow: none !important;
                border: none !important;
                display: block !important;
            }
            
            /* Ensure the inner card wrapper fits and avoids page breaks */
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

      {/* ID Card Container - Set fixed size for Portrait desktop preview, print styles override */}
      <div 
        id="id-card-print-area" 
        // New Portrait Dimensions: w-[203px] h-[320px] (same aspect ratio as 53.98mm x 85.6mm)
        className="w-[203px] h-[320px] mx-auto shadow-xl transition-all duration-300"
      >
        <div className="bg-white rounded-lg overflow-hidden border-2 border-gray-200 w-full h-full flex flex-col">
          
          {/* Header (Top) */}
          <div className="flex-shrink-0 bg-gradient-to-r from-blue-900 to-blue-800 px-2 py-1 flex flex-col items-center justify-center text-center">
            <Logo className="text-white text-xs font-extrabold tracking-wider" />
            <div className="bg-yellow-400 text-blue-900 px-1 rounded mt-0.5 text-[8px] font-black uppercase">
              Authorized Stockist
            </div>
          </div>
          {/* Accent Stripe */}
          <div className="flex-shrink-0 h-0.5 bg-gradient-to-r from-yellow-400 to-yellow-500"></div>
          
          {/* Main Content: Organized vertically */}
          <div className="p-2 flex flex-col items-center flex-grow overflow-hidden">
            
            {/* Photo Section */}
            <div className="relative w-20 h-20 border-3 border-blue-600 p-[3px] mt-1 mb-1.5">
              {stockist?.profileImageUrl ? (
                <img
                  src={stockist?.profileImageUrl}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                  <Avatar name={renderValue(stockist?.name, "")} size={48} />
                </div>
              )}
            </div>
            
            {/* Name & Role */}
            <div className="text-center w-full mb-1">
              {/* Role Badge - Tighter spacing */}
              <div className="inline-block bg-blue-900 text-white px-2 py-0.5 text-[7px] font-bold uppercase mb-0.5">
                {stockist?.roleType || stockist?.designation || "Employee"}
              </div>
              
              {/* Name */}
              <h1 className="text-sm font-black text-gray-900 uppercase leading-tight truncate px-1">
                {renderValue(stockist?.contactPerson || stockist?.name, "Employee Name")}
              </h1>
            </div>

            {/* ID Number */}
            <div className="w-full bg-gray-50 border-l-3 border-blue-600 px-2 py-1 rounded-r mb-2">
              <p className="text-[8px] text-gray-500 font-semibold uppercase leading-tight">ID Number</p>
              <p className="text-sm font-bold text-blue-900 font-mono leading-tight">
                {stockist?._id ? String(stockist._id).slice(-8).toUpperCase() : "00000000"}
              </p>
            </div>
            
            {/* Contact Info (Stacked Vertically) */}
            <div className="w-full grid grid-cols-1 gap-y-1 text-[10px] text-center">
              <div>
                <p className="text-gray-500 font-semibold uppercase text-[7px] leading-tight">Phone</p>
                <p className="font-bold text-gray-900 leading-snug">
                  {renderValue(stockist?.phone || stockist?.contactNo, "—")}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-x-1">
                <div>
                  <p className="text-gray-500 font-semibold uppercase text-[7px] leading-tight">DOB</p>
                  <p className="font-bold text-gray-900 leading-snug">{formatDate(stockist?.dob)}</p>
                </div>
                <div>
                  <p className="text-gray-500 font-semibold uppercase text-[7px] leading-tight">Blood</p>
                  <p className="font-bold text-gray-900 leading-snug">{stockist?.bloodGroup || "—"}</p>
                </div>
              </div>
            </div>

            {/* QR Code (Bottom Center) */}
            <div className="bg-white p-0.5 rounded border border-gray-300 shadow-sm mt-2 mb-1">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="QR" className="w-12 h-12" />
              ) : (
                <div className="w-12 h-12 bg-gray-200"></div>
              )}
            </div>
            
            {/* Signature Area */}
            <div className="w-full text-center mt-auto">
              <div className="w-24 border-b border-gray-400 mx-auto mb-0.5"></div>
              <p className="text-gray-500 font-semibold uppercase text-[8px] leading-tight">Authorized Sign</p>
            </div>

          </div>
          
          {/* Footer Bar (Address & Web) */}
          <div className="flex-shrink-0 bg-gradient-to-r from-blue-900 to-blue-800 px-2 py-1 text-[7px] text-blue-200 text-center leading-snug">
            <p className="font-semibold line-clamp-2 mb-0.5">
              {renderValue(stockist?.address || stockist?.location, "N/A")}
            </p>
            <p className="font-bold">www.luvox.com</p>
          </div>

        </div>
      </div>
      
      {/* Print Button (Hidden on print) */}
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