import React from "react";
import { AlertTriangle, X } from "lucide-react";

/**
 * Trial-expired / payment-required modal (LOGIC_REFERENCE.md §6).
 * Shown when login responds success:false but still carries an accessToken.
 * "Pay Now"/"Check Status" routes to /payment-pending when the account is
 * already pending_admin_verification, otherwise to /SubscriptionPlans.
 */
export default function PaymentRequiredModal({ open, accountStatus, onGoToPayment, onClose }) {
  if (!open) return null;

  const isPendingVerification = accountStatus === "pending_admin_verification";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mb-4">
          <AlertTriangle className="w-7 h-7 text-amber-500" />
        </div>

        <h2 className="text-xl font-bold text-slate-800 mb-2">
          {isPendingVerification ? "Payment Under Review" : "Subscription Required"}
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          {isPendingVerification
            ? "We've received your payment and it's awaiting admin verification. Check the status below."
            : "Your trial has ended. Choose a plan to continue using your account."}
        </p>

        <button
          onClick={onGoToPayment}
          className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:brightness-105 transition"
        >
          {isPendingVerification ? "Check Status" : "Pay Now"}
        </button>
      </div>
    </div>
  );
}
