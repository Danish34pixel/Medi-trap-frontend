import React from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "../config/api";

const MedicalMiddle = () => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [message, setMessage] = useState(
    "Thanks for registering. Your documents are under verification. We will notify you once your account is approved."
  );

  useEffect(() => {
    // Check either pendingStockistId or pendingUserId (user signup flow)
    let stockistId = null;
    let userId = null;
    try {
      stockistId = localStorage.getItem("pendingStockistId");
    } catch (e) {
      stockistId = null;
    }
    try {
      userId = localStorage.getItem("pendingUserId");
    } catch (e) {
      userId = null;
    }

    if (!stockistId && !userId) {
      setChecking(false);
      return;
    }

    let cancelled = false;
    const check = async () => {
      try {
        const build = (path) => apiUrl(path);

        // Prefer checking stockistId first (original behavior), otherwise check userId
        if (stockistId) {
          const res = await fetch(build(`/api/stockist/${stockistId}`), {
            credentials: "include",
          });
          const json = await res.json().catch(() => ({}));
          if (res.ok && json && json.data) {
            if (json.data.approved) {
              try {
                localStorage.removeItem("pendingStockistId");
              } catch (e) {}
              navigate("/stockist-login");
              return;
            } else if (json.data.declined) {
              setMessage("Document verification failed");
              setChecking(false);
              return;
            }
          }
        } else if (userId) {
          const res = await fetch(build(`/api/user/${userId}`), {
            credentials: "include",
          });
          const json = await res.json().catch(() => ({}));
          if (res.ok && json && json.data) {
            if (json.data.approved) {
              try {
                localStorage.removeItem("pendingUserId");
              } catch (e) {}
              // regular user login
              navigate("/login");
              return;
            } else if (json.data.declined) {
              setMessage("Document verification failed");
              setChecking(false);
              return;
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

export default MedicalMiddle;
