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
      submitData.append("personalPhoto", pFile);

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
      const created = await postForm("/api/auth/purchaser-signup", submitData, {
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
        // auth route returns `purchaser` object when created
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
            // we send the created purchaser's image URLs if backend returned them
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
              <User className="w-8 h-8" />
              Purchaser Registration
            </h2>
            <p className="text-blue-100 mt-2">
              Please fill in all the required information
            </p>
          </div>

          <div className="px-8 py-6 space-y-6">
            {submitStatus === "success" && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h3 className="text-green-800 font-semibold">
                    Registration Successful!
                  </h3>
                  <p className="text-green-700 text-sm">
                    Purchaser has been registered successfully.
                  </p>
                </div>
              </div>
            )}

            {submitStatus === "error" && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <h3 className="text-red-800 font-semibold">
                    Registration Failed
                  </h3>
                  <p className="text-red-700 text-sm">
                    {errorMessage ||
                      "There was an error submitting the form. Please try again."}
                  </p>
                </div>
              </div>
            )}
            {submitStatus === "route-missing" && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h3 className="text-yellow-800 font-semibold">Unavailable</h3>
                  <p className="text-yellow-700 text-sm">{errorMessage}</p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Full Name *
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border ${
                  errors.fullName ? "border-red-300" : "border-gray-300"
                } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition`}
                placeholder="Enter full name"
              />
              {errors.fullName && (
                <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-2" />
                Address *
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                rows="3"
                className={`w-full px-4 py-3 border ${
                  errors.address ? "border-red-300" : "border-gray-300"
                } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none`}
                placeholder="Enter complete address"
              />
              {errors.address && (
                <p className="text-red-500 text-sm mt-1">{errors.address}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Phone className="w-4 h-4 inline mr-2" />
                Contact Number *
              </label>
              <input
                type="tel"
                name="contactNo"
                value={formData.contactNo}
                onChange={handleInputChange}
                maxLength="10"
                className={`w-full px-4 py-3 border ${
                  errors.contactNo ? "border-red-300" : "border-gray-300"
                } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition`}
                placeholder="Enter 10-digit mobile number"
              />
              {errors.contactNo && (
                <p className="text-red-500 text-sm mt-1">{errors.contactNo}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border ${
                  errors.email ? "border-red-300" : "border-gray-300"
                } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition`}
                placeholder="Enter email address"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border ${
                    errors.password ? "border-red-300" : "border-gray-300"
                  } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition`}
                  placeholder="Enter password"
                />
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border ${
                    errors.confirmPassword
                      ? "border-red-300"
                      : "border-gray-300"
                  } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition`}
                  placeholder="Confirm password"
                />
                {errors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Image className="w-4 h-4 inline mr-2" />
                  Aadhar Card Image *
                </label>
                <div
                  className={`border-2 border-dashed ${
                    errors.aadharImage ? "border-red-300" : "border-gray-300"
                  } rounded-lg p-4 text-center hover:border-blue-400 transition`}
                >
                  {previews.aadharImage ? (
                    <div className="relative">
                      <img
                        src={previews.aadharImage}
                        alt="Aadhar preview"
                        className="w-full h-40 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            aadharImage: null,
                          }));
                          setPreviews((prev) => ({
                            ...prev,
                            aadharImage: null,
                          }));
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 mb-2">
                        Upload Aadhar Card
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, "aadharImage")}
                        className="hidden"
                        id="aadharImage"
                      />
                      <label
                        htmlFor="aadharImage"
                        className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition text-sm"
                      >
                        Choose File
                      </label>
                    </>
                  )}
                </div>
                {errors.aadharImage && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.aadharImage}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Camera className="w-4 h-4 inline mr-2" />
                  Photo *
                </label>
                <div
                  className={`border-2 border-dashed ${
                    errors.photo ? "border-red-300" : "border-gray-300"
                  } rounded-lg p-4 text-center hover:border-blue-400 transition`}
                >
                  {previews.photo ? (
                    <div className="relative">
                      <img
                        src={previews.photo}
                        alt="Photo preview"
                        className="w-full h-40 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({ ...prev, photo: null }));
                          setPreviews((prev) => ({ ...prev, photo: null }));
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <>
                      <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 mb-2">Upload Photo</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, "photo")}
                        className="hidden"
                        id="photo"
                      />
                      <label
                        htmlFor="photo"
                        className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition text-sm"
                      >
                        Choose File
                      </label>
                    </>
                  )}
                </div>
                {errors.photo && (
                  <p className="text-red-500 text-sm mt-1">{errors.photo}</p>
                )}
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Stockists to verify (choose at least 3)
              </label>

              <div className="border rounded p-2">
                {/* Selected tags */}
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedStockists.length === 0 && (
                    <div className="text-xs text-gray-400">
                      No stockists selected
                    </div>
                  )}
                  {selectedStockists.map((id) => {
                    const s = stockists.find((x) => x._id === id) || {};
                    const label =
                      s.contactPerson || s.name || s.medicalName || id;
                    return (
                      <span
                        key={id}
                        className="inline-flex items-center bg-blue-50 border border-blue-200 text-blue-700 px-2 py-0.5 rounded-full text-xs"
                      >
                        <span className="mr-2">{label}</span>
                        <button
                          type="button"
                          onClick={() => toggleStockist(id)}
                          className="text-blue-500 hover:text-blue-700 rounded-full p-0.5"
                          aria-label={`Remove ${label}`}
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>

                {/* Search input */}
                <div className="relative">
                  <input
                    type="text"
                    value={stockistQuery}
                    onChange={(e) => {
                      setStockistQuery(e.target.value);
                      setStockistDropdownOpen(true);
                    }}
                    onFocus={() => setStockistDropdownOpen(true)}
                    placeholder="Search stockists by name, email or phone"
                    className="w-full px-3 py-2 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />

                  {/* Dropdown list */}
                  {stockistDropdownOpen && (
                    <div className="absolute z-20 left-0 right-0 mt-1 bg-white border rounded max-h-48 overflow-auto shadow">
                      {loadingStockists ? (
                        <div className="p-2 text-sm text-gray-500">
                          Loading stockists…
                        </div>
                      ) : (
                        stockists
                          .filter((s) => {
                            const q = stockistQuery.trim().toLowerCase();
                            if (!q) return true;
                            const label = (
                              s.contactPerson ||
                              s.name ||
                              s.medicalName ||
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
                            const label =
                              s.contactPerson || s.name || s.medicalName || id;
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
                                className={`w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center justify-between ${
                                  isSelected ? "opacity-60" : ""
                                }`}
                              >
                                <div className="text-sm">
                                  <div className="font-medium">{label}</div>
                                  <div className="text-xs text-gray-500">
                                    {s.email || s.phone || s.location}
                                  </div>
                                </div>
                                {isSelected && (
                                  <div className="text-xs text-green-600">
                                    Selected
                                  </div>
                                )}
                              </button>
                            );
                          })
                      )}
                      {stockists.length === 0 && !loadingStockists && (
                        <div className="p-2 text-sm text-gray-500">
                          No stockists available
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {errors.stockists && (
                <p className="text-red-500 text-sm mt-1">{errors.stockists}</p>
              )}
            </div>

            <div className="pt-4">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`w-full py-4 rounded-lg font-semibold text-white transition ${
                  isSubmitting
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                }`}
              >
                {isSubmitting ? "Submitting..." : "Register Purchaser"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
