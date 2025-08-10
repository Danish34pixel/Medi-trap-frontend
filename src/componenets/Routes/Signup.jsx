  // Redirect to login after successful signu
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { register } from "../../features/authSlice";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  User,
  Lock,
  Upload,
  Shield,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

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
  const dispatch = useDispatch();
  const { user, loading, error } = useSelector((state) => state.auth);
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
    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (value) formData.append(key, value);
    });
    dispatch(register(formData))
    navigate('/login')
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-md w-full mx-auto">
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

        {/* Registration Form */}
        <form
          className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100"
          onSubmit={handleSubmit}
          autoComplete="off"
        >
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Create Your Account
            </h2>
            <p className="text-gray-600">
              Register your medical store with MedTrap
            </p>
          </div>

          <div className="space-y-6">
            {/* Medical Store Name */}
            <div className="relative">
              <label htmlFor="input-medicalName" className="block text-sm font-medium text-gray-700 mb-2">
                Medical Store Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building2 className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="input-medicalName"
                  name="medicalName"
                  type="text"
                  placeholder="Enter your medical store name"
                  value={form.medicalName}
                  onChange={handleChange}
                  required
                  autoComplete="on"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
              </div>
            </div>
            {/* Owner Name */}
            <div className="relative">
              <label htmlFor="input-ownerName" className="block text-sm font-medium text-gray-700 mb-2">
                Owner Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="input-ownerName"
                  name="ownerName"
                  type="text"
                  placeholder="Enter owner's full name"
                  value={form.ownerName}
                  onChange={handleChange}
                  required
                  autoComplete="on"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
              </div>
            </div>
            {/* Address */}
            <div className="relative">
              <label htmlFor="input-address" className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="input-address"
                  name="address"
                  type="text"
                  placeholder="Enter complete address"
                  value={form.address}
                  onChange={handleChange}
                  required
                  autoComplete="on"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
              </div>
            </div>
            {/* Email Address */}
            <div className="relative">
              <label htmlFor="input-email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="input-email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  autoComplete="on"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
              </div>
            </div>
            {/* Contact Number */}
            <div className="relative">
              <label htmlFor="input-contactNo" className="block text-sm font-medium text-gray-700 mb-2">
                Contact Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="input-contactNo"
                  name="contactNo"
                  type="tel"
                  placeholder="Enter contact number"
                  value={form.contactNo}
                  onChange={handleChange}
                  required
                  autoComplete="on"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
              </div>
            </div>
            {/* Drug License Number */}
            <div className="relative">
              <label htmlFor="input-drugLicenseNo" className="block text-sm font-medium text-gray-700 mb-2">
                Drug License Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Shield className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="input-drugLicenseNo"
                  name="drugLicenseNo"
                  type="text"
                  placeholder="Enter drug license number"
                  value={form.drugLicenseNo}
                  onChange={handleChange}
                  required
                  autoComplete="on"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
              </div>
            </div>
            {/* File Upload */}
            <div>
              <label htmlFor="drugLicenseImage" className="block text-sm font-medium text-gray-700 mb-2">
                Drug License Image
              </label>
              <div
                className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 ${
                  dragActive
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 hover:border-gray-400"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  id="drugLicenseImage"
                  name="drugLicenseImage"
                  type="file"
                  accept="image/*"
                  onChange={handleChange}
                  required
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-2">
                  <p className="text-sm text-gray-600">
                    {form.drugLicenseImage ? (
                      <span className="text-green-600 font-medium">
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
            {/* Password */}
            <div className="relative">
              <label htmlFor="input-password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="input-password"
                  name="password"
                  type="password"
                  placeholder="Create a strong password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Creating Account...
                </div>
              ) : (
                "Create Account"
              )}
            </button>

            {/* Show error or user info from Redux */}
            {error && (
              <div className="flex items-center p-4 rounded-lg bg-red-50 border border-red-200">
                <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}
            {user && (
              <div className="flex items-center p-4 rounded-lg bg-green-50 border border-green-200">
                <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                <span className="text-sm text-green-700">Registration successful! Please check your email for verification.</span>
              </div>
            )}
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
              >
                Sign in
              </button>
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            By registering, you agree to our{" "}
            <a href="#" className="text-blue-600 hover:text-blue-500">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-blue-600 hover:text-blue-500">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
