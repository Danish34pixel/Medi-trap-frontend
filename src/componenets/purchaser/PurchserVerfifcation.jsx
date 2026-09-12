import React from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "../config/api";
import { Shield, XCircle, Check, Info } from "lucide-react";

const PurchserVerfifcation = () => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [approvalCount, setApprovalCount] = useState(0);
  const [message, setMessage] = useState(
    "Thanks for registering. Your documents are under verification. We will notify you once your account is approved."
  );

  useEffect(() => {
    // Try both keys: a direct purchaser id or a purchasing request id
    let purchaserId = null;
    let purchasingRequestId = null;
    try {
      purchaserId = localStorage.getItem("pendingPurchaserId");
      purchasingRequestId = localStorage.getItem("pendingPurchasingRequestId");
    } catch (e) {
      purchaserId = purchasingRequestId = null;
    }

    if (!purchaserId && !purchasingRequestId) {
      setChecking(false);
      return;
    }

    // Helper: validate a possible Mongo ObjectId (24 hex chars)
    const looksLikeObjectId = (id) =>
      typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id);

    let cancelled = false;
    const check = async () => {
      try {
        // Always call backend via apiUrl so requests go to the configured API
        if (purchaserId) {
          if (!looksLikeObjectId(purchaserId)) {
            console.warn(
              "Stored pendingPurchaserId does not look like an ObjectId:",
              purchaserId
            );
            try {
              localStorage.removeItem("pendingPurchaserId");
            } catch (e) {}
          } else {
            const res = await fetch(apiUrl(`/api/purchaser/${purchaserId}`));
            const text = await res.text().catch(() => "");
            let json = {};
            try {
              json = text ? JSON.parse(text) : {};
            } catch (e) {
              console.warn("Failed parsing purchaser response text", text);
            }
            if (!res.ok) {
              console.warn("Purchaser fetch returned non-OK", res.status, json);
              if (res.status === 404) {
                // If purchaser doc not found, remove the pending id and stop polling
                try {
                  localStorage.removeItem("pendingPurchaserId");
                } catch (e) {}
                setMessage(
                  "Verification record not found. Please contact support."
                );
                setChecking(false);
                return;
              }
            }

            if (res.ok && json && json.data) {
              if (json.data.approved) {
                try {
                  localStorage.removeItem("pendingPurchaserId");
                } catch (e) {}
                navigate("/purchaserLogin");
                return;
              } else if (json.data.declined) {
                setMessage("Document verification failed");
                setChecking(false);
                return;
              }
            }
          }
        }

        if (purchasingRequestId) {
          if (!looksLikeObjectId(purchasingRequestId)) {
            console.warn(
              "Stored pendingPurchasingRequestId does not look like an ObjectId:",
              purchasingRequestId
            );
            try {
              localStorage.removeItem("pendingPurchasingRequestId");
            } catch (e) {}
          } else {
            const res2 = await fetch(
              apiUrl(`/api/purchasing-card/status/${purchasingRequestId}`)
            );
            const text2 = await res2.text().catch(() => "");
            let json2 = {};
            try {
              json2 = text2 ? JSON.parse(text2) : {};
            } catch (e) {
              console.warn("Failed parsing purchasing-card status text", text2);
            }

            if (!res2.ok) {
              console.warn(
                "Purchasing-card status returned non-OK",
                res2.status,
                json2
              );
              if (res2.status === 404) {
                // The request doc may have been removed after approval; attempt a fallback:
                // check the purchaser record (if we have one) and redirect if approved.
                try {
                  const fallbackPurchaserId =
                    localStorage.getItem("pendingPurchaserId");
                  if (
                    fallbackPurchaserId &&
                    looksLikeObjectId(fallbackPurchaserId)
                  ) {
                    const pres = await fetch(
                      apiUrl(`/api/purchaser/${fallbackPurchaserId}`)
                    );
                    if (pres.ok) {
                      const pText = await pres.text().catch(() => "");
                      let pJson = {};
                      try {
                        pJson = pText ? JSON.parse(pText) : {};
                      } catch (e) {}
                      if (pJson && pJson.data && pJson.data.approved) {
                        try {
                          localStorage.removeItem("pendingPurchasingRequestId");
                        } catch (e) {}
                        try {
                          localStorage.removeItem("pendingPurchaserId");
                        } catch (e) {}
                        setChecking(false);
                        navigate("/purchaserLogin", { replace: true });
                        return;
                      }
                    }
                  }
                } catch (e) {
                  console.warn(
                    "Fallback purchaser check failed:",
                    e && e.message
                  );
                }

                // Remove pending id and show not-found message if fallback didn't redirect
                try {
                  localStorage.removeItem("pendingPurchasingRequestId");
                } catch (e) {}
                setMessage(
                  "Verification record not found. Please contact support."
                );
                setChecking(false);
                return;
              }
            }

            if (res2.ok && json2 && json2.data) {
              // Track how many of the (up to 3) selected stockists have
              // approved so far, mirroring the animated progress dots on
              // the Nebula app's equivalent screen.
              const count = json2.data.approvals || 0;
              setApprovalCount(count);
              if (json2.data.status === "approved") {
                try {
                  localStorage.removeItem("pendingPurchasingRequestId");
                } catch (e) {}
                navigate("/purchaserLogin");
                return;
              }
              // keep polling while pending
            }
          }
        }
      } catch (e) {
        // ignore network errors and continue polling
      }
      if (!cancelled) setTimeout(check, 3000);
    };

    check();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const isFailed =
    message === "Document verification failed" ||
    message === "Verification record not found. Please contact support.";

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="w-full max-w-md bg-white/90 backdrop-blur-sm rounded-4xl shadow-card-lg border border-white/60 p-8 text-center">
        <div
          className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center ${
            isFailed
              ? "bg-gradient-to-br from-red-100 to-red-200"
              : "bg-gradient-to-br from-teal-50 to-teal-100"
          }`}
        >
          {isFailed ? (
            <XCircle className="w-10 h-10 text-red-500" />
          ) : (
            <Shield className="w-10 h-10 text-teal-600" />
          )}
        </div>

        <h1
          className={`text-xl font-bold mb-4 ${
            isFailed ? "text-red-700" : "text-slate-800"
          }`}
        >
          {isFailed ? "Verification Failed" : "Awaiting Stockist Approval"}
        </h1>

        <p className="text-slate-500 text-[15px] leading-relaxed mb-8">
          {message}
        </p>

        {!isFailed && (
          <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${
                  i < approvalCount
                    ? "bg-teal-600 border-teal-600"
                    : "bg-slate-200 border-slate-300"
                }`}
              >
                {i < approvalCount && <Check className="w-3.5 h-3.5 text-white" />}
              </div>
            ))}
            <p className="w-full text-center text-sm font-semibold text-slate-500 mt-1">
              {approvalCount} of 3 stockists approved
            </p>
          </div>
        )}

        {checking && !isFailed && (
          <div className="flex flex-col items-center gap-3">
            <div className="w-7 h-7 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-medium text-slate-400">
              Checking status...
            </p>
          </div>
        )}

        {!isFailed && (
          <div className="mt-10 flex items-start gap-2.5 bg-slate-50 rounded-2xl p-4 text-left">
            <Info className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
            <p className="flex-1 text-xs text-slate-500 italic">
              You can close this page and come back. We'll unlock your
              account once all 3 stockists approve.
            </p>
          </div>
        )}

        {isFailed && (
          <button
            type="button"
            onClick={() => navigate("/purchaser-signup")}
            className="mt-5 bg-red-700 hover:bg-red-800 text-white font-bold py-3 px-6 rounded-xl transition"
          >
            Back to Signup
          </button>
        )}
      </div>
    </div>
  );
};

export default PurchserVerfifcation;
