import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "./config/api";

export default function StaffCreate() {
  const [form, setForm] = useState({
    fullName: "",
    contact: "",
    email: "",
    address: "",
  });
  const [image, setImage] = useState(null);
  const [aadhar, setAadhar] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    if (!image || !aadhar) return alert("Please attach image and aadhar card.");
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const fd = new FormData();
      fd.append("fullName", form.fullName);
      fd.append("contact", form.contact);
      fd.append("email", form.email);
      fd.append("address", form.address);
      fd.append("image", image);
      fd.append("aadharCard", aadhar);

      const res = await fetch(apiUrl(`/api/staff`), {
        method: "POST",
        headers: { Authorization: token ? `Bearer ${token}` : "" },
        body: fd,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = (data && data.message) || res.statusText;
        alert(`Error: ${msg}`);
      } else {
        const id = data?.data?._id;
        alert("Staff created");
        if (id) navigate(`/staff/${id}`);
        else navigate("/staffs");
      }
    } catch (err) {
      alert(String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-start justify-center p-6 bg-slate-50">
      <div className="w-full max-w-2xl bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Create Staff</h2>
        <form onSubmit={submit} className="space-y-4">
          <input
            className="w-full p-2 border"
            placeholder="Full name"
            value={form.fullName}
            onChange={(e) =>
              setForm((f) => ({ ...f, fullName: e.target.value }))
            }
            required
          />
          <input
            className="w-full p-2 border"
            placeholder="Contact"
            value={form.contact}
            onChange={(e) =>
              setForm((f) => ({ ...f, contact: e.target.value }))
            }
            required
          />
          <input
            className="w-full p-2 border"
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
          <input
            className="w-full p-2 border"
            placeholder="Address"
            value={form.address}
            onChange={(e) =>
              setForm((f) => ({ ...f, address: e.target.value }))
            }
          />

          <div>
            <label className="block text-sm">Image (photo)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files[0])}
              required
            />
          </div>

          <div>
            <label className="block text-sm">Aadhar Card (image)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setAadhar(e.target.files[0])}
              required
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-emerald-500 text-white rounded"
            >
              {loading ? "Saving..." : "Create Staff"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
