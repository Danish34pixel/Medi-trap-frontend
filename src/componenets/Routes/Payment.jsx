import React, { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { openRazorpayCheckout } from "../utils/razorpayCheckout";
import { verifySubscriptionPayment } from "../utils/payment";

// Ported from nebula/app/payment.web.jsx (LOGIC_REFERENCE.md §8.4/§8.5).
// Reads the pending order stashed by SubscriptionPlans.jsx, opens the
// Razorpay overlay, verifies the signature server-side on success, then
// hands off to /payment-pending (same screen used after a trial-expiry
// payment — it polls GET /auth/me until accountStatus === "active").
export default function Payment() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading"); // loading | opening | error
  const [error, setError] = useState(null);
  const openedRef = useRef(false);

  useEffect(() => {
    if (openedRef.current) return;
    openedRef.current = true;

    let order;
    try {
      order = JSON.parse(localStorage.getItem("pendingOrder") || "null");
    } catch {
      order = null;
    }

    if (!order || !order.orderId || !order.keyId) {
      setStatus("error");
      setError("No pending order found. Please pick a plan again.");
      return;
    }

    setStatus("opening");
    openRazorpayCheckout(order, {
      onSuccess: async (response) => {
        try {
          const result = await verifySubscriptionPayment(response);
          localStorage.setItem(
            "lastSubscription",
            JSON.stringify({
              plan: order.plan,
              subscriptionPlan: result?.subscriptionPlan,
              subscriptionEndDate: result?.subscriptionEndDate,
            }),
          );
          localStorage.removeItem("pendingOrder");
          navigate("/payment-pending", { replace: true });
        } catch (e) {
          setStatus("error");
          setError(e.message || "Payment verification failed.");
        }
      },
      onDismiss: () => {
        setStatus("error");
        setError("Payment cancelled.");
      },
      onError: (e) => {
        setStatus("error");
        setError(e?.description || e?.message || "Payment failed.");
      },
    });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {status !== "error" && (
          <>
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
            <h1 className="text-xl font-bold text-slate-800 mb-2">
              Opening secure checkout...
            </h1>
            <p className="text-sm text-slate-500">
              Complete your payment in the Razorpay window.
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <h1 className="text-xl font-bold text-slate-800 mb-2">
              Payment not completed
            </h1>
            <p className="text-sm text-slate-500 mb-6">{error}</p>
            <Link
              to="/SubscriptionPlans"
              className="inline-block w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:brightness-105 transition"
            >
              &larr; Back to plans
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
