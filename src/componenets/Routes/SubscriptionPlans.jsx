import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Check, Loader2 } from "lucide-react";
import PageHeader from "../ui/PageHeader";
import Card from "../ui/Card";
import SUBSCRIPTION_PLANS from "../constants/subscriptionPlans";
import { createSubscriptionOrder } from "../utils/payment";

// Ported from nebula/app/SubscriptionPlans.jsx (LOGIC_REFERENCE.md §8.3).
// The order response is round-tripped through localStorage (not route
// state) because it carries the Razorpay orderId/keyId the checkout page
// needs after a full navigation.
export default function SubscriptionPlans() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(SUBSCRIPTION_PLANS[1]?.key);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const selectedPlan = SUBSCRIPTION_PLANS.find((p) => p.key === selected);

  const handlePay = async () => {
    if (!selectedPlan) return;
    setLoading(true);
    setError(null);
    try {
      const order = await createSubscriptionOrder(selectedPlan.key);
      localStorage.setItem("pendingOrder", JSON.stringify(order));
      navigate("/payment");
    } catch (e) {
      setError(e.message || "Could not start payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <PageHeader
        title="Choose a Plan"
        subtitle="Pick a subscription to continue using your account"
        role="slate"
      />
      <div className="container mx-auto max-w-2xl px-4 py-8 sm:py-12">
        <div className="space-y-4 mb-8">
          {SUBSCRIPTION_PLANS.map((plan) => {
            const isSelected = plan.key === selected;
            return (
              <Card
                key={plan.key}
                onClick={() => setSelected(plan.key)}
                className={`cursor-pointer transition-all border-2 ${
                  isSelected
                    ? "border-blue-500 ring-2 ring-blue-100"
                    : "border-transparent"
                }`}
                padding="p-5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                        isSelected
                          ? "bg-blue-500 border-blue-500"
                          : "border-slate-300"
                      }`}
                    >
                      {isSelected && <Check className="w-4 h-4 text-white" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800">
                          {plan.label}
                        </span>
                        {plan.badge && (
                          <span className="text-xs font-bold text-white bg-indigo-500 rounded-full px-2 py-0.5">
                            {plan.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500">{plan.tagline}</p>
                    </div>
                  </div>
                  <div className="text-xl font-bold text-slate-800">
                    &#8377;{plan.price}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">
            {error}
          </div>
        )}

        <button
          onClick={handlePay}
          disabled={loading || !selectedPlan}
          className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:brightness-105 transition disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading
            ? "Starting payment..."
            : `Pay ₹${selectedPlan?.price ?? ""}`}
        </button>

        <p className="text-center text-xs text-slate-400 mt-4">
          By continuing you agree to our{" "}
          <Link to="/refund-policy" className="underline">
            Refund Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
