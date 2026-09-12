import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

/**
 * Labeled input with a left icon and optional password show/hide toggle —
 * recreates Nebula's `InputField` pattern (repeated inline on every
 * login/signup screen: login.jsx, purchaser-login.jsx, purchaser-signup.jsx,
 * stockist-login.jsx, staff-login.jsx, Createstaff.jsx) as one shared
 * component instead of duplicating it per page.
 */
export default function Input({
  label,
  icon: Icon,
  type = "text",
  error,
  className = "",
  containerClassName = "",
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const resolvedType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className={containerClassName}>
      {label && (
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        )}
        <input
          {...props}
          type={resolvedType}
          className={`w-full ${Icon ? "pl-11" : "pl-4"} ${
            isPassword ? "pr-11" : "pr-4"
          } py-3 rounded-xl border ${
            error ? "border-red-300 focus:ring-red-500" : "border-slate-200 focus:ring-blue-500"
          } bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 transition-colors ${className}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
