import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, Shield } from "lucide-react";
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

const ROLE = "stockist";

export default function StockistLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [trialExpired, setTrialExpired] = useState(false);
  const [accountStatus, setAccountStatus] = useState(null);

  useEffect(() => {
    const saved = loadRememberedIdentifier(ROLE);
    if (saved) {
      setEmail(saved);
      setRememberMe(true);
    }
  }, []);

  async function submit(e) {
    e.preventDefault();
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
      setError((err && err.body && err.body.message) || err.message || "Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Logo className="w-20 h-20 mx-auto" alt="MedTrap Logo" />
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-3xl shadow-xl p-8 backdrop-blur-sm">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Welcome Back
            </h1>
            <p className="text-gray-600">Sign in to your MedTrap account</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 bg-gray-50"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 bg-gray-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-teal-600 bg-gray-100 border-gray-300 rounded focus:ring-teal-500 focus:ring-2"
                />
                <span className="ml-2 text-sm text-gray-600">Remember me</span>
              </label>
              <a
                href="/forgot-password"
                className="text-sm text-teal-600 hover:text-teal-500 font-medium transition-colors"
              >
                Forgot password?
              </a>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-role-stockist-from to-role-stockist-to hover:brightness-105 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Signing in...
                </div>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">
                New to MedTrap?
              </span>
            </div>
          </div>

          {/* Create Account Link */}
          <div className="text-center">
            <a
              href="/adminCreateStockist"
              className="text-teal-600 hover:text-teal-500 font-semibold transition-colors"
            >
              Create your account
            </a>
          </div>
        </div>

        {/* Security Notice */}
        <div className="text-center mt-6">
          <div className="flex items-center justify-center text-sm text-gray-500">
            <Shield className="w-4 h-4 text-amber-500 mr-1" />
            Protected by industry-standard security measures
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
