import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // optional; fallback provided if not using react-router
import API_BASE from "./config/api";

export default function AdminCreateMedicine() {
  const [form, setForm] = useState({ name: "", company: "", stockists: [] });
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [stockistsList, setStockistsList] = useState([]);

  // try to get useNavigate if available; otherwise null
  const navigate = (() => {
    try {
      return useNavigate();
    } catch (e) {
      return null;
    }
  })();

  const setField = (path, value) => {
    setForm((f) => ({ ...f, [path]: value }));
  };

  const toggleStockist = (id) => {
    setForm((f) => ({
      ...f,
      stockists: f.stockists.includes(id)
        ? f.stockists.filter((s) => s !== id)
        : [...f.stockists, id],
    }));
  };

  const submit = async (e) => {
    e && e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/medicine/quick`, {
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
        window.alert("Success — medicine created.");
        if (navigate) navigate(-1);
        else window.history.back();
      }
    } catch (err) {
      window.alert(`Error: ${String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const cRes = await fetch(`${API_BASE}/api/company`);
        const cData = await cRes.json();
        if (cData && cData.data) setCompanies(cData.data);
      } catch (err) {
        console.warn("Could not load companies", err);
      }
      try {
        const sRes = await fetch(`${API_BASE}/api/stockist`);
        const sData = await sRes.json();
        if (sData && sData.data) setStockistsList(sData.data);
      } catch (err) {
        console.warn("Could not load stockists", err);
      }
    })();
  }, []);

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        <h1 style={styles.heading}>Create Medicine</h1>

        <form onSubmit={submit} style={{ width: "100%" }}>
          <label style={styles.label}>
            Name
            <input
              type="text"
              placeholder="Name"
              style={styles.input}
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              required
            />
          </label>

          <div style={{ marginTop: 12 }}>
            <div style={{ marginBottom: 6, fontWeight: 600 }}>
              Select Company
            </div>
            <div>
              {companies.length === 0 && (
                <div style={styles.helper}>No companies found.</div>
              )}
              {companies.map((c) => (
                <label
                  key={c._id}
                  style={{
                    ...styles.stockistRow,
                    display: "flex",
                    alignItems: "center",
                    cursor: "pointer",
                  }}
                  onClick={() => setField("company", c._id)}
                >
                  <input
                    type="radio"
                    name="company"
                    checked={form.company === c._id}
                    onChange={() => setField("company", c._id)}
                    style={{ marginRight: 12 }}
                  />
                  <span style={{ flex: 1 }}>{c.name}</span>
                  <small style={{ color: "#6B7280" }}>{c.email || ""}</small>
                </label>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={{ marginBottom: 6, fontWeight: 600 }}>
              Assign to stockists (optional)
            </div>
            <div>
              {stockistsList.length === 0 && (
                <div style={styles.helper}>No stockists found.</div>
              )}
              {stockistsList.map((s) => (
                <label
                  key={s._id}
                  style={{
                    ...styles.stockistRow,
                    display: "flex",
                    alignItems: "center",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={form.stockists.includes(s._id)}
                    onChange={() => toggleStockist(s._id)}
                    style={{ marginRight: 12 }}
                  />
                  <span style={{ flex: 1 }}>{s.name}</span>
                  <small style={{ color: "#6B7280" }}>{s.email || ""}</small>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            style={{ ...styles.button, opacity: loading ? 0.7 : 1 }}
            disabled={loading}
          >
            {loading ? "Saving..." : "Create"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    minHeight: "100vh",
    backgroundColor: "#F8FAFC",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    padding: 24,
    boxSizing: "border-box",
  },
  container: {
    maxWidth: 760,
    width: "100%",
    background: "white",
    borderRadius: 12,
    padding: 20,
    boxShadow: "0 6px 18px rgba(15, 23, 42, 0.06)",
    boxSizing: "border-box",
  },
  heading: {
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 12,
    color: "#1F2937",
  },
  label: {
    display: "block",
    marginBottom: 12,
    width: "100%",
    fontSize: 14,
  },
  input: {
    width: "100%",
    marginTop: 6,
    padding: 12,
    borderRadius: 8,
    border: "1px solid #E5E7EB",
    boxSizing: "border-box",
    background: "#ffffff",
    fontSize: 14,
  },
  helper: {
    padding: 12,
    borderRadius: 8,
    background: "#FEF3C7",
    border: "1px solid #FDE68A",
    marginBottom: 8,
  },
  stockistRow: {
    backgroundColor: "#FFFFFF",
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    border: "1px solid #E5E7EB",
  },
  button: {
    backgroundColor: "#10B981",
    color: "#FFFFFF",
    padding: "12px 18px",
    borderRadius: 8,
    border: "none",
    fontWeight: 600,
    marginTop: 14,
    cursor: "pointer",
  },
};
