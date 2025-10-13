import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl, postForm, postJson } from "../config/api";
import {
  Camera,
  Upload,
  User,
  MapPin,
  Phone,
  Image,
  CheckCircle,
  AlertCircle,
  Search,
  X,
} from "lucide-react";

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
        if (created && created.token) {
          localStorage.setItem("token", created.token);
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
      // If signup failed due to existing email, attempt a best-effort fallback:
      // create a Purchaser via the public /api/purchaser endpoint (it uses
      // different file field names). This helps when a User already exists
      // but a Purchaser record is missing.
      try {
        const errMsg = error && error.body && error.body.message;
        if (errMsg === "Email already registered") {
          const fallbackToken = localStorage.getItem("token");
          const fallbackForm = new FormData();
          fallbackForm.append("fullName", formData.fullName.trim());
          fallbackForm.append("address", formData.address.trim());
          fallbackForm.append("email", formData.email.trim());
          fallbackForm.append("password", formData.password || "");
          fallbackForm.append("contactNo", formData.contactNo.trim());
          // /api/purchaser expects 'aadharImage' and 'photo'
          fallbackForm.append("aadharImage", formData.aadharImage);
          fallbackForm.append("photo", formData.photo);

          const fallbackResp = await postForm("/api/purchaser", fallbackForm, {
            headers: fallbackToken
              ? { Authorization: `Bearer ${fallbackToken}` }
              : {},
            credentials: "omit",
          });

          // Persist pending purchaser id if available
          try {
            if (fallbackResp && fallbackResp.data && fallbackResp.data._id) {
              localStorage.setItem("pendingPurchaserId", fallbackResp.data._id);
            }
          } catch (e) {}

          // Notify stockists as before, using fallbackResp data where available
          try {
            const reqJson2 = await postJson(
              "/api/purchasing-card/request",
              {
                stockistIds: selectedStockists,
                purchaserId: fallbackResp.data?._id,
                requester: {
                  fullName: formData.fullName,
                  email: formData.email,
                },
                purchaserData: {
                  fullName: formData.fullName,
                  address: formData.address,
                  contactNo: formData.contactNo,
                  email: formData.email,
                  aadharImage: fallbackResp.data?.aadharImage,
                  photo: fallbackResp.data?.photo,
                },
              },
              {
                headers: fallbackToken
                  ? { Authorization: `Bearer ${fallbackToken}` }
                  : {},
                credentials: "omit",
              }
            );
            try {
              if (reqJson2 && reqJson2.requestId) {
                localStorage.setItem(
                  "pendingPurchasingRequestId",
                  reqJson2.requestId
                );
              }
            } catch (e) {}
          } catch (e) {
            // ignore purchasing-card errors for fallback path; we'll surface original error if needed
          }

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
          setPreviews({ aadharImage: null, photo: null });
          setSelectedStockists([]);
          return;
        }
      } catch (fErr) {
        console.warn(
          "Purchaser fallback attempt failed:",
          fErr && fErr.message
        );
        // continue to original error handling below
      }
      // Add contextual debugging info to help diagnose network issues
      try {
        const debugCtx = {
          createUrl: apiUrl("/api/purchaser"),
          reqUrl: apiUrl("/api/purchasing-card/request"),
          tokenPreview: localStorage.getItem("token")
            ? `${String(localStorage.getItem("token")).slice(0, 8)}...`
            : null,
          pageProtocol:
            typeof window !== "undefined" ? window.location.protocol : null,
          online: typeof navigator !== "undefined" ? navigator.onLine : null,
        };
        console.error("Error submitting:", error, debugCtx);

        // Try to extract structured server error from fetch helper
        const serverMsg =
          (error && error.body && error.body.message) || error.message || null;
        if (serverMsg) setErrorMessage(serverMsg);
      } catch (e) {
        console.error("Error submitting (failed to build debug ctx):", error);
      }
      // Surface a clearer message when the backend indicates a missing route
      try {
        const status = error && error.status;
        const bodyMsg = error && error.body && error.body.message;
        // Handle AbortError from fetch timeouts
        if (error && error.name === "AbortError") {
          setErrorMessage(
            "The request timed out. The server may be slow or unreachable — try again in a moment."
          );
          setSubmitStatus("timeout");
          return;
        }
        if (
          status === 501 ||
          (typeof bodyMsg === "string" &&
            bodyMsg.includes("Route not implemented on this deployment"))
        ) {
          setErrorMessage(
            "The server deployment does not support purchaser registration at this time. Please try again later or contact support."
          );
          setSubmitStatus("route-missing");
        } else {
          setSubmitStatus("error");
        }
      } catch (e) {
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

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-md mx-auto">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img
            src="/final-logo.png"
            alt="Medi-Trap Logo"
            className="h-16 w-auto"
          />
        </div>

        {/* Header */}
        <div className="bg-white rounded-3xl shadow-sm p-6 mb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-gray-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-800">
              Purchaser Registration
            </h1>
          </div>
          <p className="text-sm text-gray-500">
            Complete your profile to get started
          </p>
        </div>

        {/* Status Messages */}
        {submitStatus === "success" && (
          <div className="bg-white rounded-2xl shadow-sm p-4 mb-4 border-l-4 border-green-500">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-800 text-sm">
                  Success!
                </h3>
                <p className="text-xs text-gray-600 mt-1">
                  Registration completed successfully
                </p>
              </div>
            </div>
          </div>
        )}

        {submitStatus === "error" && (
          <div className="bg-white rounded-2xl shadow-sm p-4 mb-4 border-l-4 border-red-500">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-800 text-sm">Error</h3>
                <p className="text-xs text-gray-600 mt-1">
                  {errorMessage || "Something went wrong. Please try again."}
                </p>
              </div>
            </div>
          </div>
        )}
        {submitStatus === "route-missing" && (
          <div className="bg-white rounded-2xl shadow-sm p-4 mb-4 border-l-4 border-yellow-500">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-800 text-sm">
                  Unavailable
                </h3>
                <p className="text-xs text-gray-600 mt-1">{errorMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form Card */}
        <div className="bg-white rounded-3xl shadow-sm p-6 space-y-5">
          {/* Full Name */}
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">
              Full Name
            </label>
            <div className="relative">
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 bg-gray-50 border ${
                  errors.fullName ? "border-red-300" : "border-transparent"
                } rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:bg-white transition text-sm`}
                placeholder="Enter your full name"
              />
            </div>
            {errors.fullName && (
              <p className="text-red-500 text-xs mt-1.5 ml-1">
                {errors.fullName}
              </p>
            )}
          </div>

          {/* Address */}
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">
              Address
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              rows="3"
              className={`w-full px-4 py-3 bg-gray-50 border ${
                errors.address ? "border-red-300" : "border-transparent"
              } rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:bg-white transition resize-none text-sm`}
              placeholder="Enter your complete address"
            />
            {errors.address && (
              <p className="text-red-500 text-xs mt-1.5 ml-1">
                {errors.address}
              </p>
            )}
          </div>

          {/* Contact Number */}
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">
              Contact Number
            </label>
            <input
              type="tel"
              name="contactNo"
              value={formData.contactNo}
              onChange={handleInputChange}
              maxLength="10"
              className={`w-full px-4 py-3 bg-gray-50 border ${
                errors.contactNo ? "border-red-300" : "border-transparent"
              } rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:bg-white transition text-sm`}
              placeholder="10-digit mobile number"
            />
            {errors.contactNo && (
              <p className="text-red-500 text-xs mt-1.5 ml-1">
                {errors.contactNo}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 bg-gray-50 border ${
                errors.email ? "border-red-300" : "border-transparent"
              } rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:bg-white transition text-sm`}
              placeholder="your.email@example.com"
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1.5 ml-1">{errors.email}</p>
            )}
          </div>

          {/* Password Fields */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 bg-gray-50 border ${
                  errors.password ? "border-red-300" : "border-transparent"
                } rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:bg-white transition text-sm`}
                placeholder="••••••"
              />
              {errors.password && (
                <p className="text-red-500 text-xs mt-1.5">{errors.password}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">
                Confirm
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 bg-gray-50 border ${
                  errors.confirmPassword
                    ? "border-red-300"
                    : "border-transparent"
                } rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:bg-white transition text-sm`}
                placeholder="••••••"
              />
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1.5">
                  {errors.confirmPassword}
                </p>
              )}
            </div>
          </div>

          {/* Image Uploads */}
          <div className="grid grid-cols-2 gap-3">
            {/* Aadhar Card */}
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">
                Aadhar Card
              </label>
              <div
                className={`relative bg-gradient-to-br from-cyan-400 to-cyan-500 rounded-2xl overflow-hidden ${
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
                      <Image className="w-8 h-8 text-white mb-2" />
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
                <p className="text-red-500 text-xs mt-1.5">
                  {errors.aadharImage}
                </p>
              )}
            </div>

            {/* Photo */}
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">
                Your Photo
              </label>
              <div
                className={`relative bg-gradient-to-br from-orange-400 to-orange-500 rounded-2xl overflow-hidden ${
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
                <p className="text-red-500 text-xs mt-1.5">{errors.photo}</p>
              )}
            </div>
          </div>

          {/* Stockists Selection */}
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">
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
                      className="inline-flex items-center gap-1.5 bg-cyan-50 text-cyan-700 px-3 py-1.5 rounded-full text-xs font-medium"
                    >
                      {label}
                      <button
                        type="button"
                        onClick={() => toggleStockist(id)}
                        className="hover:bg-cyan-200 rounded-full p-0.5 transition"
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
                <Search className="w-4 h-4 text-gray-400" />
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
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-transparent rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:bg-white transition text-sm"
              />

              {/* Dropdown */}
              {stockistDropdownOpen && (
                <div className="absolute z-20 left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-lg max-h-48 overflow-auto">
                  {loadingStockists ? (
                    <div className="p-4 text-sm text-gray-500 text-center">
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
                            className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition flex items-center justify-between ${
                              isSelected ? "opacity-50" : ""
                            }`}
                          >
                            <div>
                              <div className="text-sm font-medium text-gray-800">
                                {label}
                              </div>
                              <div className="text-xs text-gray-500">
                                {s.email || s.phone}
                              </div>
                            </div>
                            {isSelected && (
                              <span className="text-xs text-cyan-500 font-semibold">
                                Selected
                              </span>
                            )}
                          </button>
                        );
                      })
                  )}
                  {stockists.length === 0 && !loadingStockists && (
                    <div className="p-4 text-sm text-gray-500 text-center">
                      No stockists found
                    </div>
                  )}
                </div>
              )}
            </div>

            {errors.stockists && (
              <p className="text-red-500 text-xs mt-1.5 ml-1">
                {errors.stockists}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`w-full py-4 rounded-2xl font-semibold text-white transition shadow-lg ${
              isSubmitting
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-500 hover:to-cyan-600 active:scale-[0.98]"
            }`}
          >
            {isSubmitting ? "Submitting..." : "Complete Registration"}
          </button>

          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 mb-2">
              Already have an account?
            </p>
            <button
              type="button"
              onClick={() => navigate("/purchaserLogin")}
              className="text-cyan-600 hover:text-cyan-700 font-semibold text-sm transition"
            >
              Sign In Here
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
