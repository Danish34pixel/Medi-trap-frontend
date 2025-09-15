import React, { useEffect, useState } from "react";
import axios from "axios";
import { apiUrl } from "./config/api";
import { QRCodeCanvas } from "qrcode.react";

const Purchaser = () => {
  const [purchasers, setPurchasers] = useState([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    fetchPurchasers();
  }, []);

  const fetchPurchasers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(apiUrl("/api/purchaser"));
      setPurchasers(Array.isArray(res.data.data) ? res.data.data : []);
      setError(null);
    } catch (err) {
      setError("Failed to fetch purchasers");
    }
    setLoading(false);
  };

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
    // Reset file inputs
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach((input) => (input.value = ""));
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

      await axios.post(apiUrl("/api/purchaser"), formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      resetForm();
      setFormVisible(false);
      setSuccessMessage("Purchaser added successfully!");
      fetchPurchasers();
      setSubmitting(false);

      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (err) {
      setError("Failed to add purchaser");
      setSubmitting(false);
    }
  };

  const showForm = () => {
    setFormVisible(true);
    setSuccessMessage("");
    setError(null);
  };

  return (
    <div className="bg-sky-50 min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">✅</span>
              <div>
                <h4 className="text-green-800 font-semibold">
                  {successMessage}
                </h4>
                <p className="text-green-600 text-sm">
                  QR code has been generated for the new purchaser.
                </p>
              </div>
            </div>
            <button
              onClick={() => setSuccessMessage("")}
              className="text-green-600 hover:text-green-800 text-xl font-bold"
            >
              ×
            </button>
          </div>
        )}

        {/* Purchasers List */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-sky-100 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-sky-700 flex items-center gap-3">
              <span>🧑‍💼</span> Purchasers
            </h2>
            <div className="text-sky-600 font-medium">
              Total: {purchasers.length}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
              <span className="ml-3 text-sky-600">Loading purchasers...</span>
            </div>
          ) : error ? (
            <div className="text-red-600 py-4 text-center bg-red-50 rounded-lg border border-red-200">
              {error}
            </div>
          ) : purchasers.length === 0 ? (
            <div className="text-sky-600 py-12 text-center">
              <span className="text-4xl mb-4 block">📋</span>
              <p>No purchasers found. Add your first purchaser below!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-4">
              {purchasers.map((p) => (
                <div
                  key={p._id}
                  className="flex flex-col items-center space-y-4"
                >
                  {/* Purchaser Card */}
                  <div className="bg-gradient-to-br from-white to-sky-25 border border-sky-200 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col gap-4 items-center w-full">
                    {/* Profile Section */}
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-24 h-24 rounded-full overflow-hidden border-3 border-sky-300 bg-sky-50 flex items-center justify-center shadow-md">
                        {p.photo ? (
                          <img
                            src={p.photo}
                            alt="Photo"
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <span className="text-4xl">🧑‍💼</span>
                        )}
                      </div>
                      <div className="text-center">
                        <h3 className="text-xl font-bold text-sky-700 mb-1">
                          {p.fullName}
                        </h3>
                        <p className="text-slate-600 text-sm leading-relaxed mb-2">
                          {p.address}
                        </p>
                        <div className="inline-flex items-center gap-2 bg-sky-100 px-3 py-1 rounded-full">
                          <span className="text-sm">📱</span>
                          <span className="text-slate-700 font-medium text-sm">
                            {p.contactNo}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* ID Badge */}
                    <div className="w-full mt-4">
                      <div className="bg-sky-50 border border-sky-200 rounded-lg px-3 py-2 text-center">
                        <span className="text-xs text-slate-400 block">ID</span>
                        <span className="text-xs font-mono text-slate-600">
                          {p._id}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* QR Code Below Card */}
                  <div className="bg-white p-4 rounded-xl shadow-lg border border-sky-200 flex flex-col items-center space-y-2">
                    <div className="text-sky-700 font-medium text-sm text-center">
                      QR Code
                    </div>
                    <QRCodeCanvas
                      value={window.location.origin + `/purchaser/${p._id}`}
                      size={120}
                      bgColor="#ffffff"
                      fgColor="#0ea5e9"
                      level="M"
                    />
                    <div className="text-xs text-slate-400 text-center">
                      Scan to view profile
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Purchaser Form */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-sky-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-sky-700 flex items-center gap-3">
              <span>➕</span> Add New Purchaser
            </h3>
            {!formVisible && (
              <button
                onClick={showForm}
                className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors duration-200 font-medium"
              >
                Add Another
              </button>
            )}
          </div>

          {formVisible ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label
                    htmlFor="fullName"
                    className="text-slate-700 font-medium text-sm"
                  >
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    id="fullName"
                    placeholder="Enter full name"
                    value={form.fullName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-sky-200 bg-sky-50 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-transparent transition-all duration-200"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="contactNo"
                    className="text-slate-700 font-medium text-sm"
                  >
                    Contact Number *
                  </label>
                  <input
                    type="tel"
                    name="contactNo"
                    id="contactNo"
                    placeholder="Enter contact number"
                    value={form.contactNo}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-sky-200 bg-sky-50 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="address"
                  className="text-slate-700 font-medium text-sm"
                >
                  Address *
                </label>
                <textarea
                  name="address"
                  id="address"
                  placeholder="Enter complete address"
                  value={form.address}
                  onChange={handleChange}
                  required
                  rows="3"
                  className="w-full px-4 py-3 rounded-lg border border-sky-200 bg-sky-50 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-transparent transition-all duration-200 resize-vertical"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label
                    htmlFor="photo"
                    className="text-slate-700 font-medium text-sm"
                  >
                    Purchaser Photo *
                  </label>
                  <input
                    type="file"
                    name="photo"
                    id="photo"
                    accept="image/*"
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-sky-200 bg-sky-50 focus:outline-none focus:ring-2 focus:ring-sky-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-100 file:text-sky-700 hover:file:bg-sky-200"
                  />
                  {photoPreview && (
                    <div className="mt-3 flex justify-center">
                      <img
                        src={photoPreview}
                        alt="Photo Preview"
                        className="w-20 h-20 object-cover rounded-full border-2 border-sky-200 shadow-sm"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="aadharImage"
                    className="text-slate-700 font-medium text-sm"
                  >
                    Aadhar Image *
                  </label>
                  <input
                    type="file"
                    name="aadharImage"
                    id="aadharImage"
                    accept="image/*"
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-sky-200 bg-sky-50 focus:outline-none focus:ring-2 focus:ring-sky-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-100 file:text-sky-700 hover:file:bg-sky-200"
                  />
                  {aadharPreview && (
                    <div className="mt-3 flex justify-center">
                      <img
                        src={aadharPreview}
                        alt="Aadhar Preview"
                        className="w-32 h-20 object-cover rounded border-2 border-sky-200 shadow-sm"
                      />
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                  <span className="text-red-500 text-xl">⚠️</span>
                  <span className="text-red-700">{error}</span>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                    submitting
                      ? "bg-sky-400 text-white cursor-not-allowed"
                      : "bg-sky-600 text-white hover:bg-sky-700 hover:shadow-lg"
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
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 rounded-lg border border-sky-300 text-sky-700 font-semibold hover:bg-sky-50 transition-all duration-200"
                >
                  Reset
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-12">
              <span className="text-6xl mb-4 block">🎉</span>
              <h4 className="text-xl font-semibold text-green-700 mb-2">
                Purchaser Added Successfully!
              </h4>
              <p className="text-green-600 mb-6">
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
