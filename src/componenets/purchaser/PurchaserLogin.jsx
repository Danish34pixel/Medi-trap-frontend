
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, User, Eye, EyeOff, AlertCircle } from "lucide-react";
import Logo from "../Logo";
import { postJson } from "../config/api";

const PurchaserLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);


  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }
    setError("");
    try {
      // Call backend login endpoint
      const res = await postJson("/auth/login", { email, password });
      if (res && res.token && res.user) {
        localStorage.setItem("token", res.token);
        localStorage.setItem("user", JSON.stringify(res.user));
        // Fetch the Purchaser by email to get the correct ID
        try {
          const purchaserRes = await postJson("/purchaser/find-by-email", { email });
          const purchaser = purchaserRes.data || purchaserRes.purchaser || purchaserRes;
          const purchaserId = purchaser._id || purchaser.id;
          if (purchaserId) {
            navigate(`/purchaser/${purchaserId}`);
            return;
          }
        } catch (e) {
          // fallback: go to dashboard or error
        }
        navigate("/dashboard");
      } else {
        setError("Invalid response from server. Please try again.");
      }
    } catch (err) {
      if (err && err.body && err.body.message) {
        setError(err.body.message);
      } else {
        setError(err.message || "Login failed. Please try again.");
      }
    }
  };

  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        {/* Header Card */}
        <div className="bg-white rounded-3xl shadow-lg p-8 mb-6">
          <div className="flex flex-col items-center mb-6">
            <Logo className="w-20 h-20" alt="MedTrap Logo" />
            <h1 className="text-2xl font-bold text-gray-800">Welcome Back</h1>
            <p className="text-sm text-gray-500 mt-1">Sign in to your purchaser account</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-700 text-sm font-medium">Error</p>
                <p className="text-red-600 text-xs mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Mail className="w-4 h-4 text-blue-500" />
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full px-4 py-3.5 pl-11 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-400 focus:border-transparent transition bg-gray-50 text-gray-800 placeholder-gray-400"
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Lock className="w-4 h-4 text-blue-500" />
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full px-4 py-3.5 pl-11 pr-11 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-400 focus:border-transparent transition bg-gray-50 text-gray-800 placeholder-gray-400"
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember & Forgot Password */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-2 focus:ring-blue-400"
                />
                <span className="text-gray-600">Remember me</span>
              </label>
        <button
          type="button"
          onClick={() => navigate('/forgot-password')}
          className="text-blue-500 hover:text-blue-600 font-medium transition"
        >
          Forgot Password?
        </button>
            </div>

        <button
              type="submit"
              className="w-full py-4 rounded-2xl font-semibold text-white transition shadow-lg bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-500 hover:to-cyan-600 active:scale-[0.98] mt-6"
              >
               Sign In
        </button>
          </form>{/* Submit Button */}
            

          {/* Sign Up Link */}
          <div className="text-center mt-6">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/purchaser-signup')}
                className="text-blue-500 hover:text-blue-600 font-semibold transition"
              >
                Sign Up
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaserLogin;