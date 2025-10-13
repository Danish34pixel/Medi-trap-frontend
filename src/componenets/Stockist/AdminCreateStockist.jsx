import React, { useState, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "../config/api";
import { uploadToCloudinary } from "../../utils/cloudinaryUpload";

const InputField = memo(
  ({
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
      <div className="mb-5">
        <label className="block text-sm font-semibold text-gray-800 mb-2.5 flex items-center">
          {label}
          {required && <span className="text-rose-500 ml-1">*</span>}
        </label>
        <input
          type={type}
          placeholder={placeholder}
          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-300 text-gray-700 font-medium placeholder-gray-400"
          value={value}
          onChange={handleChange}
          required={required}
          {...props}
        />
      </div>
    );
  }
);

const FileUploadCard = ({ label, onChange, hasFile, fileName }) => (
  <div className="mb-5">
    <label className="block text-sm font-semibold text-gray-800 mb-2.5">
      {label}
    </label>
    <label className="block">
      <input
        type="file"
        accept="image/*"
        onChange={onChange}
        className="hidden"
      />
      <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-indigo-500 hover:bg-indigo-50 transition-all duration-300 cursor-pointer bg-white group">
        <div className="text-4xl mb-3 transition-transform group-hover:scale-110">
          {hasFile ? "✅" : "📸"}
        </div>
        <p className="text-sm font-medium text-gray-700">
          {hasFile ? (
            <span className="text-indigo-600">{fileName}</span>
          ) : (
            <>
              <span className="text-indigo-600">Click to upload</span>
              <br />
              <span className="text-gray-500 text-xs">PNG, JPG up to 5MB</span>
            </>
          )}
        </p>
      </div>
    </label>
  </div>
);

const SelectField = ({ label, value, onChange, options }) => (
  <div className="mb-5">
    <label className="block text-sm font-semibold text-gray-800 mb-2.5">
      {label}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-300 text-gray-700 font-medium appearance-none cursor-pointer"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%236366f1' d='M0 0l6 8 6-8z'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 1rem center",
        paddingRight: "2.5rem",
      }}
    >
      <option value="">Select {label}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  </div>
);

const SectionHeader = ({ icon, title }) => (
  <div className="flex items-center gap-3 mb-5 pb-4 border-b-2 border-indigo-100">
    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold shadow-md">
      {icon}
    </div>
    <h3 className="text-lg font-bold text-gray-800">{title}</h3>
  </div>
);

export default function MedTrapStockistForm() {
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
    licenseImageUrl: "",
    dob: "",
    bloodGroup: "",
    profileImageUrl: "",
    roleType: "",
    cntxNumber: "",
  });

  const [loading, setLoading] = useState(false);
  const [licenseImageFile, setLicenseImageFile] = useState(null);
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const setField = useCallback((path, value) => {
    if (path && path.startsWith("address.")) {
      const key = path.split(".")[1];
      setForm((f) => ({ ...f, address: { ...f.address, [key]: value } }));
    } else {
      setForm((f) => ({ ...f, [path]: value }));
    }
  }, []);

  const handleLicenseFileChange = (e) => {
    const file = e?.target?.files?.[0] || null;
    setLicenseImageFile(file);
  };

  const handleProfileFileChange = (e) => {
    const file = e?.target?.files?.[0] || null;
    setProfileImageFile(file);
  };

  const submit = async (e) => {
    e && e.preventDefault();
    setLoading(true);
    try {
      let licenseImageUrl = form.licenseImageUrl || "";
      let profileImageUrl = form.profileImageUrl || "";

      if (licenseImageFile) {
        licenseImageUrl = await uploadToCloudinary(licenseImageFile);
      }
      if (profileImageFile) {
        profileImageUrl = await uploadToCloudinary(profileImageFile);
      }

      const payload = {
        name: form.name,
        contactPerson: form.contactPerson,
        phone: form.phone,
        email: form.email,
        password: form.password,
        address: form.address,
        licenseNumber: form.licenseNumber,
        licenseExpiry: form.licenseExpiry || null,
        licenseImageUrl,
        dob: form.dob || null,
        bloodGroup: form.bloodGroup || null,
        profileImageUrl,
        roleType: form.roleType || null,
        cntxNumber: form.cntxNumber || null,
      };

      const res = await fetch(apiUrl("/api/stockist/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          json?.message || json?.error || `Request failed (${res.status})`;
        throw new Error(msg);
      }

      try {
        if (json && json.data && json.data._id) {
          localStorage.setItem("pendingStockistId", String(json.data._id));
        }
      } catch (e) {
        // ignore localStorage errors
      }

      try {
        navigate("/stockist/verification");
      } catch (e) {
        window.location.href = "/stockist/verification";
      }
    } catch (err) {
      console.error("Create stockist failed:", err);
      alert(err.message || "Failed to create stockist");
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  const roleTypes = ["Proprietor", "Pharmacist"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 py-12 px-4">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full blur-2xl opacity-30"></div>
            <div className="relative w-28 h-28 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-full flex items-center justify-center shadow-2xl">
              <span className="text-5xl">⚕️</span>
            </div>
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          MedTrap Stockist
        </h1>
        <p className="text-lg text-gray-600 font-medium">
          Partner with us to grow your pharmacy business
        </p>
      </div>

      {/* Main Container */}
      <div className="max-w-2xl mx-auto">
        {/* Progress Indicator */}
        <div className="mb-8 px-6 py-5 bg-white rounded-2xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-gray-700">
              Step {currentStep} of {totalSteps}
            </span>
            <span className="text-sm font-medium text-indigo-600">
              {currentStep === 1 && "Basic Information"}
              {currentStep === 2 && "Professional Details"}
              {currentStep === 3 && "Personal & Documents"}
            </span>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex-1">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    step <= currentStep
                      ? "bg-gradient-to-r from-indigo-500 to-purple-500 shadow-md"
                      : "bg-gray-200"
                  }`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 px-8 py-8 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">
              {currentStep === 1 && "Welcome to MedTrap"}
              {currentStep === 2 && "Professional Information"}
              {currentStep === 3 && "Final Step: Documents & Personal Info"}
            </h2>
            <p className="text-gray-600 mt-2">
              {currentStep === 1 && "Let's start with your basic information"}
              {currentStep === 2 && "Tell us about your pharmacy business"}
              {currentStep === 3 && "Complete your profile with documents"}
            </p>
          </div>

          <div className="px-8 py-8 max-h-96 overflow-y-auto">
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <SectionHeader icon="🏢" title="Firm Information" />
                <InputField
                  label="Firm/Shop Name"
                  placeholder="Enter your pharmacy name"
                  value={form.name}
                  path="name"
                  onChange={setField}
                  required
                />
                <InputField
                  label="Contact Person"
                  placeholder="Owner/Manager name"
                  value={form.contactPerson}
                  path="contactPerson"
                  onChange={setField}
                />

                <SectionHeader icon="📞" title="Contact Information" />
                <InputField
                  label="Email Address"
                  type="email"
                  placeholder="your.email@example.com"
                  value={form.email}
                  path="email"
                  onChange={setField}
                />
                <InputField
                  label="Phone Number"
                  placeholder="+91 XXXXX XXXXX"
                  value={form.phone}
                  path="phone"
                  onChange={setField}
                />
                <InputField
                  label="Create Password"
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  path="password"
                  onChange={setField}
                  required
                />
              </div>
            )}

            {/* Step 2: Professional Details */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <SectionHeader icon="📍" title="Location Details" />
                <InputField
                  label="Street Address"
                  placeholder="Shop address"
                  value={form.address.street}
                  path="address.street"
                  onChange={setField}
                />
                <div className="grid grid-cols-2 gap-4">
                  <InputField
                    label="City"
                    placeholder="City"
                    value={form.address.city}
                    path="address.city"
                    onChange={setField}
                  />
                  <InputField
                    label="State"
                    placeholder="State"
                    value={form.address.state}
                    path="address.state"
                    onChange={setField}
                  />
                </div>
                <InputField
                  label="Pincode"
                  placeholder="XXXXXX"
                  value={form.address.pincode}
                  path="address.pincode"
                  onChange={setField}
                />

                <SectionHeader icon="📜" title="License Information" />
                <InputField
                  label="License Number"
                  placeholder="Your pharmacy license number"
                  value={form.licenseNumber}
                  path="licenseNumber"
                  onChange={setField}
                />
                <InputField
                  label="License Expiry Date"
                  type="date"
                  value={form.licenseExpiry}
                  path="licenseExpiry"
                  onChange={setField}
                />
              </div>
            )}

            {/* Step 3: Personal & Documents */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <SectionHeader icon="👤" title="Personal Details" />
                <InputField
                  label="Date of Birth"
                  type="date"
                  value={form.dob}
                  path="dob"
                  onChange={setField}
                />
                <SelectField
                  label="Blood Group"
                  value={form.bloodGroup}
                  onChange={(value) => setField("bloodGroup", value)}
                  options={bloodGroups}
                />
                <SelectField
                  label="Role Type"
                  value={form.roleType}
                  onChange={(value) => setField("roleType", value)}
                  options={roleTypes}
                />
                <InputField
                  label="CNTX Number"
                  placeholder="CNTX identifier"
                  value={form.cntxNumber}
                  path="cntxNumber"
                  onChange={setField}
                />

                <SectionHeader icon="📁" title="Upload Documents" />
                <FileUploadCard
                  label="Profile Photo"
                  onChange={handleProfileFileChange}
                  hasFile={!!profileImageFile}
                  fileName={profileImageFile?.name}
                />
                <FileUploadCard
                  label="License Document"
                  onChange={handleLicenseFileChange}
                  hasFile={!!licenseImageFile}
                  fileName={licenseImageFile?.name}
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 bg-gradient-to-r from-gray-50 to-slate-50 px-8 py-6 flex gap-3 justify-between">
            <button
              onClick={prevStep}
              disabled={currentStep === 1 || loading}
              className={`px-8 py-3.5 rounded-xl font-bold transition-all duration-300 shadow-md ${
                currentStep === 1
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-white border-2 border-indigo-200 text-indigo-700 hover:border-indigo-500 hover:bg-indigo-50 hover:shadow-lg transform hover:-translate-y-0.5"
              }`}
            >
              ← Previous
            </button>

            {currentStep < totalSteps ? (
              <button
                onClick={nextStep}
                className="px-10 py-3.5 rounded-xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white shadow-lg hover:shadow-2xl transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={submit}
                disabled={loading}
                className={`px-10 py-3.5 rounded-xl font-bold shadow-lg transition-all duration-300 ${
                  loading
                    ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                    : "bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 text-white hover:shadow-2xl transform hover:-translate-y-0.5 active:translate-y-0"
                }`}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Registering...
                  </div>
                ) : (
                  "✓ Complete Registration"
                )}
              </button>
            )}
          </div>
        </div>

        {/* Security Footer */}
        <div className="mt-8 text-center">
          <div className="inline-block bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-xl px-6 py-3 shadow-sm">
            <p className="text-emerald-800 font-semibold text-sm">
              🔐 Your data is protected by industry-standard encryption
            </p>
          </div>
          <p className="text-gray-600 text-xs mt-4">
            By registering, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
