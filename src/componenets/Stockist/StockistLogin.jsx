// // import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { postJson, fetchJson } from "../config/api";

// const PurchaserLogin = () => {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(false);
//   const navigate = useNavigate();

//   const handleSubmit = (event) => {
//     event.preventDefault();
//     if (!email || !password) {
//       setError("Email and password are required.");
//       return;
//     }

//     setError("");
//     setLoading(true);

//     postJson("/api/auth/login", { email, password })
//       .then(async (res) => {
//         // Expecting { success, token, user }
//         if (res && res.token) {
//           // Store token for subsequent requests
//           try {
//             localStorage.setItem("token", res.token);
//           } catch (e) {
//             console.warn("Failed to save token to localStorage", e);
//           }

//           // Try to fetch purchaser(s) for this user and redirect to purchaser page
//           try {
//             const purchasersResp = await fetchJson("/purchaser", {
//               method: "GET",
//               headers: { Authorization: Bearer ${res.token} },
//             });
//             if (
//               purchasersResp &&
//               purchasersResp.data &&
//               purchasersResp.data.length > 0
//             ) {
//               const purchaserId = purchasersResp.data[0]._id;
//               navigate(/purchaser/${purchaserId});
//               return;
//             }
//           } catch (e) {
//             // ignore fetch purchaser errors and fallback to purchaser login
//             console.warn(
//               "Could not fetch purchasers after login:",
//               e && e.message
//             );
//           }
//         }
//         console.log("Login successful:", res);
//         setError("");
//         // fallback navigation
//         navigate("/purchaserLogin");
//       })
//       .catch((err) => {
//         console.error("Login error:", err);
//         const msg =
//           (err && err.message) ||
//           (err && err.body && err.body.message) ||
//           "Login failed";
//         setError(msg);
//       })
//       .finally(() => setLoading(false));
//   };

//   return (
//     <div style={{ maxWidth: 400, margin: "50px auto" }}>
//       <h2>Purchaser Login</h2>
//       <form onSubmit={handleSubmit}>
//         <div style={{ marginBottom: 12 }}>
//           <label>Email:</label>
//           <input
//             type="email"
//             value={email}
//             onChange={(e) => setEmail(e.target.value)}
//             placeholder="Enter email"
//             required
//             style={{ width: "100%", padding: 8 }}
//           />
//         </div>
//         <div style={{ marginBottom: 12 }}>
//           <label>Password:</label>
//           <input
//             type="password"
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//             placeholder="Enter password"
//             required
//             style={{ width: "100%", padding: 8 }}
//           />
//         </div>
//         {error && <div style={{ color: "red", marginBottom: 12 }}>{error}</div>}
//         <button
//           type="submit"
//           disabled={loading}
//           style={{ width: "100%", padding: 10 }}
//         >
//           {loading ? "Logging in..." : "Login"}
//         </button>
//       </form>
//     </div>
//   );
// };

// export default PurchaserLogin;
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { postJson, apiUrl } from "../config/api";

const PurchaserLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await postJson("/api/auth/login", { email, password });

      if (res && res.token) {
        // Save token
        localStorage.setItem("token", res.token);

        // Fetch purchasers for this user
        const purchasersResp = await fetch(apiUrl("/api/purchaser"), {
          headers: { Authorization: `Bearer ${res.token}` },
        });
        const purchasersData = await purchasersResp.json();

        if (purchasersData?.data?.length > 0) {
          navigate(`/purchaser/${purchasersData.data[0]._id}`);
        } else {
          setError("No purchaser assigned to this account");
        }
      } else {
        setError("Login failed: invalid response");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err?.message || (err?.body?.message ? err.body.message : "Login failed")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "50px auto" }}>
      <h2>Purchaser Login</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", padding: 8, marginBottom: 12 }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", padding: 8, marginBottom: 12 }}
        />
        {error && <div style={{ color: "red", marginBottom: 12 }}>{error}</div>}
        <button
          type="submit"
          disabled={loading}
          style={{ width: "100%", padding: 10 }}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
};

export default PurchaserLogin;
