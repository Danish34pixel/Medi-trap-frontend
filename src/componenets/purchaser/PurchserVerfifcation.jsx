import React from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "../config/api";

const PurchserVerfifcation = () => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
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

    let cancelled = false;
    const check = async () => {
      try {
        const useProxy = import.meta.env.MODE === "development";
        const build = (path) => (useProxy ? path : apiUrl(path));
        if (purchaserId) {
          const res = await fetch(build(`/api/purchaser/${purchaserId}`));
          const json = await res.json().catch(() => ({}));
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

        if (purchasingRequestId) {
          const res2 = await fetch(
            build(`/api/purchasing-card/status/${purchasingRequestId}`)
          );
          const json2 = await res2.json().catch(() => ({}));
          if (res2.ok && json2 && json2.data) {
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

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white p-6 rounded-xl shadow-lg text-center">
        <h1 className="text-2xl font-bold mb-4">
          {message === "Document verification failed"
            ? "Verification Failed"
            : "Documents under verification"}
        </h1>
        <p className="text-gray-600 mb-4">{message}</p>
        {message !== "Document verification failed" && (
          <p className="text-sm text-gray-400">
            You can close this page and wait for an email or login later.
          </p>
        )}
      </div>
    </div>
  );
};

export default PurchserVerfifcation;
