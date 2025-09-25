import React, { useState, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import {
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
import { useEffect } from "react";

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
  // Ensure the user is authenticated (any logged-in user may create stockists)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.alert(
        "You must be signed in to create a stockist. Redirecting to login."
      );
      navigate("/login");
    }
  }, [navigate]);
  const [form, setForm] = useState({
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    password: "",
    address: { street: "", city: "", state: "", pincode: "" },
    licenseNumber: "",
    licenseExpiry: "",
    licenseImageUrl: "",
    dob: "",
    bloodGroup: "",
    profileImageUrl: "",
    roleType: "", // Proprietor or Pharmacist
    cntxNumber: "",
  });
  const [loading, setLoading] = useState(false);
  const [licenseImageFile, setLicenseImageFile] = useState(null);
  const [profileImageFile, setProfileImageFile] = useState(null);

  const setField = useCallback((path, value) => {
    if (path && path.startsWith("address.")) {
      const key = path.split(".")[1];
      setForm((f) => ({ ...f, address: { ...f.address, [key]: value } }));
    } else {
      setForm((f) => ({ ...f, [path]: value }));
    }
  }, []);

  const handleFileChange = (e) => {
    const file = e?.target?.files?.[0] || null;
    setLicenseImageFile(file);
  };

  const handleProfileFileChange = (e) => {
    const file = e?.target?.files?.[0] || null;
    setProfileImageFile(file);
  };

  const uploadToCloudinary = async (file) => {
    if (!file) return "";

    const formData = new FormData();
    // caller determines field name: licenseImage or profileImage
    // when calling this helper from frontend we always use licenseImage for license upload
    formData.append("licenseImage", file);

    const token = localStorage.getItem("token");
    const res = await fetch(apiUrl("/api/stockist/upload-license"), {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.message || "Upload failed");
    return json.url || json.data?.url || "";
  };

  const submit = async (e) => {
    e && e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        window.alert(
          "You must be signed in to perform this action. Redirecting to login."
        );
        navigate("/login");
        return;
      }
      // Upload profile image (if provided)
      let profileImageUrl = form.profileImageUrl || "";
      if (profileImageFile) {
        try {
          // adjust form field name expected by backend
          const formData = new FormData();
          formData.append("profileImage", profileImageFile);
          const token = localStorage.getItem("token");
          const upRes = await fetch(apiUrl("/api/stockist/upload-profile"), {
            method: "POST",
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: formData,
          });
          const upJson = await upRes.json().catch(() => ({}));
          if (!upRes.ok)
            throw new Error(upJson.message || "Profile upload failed");
          profileImageUrl = upJson.url || "";
        } catch (err) {
          window.alert("Profile image upload failed: " + String(err));
          setLoading(false);
          return;
        }
      }

      // If a license image file is selected, upload it first and set its URL
      let licenseImageUrl = form.licenseImageUrl || "";
      if (licenseImageFile) {
        try {
          const formData = new FormData();
          formData.append("licenseImage", licenseImageFile);
          const token = localStorage.getItem("token");
          const upRes = await fetch(apiUrl("/api/stockist/upload-license"), {
            method: "POST",
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: formData,
          });
          const upJson = await upRes.json().catch(() => ({}));
          if (!upRes.ok)
            throw new Error(upJson.message || "License upload failed");
          licenseImageUrl = upJson.url || "";
        } catch (err) {
          window.alert("License image upload failed: " + String(err));
          setLoading(false);
          return;
        }
      }

      const payload = { ...form, licenseImageUrl, profileImageUrl };

      const res = await fetch(apiUrl("/api/stockist"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          (data && data.message) || JSON.stringify(data) || res.statusText;
        window.alert(`Error: ${msg}`);
        return;
      }

      window.alert("Success — stockist created.");
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
              label="Firm Name"
              placeholder="Enter stockist name"
              value={form.name}
              path="name"
              onChange={setField}
              required
            />
            <InputField
              icon={User}
              label="Stockist Name"
              placeholder="Stockist Name"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Date of Birth
              </label>
              <input
                type="date"
                value={form.dob}
                onChange={(e) => setField("dob", e.target.value)}
                className="w-full rounded-xl border px-4 py-3 bg-white/90"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Blood Group
              </label>
              <select
                value={form.bloodGroup}
                onChange={(e) => setField("bloodGroup", e.target.value)}
                className="w-full rounded-xl border px-4 py-3 bg-white/90"
              >
                <option value="">Select</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Role Type
              </label>
              <select
                value={form.roleType}
                onChange={(e) => setField("roleType", e.target.value)}
                className="w-full rounded-xl border px-4 py-3 bg-white/90"
              >
                <option value="">Select</option>
                <option value="Proprietor">Proprietor</option>
                <option value="Pharmacist">Pharmacist</option>
              </select>
            </div>

            <InputField
              icon={User}
              label="CNTX Number"
              placeholder="CNTX number"
              value={form.cntxNumber}
              path="cntxNumber"
              onChange={setField}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2 flex items-center gap-2">
              Profile Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleProfileFileChange}
              className="w-full rounded-xl border px-4 py-3 bg-white/90"
            />
            {form.profileImageUrl && (
              <p className="text-xs text-slate-500 mt-2">
                Existing URL will be used if no file is chosen.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2 flex items-center gap-2">
              License Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full rounded-xl border px-4 py-3 bg-white/90"
            />
            {form.licenseImageUrl && (
              <p className="text-xs text-slate-500 mt-2">
                Existing URL will be used if no file is chosen.
              </p>
            )}
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
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={() => navigate("/stockist-login")}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold shadow hover:from-blue-600 hover:to-indigo-700 transition-colors duration-200"
            >
              Login as Stockist
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
