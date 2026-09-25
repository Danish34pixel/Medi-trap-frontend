import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Nav from "./Nav";
import Screen from "./Screen";
import PaymentRequiredGate from "./ui/PaymentRequiredGate";
import TrialBanner from "./ui/TrialBanner";
import { fetchSubscriptionStatus, daysRemaining } from "./utils/subscriptionStatus";

export default function Dashboard() {
  // Ported from nebula/app/Home/index.jsx: gate the dashboard on
  // paymentStatus === "payment_due" (trial expired mid-session, not just
  // at login), and show a trial-days-left banner while paymentStatus ===
  // "trial". A network hiccup here must not block the dashboard, matching
  // nebula's silent catch.
  const [accountStatus, setAccountStatus] = useState(null);
  const [isTrialActive, setIsTrialActive] = useState(false);
  const [trialDaysLeft, setTrialDaysLeft] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchSubscriptionStatus()
      .then(({ accountStatus: status, isTrialActive: trialActive, trialEndDate }) => {
        if (cancelled) return;
        setAccountStatus(status || null);
        setIsTrialActive(trialActive);
        setTrialDaysLeft(daysRemaining(trialEndDate));
      })
      .catch(() => {
        // Silent — same as nebula, don't block the dashboard on this.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // try to get react-router navigate; fallback to window.history
  let navigateFn;
  try {
    const useNav = useNavigate();
    navigateFn = (path) => useNav(path);
  } catch (e) {
    navigateFn = (path) => {
      // allow both path strings and { name: '...', params: {...} } if someone passes that
      if (typeof path === "string") {
        window.location.href = path;
      } else if (path && path.name) {
        // fallback: try simple mapping to URL
        window.location.href = path.name;
      }
    };
  }

  // Provide a navigation-like object for components expecting `navigation.navigate(...)`
  const navigation = {
    navigate: navigateFn,
    goBack: () => window.history.back(),
    // you can add more helpers if needed (replace, push, etc.)
  };

  if (accountStatus === "pending_payment") {
    return <PaymentRequiredGate />;
  }

  return (
    <div className="min-h-screen bg-white overflow-y-auto">
      {isTrialActive && <TrialBanner daysLeft={trialDaysLeft} />}
      {/* Nav and Screen are expected to be React components (web).
          They will receive a `navigation` prop similar to React Native. */}
      <Nav navigation={navigation} />
      {/* Admin Panel button: belt-and-braces fallback for any admin user
          landing on /dashboard instead of /adminpanel (LOGIC_REFERENCE.md §1). */}
      {(() => {
        try {
          const userStr = localStorage.getItem("user");
          if (!userStr) return null;
          const user = JSON.parse(userStr);
          if (user && user.role === "admin") {
            return (
              <div className="p-6">
                <button
                  onClick={() => {
                    try {
                      navigation && navigation.navigate
                        ? navigation.navigate("/adminpanel")
                        : (window.location.href = "/adminpanel");
                    } catch (e) {
                      window.location.href = "/adminpanel";
                    }
                  }}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-4 py-2 rounded"
                >
                  Admin Panel
                </button>
              </div>
            );
          }
        } catch (e) {
          return null;
        }
        return null;
      })()}
      <Screen navigation={navigation} />
    </div>
  );
}
