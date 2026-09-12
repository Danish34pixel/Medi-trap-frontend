import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl, postForm, postJson } from "../config/api";
import {
  Camera,
  User,
  MapPin,
  Phone,
  Mail,
  Lock,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  Search,
  X,
  ArrowRight,
} from "lucide-react";
import Card from "../ui/Card";
import Input from "../ui/Input";
import PageHeader from "../ui/PageHeader";
import Btn from "../stockistComponents/Btn";

export default function PurchaserSignup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    address: "",
    contactNo: "",
    email: "",
    password: "",
    confirmPassword: "",
    aadharImage: null,
    photo: null,
  });

  const [previews, setPreviews] = useState({
    aadharImage: null,
    photo: null,
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [stockists, setStockists] = useState([]);
  const [selectedStockists, setSelectedStockists] = useState([]);
  const [loadingStockists, setLoadingStockists] = useState(false);
  const [stockistQuery, setStockistQuery] = useState("");
  const [stockistDropdownOpen, setStockistDropdownOpen] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setErrors((prev) => ({
          ...prev,
          [fieldName]: "Please upload a valid image file",
        }));
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          [fieldName]: "File size should be less than 5MB",
        }));
        return;
      }

      setFormData((prev) => ({
        ...prev,
        [fieldName]: file,
      }));

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews((prev) => ({
          ...prev,
          [fieldName]: reader.result,
        }));
      };
      reader.readAsDataURL(file);

      if (errors[fieldName]) {
        setErrors((prev) => ({ ...prev, [fieldName]: "" }));
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    } else if (formData.fullName.trim().length < 3) {
      newErrors.fullName = "Name must be at least 3 characters";
    }

    if (!formData.address.trim()) {
      newErrors.address = "Address is required";
    } else if (formData.address.trim().length < 10) {
      newErrors.address = "Please enter a complete address";
    }

    if (!formData.contactNo.trim()) {
      newErrors.contactNo = "Contact number is required";
    } else if (!/^[6-9]\d{9}$/.test(formData.contactNo.trim())) {
      newErrors.contactNo = "Please enter a valid 10-digit mobile number";
    }

    if (!formData.email || !formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (
      !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email.trim())
    ) {
      newErrors.email = "Please enter a valid email address";
    }

    // Password validation
    if (!formData.password || !formData.password.trim()) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!formData.aadharImage) {
      newErrors.aadharImage = "Aadhar card image is required";
    }

    if (!formData.photo) {
      newErrors.photo = "Photo is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    if (!Array.isArray(selectedStockists) || selectedStockists.length < 3) {
      setErrors((prev) => ({
        ...prev,
        stockists: "Please select at least 3 stockists to notify",
      }));
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      // Extra client-side validation to avoid server-side multer errors
      const aFile = formData.aadharImage;
      const pFile = formData.photo;
      if (!aFile || !aFile.type || !aFile.type.startsWith("image/")) {
        setErrorMessage("Please upload a valid aadhar image (JPG/PNG)");
        setSubmitStatus("error");
        setIsSubmitting(false);
        return;
      }
      if (!pFile || !pFile.type || !pFile.type.startsWith("image/")) {
        setErrorMessage("Please upload a valid personal photo (JPG/PNG)");
        setSubmitStatus("error");
        setIsSubmitting(false);
        return;
      }

      const submitData = new FormData();
      submitData.append("fullName", formData.fullName.trim());
      submitData.append("address", formData.address.trim());
      submitData.append("email", formData.email.trim());
      // append password so backend can hash and store it
      submitData.append("password", formData.password || "");
      submitData.append("contactNo", formData.contactNo.trim());
      submitData.append("aadharImage", aFile);
      // Auth route expects 'personalPhoto' for purchaser signup
      submitData.append("photo", pFile);

      // attach token if available so backend authenticate middleware accepts the multipart request
      const token = localStorage.getItem("token");

      // Use auth purchaser-signup so we also get back a token + user
      const createUrl = apiUrl("/api/auth/purchaser-signup");
      const tokenPreview = token ? `${String(token).slice(0, 8)}...` : null;
      console.debug("Purchaser create request ->", {
        url: createUrl,
        token: !!token,
        tokenPreview,
        pageProtocol:
          typeof window !== "undefined" ? window.location.protocol : null,
        online: typeof navigator !== "undefined" ? navigator.onLine : null,
      });
      const created = await postForm("/api/purchaser", submitData, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "omit",
      });

      // If signup returned a token, persist it so subsequent requests are authenticated
      try {
        const authToken = created && (created.accessToken || created.token);
        if (authToken) {
          localStorage.setItem("token", authToken);
        }
      } catch (e) {}
      // Persist pending purchaser id so verification page can poll purchaser approval
      try {
        // auth route returns purchaser object when created
        if (created && created.purchaser && created.purchaser._id) {
          localStorage.setItem("pendingPurchaserId", created.purchaser._id);
        }
      } catch (e) {}

      // Then send purchasing-card request to notify selected stockists
      const reqUrl = apiUrl("/api/purchasing-card/request");
      console.debug("Purchasing-card request ->", {
        url: reqUrl,
        token: !!token,
        tokenPreview,
      });
      const reqJson = await postJson(
        "/api/purchasing-card/request",
        {
          stockistIds: selectedStockists,
          purchaserId: created.purchaser?._id || created.data?._id,
          requester: { fullName: formData.fullName, email: formData.email },
          purchaserData: {
            fullName: formData.fullName,
            address: formData.address,
            contactNo: formData.contactNo,
            email: formData.email,
            aadharImage:
              created.purchaser?.aadharImage || created.data?.aadharImage,
            photo:
              created.purchaser?.photo ||
              created.data?.photo ||
              created.purchaser?.personalPhoto,
          },
        },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          credentials: "omit",
        }
      );
      // Persist pending purchasing request id so verification page can poll status
      try {
        if (reqJson && reqJson.requestId) {
          localStorage.setItem("pendingPurchasingRequestId", reqJson.requestId);
        }
      } catch (e) {}

      // navigate to purchaser verification flow
      try {
        navigate("/purchasermiddle");
      } catch (e) {}

      setSubmitStatus("success");
      setFormData({
        fullName: "",
        address: "",
        contactNo: "",
        email: "",
        password: "",
        confirmPassword: "",
        aadharImage: null,
        photo: null,
      });
      setPreviews({
        aadharImage: null,
        photo: null,
      });
      setSelectedStockists([]);
    } catch (error) {
      // Always show backend error in the form
      const serverMsg =
        (error && error.body && error.body.message) || error.message || null;
      if (serverMsg) {
        setErrorMessage(serverMsg);
        setSubmitStatus("error");
      } else {
        setErrorMessage("Something went wrong. Please try again.");
        setSubmitStatus("error");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    // Debug: print resolved API base for diagnosing network issues
    try {
      console.debug("Resolved API base:", apiUrl("/"));
    } catch (e) {}
    const fetchStockists = async () => {
      setLoadingStockists(true);
      try {
        const res = await fetch(apiUrl("/api/stockist"));
        const json = await res.json();
        setStockists(json.data || []);
      } catch (e) {
        console.warn("Failed to load stockists", e.message);
      } finally {
        setLoadingStockists(false);
      }
    };
    fetchStockists();
  }, []);

  const toggleStockist = (id) => {
    setSelectedStockists((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
    setErrors((prev) => ({ ...prev, stockists: "" }));
  };

  const isDuplicateAccountError =
    !!errorMessage &&
    (errorMessage.toLowerCase().includes("already registered") ||
      errorMessage.toLowerCase().includes("already exist"));

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <PageHeader
        title="Purchaser Registration"
        subtitle="Complete your profile to get started"
        role="purchaser"
        onBack={() => navigate("/purchaserLogin")}
      />

      <div className="max-w-md mx-auto px-4 pt-6">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img
            src="/final-logo.png"
            alt="Medi-Trap Logo"
            className="h-14 w-auto"
          />
        </div>

        {/* Status Messages */}
        {submitStatus === "success" && (
          <Card padding="p-4" className="mb-4 border-l-4 border-green-500">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-slate-800 text-sm">
                  Success!
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Registration completed successfully
                </p>
              </div>
            </div>
          </Card>
        )}

        {submitStatus === "error" && (
          <Card padding="p-4" className="mb-4 border-l-4 border-red-500">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-slate-800 text-sm">Error</h3>
                <p className="text-xs text-slate-600 mt-1">
                  {errorMessage || "Something went wrong. Please try again."}
                </p>
                {isDuplicateAccountError && (
                  <button
                    type="button"
                    onClick={() => navigate("/purchaserLogin")}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-role-purchaser hover:underline"
                  >
                    Login to existing account
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </Card>
        )}
        {submitStatus === "route-missing" && (
          <Card padding="p-4" className="mb-4 border-l-4 border-yellow-500">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-slate-800 text-sm">
                  Unavailable
                </h3>
                <p className="text-xs text-slate-600 mt-1">{errorMessage}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Form Card */}
        <Card padding="p-6" className="rounded-4xl space-y-5">
          <Input
            label="Full Name"
            icon={User}
            name="fullName"
            value={formData.fullName}
            onChange={handleInputChange}
            placeholder="Enter your full name"
            error={errors.fullName}
          />

          {/* Address */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Address
            </label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                rows="3"
                className={`w-full pl-11 pr-4 py-3 rounded-xl border ${
                  errors.address
                    ? "border-red-300 focus:ring-red-500"
                    : "border-slate-200 focus:ring-blue-500"
                } bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 transition-colors resize-none text-sm`}
                placeholder="Enter your complete address"
              />
            </div>
            {errors.address && (
              <p className="mt-1 text-xs text-red-500">{errors.address}</p>
            )}
          </div>

          <Input
            label="Contact Number"
            icon={Phone}
            type="tel"
            name="contactNo"
            value={formData.contactNo}
            onChange={handleInputChange}
            maxLength="10"
            placeholder="10-digit mobile number"
            error={errors.contactNo}
          />

          <Input
            label="Email Address"
            icon={Mail}
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="your.email@example.com"
            error={errors.email}
          />

          {/* Password Fields */}
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Password"
              icon={Lock}
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="••••••"
              error={errors.password}
            />
            <Input
              label="Confirm"
              icon={Lock}
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="••••••"
              error={errors.confirmPassword}
            />
          </div>

          {/* Image Uploads */}
          <div className="grid grid-cols-2 gap-3">
            {/* Aadhar Card */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Aadhar Card
              </label>
              <div
                className={`relative bg-gradient-to-br from-cyan-400 to-cyan-500 rounded-3xl overflow-hidden ${
                  errors.aadharImage ? "ring-2 ring-red-300" : ""
                }`}
              >
                {previews.aadharImage ? (
                  <div className="relative aspect-square">
                    <img
                      src={previews.aadharImage}
                      alt="Aadhar"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, aadharImage: null }));
                        setPreviews((prev) => ({ ...prev, aadharImage: null }));
                      }}
                      className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label
                    htmlFor="aadharImage"
                    className="cursor-pointer block aspect-square"
                  >
                    <div className="flex flex-col items-center justify-center h-full p-4">
                      <ImageIcon className="w-8 h-8 text-white mb-2" />
                      <span className="text-xs text-white font-medium text-center">
                        Upload Aadhar
                      </span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, "aadharImage")}
                      className="hidden"
                      id="aadharImage"
                    />
                  </label>
                )}
              </div>
              {errors.aadharImage && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.aadharImage}
                </p>
              )}
            </div>

            {/* Photo */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Your Photo
              </label>
              <div
                className={`relative bg-gradient-to-br from-orange-400 to-red-500 rounded-3xl overflow-hidden ${
                  errors.photo ? "ring-2 ring-red-300" : ""
                }`}
              >
                {previews.photo ? (
                  <div className="relative aspect-square">
                    <img
                      src={previews.photo}
                      alt="Photo"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, photo: null }));
                        setPreviews((prev) => ({ ...prev, photo: null }));
                      }}
                      className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label
                    htmlFor="photo"
                    className="cursor-pointer block aspect-square"
                  >
                    <div className="flex flex-col items-center justify-center h-full p-4">
                      <Camera className="w-8 h-8 text-white mb-2" />
                      <span className="text-xs text-white font-medium text-center">
                        Upload Photo
                      </span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, "photo")}
                      className="hidden"
                      id="photo"
                    />
                  </label>
                )}
              </div>
              {errors.photo && (
                <p className="mt-1 text-xs text-red-500">{errors.photo}</p>
              )}
            </div>
          </div>

          {/* Stockists Selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Select Stockists (min. 3)
            </label>

            {/* Selected Pills */}
            {selectedStockists.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedStockists.map((id) => {
                  const s = stockists.find((x) => x._id === id) || {};
                  const label = s.contactPerson || s.name || id;
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1.5 bg-blue-50 text-role-purchaser px-3 py-1.5 rounded-full text-xs font-medium"
                    >
                      {label}
                      <button
                        type="button"
                        onClick={() => toggleStockist(id)}
                        className="hover:bg-blue-200/60 rounded-full p-0.5 transition"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            {/* Search Box */}
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <Search className="w-4 h-4 text-slate-400" />
              </div>
              <input
                type="text"
                value={stockistQuery}
                onChange={(e) => {
                  setStockistQuery(e.target.value);
                  setStockistDropdownOpen(true);
                }}
                onFocus={() => setStockistDropdownOpen(true)}
                placeholder="Search by name, email or phone"
                className={`w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:bg-white transition-colors text-sm ${
                  errors.stockists
                    ? "border-red-300 focus:ring-red-500"
                    : "border-slate-200 focus:ring-blue-500"
                }`}
              />

              {/* Dropdown */}
              {stockistDropdownOpen && (
                <div className="absolute z-20 left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-card-lg max-h-48 overflow-auto">
                  {loadingStockists ? (
                    <div className="p-4 text-sm text-slate-500 text-center">
                      Loading...
                    </div>
                  ) : (
                    stockists
                      .filter((s) => {
                        const q = stockistQuery.trim().toLowerCase();
                        if (!q) return true;
                        const label = (
                          s.contactPerson ||
                          s.name ||
                          ""
                        ).toLowerCase();
                        const email = (s.email || "").toLowerCase();
                        const phone = (s.phone || "").toLowerCase();
                        return (
                          label.includes(q) ||
                          email.includes(q) ||
                          phone.includes(q)
                        );
                      })
                      .map((s) => {
                        const id = s._id;
                        const label = s.contactPerson || s.name || id;
                        const isSelected = selectedStockists.includes(id);
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => {
                              if (!isSelected) toggleStockist(id);
                              setStockistQuery("");
                              setStockistDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition flex items-center justify-between gap-2 ${
                              isSelected ? "bg-blue-50/60" : ""
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-slate-800 truncate">
                                {label}
                              </div>
                              <div className="text-xs text-slate-500 truncate">
                                {s.email || s.phone}
                              </div>
                            </div>
                            {isSelected && (
                              <CheckCircle className="w-4 h-4 text-role-purchaser flex-shrink-0" />
                            )}
                          </button>
                        );
                      })
                  )}
                  {stockists.length === 0 && !loadingStockists && (
                    <div className="p-4 text-sm text-slate-500 text-center">
                      No stockists found
                    </div>
                  )}
                </div>
              )}
            </div>

            {errors.stockists && (
              <p className="mt-1.5 ml-1 text-xs text-red-500">
                {errors.stockists}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <Btn
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            variant="purchaser"
            className={`w-full py-3.5 text-base ${
              isSubmitting ? "opacity-60 pointer-events-none hover:scale-100" : ""
            }`}
          >
            {isSubmitting ? "Submitting..." : "Complete Registration"}
          </Btn>

          {/* Sign In Link */}
          <div className="pt-2 text-center">
            <p className="text-sm text-slate-600 mb-1">
              Already have an account?
            </p>
            <button
              type="button"
              onClick={() => navigate("/purchaserLogin")}
              className="text-role-purchaser hover:brightness-90 font-semibold text-sm transition"
            >
              Sign In Here
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
