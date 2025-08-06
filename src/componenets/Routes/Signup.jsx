import React, { useState } from "react";
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
    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (value) formData.append(key, value);
    });

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setMessage(
        "Registration successful! Please check your email for verification."
      );
    } catch (err) {
      setMessage("Registration failed. Please try again.");
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
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
          />
        ) : (
          <input
            name={name}
            type={type}
            placeholder={placeholder}
            value={form[name] || ""}
            // onChange={(e) => handleChange(e)}
            required={required}
            autoComplete={name === "password" ? "new-password" : "on"}
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
          />
        )}
      </div>
    </div>
  );

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
            <InputField
              icon={Lock}
              label="Password"
              name="password"
              type="password"
              placeholder="Create a strong password"
              required
            />
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
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
                className={`flex items-center p-4 rounded-lg ${
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
                  className={`text-sm ${
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
