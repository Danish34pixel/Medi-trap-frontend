import React from "react";
import { ShieldCheck, User, Briefcase, Droplet, Maximize, Printer } from "lucide-react";
import Avatar from "./Avatar";

function formatDate(d) {
  if (!d) return "—";
  try {
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return "—";
    return dt.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  } catch {
    return "—";
  }
}

/**
 * ID-badge card matching Nebula's components/stockist/IdentityCard.jsx:
 * indigo gradient header, overlapping photo, name badge, a 3-column stat
 * grid (full name / firm name / blood group) and a QR + "AUTHENTIC" seal.
 */
export default function IdentityCard({ stockist, qrDataUrl }) {
  const handlePrint = () => {
    const printContents = document.getElementById("id-card-print-area");
    if (!printContents) return window.print();
    const printWindow = window.open("", "", "height=800,width=800");
    printWindow.document.write("<html><head><title>ID Card</title>");
    document.querySelectorAll('link[rel="stylesheet"], style').forEach((node) => {
      printWindow.document.write(node.outerHTML);
    });
    printWindow.document.write(
      '</head><body style="background:white;margin:0;padding:0;">'
    );
    printWindow.document.write('<div id="print-root" style="margin:0;padding:0;">');
    printWindow.document.write(printContents.innerHTML);
    printWindow.document.write("</div>");
    printWindow.document.write(
      "<script>window.onload = function() { setTimeout(function() { window.focus(); window.print(); window.close(); }, 300); };</script>"
    );
    printWindow.document.write("</body></html>");
    printWindow.document.close();
  };

  if (!stockist) return null;

  const displayName = stockist.contactPerson || stockist.name || "Authorized User";
  const idNum = stockist._id ? String(stockist._id).slice(-8).toUpperCase() : "MT-88291";
  const role = String(stockist.role || stockist.roleType || "STOCKIST")
    .toUpperCase()
    .replace("PROPRITER", "PROPRIETOR");

  return (
    <div className="w-full">
      <style>{`
        @media print {
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          @page { size: 53.98mm 85.6mm; orientation: portrait; margin: 0; }
          .print\\:hidden { display: none !important; }
          body.print-only-card { padding: 0 !important; margin: 0 !important; overflow: hidden !important; width: 53.98mm !important; height: 85.6mm !important; }
          #id-card-print-area, #id-card-print-area-desktop { width: 53.98mm; height: 85.6mm; margin: 0; padding: 0; }
          #id-card-print-area > div, #id-card-print-area-desktop > div { width: 100%; height: 100%; border-radius: 0 !important; box-shadow: none !important; border: none !important; page-break-inside: avoid; }
        }
      `}</style>

      {/* ── MOBILE / TABLET VIEW (<1024px) - 100% UNTOUCHED ── */}
      <div className="block lg:hidden w-full py-6 flex flex-col items-center">
        <div id="id-card-print-area" className="w-full max-w-[320px]">
          <div className="rounded-4xl bg-white border border-white/80 shadow-card-lg overflow-hidden">
            {/* Header */}
            <div className="relative h-40 bg-gradient-to-br from-indigo-700 to-indigo-500 px-6 pt-6 overflow-hidden">
              <div className="absolute -left-12 -top-5 w-48 h-48 rounded-full bg-white opacity-10" />
              <div className="absolute -right-8 -bottom-3 w-48 h-48 rounded-full bg-white opacity-10" />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-white font-black tracking-wider text-base">
                    MEDITRAP
                  </span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-2.5 py-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  <span className="text-white text-[10px] font-extrabold">VERIFIED</span>
                </div>
              </div>
            </div>

            {/* Overlapping photo */}
            <div className="relative z-10 flex flex-col items-center -mt-16">
              <div className="w-28 h-28 rounded-[2rem] border-[6px] border-white bg-white shadow-card-lg overflow-hidden flex items-center justify-center">
                {stockist.profileImageUrl ? (
                  <img
                    src={stockist.profileImageUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Avatar name={displayName} size={100} />
                )}
              </div>
              <div className="-mt-3 bg-indigo-950 text-white text-[10px] font-black tracking-wider px-3.5 py-1 rounded-xl shadow-card">
                {role}
              </div>
            </div>

            {/* Body */}
            <div className="px-6 pt-4 pb-6 flex flex-col items-center">
              <h2 className="text-xl font-black text-indigo-950 text-center truncate w-full">
                {displayName}
              </h2>
              <div className="flex items-center gap-1.5 mt-1 mb-5">
                <span className="text-xs font-bold text-slate-500">ID NO:</span>
                <span className="text-xs font-extrabold text-indigo-700 tracking-wide">
                  {idNum}
                </span>
              </div>

              {/* Stat grid */}
              <div className="w-full grid grid-cols-3 gap-2 bg-slate-50 border border-slate-100 rounded-2xl py-4 px-2 mb-6">
                <div className="flex flex-col items-center gap-1 text-center px-1">
                  <User className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="text-[11px] font-extrabold text-slate-800 truncate w-full">
                    {stockist.contactPerson || stockist.fullName || displayName}
                  </span>
                  <span className="text-[8px] font-bold text-slate-400 uppercase">
                    Full Name
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1 text-center px-1 border-x border-slate-200">
                  <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="text-[11px] font-extrabold text-slate-800 truncate w-full">
                    {stockist.name || stockist.companyName || stockist.firmName || "N/A"}
                  </span>
                  <span className="text-[8px] font-bold text-slate-400 uppercase">
                    Firm Name
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1 text-center px-1">
                  <Droplet className="w-3.5 h-3.5 text-red-500" />
                  <span className="text-[11px] font-extrabold text-slate-800 truncate w-full">
                    {stockist.bloodGroup || stockist.blood || stockist.user?.bloodGroup || "O+"}
                  </span>
                  <span className="text-[8px] font-bold text-slate-400 uppercase">Blood</span>
                </div>
              </div>

              {/* QR + seal */}
              <div className="w-full flex items-end justify-between">
                <div className="flex flex-col items-center gap-2">
                  <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-card">
                    {qrDataUrl ? (
                      <img src={qrDataUrl} alt="QR Code" className="w-[70px] h-[70px]" />
                    ) : (
                      <div className="w-[70px] h-[70px] flex items-center justify-center">
                        <Maximize className="w-8 h-8 text-slate-200" />
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] font-black text-slate-500">SCAN TO VERIFY</span>
                </div>
                <div className="flex flex-col items-center gap-1 mb-4">
                  <ShieldCheck className="w-6 h-6 text-amber-500" />
                  <span className="text-[9px] font-black text-amber-500 tracking-wide">
                    AUTHENTIC
                  </span>
                </div>
              </div>

              {stockist.dob && (
                <p className="mt-4 text-[10px] text-slate-400 font-semibold">
                  DOB: {formatDate(stockist.dob)}
                </p>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={handlePrint}
          className="print:hidden mt-4 w-full max-w-[280px] inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-role-stockist-from to-role-stockist-to text-white rounded-xl shadow-card-lg hover:brightness-105 transition-all font-bold text-sm"
        >
          <Printer className="w-4 h-4" />
          Print ID Card
        </button>
      </div>

      {/* ── DESKTOP VIEW (>=1024px) - HORIZONTAL LANDSCAPE LAYOUT ── */}
      <div className="hidden lg:block w-full max-w-3xl mx-auto py-8">
        <div id="id-card-print-area-desktop" className="w-full">
          <div className="rounded-[2.5rem] bg-white border border-slate-200/80 shadow-2xl overflow-hidden flex flex-row items-stretch min-h-[320px]">
            {/* Left Indigo Banner (35% width) */}
            <div className="w-[35%] bg-gradient-to-br from-indigo-700 via-indigo-800 to-purple-900 p-6 flex flex-col items-center justify-between relative overflow-hidden text-center shrink-0">
              {/* Decorative Background Circles */}
              <div className="absolute -left-10 -top-10 w-44 h-44 rounded-full bg-white/10 blur-xl pointer-events-none" />
              <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-white/10 blur-xl pointer-events-none" />

              {/* Brand Header */}
              <div className="relative z-10 flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-md">
                    <ShieldCheck className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-white font-black tracking-wider text-sm">MEDITRAP</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md rounded-full px-2.5 py-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-white text-[10px] font-extrabold">VERIFIED</span>
                </div>
              </div>

              {/* Photo Box */}
              <div className="relative z-10 my-4 flex flex-col items-center">
                <div className="w-32 h-32 rounded-[2.25rem] border-4 border-white/90 bg-white shadow-2xl overflow-hidden flex items-center justify-center">
                  {stockist.profileImageUrl ? (
                    <img
                      src={stockist.profileImageUrl}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Avatar name={displayName} size={110} />
                  )}
                </div>
                <div className="mt-3 bg-indigo-950/90 backdrop-blur-md text-white text-[11px] font-black tracking-widest px-4 py-1 rounded-xl border border-white/20 shadow-lg uppercase">
                  {role}
                </div>
              </div>

              {/* Authentic Badge */}
              <div className="relative z-10 flex items-center gap-1.5 text-amber-300 font-extrabold text-[11px] tracking-wider">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>AUTHENTIC SEAL</span>
              </div>
            </div>

            {/* Right Details Panel (65% width) */}
            <div className="flex-1 p-8 flex flex-col justify-between bg-gradient-to-br from-white via-slate-50/50 to-indigo-50/20">
              {/* Header Info */}
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-black text-indigo-950 tracking-tight leading-tight">
                      {displayName}
                    </h2>
                    <p className="text-xs font-bold text-slate-500 mt-1">Authorized Healthcare Stockist</p>
                  </div>
                  <div className="bg-indigo-50 border border-indigo-100 px-3.5 py-1.5 rounded-xl text-xs font-black text-indigo-700 tracking-wide shrink-0 shadow-sm">
                    ID: {idNum}
                  </div>
                </div>

                {/* 3-Column Metadata Grid */}
                <div className="grid grid-cols-3 gap-3 bg-white border border-slate-200/70 shadow-sm rounded-2xl p-4 mt-5">
                  <div className="flex flex-col items-start gap-1">
                    <div className="flex items-center gap-1.5 text-indigo-600">
                      <User className="w-4 h-4" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Full Name</span>
                    </div>
                    <span className="text-xs font-black text-slate-800 truncate w-full mt-0.5">
                      {stockist.contactPerson || stockist.fullName || displayName}
                    </span>
                  </div>

                  <div className="flex flex-col items-start gap-1 border-x border-slate-100 px-3">
                    <div className="flex items-center gap-1.5 text-indigo-600">
                      <Briefcase className="w-4 h-4" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Firm Name</span>
                    </div>
                    <span className="text-xs font-black text-slate-800 truncate w-full mt-0.5">
                      {stockist.name || stockist.companyName || stockist.firmName || "N/A"}
                    </span>
                  </div>

                  <div className="flex flex-col items-start gap-1 pl-1">
                    <div className="flex items-center gap-1.5 text-red-500">
                      <Droplet className="w-4 h-4" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Blood Group</span>
                    </div>
                    <span className="text-xs font-black text-slate-800 truncate w-full mt-0.5">
                      {stockist.bloodGroup || stockist.blood || stockist.user?.bloodGroup || "O+"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Footer Section: QR Code & Print Action */}
              <div className="flex items-end justify-between mt-6 pt-4 border-t border-slate-200/60">
                <div className="flex items-center gap-4">
                  <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-md shrink-0">
                    {qrDataUrl ? (
                      <img src={qrDataUrl} alt="QR Code" className="w-16 h-16" />
                    ) : (
                      <div className="w-16 h-16 flex items-center justify-center">
                        <Maximize className="w-8 h-8 text-slate-300" />
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="block text-[10px] font-black tracking-wider text-slate-500 uppercase">
                      Scan to Verify
                    </span>
                    <span className="block text-[10px] font-semibold text-slate-400 mt-0.5">
                      Digital Authentication
                    </span>
                  </div>
                </div>

                <button
                  onClick={handlePrint}
                  className="print:hidden inline-flex items-center justify-center gap-2.5 px-6 py-3 bg-gradient-to-r from-role-stockist-from to-role-stockist-to text-white rounded-xl shadow-lg hover:shadow-xl hover:brightness-105 transform hover:-translate-y-0.5 transition-all font-bold text-sm"
                >
                  <Printer className="w-4 h-4" />
                  Print ID Card
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
