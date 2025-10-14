import React, { useState } from "react";
import Logo from "../Logo";
import { apiUrl } from "../config/api";
import { setCookie, getCookie } from "../utils/cookies";
import { useNavigate } from "react-router-dom";

const InputField = ({
  icon: Icon,
  label,
  name,
  type = "text",
  placeholder,
  required = false,
  accept,
  value,
  onChange,
}) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
      {Icon && <Icon className="h-4 w-4 text-cyan-600" />}
      {label}
    </label>
    {type === "file" ? (
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        onChange={onChange}
        required={required}
        accept={accept}
        className="block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all duration-200"
      />
    ) : (
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        autoComplete={name === "password" ? "new-password" : "on"}
        className="block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all duration-200"
      />
    )}
  </div>
);

const Signup = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    medicalName: "",
    ownerName: "",
    address: "",
    email: "",
    contactNo: "",
    drugLicenseNo: "",
    password: "",
    drugLicenseImage: null,
  });
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "drugLicenseImage") {
      setForm((prev) => ({ ...prev, drugLicenseImage: files[0] }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };


  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setForm((prev) => ({
        ...prev,
        drugLicenseImage: e.dataTransfer.files[0],
      }));
    }
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setIsLoading(true);
    setMessage("");
    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (value !== null && value !== undefined) formData.append(key, value);
    });
    try {
      const response = await fetch(apiUrl(`/api/auth/signup`), {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }
      if (data.success) {
        setMessage("Registration successful! You can now log in.");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        throw new Error("Invalid response format from server");
      }
    } catch (err) {
      setMessage(err.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Icon components
  const Building2 = (props) => (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m11 0v-4a2 2 0 00-2-2h-2a2 2 0 00-2 2v4m6 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v12"
      />
    </svg>
  );

  const User = (props) => (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  );

  const MapPin = (props) => (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );

  const Mail = (props) => (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  );

  const Phone = (props) => (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
      />
    </svg>
  );

  const Shield = (props) => (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );

  const Lock = (props) => (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    </svg>
  );

  const Upload = (props) => (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
      />
    </svg>
  );

  const CheckCircle = (props) => (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );

  const AlertCircle = (props) => (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-md w-full mx-auto">
        {/* Logo and Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <Logo className="w-16 h-16" alt="MedTrap Logo" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">MedTrap</h1>
          <p className="text-sm text-gray-600 mt-1">Healthcare Management System</p>
        </div>

        {/* Registration Form */}
        <div className="bg-white rounded-3xl shadow-sm p-6 border border-gray-100">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-1">
              Create Account
            </h2>
            <p className="text-sm text-gray-600">
              Register your medical store
            </p>
          </div>

          
          {/* Medical store signup form (only option) */}
            <>
              <InputField
                icon={Building2}
                label="Medical Store Name"
                name="medicalName"
                placeholder="Enter store name"
                value={form.medicalName}
                onChange={handleChange}
                required
              />
              <InputField
                icon={User}
                label="Owner Name"
                name="ownerName"
                placeholder="Enter owner's name"
                value={form.ownerName}
                onChange={handleChange}
                required
              />
              <InputField
                icon={MapPin}
                label="Address"
                name="address"
                placeholder="Complete address"
                value={form.address}
                onChange={handleChange}
                required
              />
              <InputField
                icon={Mail}
                label="Email Address"
                name="email"
                type="email"
                placeholder="your@email.com"
                value={form.email}
                onChange={handleChange}
                required
              />
              <InputField
                icon={Phone}
                label="Contact Number"
                name="contactNo"
                type="tel"
                placeholder="Phone number"
                value={form.contactNo}
                onChange={handleChange}
                required
              />
              <InputField
                icon={Shield}
                label="Drug License Number"
                name="drugLicenseNo"
                placeholder="License number"
                value={form.drugLicenseNo}
                onChange={handleChange}
                required
              />

              {/* File Upload */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Drug License Image
                </label>
                <div
                  className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                    dragActive
                      ? "border-cyan-400 bg-cyan-50"
                      : "border-gray-200 hover:border-cyan-300"
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    name="drugLicenseImage"
                    type="file"
                    accept="image/*"
                    onChange={handleChange}
                    required
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                  <div>
                    <p className="text-sm text-gray-600">
                      {form.drugLicenseImage ? (
                        <span className="text-cyan-600 font-medium">
                          ✓ {form.drugLicenseImage.name}
                        </span>
                      ) : (
                        <>
                          <span className="font-medium text-cyan-600">
                            Tap to upload
                          </span>{" "}
                          or drag and drop
                        </>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PNG, JPG, GIF up to 10MB
                    </p>
                  </div>
                </div>
              </div>

              <InputField
                icon={Lock}
                label="Password"
                name="password"
                type="password"
                placeholder="Create password"
                value={form.password}
                onChange={handleChange}
                required
              />

              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className={`w-full py-4 rounded-2xl font-bold text-white shadow-md transition-all ${
                  isLoading
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-gradient-to-r from-cyan-500 to-cyan-600 hover:shadow-lg active:scale-98"
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Creating Account...
                  </div>
                ) : (
                  "Create Account"
                )}
              </button>
            </>

          {message && (
            <div
              className={`mt-4 flex items-center gap-2 p-4 rounded-xl ${
                message.includes("successful")
                  ? "bg-green-50 border border-green-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              {message.includes("successful") ? (
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
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

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="font-semibold text-cyan-600 hover:text-cyan-700 transition-colors"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            By registering, you agree to our{" "}
            <a href="#" className="text-cyan-600 hover:text-cyan-700 font-medium">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-cyan-600 hover:text-cyan-700 font-medium">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;