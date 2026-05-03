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
