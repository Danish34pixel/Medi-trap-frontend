import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  Calendar,
  Sparkles,
  Building,
  Star,
} from "lucide-react";
import { apiUrl } from "./config/api";
import Logo from "./Logo";

// The InputField component remains exactly the same as in your second code snippet.
const InputField = memo(
  ({
    icon: Icon,
    label,
    type = "text",
    placeholder,
    value,
    onChange,
    required = false,
    path,
    ...props
  }) => {
    const handleChange = (e) => {
      onChange(path, e.target.value);
    };

    return (
      <div className="group relative">
        <label className="block text-sm font-semibold text-slate-600 mb-3 flex items-center gap-2">
          <Icon size={16} className="text-blue-500" />
          {label}
          {required && <Star size={12} className="text-red-400" />}
        </label>
        <div className="relative">
          <input
            type={type}
            placeholder={placeholder}
            className="w-full bg-white/90 backdrop-blur-xl border border-slate-200/50 rounded-2xl px-5 py-4 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all duration-300 hover:border-slate-300/50 hover:bg-white group-hover:shadow-lg group-hover:shadow-blue-500/10"
            value={value}
            onChange={handleChange}
            required={required}
            {...props}
          />
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
        </div>
      </div>
    );
  }
);

export default function AdminCreateStockist() {
  const [form, setForm] = useState({
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: { street: "", city: "", state: "", pincode: "" },
    licenseNumber: "",
    licenseExpiry: "",
  });
  const [loading, setLoading] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [particles, setParticles] = useState([]);

  const navigate = useNavigate();

  // Track mouse movement for interactive effects (batch updates with rAF)
  const rafRef = useRef(null);
  const lastMouseRef = useRef(0);
  useEffect(() => {
    const handleMouseMove = (e) => {
      const now = Date.now();
      if (now - lastMouseRef.current < 120) return;
      lastMouseRef.current = now;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        setMousePosition({ x: e.clientX, y: e.clientY });
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Generate floating particles
  useEffect(() => {
    const generateParticles = () => {
      const newParticles = [];
      for (let i = 0; i < 15; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 3 + 1,
          opacity: Math.random() * 0.3 + 0.1,
          duration: Math.random() * 4 + 3,
        });
      }
      setParticles(newParticles);
    };
    generateParticles();
  }, []);

  // Correctly memoized handler to update nested state
  const setField = useCallback((path, value) => {
    if (path.startsWith("address.")) {
      const key = path.split(".")[1];
      setForm((f) => ({ ...f, address: { ...f.address, [key]: value } }));
    } else {
      setForm((f) => ({ ...f, [path]: value }));
    }
  }, []);

  const submit = async (e) => {
    e && e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(apiUrl("/api/stockist"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(form),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          (data && data.message) || JSON.stringify(data) || res.statusText;
        window.alert(`Error: ${msg}`);
      } else {
        window.alert("Success — stockist created.");
        navigate ? navigate(-1) : window.history.back();
      }
    } catch (err) {
      // Show user-facing alert for submit failure; avoid noisy console output in production UI
      window.alert(`Error submitting stockist: ${String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Light gradient background matching the image */}
      <div
        className="absolute inset-0 transition-all duration-1000"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, 
            rgba(99, 102, 241, 0.08), 
            rgba(139, 92, 246, 0.05), 
            rgba(168, 85, 247, 0.03), 
            transparent 50%),
            linear-gradient(135deg, 
            #f8fafc 0%, 
            #f1f5f9 25%, 
            #e2e8f0 50%, 
            #cbd5e1 75%, 
            #94a3b8 100%)`,
        }}
      />

      {/* Subtle floating particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-1 h-1 bg-blue-400/40 rounded-full animate-ping"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            opacity: particle.opacity,
            animationDuration: `${particle.duration}s`,
            animationDelay: `${particle.id * 0.2}s`,
          }}
        />
      ))}

      {/* Soft background shapes */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-r from-blue-500/3 to-purple-500/3 rounded-full blur-3xl animate-spin"
          style={{ animationDuration: "25s" }}
        ></div>
      </div>

      <div className="relative flex items-start justify-center min-h-screen py-8 px-4">
        <div className="w-full max-w-4xl">
          {/* Main container with light glassmorphism */}
          <div className="relative bg-white/80 backdrop-blur-2xl rounded-3xl border border-white/60 shadow-2xl shadow-slate-200/50 p-8 sm:p-12">
            {/* Subtle border glow */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 blur-sm animate-pulse"></div>
            <div className="absolute inset-[1px] rounded-3xl bg-white/90 backdrop-blur-xl"></div>

            <div className="relative z-10">
              {/* Light themed header */}
              <div className="text-center mb-12 relative">
                <Logo className="h-25 w-32" />

                <h1 className="text-4xl sm:text-5xl font-black mb-4 relative">
                  <span className="bg-gradient-to-r from-slate-700 via-slate-600 to-slate-500 bg-clip-text text-transparent">
                    Create Stockist
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-purple-500/20 bg-clip-text text-transparent blur-sm animate-pulse delay-500"></div>
                </h1>

                <p className="text-slate-500 text-lg font-light">
                  Register a new stockist with comprehensive details
                </p>
              </div>

              {/* Enhanced form with light theme */}
              <div onSubmit={submit} className="space-y-8">
                {/* Basic Information Section */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/3 to-indigo-500/3 rounded-3xl blur-xl"></div>
                  <div className="relative bg-white/60 backdrop-blur-xl rounded-3xl border border-white/40 p-8 shadow-lg shadow-slate-200/20">
                    <h2 className="text-xl font-bold text-slate-600 mb-6 flex items-center gap-3">
                      <User className="text-blue-500" size={20} />
                      Basic Information
                    </h2>

                    <div className="space-y-6">
                      <InputField
                        icon={Building}
                        label="Stockist Name"
                        placeholder="Enter stockist name"
                        value={form.name}
                        path="name"
                        onChange={setField} // Pass setField directly
                        required
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <InputField
                          icon={User}
                          label="Contact Person"
                          placeholder="Primary contact person"
                          value={form.contactPerson}
                          path="contactPerson"
                          onChange={setField} // Pass setField directly
                        />

                        <InputField
                          icon={Phone}
                          label="Phone Number"
                          type="tel"
                          placeholder="Contact phone number"
                          value={form.phone}
                          path="phone"
                          onChange={setField} // Pass setField directly
                        />
                      </div>

                      <InputField
                        icon={Mail}
                        label="Email Address"
                        type="email"
                        placeholder="Business email address"
                        value={form.email}
                        path="email"
                        onChange={setField} // Pass setField directly
                      />
                    </div>
                  </div>
                </div>

                {/* Address Section */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/3 to-purple-500/3 rounded-3xl blur-xl"></div>
                  <div className="relative bg-white/60 backdrop-blur-xl rounded-3xl border border-white/40 p-8 shadow-lg shadow-slate-200/20">
                    <h2 className="text-xl font-bold text-slate-600 mb-6 flex items-center gap-3">
                      <MapPin className="text-indigo-500" size={20} />
                      Address Details
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <InputField
                        icon={MapPin}
                        label="Street Address"
                        placeholder="Street address"
                        value={form.address.street}
                        path="address.street"
                        onChange={setField} // Pass setField directly
                      />

                      <InputField
                        icon={Building}
                        label="City"
                        placeholder="City name"
                        value={form.address.city}
                        path="address.city"
                        onChange={setField} // Pass setField directly
                      />

                      <InputField
                        icon={MapPin}
                        label="State"
                        placeholder="State/Province"
                        value={form.address.state}
                        path="address.state"
                        onChange={setField} // Pass setField directly
                      />

                      <InputField
                        icon={MapPin}
                        label="Pincode"
                        inputMode="numeric"
                        placeholder="Postal code"
                        value={form.address.pincode}
                        path="address.pincode"
                        onChange={setField} // Pass setField directly
                      />
                    </div>
                  </div>
                </div>

                {/* License Information Section */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/3 to-pink-500/3 rounded-3xl blur-xl"></div>
                  <div className="relative bg-white/60 backdrop-blur-xl rounded-3xl border border-white/40 p-8 shadow-lg shadow-slate-200/20">
                    <h2 className="text-xl font-bold text-slate-600 mb-6 flex items-center gap-3">
                      <FileText className="text-purple-500" size={20} />
                      License Information
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <InputField
                        icon={FileText}
                        label="License Number"
                        placeholder="Enter license number"
                        value={form.licenseNumber}
                        path="licenseNumber"
                        onChange={setField} // Pass setField directly
                      />

                      <InputField
                        icon={Calendar}
                        label="License Expiry Date"
                        type="date"
                        value={form.licenseExpiry}
                        path="licenseExpiry"
                        onChange={setField} // Pass setField directly
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Button - Blue theme matching the image */}
                <div className="pt-8">
                  <button
                    type="submit"
                    onClick={submit}
                    className={`group relative w-full text-white font-bold py-5 px-8 rounded-2xl transition-all duration-500 transform hover:scale-105 overflow-hidden border border-white/30 ${
                      loading
                        ? "bg-gradient-to-r from-blue-400/70 to-indigo-500/70 cursor-not-allowed"
                        : "bg-gradient-to-r from-blue-500 via-indigo-600 to-blue-700 hover:shadow-2xl hover:shadow-blue-500/25"
                    }`}
                    disabled={loading}
                  >
                    {/* Animated background */}
                    {!loading && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                    )}

                    {/* Button content */}
                    <div className="relative flex items-center justify-center gap-3">
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span className="text-lg tracking-wider">
                            Creating Stockist...
                          </span>
                        </>
                      ) : (
                        <>
                          <Package size={20} />
                          <span className="text-lg tracking-wider">
                            CREATE STOCKIST
                          </span>
                        </>
                      )}
                    </div>

                    {/* Subtle glowing border effect */}
                    {!loading && (
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/30 via-indigo-500/30 to-blue-500/30 blur-md -z-10 animate-pulse"></div>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
