import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // optional; fallback provided if you don't use react-router
import API_BASE from "./config/api";

export default function AdminCreateCompany() {
  const [form, setForm] = useState({ name: "", stockists: [] });
  const [loading, setLoading] = useState(false);
  const [stockistsList, setStockistsList] = useState([]);
  const navigate = (() => {
    try {
      return useNavigate();
    } catch (e) {
      return null;
    }
  })();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/stockist`);
        const data = await res.json();
        if (data && data.data) setStockistsList(data.data);
      } catch (err) {
        // console.warn moved to console
        console.warn("Could not load stockists", err);
      }
    })();
  }, []);

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
      const res = await fetch(`${API_BASE}/api/company`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        // Show useful error
        const msg =
          (data && data.message) || JSON.stringify(data) || res.statusText;
        window.alert(`Error: ${msg}`);
      } else {
        window.alert("Success — company created.");
        // navigate back if react-router present, otherwise history.back()
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
    <div style={styles.wrapper}>
      <div style={styles.container}>
        <h1 style={styles.heading}>Create Company</h1>

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
              Assign to stockists (optional)
            </div>
            <div>
              {stockistsList.length === 0 && (
                <div style={styles.helper}>No stockists found.</div>
              )}
              {stockistsList.map((s) => (
                <label key={s._id} style={styles.stockistRow}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      width: "100%",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={form.stockists.includes(s._id)}
                      onChange={() => toggleStockist(s._id)}
                    />
                    <span style={{ flex: 1 }}>{s.name}</span>
                    <small style={{ color: "#6B7280" }}>{s.email || ""}</small>
                  </div>
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
    display: "block",
    backgroundColor: "#FFFFFF",
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    border: "1px solid #E5E7EB",
    cursor: "pointer",
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
