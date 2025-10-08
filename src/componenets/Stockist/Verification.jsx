import React from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "../config/api";

const Verification = () => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [message, setMessage] = useState(
    "Thanks for registering. Your documents are under verification. We will notify you once your account is approved."
  );

  useEffect(() => {
    let id = null;
    try {
      id = localStorage.getItem("pendingStockistId");
    } catch (e) {
      id = null;
    }
    if (!id) {
      setChecking(false);
      return;
    }

    let cancelled = false;
    const check = async () => {
      try {
        const useProxy = import.meta.env.MODE === "development";
        const build = (path) => (useProxy ? path : apiUrl(path));
        const res = await fetch(build(`/api/stockist/${id}`));
        const json = await res.json().catch(() => ({}));
        if (res.ok && json && json.data) {
          if (json.data.approved) {
            // approved: cleanup and redirect to login
            try {
              localStorage.removeItem("pendingStockistId");
            } catch (e) {}
            navigate("/stockist-login");
            return;
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
          Documents under verification
        </h1>
        <p className="text-gray-600 mb-4">{message}</p>
        <p className="text-sm text-gray-400">
          You can close this page and wait for an email or login later.
        </p>
      </div>
    </div>
  );
};

export default Verification;
