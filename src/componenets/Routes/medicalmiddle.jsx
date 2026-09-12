import React from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { XCircle, Info } from "lucide-react";
import { apiUrl } from "../config/api";
import PageHeader from "../ui/PageHeader";
import Card from "../ui/Card";
import Btn from "../stockistComponents/Btn";

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

  const isFailed = message === "Document verification failed";

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <PageHeader title="Account Verification" role="medical" showBack={false} />

      <div className="flex items-center justify-center p-6 py-12">
        <Card
          padding="p-8"
          elevated
          className="max-w-md w-full rounded-4xl flex flex-col items-center text-center"
        >
          {checking ? (
            <div className="w-20 h-20 rounded-full bg-orange-50 flex items-center justify-center mb-6">
              <div className="w-10 h-10 border-4 border-role-medical/20 border-t-role-medical rounded-full animate-spin" />
            </div>
          ) : isFailed ? (
            <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-6">
              <XCircle className="w-12 h-12 text-red-500" />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mb-6">
              <Info className="w-12 h-12 text-emerald-500" />
            </div>
          )}

          <h1 className="text-xl font-bold text-slate-800 mb-4">
            {isFailed ? "Verification Failed" : "Documents under verification"}
          </h1>

          <p className="text-slate-600 mb-4 leading-relaxed">{message}</p>

          {!isFailed && (
            <p className="text-sm text-slate-400 mb-8 leading-relaxed">
              You can safely close this screen. Check back later to see if you
              have been approved.
            </p>
          )}

          <Btn
            variant="default"
            onClick={() => navigate("/")}
            className="w-full justify-center"
          >
            Return to Main Screen
          </Btn>
        </Card>
      </div>
    </div>
  );
};

export default MedicalMiddle;
