import React, { useState, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "../config/api";
import { uploadToCloudinary } from "../../utils/cloudinaryUpload";
import Logo from "../Logo";

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
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-600 mb-2">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
        <input
          type={type}
          placeholder={placeholder}
          className="w-full px-4 py-3 rounded-2xl border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-cyan-400 transition-all duration-200 text-gray-800 text-sm placeholder-gray-400 shadow-sm"
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
  <div className="mb-4">
    <label className="block text-xs font-medium text-gray-600 mb-2">
      {label}
    </label>
    <label className="block">
      <input
        type="file"
        accept="image/*"
        onChange={onChange}
        className="hidden"
      />
      <div className="relative bg-gradient-to-br from-cyan-400 to-cyan-500 rounded-3xl p-6 text-center cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300 group">
        <div className="text-3xl mb-2">
          {hasFile ? "✅" : "📸"}
        </div>
        <p className="text-sm font-semibold text-white">
          {hasFile ? (
            <span>{fileName}</span>
          ) : (
            <>
              <span>Tap to upload</span>
              <br />
              <span className="text-xs font-normal opacity-90">PNG, JPG up to 5MB</span>
            </>
          )}
        </p>
      </div>
    </label>
  </div>
);

const SelectField = ({ label, value, onChange, options }) => (
  <div className="mb-4">
    <label className="block text-xs font-medium text-gray-600 mb-2">
      {label}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-3 rounded-2xl border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-cyan-400 transition-all duration-200 text-gray-800 text-sm appearance-none cursor-pointer shadow-sm"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%2322d3ee' d='M0 0l6 8 6-8z'/%3E%3C/svg%3E")`,
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
  <div className="flex items-center gap-3 mb-5 mt-6">
    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-400 to-cyan-500 flex items-center justify-center text-white text-lg shadow-lg">
      {icon}
    </div>
    <h3 className="text-base font-bold text-gray-800">{title}</h3>
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
    <div className="min-h-screen bg-gray-100 py-2 md:py-6 px-2 md:px-4 flex items-center justify-center">
      <div className="w-full max-w-md mx-auto bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden" style={{ minHeight: 'calc(100vh - 32px)', height: 'auto', maxHeight: { md: '800px' } }}>
        {/* Logo */}
        <div className="pt-6 pb-2 text-center">
          <Logo className="h-12 w-auto mx-auto" />
        </div>

        {/* Header */}
        <div className="bg-white px-4 md:px-6 pb-4 md:pb-6">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <button 
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                currentStep === 1 
                  ? 'bg-gray-100 text-gray-300' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ←
            </button>
            <h1 className="text-lg font-bold text-gray-800">Stockist Registration</h1>
            <div className="w-10 h-10 rounded-2xl  flex items-center justify-center text-white shadow-lg">
              
            </div>
          </div>

          {/* Progress Pills */}
          <div className="flex gap-2 mb-6">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${
                  step <= currentStep
                    ? "bg-gradient-to-r from-cyan-400 to-cyan-500"
                    : "bg-gray-200"
                }`}
              />
            ))}
          </div>

          {/* Hero Card */}
          <div className="bg-gradient-to-br from-cyan-400 to-cyan-500 rounded-3xl p-6 shadow-xl mb-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-10 -mt-10"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full -ml-8 -mb-8"></div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-2">
                <div className="text-3xl">⚕️</div>
                <div>
                  <h2 className="text-white font-bold text-lg">MedTrap Partner</h2>
                  <p className="text-cyan-100 text-xs">
                    {currentStep === 1 && "Basic Information"}
                    {currentStep === 2 && "Professional Details"}
                    {currentStep === 3 && "Documents & Personal"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Form Content */}
        <div className="px-4 md:px-6 pb-4 md:pb-6 overflow-y-auto" style={{ 
          height: 'auto',
          maxHeight: 'calc(100vh - 340px)',
          '@media (min-width: 768px)': {
            height: 'calc(100vh - 420px)',
            maxHeight: '380px'
          }
        }}>
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div>
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

              <SectionHeader icon="📞" title="Contact Details" />
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
            <div>
              <SectionHeader icon="📍" title="Location" />
              <InputField
                label="Street Address"
                placeholder="Shop address"
                value={form.address.street}
                path="address.street"
                onChange={setField}
              />
              <div className="grid grid-cols-2 gap-3">
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

              <SectionHeader icon="📜" title="License" />
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
            <div>
              <SectionHeader icon="👤" title="Personal Info" />
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

              <SectionHeader icon="📁" title="Documents" />
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

        {/* Fixed Bottom Action Button */}
        <div className="px-4 md:px-6 pb-6 md:pb-8 bg-white">
          {currentStep < totalSteps ? (
            <button
              onClick={nextStep}
              className="w-full py-4 rounded-3xl font-bold bg-gradient-to-r from-cyan-400 to-cyan-500 text-white shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 text-base"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={loading}
              className={`w-full py-4 rounded-3xl font-bold shadow-xl transition-all duration-300 text-base ${
                loading
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-cyan-400 to-cyan-500 text-white hover:shadow-2xl transform hover:-translate-y-0.5 active:translate-y-0"
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Registering...
                </div>
              ) : (
                "Complete Registration"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}