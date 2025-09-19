import React, { useEffect, useState } from "react";
import axios from "axios";
import { apiUrl } from "./config/api";
import API_BASE from "./config/api";
import { QRCodeSVG } from "qrcode.react";

const Purchaser = () => {
  const [purchasers, setPurchasers] = useState([]);
  // Fetch purchasers from backend
  useEffect(() => {
    const fetchPurchasers = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(apiUrl("/api/purchaser"));
        setPurchasers(res.data.data || []);
      } catch (err) {
        setError("Failed to fetch purchasers");
      }
      setLoading(false);
    };
    fetchPurchasers();
  }, []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
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
  const [formVisible, setFormVisible] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");

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

      const res = await axios.post(apiUrl("/api/purchaser"), formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data && res.data.success) {
        // Add new purchaser to list (prepend for latest first)
        setPurchasers([res.data.data, ...purchasers]);
        resetForm();
        setFormVisible(false);
        setSuccessMessage("Purchaser added successfully!");
        setSubmitting(false);
        setTimeout(() => {
          setSuccessMessage("");
        }, 3000);
      } else {
        throw new Error(res.data.message || "Failed to add purchaser");
      }
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to add purchaser"
      );
      setSubmitting(false);
    }
  };

  const showForm = () => {
    setFormVisible(true);
    setSuccessMessage("");
    setError(null);
  };

  // Real QR Code component using qrcode.react
  const QRCode = ({ value, size = 120 }) => (
    <div className="flex flex-col items-center">
      <QRCodeSVG value={value} size={size} />
    </div>
  );

  return (
    <div className="min-h-screen py-8" style={{ backgroundColor: "#f8fafc" }}>
      <div className="max-w-6xl mx-auto px-4">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-2xl p-6 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
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
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <h4 className="text-green-800 font-semibold text-lg">
                  {successMessage}
                </h4>
                <p className="text-green-600 text-sm">
                  QR code has been generated for the new purchaser.
                </p>
              </div>
            </div>
            <button
              onClick={() => setSuccessMessage("")}
              className="text-green-600 hover:text-green-800 p-2"
            >
              <svg
                className="w-5 h-5"
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

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-white"
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
          <h1 className="text-3xl font-bold text-gray-800">
            Purchaser Management
          </h1>
          <p className="text-gray-600 mt-2">
            Manage purchaser profiles and generate QR codes
          </p>
        </div>

        {/* Purchasers List */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 mb-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
              <svg
                className="w-7 h-7 text-blue-500"
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
              Purchasers
            </h2>
            <div className="bg-blue-50 px-4 py-2 rounded-xl">
              <span className="text-blue-600 font-semibold">
                Total: {purchasers.length}
              </span>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-blue-600 font-medium">
                Loading purchasers...
              </span>
            </div>
          ) : error ? (
            <div className="text-red-600 py-8 text-center bg-red-50 rounded-xl border border-red-200">
              <svg
                className="w-12 h-12 text-red-500 mx-auto mb-4"
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
              <p className="font-medium">{error}</p>
            </div>
          ) : purchasers.length === 0 ? (
            <div className="text-center py-16">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {purchasers.map((p) => (
                <div
                  key={p._id}
                  className="flex flex-col items-center space-y-6"
                >
                  {/* Purchaser Card */}
                  <div className="bg-gradient-to-br from-white to-blue-50 border border-blue-100 rounded-2xl p-6 shadow-md hover:shadow-lg transition-all duration-300 w-full">
                    {/* Profile Section */}
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-blue-200 bg-blue-50 flex items-center justify-center shadow-sm">
                        {(() => {
                          const img = p.photo;
                          if (!img)
                            return (
                              <svg
                                className="w-12 h-12 text-blue-400"
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
                            );
                          // resolve absolute vs relative
                          const src = img.startsWith("http")
                            ? img
                            : `${API_BASE}${
                                img.startsWith("/") ? img : `/${img}`
                              }`;
                          return (
                            <img
                              src={src}
                              alt="Photo"
                              className="object-cover w-full h-full"
                              onError={(e) => {
                                // fallback to placeholder on load error
                                e.currentTarget.onerror = null;
                                e.currentTarget.src =
                                  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><rect width='100%' height='100%' fill='%23e6eefc'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%236b8bd7' font-size='20'>Photo</text></svg>";
                              }}
                            />
                          );
                        })()}
                      </div>

                      <div className="text-center w-full">
                        <h3 className="text-xl font-bold text-gray-800 mb-2">
                          {p.fullName}
                        </h3>
                        <p className="text-gray-600 text-sm leading-relaxed mb-3 px-2">
                          {p.address}
                        </p>
                        <div className="inline-flex items-center gap-2 bg-blue-100 px-4 py-2 rounded-full">
                          <svg
                            className="w-4 h-4 text-blue-600"
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
                          <span className="text-gray-700 font-medium text-sm">
                            {p.contactNo}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* ID Badge */}
                    <div className="mt-4">
                      <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-center">
                        <span className="text-xs text-gray-400 block">ID</span>
                        <span className="text-xs font-mono text-gray-600 break-all">
                          {p._id}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* QR Code Below Card */}
                  <div className="bg-white p-6 rounded-2xl shadow-lg border border-blue-100 flex flex-col items-center space-y-3">
                    <div className="text-blue-600 font-semibold text-sm">
                      QR Code
                    </div>
                    <QRCode value={`/purchaser/${p._id}`} size={120} />
                    <div className="text-xs text-gray-500 text-center">
                      Scan to view profile
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Purchaser Form */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
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
              <button
                onClick={showForm}
                className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors duration-200 font-semibold shadow-md"
              >
                Add Another
              </button>
            )}
          </div>

          {formVisible ? (
            <div className="space-y-6">
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
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
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
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
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
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-vertical"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-gray-700 font-medium text-sm">
                    Purchaser Photo *
                  </label>
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-blue-300 transition-colors">
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
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">Upload photo</p>
                  </div>
                  {photoPreview && (
                    <div className="mt-3 flex justify-center">
                      <img
                        src={photoPreview}
                        alt="Photo Preview"
                        className="w-20 h-20 object-cover rounded-full border-4 border-blue-200 shadow-sm"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-gray-700 font-medium text-sm">
                    Aadhar Card Image *
                  </label>
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-blue-300 transition-colors">
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
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
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
                        className="w-32 h-20 object-cover rounded-lg border-2 border-blue-200 shadow-sm"
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
                      ? "bg-blue-400 text-white cursor-not-allowed"
                      : "bg-blue-500 text-white hover:bg-blue-600 hover:shadow-lg"
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
                  className="px-6 py-4 rounded-xl border-2 border-blue-200 text-blue-600 font-semibold hover:bg-blue-50 transition-all duration-200"
                >
                  Reset
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
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
      </div>
    </div>
  );
};

export default Purchaser;
