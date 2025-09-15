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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
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
      setForm({
        fullName: "",
        address: "",
        contactNo: "",
        aadharImage: null,
        photo: null,
      });
      setAadharPreview(null);
      setPhotoPreview(null);
      setFormVisible(false);
      fetchPurchasers();
      setError(null);
    } catch (err) {
      setError("Failed to add purchaser");
    }
    setSubmitting(false);
  };

  return (
    <div className="bg-sky-50 min-h-screen py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow p-6 border border-sky-100 mb-8">
          <h2 className="text-2xl font-bold text-sky-700 mb-2 flex items-center gap-2">
            <span>🧑‍💼</span> Purchasers
          </h2>
          {loading ? (
            <div className="text-sky-600 py-4">Loading...</div>
          ) : error ? (
            <div className="text-red-600 py-4">{error}</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              {purchasers.map((p) => (
                <div
                  key={p._id}
                  className="bg-white border border-sky-200 rounded-xl p-6 shadow-md flex flex-col gap-3 items-center relative"
                  style={{ minHeight: 340 }}
                >
                  <div className="absolute top-3 right-3">
                    <QRCodeCanvas
                      value={window.location.origin + `/purchaser/${p._id}`}
                      size={128}
                      bgColor="#fff"
                      fgColor="#0ea5e9"
                    />
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-sky-300 bg-sky-50 flex items-center justify-center">
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
                    <div className="text-lg font-bold text-sky-700">
                      {p.fullName}
                    </div>
                    <div className="text-slate-600 text-sm text-center">
                      {p.address}
                    </div>
                    <div className="text-slate-700 font-medium">
                      {p.contactNo}
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-slate-400">ID: {p._id}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="bg-white rounded-2xl shadow p-6 border border-sky-100">
          <h3 className="text-xl font-bold text-sky-700 mb-4 flex items-center gap-2">
            <span>➕</span> Add Purchaser
          </h3>
          {formVisible ? (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="fullName"
                  className="text-slate-700 font-medium"
                >
                  Full Name
                </label>
                <input
                  type="text"
                  name="fullName"
                  id="fullName"
                  placeholder="Full Name"
                  value={form.fullName}
                  onChange={handleChange}
                  required
                  className="px-4 py-2 rounded-lg border border-sky-200 bg-sky-50 focus:outline-none focus:ring-2 focus:ring-sky-300"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="address" className="text-slate-700 font-medium">
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  id="address"
                  placeholder="Address"
                  value={form.address}
                  onChange={handleChange}
                  required
                  className="px-4 py-2 rounded-lg border border-sky-200 bg-sky-50 focus:outline-none focus:ring-2 focus:ring-sky-300"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="contactNo"
                  className="text-slate-700 font-medium"
                >
                  Contact Number
                </label>
                <input
                  type="text"
                  name="contactNo"
                  id="contactNo"
                  placeholder="Contact Number"
                  value={form.contactNo}
                  onChange={handleChange}
                  required
                  className="px-4 py-2 rounded-lg border border-sky-200 bg-sky-50 focus:outline-none focus:ring-2 focus:ring-sky-300"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="photo" className="text-slate-700 font-medium">
                  Purchaser Photo
                </label>
                <input
                  type="file"
                  name="photo"
                  id="photo"
                  accept="image/*"
                  onChange={handleChange}
                  required
                  className="px-4 py-2 rounded-lg border border-sky-200 bg-sky-50 focus:outline-none focus:ring-2 focus:ring-sky-300"
                />
                {photoPreview && (
                  <img
                    src={photoPreview}
                    alt="Photo Preview"
                    className="mt-2 w-20 h-20 object-cover rounded-full border border-sky-200"
                  />
                )}
              </div>
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="aadharImage"
                  className="text-slate-700 font-medium"
                >
                  Aadhar Image
                </label>
                <input
                  type="file"
                  name="aadharImage"
                  id="aadharImage"
                  accept="image/*"
                  onChange={handleChange}
                  required
                  className="px-4 py-2 rounded-lg border border-sky-200 bg-sky-50 focus:outline-none focus:ring-2 focus:ring-sky-300"
                />
                {aadharPreview && (
                  <img
                    src={aadharPreview}
                    alt="Aadhar Preview"
                    className="mt-2 w-32 h-20 object-cover rounded border border-sky-200"
                  />
                )}
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="mt-2 px-6 py-2 rounded-lg bg-sky-600 text-white font-semibold hover:bg-sky-700 transition"
              >
                {submitting ? "Adding..." : "Add Purchaser"}
              </button>
              {error && <div className="text-red-600 mt-2">{error}</div>}
            </form>
          ) : (
            <div className="text-green-700 font-semibold">
              Purchaser added successfully!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Purchaser;
