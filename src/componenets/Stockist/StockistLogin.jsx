import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, Shield } from "lucide-react";
import { apiUrl } from "../config/api";
import { setCookie, removeCookie, getCookie } from "../utils/cookies";

export default function StockistLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data && data.message) || "Login failed");
        setLoading(false);
        return;
      }

      // Clear any previous auth state first to avoid races where another
      // component reads an old token and overwrites the stored user/profile.
      try {
        removeCookie("token");
        localStorage.removeItem("user");
      } catch (e) {}

      // Store the new auth values once. Token stored in cookie (client-side).
      if (data.token) {
        console.debug(
          "Login: storing token (cookie) ->",
          data.token && data.token.slice(0, 16) + "..."
        );
        setCookie("token", data.token, 7);
      }
      if (data.user) {
        console.debug("Login: storing user ->", data.user && data.user.email);
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      // Log for debugging: show which user is stored and token snippet
      try {
        console.log(
          "Login: stored user ->",
          JSON.parse(localStorage.getItem("user"))
        );
        console.log(
          "Login: current token (cookie) ->",
          (getCookie("token") || "(none)").slice(0, 16) + "..."
        );
      } catch (e) {
        console.warn("Login: could not parse stored user", e);
      }

      // If the authenticated user is a stockist and not yet approved, send them to verification
      try {
        const storedUser =
          data.user || JSON.parse(localStorage.getItem("user") || "null");
        const isStockist =
          storedUser &&
          (storedUser.role === "stockist" ||
            storedUser.roleType === "stockist");
        const isApproved = storedUser && storedUser.approved;
        if (isStockist && !isApproved) {
          navigate("/stockist-outcode");
          setTimeout(() => window.location.reload(), 120);
        } else {
          // Force a reload so all components re-read localStorage and show the new account
          navigate("/stockist-outcode");
          setTimeout(() => window.location.reload(), 120);
        }
      } catch (e) {
        navigate("/stockist-outcode");
        setTimeout(() => window.location.reload(), 120);
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  // Diagnostic: log resolved API base & call runtime debug endpoint
  React.useEffect(() => {
    // Only run diagnostics in development to avoid noisy 404s in other envs
    if (!import.meta.env.DEV) return;
    try {
      const loginUrl = apiUrl("/api/auth/login");
      console.log("Resolved login URL:", loginUrl);
      // Removed /debug/runtime fetch to avoid noisy 404s when that endpoint
      // is not present on the backend.
    } catch (e) {
      console.warn("apiUrl diagnostic failed", e);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="relative inline-block">
            <div className="w-20 h-20 bg-gradient-to-r from-teal-400 via-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 mx-auto shadow-lg transform rotate-12">
              <img src="/final-logo.png" alt="" />
              <div className="bg-white rounded-lg p-2 transform -rotate-12">
                <div className="w-8 h-8 bg-gradient-to-r from-teal-500 to-blue-600 rounded-md flex items-center justify-center">
                  <div className="w-4 h-4 bg-white rounded-sm flex items-center justify-center">
                    <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-white rounded-full flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              </div>
            </div>
          </div>
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
              className="w-full bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
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
    </div>
  );
}
