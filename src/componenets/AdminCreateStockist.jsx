import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // optional
import API_BASE from "./config/api";

export default function AdminCreateStockist() {
  const [form, setForm] = useState({
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: { street: "", city: "", state: "", pincode: "" },
    licenseNumber: "",
    licenseExpiry: "",
    companies: [],
  });
  const [loading, setLoading] = useState(false);
  const [companiesList, setCompaniesList] = useState([]);

  const navigate = (() => {
    try {
      return useNavigate();
    } catch (e) {
      return null;
    }
  })();

  const setField = (path, value) => {
    if (path.startsWith("address.")) {
      const key = path.split(".")[1];
      setForm((f) => ({ ...f, address: { ...f.address, [key]: value } }));
    } else {
      setForm((f) => ({ ...f, [path]: value }));
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/company`);
        const data = await res.json().catch(() => ({}));
        if (data && data.data) setCompaniesList(data.data);
      } catch (err) {
        console.warn("Could not load companies", err);
      }
    })();
  }, []);

  const toggleCompany = (id) => {
    setForm((f) => ({
      ...f,
      companies: f.companies.includes(id)
        ? f.companies.filter((c) => c !== id)
        : [...f.companies, id],
    }));
  };

  const submit = async (e) => {
    e && e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/stockist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          (data && data.message) || JSON.stringify(data) || res.statusText;
        window.alert(`Error: ${msg}`);
      } else {
        window.alert("Success — stockist created.");
        if (navigate) navigate(-1);
        else window.history.back();
      }
    } catch (err) {
      window.alert(`Error: ${String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-start justify-center py-8 px-4">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-md p-6 sm:p-8">
        <h1 className="text-2xl font-semibold text-slate-800 mb-6">
          Create Stockist
        </h1>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Name
            </label>
            <input
              type="text"
              placeholder="Name"
              className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              required
            />
          </div>
        

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Contact Person
              </label>
              <input
                type="text"
                placeholder="Contact Person"
                className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                value={form.contactPerson}
                onChange={(e) => setField("contactPerson", e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Phone
              </label>
              <input
                type="tel"
                placeholder="Phone"
                className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email
            </label>
            <input
              type="email"
              placeholder="Email"
              className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
            />
          </div>

          <div className="pt-2">
            <h3 className="text-sm font-medium text-slate-700 mb-3">Address</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-600 mb-2">
                  Street
                </label>
                <input
                  type="text"
                  placeholder="Street"
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  value={form.address.street}
                  onChange={(e) => setField("address.street", e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-2">
                  City
                </label>
                <input
                  type="text"
                  placeholder="City"
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  value={form.address.city}
                  onChange={(e) => setField("address.city", e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-2">
                  State
                </label>
                <input
                  type="text"
                  placeholder="State"
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  value={form.address.state}
                  onChange={(e) => setField("address.state", e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-2">
                  Pincode
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Pincode"
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  value={form.address.pincode}
                  onChange={(e) => setField("address.pincode", e.target.value)}
                />
              </div>
            </div>
          </div>


          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                License Number
              </label>
              <input
                type="text"
                placeholder="License Number"
                className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                value={form.licenseNumber}
                onChange={(e) => setField("licenseNumber", e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                License Expiry
              </label>
              <input
                type="date"
                className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                value={form.licenseExpiry}
                onChange={(e) => setField("licenseExpiry", e.target.value)}
              />
            </div>
          </div>

          <div className="pt-4">
            <h3 className="text-sm font-medium text-slate-700 mb-3">
              Assign to companies (optional)
            </h3>
            <div className="mb-4">
              {companiesList.length === 0 && (
                <div className="text-sm text-slate-500">
                  No companies found.
                </div>
              )}
              {companiesList.map((c) => (
                <label key={c._id} className="flex items-center gap-3 mb-2">
                  <input
                    type="checkbox"
                    checked={form.companies.includes(c._id)}
                    onChange={() => toggleCompany(c._id)}
                  />
                  <span className="text-sm">{c.name}</span>
                  <small className="text-xs text-slate-400">
                    {c.email || ""}
                  </small>
                </label>
              ))}
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className={`w-full inline-flex items-center justify-center rounded-lg px-5 py-3 text-sm font-semibold text-white ${
                loading
                  ? "bg-emerald-300 cursor-not-allowed"
                  : "bg-emerald-500 hover:bg-emerald-600"
              }`}
              disabled={loading}
            >
              {loading ? "Saving..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
