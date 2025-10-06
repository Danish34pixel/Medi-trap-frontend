import React, { useState, useCallback, memo } from "react";
import {
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  Calendar,
  Key,
  Building,
  Camera,
  Upload,
  CheckCircle,
  ArrowLeft,
  Heart,
} from "lucide-react";
import axios from "axios";
import { apiUrl } from "../config/api";
import { uploadToCloudinary } from "../../utils/cloudinaryUpload";
import { useNavigate } from "react-router-dom";

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
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          {Icon && (
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center justify-center">
              <Icon size={16} className="text-white" />
            </div>
          )}
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
        <input
          type={type}
          placeholder={placeholder}
          className="w-full rounded-xl border-2 border-gray-100 px-4 py-3 bg-gray-50 focus:bg-white focus:border-cyan-400 transition-all duration-200 text-gray-800"
          value={value}
          onChange={handleChange}
          required={required}
          {...props}
        />
      </div>
    );
  }
);

const FileUploadCard = ({ label, icon: Icon, onChange, hasFile, fileName }) => (
  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-400 to-pink-500 flex items-center justify-center">
          <Icon size={20} className="text-white" />
        </div>
        <span className="font-semibold text-gray-700">{label}</span>
      </div>
      {hasFile && <CheckCircle className="text-green-500" size={20} />}
    </div>

    <label className="block">
      <input
        type="file"
        accept="image/*"
        onChange={onChange}
        className="hidden"
      />
      <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-cyan-400 transition-colors cursor-pointer">
        <Upload className="mx-auto text-gray-400 mb-2" size={24} />
        <p className="text-sm text-gray-500">
          {hasFile ? `Selected: ${fileName}` : "Tap to upload image"}
        </p>
      </div>
    </label>
  </div>
);

const SelectField = ({ label, value, onChange, options, icon: Icon }) => (
  <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
    <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
      {Icon && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-400 to-indigo-500 flex items-center justify-center">
          <Icon size={16} className="text-white" />
        </div>
      )}
      {label}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border-2 border-gray-100 px-4 py-3 bg-gray-50 focus:bg-white focus:border-cyan-400 transition-all duration-200 text-gray-800"
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

export default function ModernStockistForm() {
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
  const navigate = useNavigate();

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
      // Upload files to Cloudinary (client-side helper)
      let profileImageUrl = form.profileImageUrl || "";
      let licenseImageUrl = form.licenseImageUrl || "";

      if (profileImageFile) {
        profileImageUrl = await uploadToCloudinary(profileImageFile);
      }
      if (licenseImageFile) {
        licenseImageUrl = await uploadToCloudinary(licenseImageFile);
      }

      // Prepare payload matching backend expectations
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

      const res = await axios.post(apiUrl("/api/stockist/register"), payload, {
        headers: { "Content-Type": "application/json" },
      });

      if (res?.data?.success) {
        // Optionally store token for immediate use: res.data.token
        // Redirect to stockist login page
        navigate("/stockist-login");
      } else {
        alert(res?.data?.message || "Failed to create stockist");
      }
    } catch (err) {
      console.error("Create stockist failed:", err);
      alert(
        err.response?.data?.message ||
          err.message ||
          "Failed to create stockist"
      );
    } finally {
      setLoading(false);
    }
  };

  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  const roleTypes = ["Proprietor", "Pharmacist"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div>
              <h1 className="font-bold text-gray-800">Create Stockist</h1>
              <p className="text-sm text-gray-500">Register new stockist</p>
            </div>
          </div>
          <Heart className="text-red-400" size={24} />
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* Progress Card */}
        <div className="bg-gradient-to-r from-cyan-400 to-blue-500 rounded-3xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold">Registration Form</h2>
              <p className="text-blue-100">Fill in stockist details</p>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
              <Building size={28} className="text-white" />
            </div>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`h-2 flex-1 rounded-full ${
                  step <= currentStep ? "bg-white" : "bg-white/30"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {/* Basic Information */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center">
                <User size={16} className="text-white" />
              </div>
              Basic Information
            </h3>
            <div className="space-y-4">
              <InputField
                icon={Building}
                label="Firm Name"
                placeholder="Enter firm name"
                value={form.name}
                path="name"
                onChange={setField}
                required
              />
              <InputField
                icon={User}
                label="Contact Person"
                placeholder="Contact person name"
                value={form.contactPerson}
                path="contactPerson"
                onChange={setField}
              />
            </div>
          </div>

          {/* Contact Details */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-400 to-pink-500 flex items-center justify-center">
                <Phone size={16} className="text-white" />
              </div>
              Contact Details
            </h3>
            <div className="space-y-4">
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
                placeholder="Email address"
                value={form.email}
                path="email"
                onChange={setField}
              />
              <InputField
                icon={Key}
                label="Password"
                type="password"
                placeholder="Set password"
                value={form.password}
                path="password"
                onChange={setField}
                required
              />
            </div>
          </div>

          {/* Address Information */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-400 to-red-500 flex items-center justify-center">
                <MapPin size={16} className="text-white" />
              </div>
              Address Details
            </h3>
            <div className="space-y-4">
              <InputField
                icon={MapPin}
                label="Street Address"
                placeholder="Street address"
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
                placeholder="Pincode"
                value={form.address.pincode}
                path="address.pincode"
                onChange={setField}
              />
            </div>
          </div>

          {/* License Information */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-400 to-purple-500 flex items-center justify-center">
                <FileText size={16} className="text-white" />
              </div>
              License Details
            </h3>
            <div className="space-y-4">
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
          </div>

          {/* Personal Information */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-teal-400 to-cyan-500 flex items-center justify-center">
                <User size={16} className="text-white" />
              </div>
              Personal Details
            </h3>
            <div className="space-y-4">
              <InputField
                icon={Calendar}
                label="Date of Birth"
                type="date"
                value={form.dob}
                path="dob"
                onChange={setField}
              />
              <SelectField
                icon={Heart}
                label="Blood Group"
                value={form.bloodGroup}
                onChange={(value) => setField("bloodGroup", value)}
                options={bloodGroups}
              />
              <SelectField
                icon={Building}
                label="Role Type"
                value={form.roleType}
                onChange={(value) => setField("roleType", value)}
                options={roleTypes}
              />
              <InputField
                icon={User}
                label="CNTX Number"
                placeholder="CNTX number"
                value={form.cntxNumber}
                path="cntxNumber"
                onChange={setField}
              />
            </div>
          </div>

          {/* File Uploads */}
          <div className="space-y-4">
            <FileUploadCard
              label="Profile Image"
              icon={Camera}
              onChange={handleProfileFileChange}
              hasFile={!!profileImageFile}
              fileName={profileImageFile?.name}
            />
            <FileUploadCard
              label="License Image"
              icon={FileText}
              onChange={handleLicenseFileChange}
              hasFile={!!licenseImageFile}
              fileName={licenseImageFile?.name}
            />
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              onClick={submit}
              disabled={loading}
              className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg transition-all duration-300 ${
                loading
                  ? "bg-gray-400 cursor-not-allowed text-gray-600"
                  : "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white transform hover:scale-[1.02] active:scale-[0.98]"
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                  Creating Stockist...
                </div>
              ) : (
                "Create Stockist"
              )}
            </button>
          </div>

          {/* Login Link */}
          <div className="text-center pt-4">
            <button
              type="button"
              onClick={() => navigate("/stockist-login")}
              className="px-8 py-3 rounded-xl bg-white border-2 border-gray-200 text-gray-600 font-semibold shadow-sm hover:border-cyan-400 hover:text-cyan-600 transition-colors duration-200"
            >
              Login as Stockist
            </button>
          </div>
        </div>

        {/* Bottom Spacing */}
        <div className="h-8"></div>
      </div>
    </div>
  );
}
