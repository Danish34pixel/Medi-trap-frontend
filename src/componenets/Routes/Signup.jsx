import React, { useState } from "react";
import Logo from "../Logo";
import { apiUrl } from "../config/api";
import { useNavigate } from "react-router-dom";

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

  const InputField = ({
    icon: Icon,
    label,
    name,
    type = "text",
    placeholder,
    required = false,
    accept,
  }) => (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Icon className="h-5 w-5 text-gray-400" />
        </div>
        {type === "file" ? (
          <input
            name={name}
            type={type}
            placeholder={placeholder}
            onChange={handleChange}
            required={required}
            accept={accept}
            className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl shadow-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
          />
        ) : (
          <input
            name={name}
            type={type}
            placeholder={placeholder}
            value={form[name] || ""}
            onChange={handleChange}
            required={required}
            autoComplete={name === "password" ? "new-password" : "on"}
            className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl shadow-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
          />
        )}
      </div>
    </div>
  );

  // Icon components
  const Building2 = (props) => (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m11 0v-4a2 2 0 00-2-2h-2a2 2 0 00-2 2v4m6 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v12" />
    </svg>
  );

  const User = (props) => (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );

  const MapPin = (props) => (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );

  const Mail = (props) => (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );

  const Phone = (props) => (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  );

  const Shield = (props) => (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  const Lock = (props) => (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );

  const Upload = (props) => (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
  );

  const CheckCircle = (props) => (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  const AlertCircle = (props) => (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center" style={{ backgroundColor: '#f8fafc' }}>
      <div className="max-w-md w-full mx-auto">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <Logo className="w-20 h-20" alt="MedTrap Logo" />
          <h1 className="text-2xl font-bold text-gray-800">MedTrap</h1>
          <p className="text-gray-600 mt-1">Medical Store Management</p>
        </div>

        {/* Registration Form */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Create Your Account
            </h2>
            <p className="text-gray-600">
              Register your medical store with MedTrap
            </p>
          </div>

          <div className="space-y-6">
            <InputField
              icon={Building2}
              label="Medical Store Name"
              name="medicalName"
              placeholder="Enter your medical store name"
              required
            />
            <InputField
              icon={User}
              label="Owner Name"
              name="ownerName"
              placeholder="Enter owner's full name"
              required
            />
            <InputField
              icon={MapPin}
              label="Address"
              name="address"
              placeholder="Enter complete address"
              required
            />
            <InputField
              icon={Mail}
              label="Email Address"
              name="email"
              type="email"
              placeholder="Enter your email"
              required
            />
            <InputField
              icon={Phone}
              label="Contact Number"
              name="contactNo"
              type="tel"
              placeholder="Enter contact number"
              required
            />
            <InputField
              icon={Shield}
              label="Drug License Number"
              name="drugLicenseNo"
              placeholder="Enter drug license number"
              required
            />
            
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Drug License Image
              </label>
              <div
                className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 ${
                  dragActive
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-blue-300"
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
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-3">
                  <p className="text-sm text-gray-600">
                    {form.drugLicenseImage ? (
                      <span className="text-blue-600 font-medium">
                        {form.drugLicenseImage.name}
                      </span>
                    ) : (
                      <>
                        <span className="font-medium text-blue-600">
                          Click to upload
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
              placeholder="Create a strong password"
              required
            />
            
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full flex justify-center py-4 px-6 border border-transparent rounded-xl shadow-md text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Creating Account...
                </div>
              ) : (
                "Create Account"
              )}
            </button>

            {message && (
              <div
                className={`flex items-center p-4 rounded-xl ${
                  message.includes("successful")
                    ? "bg-green-50 border border-green-200"
                    : "bg-red-50 border border-red-200"
                }`}
              >
                {message.includes("successful") ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
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

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="font-semibold text-blue-600 hover:text-blue-500 transition-colors"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            By registering, you agree to our{" "}
            <a href="#" className="text-blue-600 hover:text-blue-500 font-medium">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-blue-600 hover:text-blue-500 font-medium">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;