import React from "react";
import { useNavigate } from "react-router-dom";
import { Lock, ArrowRight } from "lucide-react";
import { logout } from "../utils/authFlow";

// Ported from nebula/components/PaymentRequiredGate.jsx. Rendered in place
// of the dashboard when paymentStatus === "payment_due" (Dashboard.jsx,
// mirroring nebula/app/Home/index.jsx). Routes into the existing
// SubscriptionPlans -> payment -> payment-pending flow.
export default function PaymentRequiredGate() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-8">
      <div className="max-w-sm w-full flex flex-col items-center text-center">
        <div className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center mb-6">
          <Lock className="w-11 h-11 text-red-600" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-800 mb-3">
          Payment Required
        </h1>
        <p className="text-slate-600 mb-7 leading-relaxed">
          Your free trial has ended. Complete your subscription payment to
          keep using MedTrap.
        </p>
        <button
          onClick={() => navigate("/SubscriptionPlans")}
          className="w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-4 rounded-2xl transition"
        >
          Complete Payment
          <ArrowRight className="w-[18px] h-[18px]" />
        </button>
        <button
          onClick={() => logout(navigate)}
          className="mt-5 text-slate-500 font-semibold text-sm hover:text-slate-700"
        >
          Log Out
        </button>
      </div>
    </div>
  );
}
