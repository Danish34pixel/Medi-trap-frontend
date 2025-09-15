import React, { useState, useEffect } from "react";
import { apiUrl } from "../config/api";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Mail,
  Lock,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
} from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      // Use configured API base so production builds point to the Render backend
      const response = await fetch(apiUrl(`/api/auth/login`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      if (data.success && data.token && data.user) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setMessage("Login successful!");
        setTimeout(() => navigate("/"), 1000);
      } else {
        throw new Error("Invalid response format from server");
      }
    } catch (err) {
      setMessage(err.message || "Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const InputField = ({
    icon: Icon,
    label,
    name,
    type = "text",
    placeholder,
    required = false,
    showPasswordToggle = false,
  }) => (
    <div className="relative group">
      <label
        className={`block text-sm font-medium transition-all duration-300 mb-2 ${
          focusedField === name ? "text-blue-600" : "text-gray-700"
        }`}
      >
        {label}
      </label>
      <div className="relative">
        <div
          className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-all duration-300 ${
            focusedField === name ? "text-blue-500" : "text-gray-400"
          }`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <input
          name={name}
          type={
            showPasswordToggle ? (showPassword ? "text" : "password") : type
          }
          placeholder={placeholder}
          value={form[name]}
          onChange={handleChange}
          onFocus={() => setFocusedField(name)}
          onBlur={() => setFocusedField(null)}
          required={required}
          className={`block w-full pl-10 pr-12 py-3 border rounded-lg shadow-sm placeholder-gray-500 transition-all duration-300 transform hover:scale-[1.01] focus:scale-[1.01] ${
            focusedField === name
              ? "border-blue-500 ring-2 ring-blue-200 bg-blue-50/50"
              : "border-gray-300 hover:border-gray-400 bg-white"
          }`}
        />
        {showPasswordToggle && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-all duration-200 hover:scale-110"
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Custom Fonts */}
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Poppins:wght@300;400;500;600;700;800&display=swap");

        * {
          font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI",
            Roboto, sans-serif;
        }

        .brand-font {
          font-family: "Poppins", sans-serif;
        }

        .fade-in {
          opacity: ${isVisible ? 1 : 0};
          transform: translateY(${isVisible ? "0" : "30px"});
          transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .slide-in-left {
          opacity: ${isVisible ? 1 : 0};
          transform: translateX(${isVisible ? "0" : "-50px"});
          transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.2s;
        }

        .slide-in-right {
          opacity: ${isVisible ? 1 : 0};
          transform: translateX(${isVisible ? "0" : "50px"});
          transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.4s;
        }

        .scale-in {
          opacity: ${isVisible ? 1 : 0};
          transform: scale(${isVisible ? 1 : 0.8});
          transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.6s;
        }

        .floating {
          animation: floating 6s ease-in-out infinite;
        }

        .pulse-ring {
          animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes floating {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes pulse-ring {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          100% {
            transform: scale(1.2);
            opacity: 0;
          }
        }

        .gradient-text {
          background: linear-gradient(135deg, #3b82f6, #10b981);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .glass-effect {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .hover-lift:hover {
          transform: translateY(-2px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
            0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }

        .button-gradient {
          background: linear-gradient(135deg, #3b82f6, #10b981);
          background-size: 200% 200%;
          animation: gradient-shift 3s ease infinite;
        }

        .button-gradient:hover {
          animation: gradient-shift 0.5s ease infinite;
        }

        @keyframes gradient-shift {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        /* Mobile Responsive */
        @media (max-width: 640px) {
          .mobile-padding {
            padding: 1rem;
          }

          .mobile-text {
            font-size: 2rem;
          }

          .mobile-card {
            margin: 1rem;
            padding: 1.5rem;
          }
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center py-4 sm:py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div
            className="absolute -bottom-40 -left-40 w-80 h-80 bg-green-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"
            style={{ animationDelay: "2s" }}
          ></div>
          <div
            className="absolute top-40 left-40 w-60 h-60 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"
            style={{ animationDelay: "4s" }}
          ></div>
        </div>

        <div className="max-w-md w-full relative z-10">
          {/* Logo and Header */}
          <div
            className="relative flex justify-center items-center mb-4"
            style={{ height: "80px" }}
          >
            <span
              className="text-blue-600 text-4xl absolute z-0"
              style={{ left: "45%", top: "10%" }}
            >
              D
            </span>
            <span
              className="text-red-600 text-4xl absolute z-0"
              style={{ left: "50%", top: "10%" }}
            >
              K
            </span>
            <img
              src="/cd774852582f4e41232a6ebd5886e0bc-removebg-preview.png"
              alt="MedTrap Logo"
              className="mx-auto w-20 h-20 mb-4 relative z-10"
            />
          </div>
          {/* Login Form */}
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100 glass-effect hover-lift transition-all duration-500 scale-in mobile-card">
            <div className="mb-6 slide-in-left">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2 brand-font">
                Welcome Back
              </h2>
              <p className="text-gray-600 text-sm sm:text-base">
                Sign in to your MedTrap account
              </p>
            </div>

            <div className="space-y-6 slide-in-right">
              <InputField
                icon={Mail}
                label="Email Address"
                name="email"
                type="email"
                placeholder="Enter your email address"
                required
              />

              <InputField
                icon={Lock}
                label="Password"
                name="password"
                type="password"
                placeholder="Enter your password"
                required
                showPasswordToggle={true}
              />

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-all duration-200 hover:scale-110"
                  />
                  <label
                    htmlFor="remember-me"
                    className="ml-2 block text-gray-700 font-medium"
                  >
                    Remember me
                  </label>
                </div>
                <a
                  href="#"
                  className="text-blue-600 hover:text-blue-500 transition-all duration-200 hover:underline font-medium"
                >
                  Forgot password?
                </a>
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white button-gradient hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    <span className="font-semibold">Signing in...</span>
                  </div>
                ) : (
                  <span className="font-semibold">Sign In</span>
                )}
              </button>

              {message && (
                <div
                  className={`flex items-center p-4 rounded-lg transition-all duration-500 transform ${
                    message.includes("successful")
                      ? "bg-green-50 border border-green-200 scale-100 opacity-100"
                      : "bg-red-50 border border-red-200 scale-100 opacity-100"
                  }`}
                >
                  {message.includes("successful") ? (
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 animate-bounce" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600 mr-3 animate-pulse" />
                  )}
                  <span
                    className={`text-sm font-medium ${
                      message.includes("successful")
                        ? "text-green-700"
                        : "text-red-700"
                    }`}
                  >
                    {message}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-6 fade-in" style={{ animationDelay: "1s" }}>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500 font-medium">
                    New to MedTrap?
                  </span>
                </div>
              </div>

              <div className="mt-4 text-center">
                <button
                  onClick={() => {
                    navigate("/signup");
                  }}
                  className="font-semibold text-blue-600 hover:text-blue-500 transition-all duration-200 hover:underline transform hover:scale-105 inline-block"
                >
                  Create your account
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            className="mt-6 sm:mt-8 text-center fade-in"
            style={{ animationDelay: "1.2s" }}
          >
            <p className="text-xs text-gray-500 font-medium">
              🔒 Protected by industry-standard security measures
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
