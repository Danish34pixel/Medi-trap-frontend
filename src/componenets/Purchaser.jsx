import React, { useEffect, useState } from "react";
import axios from "axios";
import { apiUrl } from "./config/api";
import API_BASE from "./config/api";
import { QRCodeSVG } from "qrcode.react";

// Helper to safely render address objects or strings
const formatAddress = (addr) => {
  if (!addr) return "";
  if (typeof addr === "string") return addr;
  try {
    const parts = [];
    if (addr.street) parts.push(addr.street);
    if (addr.city) parts.push(addr.city);
    if (addr.state) parts.push(addr.state);
    if (addr.pincode) parts.push(addr.pincode);
    return parts.filter(Boolean).join(", ");
  } catch (e) {
    return "";
  }
};

// Small helper that tries multiple candidate URLs and falls back to a placeholder
const SmartImage = ({ srcCandidates = [], alt = "", className = "" }) => {
  const [index, setIndex] = React.useState(0);
  const [hasError, setHasError] = React.useState(false);

  const src =
    srcCandidates && srcCandidates.length ? srcCandidates[index] : null;

  const handleError = (e) => {
    if (index + 1 < srcCandidates.length) {
      setIndex(index + 1);
      setHasError(false);
    } else {
      setHasError(true);
      // Don't set src to avoid infinite error loop
      e.currentTarget.style.display = "none";
    }
  };

  if (!src || hasError) {
    return (
      <div
        className={`${className} bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center`}
      >
        <svg
          className="w-12 h-12 text-teal-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      </div>
    );
  }

  return (
    <img src={src} alt={alt} className={className} onError={handleError} />
  );
};

const Purchaser = () => {
  const [purchasers, setPurchasers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [meLoading, setMeLoading] = useState(true);
  const [requestingCard, setRequestingCard] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");
  const [stockistsList, setStockistsList] = useState([]);
  const [showStockistPicker, setShowStockistPicker] = useState(false);
  const [selectedStockists, setSelectedStockists] = useState([]);

  const [form, setForm] = useState({
    fullName: "",
    address: "",
    contactNo: "",
    aadharImage: null,
    photo: null,
  });
  const [aadharPreview, setAadharPreview] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const fetchPurchasers = async () => {
      setLoading(true);
      setError(null);
      try {
        let t = null;
        try {
          t = localStorage.getItem("token");
        } catch (e) {}
        if (!t) {
          setPurchasers([]);
          setError("Login required to view purchasers.");
          setLoading(false);
          return;
        }
        try {
          const res = await axios.get(apiUrl("/api/purchaser"), {
            headers: { Authorization: `Bearer ${t}` },
          });
          setPurchasers(res.data.data || []);
        } catch (errInner) {
          if (
            errInner &&
            errInner.response &&
            errInner.response.status === 401
          ) {
            try {
              localStorage.removeItem("token");
            } catch (e) {}
            setPurchasers([]);
            setError("Unauthorized. Please login to view purchasers.");
            setLoading(false);
            return;
          }
          throw errInner;
        }
      } catch (err) {
        setError("Failed to fetch purchasers");
      }
      setLoading(false);
    };

    fetchPurchasers();

    (async () => {
      try {
        setMeLoading(true);
        let token = null;
        try {
          token = localStorage.getItem("token");
        } catch (e) {}
        if (!token) {
          setCurrentUser(null);
          setMeLoading(false);
          return;
        }
        const r = await axios.get(apiUrl("/api/auth/me"), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (r.data && r.data.user) setCurrentUser(r.data.user);
      } catch (e) {
        // ignore
      } finally {
        setMeLoading(false);
      }
    })();
  }, []);

  // When user has requested a purchasing card, poll their /me endpoint
  // so the UI updates automatically when stockists approve (grants hasPurchasingCard).
  useEffect(() => {
    let timer = null;
    const startPolling = () => {
      timer = setInterval(async () => {
        try {
          const token = localStorage.getItem("token");
          if (!token) return;
          const r = await axios.get(apiUrl("/api/auth/me"), {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (r.data && r.data.user) {
            setCurrentUser(r.data.user);
            if (r.data.user.hasPurchasingCard) {
              setFormVisible(true);
              clearInterval(timer);
            }
          }
        } catch (e) {
          // ignore transient errors
        }
      }, 10000); // poll every 10s
    };

    if (
      currentUser &&
      currentUser.purchasingCardRequested &&
      !currentUser.hasPurchasingCard
    ) {
      startPolling();
    } else if (currentUser && currentUser.hasPurchasingCard) {
      setFormVisible(true);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [currentUser]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "aadharImage" && files && files[0]) {
      setForm({ ...form, aadharImage: files[0] });
      setAadharPreview(URL.createObjectURL(files[0]));
    } else if (name === "photo" && files && files[0]) {
      setForm({ ...form, photo: files[0] });
      setPhotoPreview(URL.createObjectURL(files[0]));
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const resetForm = () => {
    setForm({
      fullName: "",
      address: "",
      contactNo: "",
      aadharImage: null,
      photo: null,
    });
    setAadharPreview(null);
    setPhotoPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (!form.aadharImage || !form.photo) {
        setError("Aadhar image and photo are required");
        setSubmitting(false);
        return;
      }

      const formData = new FormData();
      formData.append("fullName", form.fullName);
      formData.append("address", form.address);
      formData.append("contactNo", form.contactNo);
      formData.append("aadharImage", form.aadharImage);
      formData.append("photo", form.photo);

      let t = null;
      try {
        t = localStorage.getItem("token");
      } catch (e) {}
      if (!t) {
        setError("Login required to add purchaser.");
        setSubmitting(false);
        return;
      }
      const res = await axios.post(apiUrl("/api/purchaser"), formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${t}`,
        },
      });

      if (res.data && res.data.success) {
        setPurchasers([res.data.data, ...purchasers]);
        resetForm();
        setFormVisible(false);
        setSuccessMessage("Purchaser added successfully!");
        setSubmitting(false);
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        throw new Error(res.data.message || "Failed to add purchaser");
      }
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to add purchaser"
      );
    }
  };

  const showForm = () => {
    if (currentUser && currentUser.hasPurchasingCard) {
      setFormVisible(true);
      setSuccessMessage("");
      setError(null);
      return;
    }
    if (!currentUser && !meLoading) {
      setRequestMessage("Please login to request a purchasing card.");
      return;
    }
    if (currentUser && currentUser.purchasingCardRequested) {
      setRequestMessage("Your purchasing card request is pending approval.");
      return;
    }
    setRequestMessage("");
  };

  const openStockistPicker = async () => {
    setRequestingCard(true);
    setRequestMessage("");
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setRequestMessage("Login required to request a purchasing card.");
        setRequestingCard(false);
        return;
      }
      const r = await axios.get(apiUrl("/api/stockist"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStockistsList(r.data && r.data.data ? r.data.data : []);
      setSelectedStockists([]);
      setShowStockistPicker(true);
    } catch (e) {
      console.warn("Failed to fetch stockists", e && e.message);
      setRequestMessage("Failed to load stockists. Try again later.");
    } finally {
      setRequestingCard(false);
    }
  };

  const requestPurchasingCard = () => {
    openStockistPicker();
  };

  const toggleStockistSelection = (id) => {
    setSelectedStockists((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id]
    );
  };

  const submitSelectedStockists = async () => {
    setRequestingCard(true);
    setRequestMessage("");
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setRequestMessage("Login required to request a purchasing card.");
        setRequestingCard(false);
        return;
      }
      if (!Array.isArray(selectedStockists) || selectedStockists.length < 3) {
        setRequestMessage("Please select at least 3 stockists to notify");
        setRequestingCard(false);
        return;
      }
      const res = await axios.post(
        apiUrl("/api/purchasing-card/request"),
        { stockistIds: selectedStockists },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data && res.data.success) {
        setRequestMessage(res.data.message || "Requested");
        setCurrentUser((u) =>
          u ? { ...u, purchasingCardRequested: true } : u
        );
        setShowStockistPicker(false);
      } else {
        setRequestMessage(res.data.message || "Request failed");
      }
    } catch (err) {
      setRequestMessage(
        err.response?.data?.message || err.message || "Request failed"
      );
    } finally {
      setRequestingCard(false);
    }
  };

  const QRCode = ({ value, size = 120 }) => (
    <div className="flex flex-col items-center">
      <QRCodeSVG value={value} size={size} />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">
                  Purchaser Management
                </h1>
                <p className="text-sm text-gray-500">
                  Manage purchaser profiles and generate QR codes
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-gray-100 px-3 py-1 rounded-full">
                <span className="text-sm font-medium text-gray-600">
                  Total: {purchasers.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-green-800 font-semibold text-lg">
                {successMessage}
              </h4>
              <p className="text-green-600 text-sm">
                QR code has been generated for the new purchaser.
              </p>
            </div>
            <button
              onClick={() => setSuccessMessage("")}
              className="text-green-600 hover:text-green-800 p-2"
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
        )}

        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20">
          <div className="p-8 border-b border-gray-100/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-teal-400 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <svg
                      className="w-7 h-7 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                    Active Purchasers
                  </h2>
                  <p className="text-gray-500 text-sm mt-1">
                    Manage and monitor purchaser profiles
                  </p>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
              <span className="ml-3 text-teal-600 font-medium">
                Loading purchasers...
              </span>
            </div>
          ) : error ? (
            <div className="text-red-600 py-8 text-center bg-red-50 rounded-xl border border-red-200 m-4">
              <p className="font-medium">{error}</p>
            </div>
          ) : purchasers.length === 0 ? (
            <div className="text-center py-16 m-4">
              <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-10 h-10 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                No purchasers found
              </h3>
              <p className="text-gray-500">
                Add your first purchaser using the form below!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-6">
              {purchasers.map((p) => (
                <div
                  key={p._id}
                  className="flex flex-col items-center space-y-6"
                >
                  <div className="group bg-gradient-to-br from-white via-white to-teal-50/30 border border-teal-100/50 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 w-full transform hover:-translate-y-2 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-6">
                      <div className="relative">
                        <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-teal-200 bg-teal-50 flex items-center justify-center shadow-2xl group-hover:border-teal-300 transition-all duration-300">
                          {(() => {
                            const img =
                              p.photo || p.image || p.aadharImage || "";
                            const candidates = [];
                            if (img && typeof img === "string") {
                              if (img.startsWith("data:")) candidates.push(img);
                              if (img.startsWith("http")) candidates.push(img);
                              if (API_BASE)
                                candidates.push(
                                  `${API_BASE}${
                                    img.startsWith("/") ? img : `/${img}`
                                  }`
                                );
                            }
                            candidates.push(
                              "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
                              "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
                            );
                            return (
                              <SmartImage
                                srcCandidates={candidates}
                                alt={`${p.fullName} Photo`}
                                className="object-cover w-full h-full"
                              />
                            );
                          })()}
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-400 rounded-full border-4 border-white shadow-lg flex items-center justify-center animate-pulse">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                        <div className="absolute -top-2 -left-2 w-6 h-6 bg-teal-500 rounded-full border-2 border-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>

                      <div className="text-center w-full space-y-4">
                        <div>
                          <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-2">
                            {p.fullName}
                          </h3>
                          <p className="text-gray-600 text-sm leading-relaxed px-4">
                            {formatAddress(p.address)}
                          </p>
                        </div>

                        <div className="inline-flex items-center gap-3 bg-gradient-to-r from-teal-100 to-teal-50 px-6 py-3 rounded-2xl border border-teal-200/50 shadow-sm">
                          <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center">
                            <svg
                              className="w-4 h-4 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                              />
                            </svg>
                          </div>
                          <span className="text-gray-700 font-semibold">
                            {p.contactNo}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6">
                      <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-2xl px-4 py-3 text-center shadow-inner">
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <div className="w-1.5 h-1.5 bg-teal-500 rounded-full"></div>
                          <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                            Purchaser ID
                          </span>
                          <div className="w-1.5 h-1.5 bg-teal-500 rounded-full"></div>
                        </div>
                        <span className="text-xs font-mono text-gray-600 bg-white px-3 py-1 rounded-lg border">
                          {p._id.substring(0, 12)}...
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="group bg-white/90 backdrop-blur-sm p-8 rounded-3xl shadow-2xl border border-white/30 flex flex-col items-center space-y-4 hover:shadow-3xl transition-all duration-500 hover:scale-105">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse"></div>
                      <span className="text-teal-600 font-bold text-sm uppercase tracking-wider">
                        QR Access Code
                      </span>
                      <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse"></div>
                    </div>
                    <div className="relative p-4 bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-inner border border-gray-100">
                      <QRCode
                        value={`${window.location.origin}/purchaser/${p._id}`}
                        size={130}
                      />
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-transparent via-transparent to-teal-500/5 group-hover:to-teal-500/10 transition-all duration-300"></div>
                    </div>
                    <div className="text-center space-y-2">
                      <div className="text-xs text-gray-500 font-medium">
                        Scan to view profile
                      </div>
                      <button className="px-4 py-2 bg-teal-50 hover:bg-teal-100 text-teal-600 rounded-xl text-xs font-semibold transition-all duration-200 border border-teal-200/50">
                        Download QR
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Purchaser Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
              <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </div>
              Add New Purchaser
            </h3>
            {!formVisible && (
              <div className="flex items-center gap-3">
                <button
                  onClick={showForm}
                  className="px-6 py-3 bg-teal-500 text-white rounded-xl hover:bg-teal-600 transition-colors duration-200 font-semibold shadow-md"
                >
                  Add Another
                </button>
                {meLoading ? null : currentUser &&
                  !currentUser.hasPurchasingCard ? (
                  <div className="flex items-center gap-2">
                    {currentUser.purchasingCardRequested ? (
                      <span className="text-sm text-gray-600">
                        Request pending
                      </span>
                    ) : (
                      <button
                        onClick={requestPurchasingCard}
                        disabled={requestingCard}
                        className="px-4 py-2 bg-yellow-400 text-gray-900 rounded-xl text-sm font-semibold hover:brightness-95"
                      >
                        {requestingCard
                          ? "Requesting..."
                          : "Request Purchasing Card"}
                      </button>
                    )}
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {formVisible ? (
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-gray-700 font-medium text-sm">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    placeholder="Enter full name"
                    value={form.fullName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-gray-700 font-medium text-sm">
                    Contact Number *
                  </label>
                  <input
                    type="tel"
                    name="contactNo"
                    placeholder="Enter contact number"
                    value={form.contactNo}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-gray-700 font-medium text-sm">
                  Address *
                </label>
                <textarea
                  name="address"
                  placeholder="Enter complete address"
                  value={form.address}
                  onChange={handleChange}
                  required
                  rows="3"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 resize-vertical"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-gray-700 font-medium text-sm">
                    Purchaser Photo *
                  </label>
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-teal-300 transition-colors">
                    <svg
                      className="w-8 h-8 text-gray-400 mx-auto mb-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <input
                      type="file"
                      name="photo"
                      accept="image/*"
                      onChange={handleChange}
                      required
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">Upload photo</p>
                  </div>
                  {photoPreview && (
                    <div className="mt-3 flex justify-center">
                      <img
                        src={photoPreview}
                        alt="Photo Preview"
                        className="w-20 h-20 object-cover rounded-full border-4 border-teal-200 shadow-sm"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-gray-700 font-medium text-sm">
                    Aadhar Card Image *
                  </label>
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-teal-300 transition-colors">
                    <svg
                      className="w-8 h-8 text-gray-400 mx-auto mb-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <input
                      type="file"
                      name="aadharImage"
                      accept="image/*"
                      onChange={handleChange}
                      required
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Upload Aadhar card
                    </p>
                  </div>
                  {aadharPreview && (
                    <div className="mt-3 flex justify-center">
                      <img
                        src={aadharPreview}
                        alt="Aadhar Preview"
                        className="w-32 h-20 object-cover rounded-lg border-2 border-teal-200 shadow-sm"
                      />
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                  <svg
                    className="w-5 h-5 text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                  <span className="text-red-700 font-medium">{error}</span>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className={`flex-1 px-6 py-4 rounded-xl font-semibold transition-all duration-200 shadow-md ${
                    submitting
                      ? "bg-teal-400 text-white cursor-not-allowed"
                      : "bg-teal-500 text-white hover:bg-teal-600 hover:shadow-lg"
                  }`}
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Adding Purchaser...
                    </span>
                  ) : (
                    "Add Purchaser"
                  )}
                </button>

                <button
                  onClick={resetForm}
                  className="px-6 py-4 rounded-xl border-2 border-teal-200 text-teal-600 font-semibold hover:bg-teal-50 transition-all duration-200"
                >
                  Reset
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              {currentUser && !currentUser.hasPurchasingCard ? (
                <div className="space-y-4">
                  <div className="w-20 h-20 bg-yellow-50 rounded-2xl flex items-center justify-center mx-auto mb-2">
                    <svg
                      className="w-10 h-10 text-yellow-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3"
                      />
                    </svg>
                  </div>
                  <h4 className="text-xl font-bold text-gray-800">
                    Purchasing Card Required
                  </h4>
                  <p className="text-gray-600">
                    You need a purchasing card to add or modify purchasers.
                  </p>
                  {currentUser.purchasingCardRequested ? (
                    <p className="text-sm text-gray-500">
                      Your request is pending approval.
                    </p>
                  ) : (
                    <button
                      onClick={requestPurchasingCard}
                      disabled={requestingCard}
                      className="px-6 py-3 bg-yellow-400 text-gray-900 rounded-xl font-semibold"
                    >
                      {requestingCard
                        ? "Requesting..."
                        : "Request Purchasing Card"}
                    </button>
                  )}
                  {requestMessage && (
                    <div className="text-sm text-gray-600 mt-2">
                      {requestMessage}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <svg
                      className="w-10 h-10 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <h4 className="text-2xl font-bold text-green-700 mb-3">
                    Purchaser Added Successfully!
                  </h4>
                  <p className="text-green-600 text-lg mb-6">
                    QR code has been generated and the purchaser is now listed
                    above.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Stockist Picker Modal */}
        {showStockistPicker && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-bold">Select Stockists (min 3)</h4>
                <button
                  onClick={() => setShowStockistPicker(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Close
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-auto mb-4">
                {stockistsList && stockistsList.length > 0 ? (
                  stockistsList.map((s) => (
                    <label
                      key={s._id}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${
                        selectedStockists.includes(s._id)
                          ? "border-teal-400 bg-teal-50"
                          : "border-gray-100"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedStockists.includes(s._id)}
                        onChange={() => toggleStockistSelection(s._id)}
                      />
                      <div className="flex-1">
                        <div className="font-medium">
                          {s.name || s.email || s._id}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatAddress(s.address)}
                        </div>
                      </div>
                    </label>
                  ))
                ) : (
                  <div className="text-center text-gray-500 p-6">
                    No stockists available
                  </div>
                )}
              </div>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowStockistPicker(false)}
                  className="px-4 py-2 rounded-lg border"
                >
                  Cancel
                </button>
                <button
                  onClick={submitSelectedStockists}
                  disabled={requestingCard}
                  className="px-4 py-2 rounded-lg bg-teal-500 text-white"
                >
                  {requestingCard ? "Requesting..." : "Notify Selected"}
                </button>
              </div>
              {requestMessage && (
                <div className="mt-3 text-sm text-gray-700">
                  {requestMessage}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Purchaser;
