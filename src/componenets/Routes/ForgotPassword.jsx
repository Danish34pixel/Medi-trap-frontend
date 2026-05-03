import React, { useState } from "react";
import { apiUrl } from "../../componenets/config/api";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  ArrowLeft,
  Shield,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e && e.preventDefault();
    if (!email)
      return setStatus({ ok: false, msg: "Please enter a valid email." });
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch(apiUrl("/api/auth/forgot-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json().catch(() => ({}));

      // Always show a generic success message to avoid user enumeration
      if (res.ok) {
        const msg =
          data?.message || "If an account exists, a reset email has been sent.";
        // If server returned debug info (resetUrl or previewUrl), include it in the status so testers can click.
        const debug = data?.debug || null;
        setStatus({ ok: true, msg, debug });
      } else {
        const msg = data?.message || "Something went wrong. Please try again.";
        setStatus({ ok: false, msg });
      }
    } catch (err) {
      setStatus({ ok: false, msg: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl mb-4 shadow-lg">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Forgot Password?
          </h1>
          <p className="text-gray-600 text-sm">
            Don't worry — we'll help you reset it.
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 backdrop-blur-sm border border-white/50">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              Reset Your Password
            </h2>
            <p className="text-sm text-gray-600">
              Enter your email address and we'll send you a secure link to reset
              your password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 text-gray-800 placeholder-gray-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-semibold py-4 rounded-2xl transition-all duration-200 transform hover:scale-[1.02] disabled:scale-100 shadow-lg disabled:shadow-none"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Sending Reset Link...</span>
                </div>
              ) : (
                "Send Reset Link"
              )}
            </button>

            {status && (
              <div
                className={`flex items-start space-x-3 p-4 rounded-2xl ${
                  status.ok
                    ? "bg-emerald-50 border border-emerald-200"
                    : "bg-red-50 border border-red-200"
                }`}
              >
                {status.ok ? (
                  <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                )}
                <div>
                  <p
                    className={`text-sm ${
                      status.ok ? "text-emerald-800" : "text-red-800"
                    }`}
                  >
                    {status.msg}
                  </p>
                  {/* Show debug links when available (DEBUG_EMAIL=true) */}
                  {status.debug && (
                    <div className="mt-2 text-sm">
                      {status.debug.resetUrl && (
                        <p>
                          <a
                            href={status.debug.resetUrl}
                            className="text-teal-600 hover:underline"
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open reset link
                          </a>
                        </p>
                      )}
                      {status.debug.previewUrl && (
                        <p>
                          <a
                            href={status.debug.previewUrl}
                            className="text-teal-600 hover:underline"
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open mail preview
                          </a>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="text-center pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="inline-flex items-center space-x-2 text-sm text-gray-600 hover:text-teal-600 transition-colors duration-200"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Login</span>
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-500">
            Need help? Contact our support team
          </p>
        </div>
      </div>
    </div>
  );
}
