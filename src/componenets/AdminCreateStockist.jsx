import React, { useState, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  Calendar,
  Key,
  Building,
} from "lucide-react";
import { apiUrl } from "./config/api";
import Logo from "./Logo";

// Small reusable input field used by the page
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
    const handleChange = (e) => onChange(path, e.target.value);
    return (
      <div>
        <label className="block text-sm font-medium text-slate-600 mb-2 flex items-center gap-2">
          {Icon && <Icon size={16} className="text-blue-500" />}
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
        <input
          type={type}
          placeholder={placeholder}
          className="w-full rounded-xl border px-4 py-3 bg-white/90"
          value={value}
          onChange={handleChange}
          required={required}
          {...props}
        />
      </div>
    );
  }
);

export default function AdminCreateStockist() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    password: "",
    address: { street: "", city: "", state: "", pincode: "" },
    licenseNumber: "",
    licenseExpiry: "",
  });
  const [loading, setLoading] = useState(false);

  const setField = useCallback((path, value) => {
    if (path && path.startsWith("address.")) {
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
        return;
      }

      window.alert("Success — stockist created.");
      // After creating a stockist, open the stockist login page so the stockist can sign in
      navigate("/stockist-login");
    } catch (err) {
      window.alert(`Error submitting stockist: ${String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow p-8">
        <div className="flex items-center gap-4 mb-6">
          <Logo className="w-20 h-20" />
          <div>
            <h1 className="text-2xl font-extrabold text-slate-700">
              Create Stockist
            </h1>
            <p className="text-sm text-slate-500">Register a new stockist</p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField
              icon={Building}
              label="Stockist Name"
              placeholder="Enter stockist name"
              value={form.name}
              path="name"
              onChange={setField}
              required
            />
            <InputField
              icon={User}
              label="Contact Person"
              placeholder="Contact person"
              value={form.contactPerson}
              path="contactPerson"
              onChange={setField}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField
              icon={Phone}
              label="Phone"
              placeholder="Phone number"
              value={form.phone}
              path="phone"
              onChange={setField}
            />
            <InputField
              icon={Mail}
              label="Email"
              type="email"
              placeholder="Email"
              value={form.email}
              path="email"
              onChange={setField}
            />
            <InputField
              icon={Key}
              label="Password"
              type="password"
              placeholder="Set a password for stockist"
              value={form.password}
              path="password"
              onChange={setField}
              required
            />
          </div>

          {/* Generate Credentials removed per user request */}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField
              icon={MapPin}
              label="Street Address"
              placeholder="Street"
              value={form.address.street}
              path="address.street"
              onChange={setField}
            />
            <InputField
              icon={MapPin}
              label="City"
              placeholder="City"
              value={form.address.city}
              path="address.city"
              onChange={setField}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField
              icon={MapPin}
              label="State"
              placeholder="State"
              value={form.address.state}
              path="address.state"
              onChange={setField}
            />
            <InputField
              icon={MapPin}
              label="Pincode"
              placeholder="Pincode"
              value={form.address.pincode}
              path="address.pincode"
              onChange={setField}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField
              icon={FileText}
              label="License Number"
              placeholder="License number"
              value={form.licenseNumber}
              path="licenseNumber"
              onChange={setField}
            />
            <InputField
              icon={Calendar}
              label="License Expiry"
              type="date"
              value={form.licenseExpiry}
              path="licenseExpiry"
              onChange={setField}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-xl text-white font-semibold ${
                loading
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {loading ? "Creating Stockist..." : "Create Stockist"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
