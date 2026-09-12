import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { fetchJson } from "../config/api";
import getHomeRouteForRole from "../utils/getHomeRouteForRole";
import { logout } from "../utils/authFlow";

// Ported from app/payment-pending.jsx (LOGIC_REFERENCE.md §7): polls
// GET /auth/me every 6s, pauses while the tab is hidden (visibilitychange
// replaces RN's AppState), resumes on focus. "active" -> redirect via
// getHomeRouteForRole; "rejected" -> clear auth storage, redirect to "/".
export default function PaymentPending() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("pending"); // pending | active | rejected
  const pausedRef = useRef(document.hidden);
  const stoppedRef = useRef(false);

  useEffect(() => {
    const onVisibility = () => {
      pausedRef.current = document.hidden;
    };
    const onFocus = () => {
      pausedRef.current = false;
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onFocus);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  useEffect(() => {
    const checkStatus = async () => {
      if (pausedRef.current || stoppedRef.current) return;
      try {
        const data = await fetchJson("/auth/me");
        const user = data.user || data;
        if (data.accountStatus === "active") {
          stoppedRef.current = true;
          setStatus("active");
          setTimeout(() => {
            const dest = getHomeRouteForRole(user.role, user._id || user.id);
            navigate(dest, { replace: true });
          }, 1800);
        } else if (data.accountStatus === "rejected") {
          stoppedRef.current = true;
          setStatus("rejected");
        }
      } catch (e) {
        // network errors are swallowed silently — keep polling
      }
    };

    checkStatus();
    const timer = setInterval(checkStatus, 6000);
    return () => clearInterval(timer);
  }, [navigate]);

  const handleBackHome = () => {
    logout(navigate);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {status === "pending" && (
          <>
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
            <h1 className="text-xl font-bold text-slate-800 mb-2">
              Awaiting Admin Verification
            </h1>
            <p className="text-sm text-slate-500">
              We're checking your payment status. This page will update automatically.
            </p>
          </>
        )}

        {status === "active" && (
          <>
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-slate-800 mb-2">Account Activated</h1>
            <p className="text-sm text-slate-500">Redirecting you now...</p>
          </>
        )}

        {status === "rejected" && (
          <>
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-slate-800 mb-2">Payment Rejected</h1>
            <p className="text-sm text-slate-500 mb-6">
              Your payment could not be verified. Please contact support or try again.
            </p>
            <button
              onClick={handleBackHome}
              className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:brightness-105 transition"
            >
              Back to Home
            </button>
          </>
        )}
      </div>
    </div>
  );
}
