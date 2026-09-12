import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Home,
  User,
  MapPin,
  Mail,
  Phone,
  Shield,
  Lock,
  UploadCloud,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { apiUrl } from "../config/api";
import { setCookie, getCookie } from "../utils/cookies";
import Card from "../ui/Card";
import Input from "../ui/Input";
import PageHeader from "../ui/PageHeader";
import Btn from "../stockistComponents/Btn";

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
  const [previewUrl, setPreviewUrl] = useState(null);

  // Purely visual: build/revoke an object URL so the drug license image can
  // be previewed like Nebula's MedicalSignup picker, without touching the
  // underlying File object that gets appended to FormData on submit.
  useEffect(() => {
    if (!form.drugLicenseImage) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(form.drugLicenseImage);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [form.drugLicenseImage]);

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
        // Persist pending user id so verification/approval flows can pick it up
        try {
          const id = data.user?._id || data.user?.id || null;
          if (id) localStorage.setItem("pendingUserId", String(id));
        } catch (e) {}
        setTimeout(() => navigate("/medical-middle"), 2000);
      } else {
        throw new Error("Invalid response format from server");
      }
    } catch (err) {
      setMessage(err.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <PageHeader
        title="Create Account"
        subtitle="Register your medical store"
        role="medical"
      />

      <div className="max-w-md w-full mx-auto px-4 py-8">
        {/* Registration Form */}
        <Card padding="p-6" elevated className="rounded-4xl">
          <Input
            icon={Home}
            label="Medical Store Name"
            name="medicalName"
            placeholder="Enter store name"
            value={form.medicalName}
            onChange={handleChange}
            required
            containerClassName="mb-4"
          />
          <Input
            icon={User}
            label="Owner Name"
            name="ownerName"
            placeholder="Enter owner's name"
            value={form.ownerName}
            onChange={handleChange}
            required
            containerClassName="mb-4"
          />
          <Input
            icon={MapPin}
            label="Address"
            name="address"
            placeholder="Complete address"
            value={form.address}
            onChange={handleChange}
            required
            containerClassName="mb-4"
          />
          <Input
            icon={Mail}
            label="Email Address"
            name="email"
            type="email"
            placeholder="your@email.com"
            value={form.email}
            onChange={handleChange}
            required
            containerClassName="mb-4"
          />
          <Input
            icon={Phone}
            label="Contact Number"
            name="contactNo"
            type="tel"
            placeholder="Phone number"
            value={form.contactNo}
            onChange={handleChange}
            required
            containerClassName="mb-4"
          />
          <Input
            icon={Shield}
            label="Drug License Number"
            name="drugLicenseNo"
            placeholder="License number"
            value={form.drugLicenseNo}
            onChange={handleChange}
            required
            containerClassName="mb-4"
          />

          {/* Image Picker — mirrors Nebula's preview-with-checkmark-overlay pattern */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Drug License Image
            </label>
            <div
              className={`relative border-2 border-dashed rounded-2xl text-center transition-all overflow-hidden ${
                previewUrl
                  ? "border-slate-200"
                  : dragActive
                  ? "border-role-medical bg-orange-50"
                  : "border-slate-200 hover:border-role-medical/60"
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
                required={!form.drugLicenseImage}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              {previewUrl ? (
                <div className="relative h-36">
                  <img
                    src={previewUrl}
                    alt="Drug license preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center gap-1">
                    <CheckCircle className="w-6 h-6 text-emerald-500" />
                    <span className="text-sm font-bold text-emerald-600">
                      License Selected
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center bg-slate-50 py-8 px-4">
                  <UploadCloud className="w-9 h-9 text-slate-400 mb-2" />
                  <p className="text-sm text-slate-500">
                    <span className="font-medium text-role-medical">
                      Tap to upload
                    </span>{" "}
                    or drag and drop
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    PNG, JPG, GIF up to 10MB
                  </p>
                </div>
              )}
            </div>
          </div>

          <Input
            icon={Lock}
            label="Password"
            name="password"
            type="password"
            placeholder="Create password"
            value={form.password}
            onChange={handleChange}
            required
            containerClassName="mb-5"
          />

          <Btn
            type="button"
            variant="medical"
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full py-3.5 disabled:opacity-60 disabled:hover:scale-100 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating Account...
              </>
            ) : (
              "Create Account"
            )}
          </Btn>

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
            <p className="text-sm text-slate-600">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="font-semibold text-role-medical hover:brightness-90 transition-colors"
              >
                Sign in
              </button>
            </p>
          </div>
        </Card>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500">
            By registering, you agree to our{" "}
            <a
              href="#"
              className="text-role-medical hover:brightness-90 font-medium"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <Link
              to="/privacy-policy"
              className="text-role-medical hover:brightness-90 font-medium"
            >
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
