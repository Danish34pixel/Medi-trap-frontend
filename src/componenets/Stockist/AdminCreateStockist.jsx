import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Briefcase,
  User,
  Mail,
  Phone,
  Lock,
  MapPin,
  Hash,
  FileText,
  Calendar,
  Upload,
  Camera,
  Check,
} from "lucide-react";
import { apiUrl } from "../config/api";
import { uploadToCloudinary } from "../../utils/cloudinaryUpload";
import Input from "../ui/Input";
import PageHeader from "../ui/PageHeader";
import Btn from "../stockistComponents/Btn";

const SectionHeader = ({ icon: Icon, title }) => (
  <div className="flex items-center gap-3 mb-5 mt-6">
    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-role-stockist-from to-role-stockist-to flex items-center justify-center text-white shadow-lg">
      <Icon className="w-5 h-5" />
    </div>
    <h3 className="text-base font-bold text-gray-800">{title}</h3>
  </div>
);

const FileUploadCard = ({ label, onChange, preview, fileName }) => (
  <div className="mb-4">
    <label className="block text-xs font-medium text-gray-600 mb-2">{label}</label>
    <label className="block">
      <input type="file" accept="image/*" onChange={onChange} className="hidden" />
      <div className="relative bg-gradient-to-br from-role-stockist-from to-role-stockist-to rounded-3xl p-6 text-center cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
        {preview ? (
          <div className="flex flex-col items-center gap-2">
            <img
              src={preview}
              alt={fileName || "preview"}
              className="w-20 h-20 rounded-2xl object-cover border-2 border-white/80 shadow-md"
            />
            <p className="text-xs font-semibold text-white flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              {fileName || "Uploaded"}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Camera className="w-8 h-8 text-white mb-2" />
            <p className="text-sm font-semibold text-white">Tap to upload</p>
            <p className="text-xs font-normal text-white/80">PNG, JPG up to 5MB</p>
          </div>
        )}
      </div>
    </label>
  </div>
);

const SelectField = ({ label, value, onChange, options }) => (
  <div className="mb-4">
    <label className="block text-xs font-medium text-gray-600 mb-2">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-3 rounded-2xl border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-role-stockist transition-all duration-200 text-gray-800 text-sm appearance-none cursor-pointer shadow-sm"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%230891b2' d='M0 0l6 8 6-8z'/%3E%3C/svg%3E")`,
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
  const [licensePreview, setLicensePreview] = useState(null);
  const [profilePreview, setProfilePreview] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  // Revoke object URLs on unmount to avoid leaking memory.
  useEffect(() => {
    return () => {
      if (licensePreview) URL.revokeObjectURL(licensePreview);
      if (profilePreview) URL.revokeObjectURL(profilePreview);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    setLicensePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
  };

  const handleProfileFileChange = (e) => {
    const file = e?.target?.files?.[0] || null;
    setProfileImageFile(file);
    setProfilePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
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

  const handleHeaderBack = () => {
    if (currentStep === 1) navigate(-1);
    else prevStep();
  };

  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  const roleTypes = ["Proprietor", "Pharmacist"];

  return (
    <div className="min-h-screen bg-gray-100 py-2 md:py-6 px-2 md:px-4 flex items-center justify-center">
      <div className="w-full max-w-md mx-auto bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden min-h-[calc(100vh-32px)] md:max-h-[800px] flex flex-col">
        {/* Header */}
        <PageHeader
          title="Stockist Registration"
          subtitle={`Step ${currentStep} of ${totalSteps}`}
          role="stockist"
          showBack
          onBack={handleHeaderBack}
        />

        <div className="px-4 md:px-6 pt-4 md:pt-6">
          {/* Progress Pills */}
          <div className="flex gap-2 mb-6">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${
                  step <= currentStep
                    ? "bg-gradient-to-r from-role-stockist-from to-role-stockist-to"
                    : "bg-gray-200"
                }`}
              />
            ))}
          </div>

          {/* Hero Card */}
          <div className="bg-gradient-to-br from-role-stockist-from to-role-stockist-to rounded-3xl p-6 shadow-xl mb-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-10 -mt-10"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full -ml-8 -mb-8"></div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-2">
                <div className="text-3xl">⚕️</div>
                <div>
                  <h2 className="text-white font-bold text-lg">MedTrap Partner</h2>
                  <p className="text-white/80 text-xs">
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
        <div className="px-4 md:px-6 pb-4 md:pb-6 overflow-y-auto flex-1">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div>
              <SectionHeader icon={Briefcase} title="Firm Information" />
              <Input
                label="Firm/Shop Name"
                icon={Briefcase}
                placeholder="Enter your pharmacy name"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                containerClassName="mb-4"
              />
              <Input
                label="Contact Person"
                icon={User}
                placeholder="Owner/Manager name"
                value={form.contactPerson}
                onChange={(e) => setField("contactPerson", e.target.value)}
                containerClassName="mb-4"
              />

              <SectionHeader icon={Mail} title="Contact Details" />
              <Input
                label="Email Address"
                type="email"
                icon={Mail}
                placeholder="your.email@example.com"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                containerClassName="mb-4"
              />
              <Input
                label="Phone Number"
                icon={Phone}
                placeholder="+91 XXXXX XXXXX"
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
                containerClassName="mb-4"
              />
              <Input
                label="Create Password"
                type="password"
                icon={Lock}
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setField("password", e.target.value)}
                containerClassName="mb-4"
              />
            </div>
          )}

          {/* Step 2: Professional Details */}
          {currentStep === 2 && (
            <div>
              <SectionHeader icon={MapPin} title="Location" />
              <Input
                label="Street Address"
                icon={MapPin}
                placeholder="Shop address"
                value={form.address.street}
                onChange={(e) => setField("address.street", e.target.value)}
                containerClassName="mb-4"
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="City"
                  placeholder="City"
                  value={form.address.city}
                  onChange={(e) => setField("address.city", e.target.value)}
                />
                <Input
                  label="State"
                  placeholder="State"
                  value={form.address.state}
                  onChange={(e) => setField("address.state", e.target.value)}
                />
              </div>
              <div className="mt-4">
                <Input
                  label="Pincode"
                  icon={Hash}
                  placeholder="XXXXXX"
                  value={form.address.pincode}
                  onChange={(e) => setField("address.pincode", e.target.value)}
                  containerClassName="mb-4"
                />
              </div>

              <SectionHeader icon={FileText} title="License" />
              <Input
                label="License Number"
                icon={FileText}
                placeholder="Your pharmacy license number"
                value={form.licenseNumber}
                onChange={(e) => setField("licenseNumber", e.target.value)}
                containerClassName="mb-4"
              />
              <Input
                label="License Expiry Date"
                type="date"
                icon={Calendar}
                value={form.licenseExpiry}
                onChange={(e) => setField("licenseExpiry", e.target.value)}
                containerClassName="mb-4"
              />
            </div>
          )}

          {/* Step 3: Personal & Documents */}
          {currentStep === 3 && (
            <div>
              <SectionHeader icon={User} title="Personal Info" />
              <Input
                label="Date of Birth"
                type="date"
                icon={Calendar}
                value={form.dob}
                onChange={(e) => setField("dob", e.target.value)}
                containerClassName="mb-4"
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
              <Input
                label="CNTX Number"
                icon={Hash}
                placeholder="CNTX identifier"
                value={form.cntxNumber}
                onChange={(e) => setField("cntxNumber", e.target.value)}
                containerClassName="mb-4"
              />

              <SectionHeader icon={Upload} title="Documents" />
              <FileUploadCard
                label="Profile Photo"
                onChange={handleProfileFileChange}
                preview={profilePreview}
                fileName={profileImageFile?.name}
              />
              <FileUploadCard
                label="License Document"
                onChange={handleLicenseFileChange}
                preview={licensePreview}
                fileName={licenseImageFile?.name}
              />
            </div>
          )}
        </div>

        {/* Fixed Bottom Action Button */}
        <div className="px-4 md:px-6 pb-6 md:pb-8 bg-white">
          {currentStep < totalSteps ? (
            <Btn variant="stockist" onClick={nextStep} className="w-full">
              Continue
            </Btn>
          ) : (
            <Btn
              variant="stockist"
              onClick={submit}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Registering...
                </>
              ) : (
                "Complete Registration"
              )}
            </Btn>
          )}
        </div>
      </div>
    </div>
  );
}
