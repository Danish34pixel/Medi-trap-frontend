import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Shield, ArrowLeft } from "lucide-react";
import Logo from "../Logo";
import { postJson } from "../config/api";
import {
  applyAuthResult,
  isTrialExpiredResponse,
  handleTrialExpired,
  goToPayment,
  loadRememberedIdentifier,
  saveRememberedIdentifier,
} from "../utils/authFlow";
import PaymentRequiredModal from "../ui/PaymentRequiredModal";

const ROLE = "staff";

/**
 * Recreates Nebula's app/Staff/staff-login.jsx (violet/purple gradient,
 * "Staff Portal" card) — this screen did not previously exist on the web.
 */
export default function StaffLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [trialExpired, setTrialExpired] = useState(false);
  const [accountStatus, setAccountStatus] = useState(null);

  useEffect(() => {
    const saved = loadRememberedIdentifier(ROLE);
    if (saved) {
      setEmail(saved);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const data = await postJson("/auth/login", { email, password, role: ROLE });

      if (data.success === false) {
        if (isTrialExpiredResponse(false, data)) {
          setAccountStatus(handleTrialExpired(data, { requestedRole: ROLE }));
          setTrialExpired(true);
          return;
        }
        setError(data.message || "Login failed");
        return;
      }

      saveRememberedIdentifier(ROLE, email, rememberMe);
      applyAuthResult(data, { requestedRole: ROLE, navigate });
    } catch (err) {
      if (err.body && isTrialExpiredResponse(false, err.body)) {
        setAccountStatus(handleTrialExpired(err.body, { requestedRole: ROLE }));
        setTrialExpired(true);
        return;
      }
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-100 flex flex-col">
      <button
        onClick={() => navigate(-1)}
        className="m-4 w-12 h-12 rounded-full bg-white shadow-card flex items-center justify-center text-slate-800 hover:bg-slate-50 transition-colors"
        aria-label="Go back"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      <div className="flex-1 flex items-center justify-center px-6 pb-10">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <Logo className="w-24 h-24" alt="MedTrap Logo" />
          </div>

          <div className="bg-white rounded-4xl shadow-card-lg p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl sm:text-[28px] font-extrabold text-slate-800 mb-2">
                Staff Portal
              </h1>
              <p className="text-sm text-slate-500">
                Sign in to your MedTrap Staff account
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-[13px] font-semibold text-slate-600 mb-2">
                  Email Address
                </label>
                <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-4">
                  <Mail className="w-5 h-5 text-slate-400 shrink-0" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    autoCapitalize="none"
                    className="flex-1 h-[52px] bg-transparent outline-none text-slate-800 placeholder-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-slate-600 mb-2">
                  Password
                </label>
                <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-4">
                  <Lock className="w-5 h-5 text-slate-400 shrink-0" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="flex-1 h-[52px] bg-transparent outline-none text-slate-800 placeholder-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-role-staff focus:ring-role-staff"
                  />
                  <span className="text-sm text-slate-500">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="text-sm font-semibold text-role-staff hover:opacity-80"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-4 rounded-2xl font-bold text-white shadow-lg bg-gradient-to-r from-role-staff-from to-role-staff-to hover:brightness-105 transition disabled:opacity-60"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            <div className="flex items-center gap-3 my-8">
              <div className="flex-1 h-px bg-slate-100" />
              <span className="text-xs text-slate-400">New to MedTrap Staff?</span>
              <div className="flex-1 h-px bg-slate-100" />
            </div>

            <div className="text-center">
              <button
                onClick={() => navigate("/adminCreateStaff")}
                className="text-sm font-bold text-role-staff hover:opacity-80"
              >
                Create your account
              </button>
            </div>
          </div>

          <div className="flex items-center justify-center gap-1.5 mt-6 text-xs text-slate-400">
            <Shield className="w-4 h-4 text-amber-500" />
            Protected by industry-standard security
          </div>
        </div>
      </div>

      <PaymentRequiredModal
        open={trialExpired}
        accountStatus={accountStatus}
        onGoToPayment={() => goToPayment(navigate, accountStatus)}
        onClose={() => setTrialExpired(false)}
      />
    </div>
  );
}
