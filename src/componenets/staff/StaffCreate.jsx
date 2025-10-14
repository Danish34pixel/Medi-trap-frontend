import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "../config/api";
import { getCookie } from "../utils/cookies";
import Logo from "../Logo";

export default function StaffCreate() {
  const [form, setForm] = useState({
    fullName: "",
    contact: "",
    email: "",
    address: "",
  });
  const [user, setUser] = useState(() => {
    try {
      const u = localStorage.getItem("user");
      return u ? JSON.parse(u) : null;
    } catch (e) {
      return null;
    }
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [attemptedProfile, setAttemptedProfile] = useState(false);
  const [debugInfo, setDebugInfo] = useState({});
  const [image, setImage] = useState(null);
  const [aadhar, setAadhar] = useState(null);
  const [stockistsList, setStockistsList] = useState([]);
  const [selectedStockist, setSelectedStockist] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    (async () => {
      try {
        const token = getCookie("token") || localStorage.getItem("token");
        if (!token) return;

        setProfileLoading(true);
        const res = await fetch(apiUrl("/api/auth/me"), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const j = await res.json().catch(() => ({}));

        try {
          setDebugInfo({
            tokenResolved: token,
            meStatus: res.status,
            meBody: j,
            localUser: (() => {
              try {
                return JSON.parse(localStorage.getItem("user"));
              } catch (e) {
                return null;
              }
            })(),
          });
        } catch (e) {}

        if (res.ok && j && j.user) {
          try {
            localStorage.setItem("user", JSON.stringify(j.user));
          } catch (e) {}
          setUser(j.user);

          if (j.user.role === "admin") {
            try {
              const sres = await fetch(apiUrl("/api/stockist"));
              const sj = await sres.json().catch(() => ({}));
              const list = (sj && sj.data) || [];
              if (sres.ok && Array.isArray(list)) setStockistsList(list);
            } catch (e) {
              console.error("Failed to load stockists", e);
            }
          }
        } else {
          try {
            localStorage.removeItem("user");
          } catch (e) {}
        }

        setAttemptedProfile(true);
        setProfileLoading(false);
      } catch (e) {
        console.error("Failed to load profile on mount", e);
        setAttemptedProfile(true);
        setProfileLoading(false);
      }
    })();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!image || !aadhar) return alert("Please attach image and aadhar card.");
    setLoading(true);
    try {
      const token = getCookie("token");
      const fd = new FormData();
      fd.append("fullName", form.fullName);
      fd.append("contact", form.contact);
      fd.append("email", form.email);
      fd.append("address", form.address);
      if (user && user.role === "admin" && selectedStockist) {
        fd.append("stockist", selectedStockist);
      }
      fd.append("image", image);
      fd.append("aadharCard", aadhar);

      const res = await fetch(apiUrl("/api/staff"), {
        method: "POST",
        body: fd,
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          (data && data.message) || JSON.stringify(data) || res.statusText;
        throw new Error(msg);
      }
      alert("Staff created successfully!");
      navigate(-1);
    } catch (err) {
      alert(String(err));
    } finally {
      setLoading(false);
    }
  };

  const localUser =
    user ||
    debugInfo.localUser ||
    (function () {
      try {
        return JSON.parse(localStorage.getItem("user"));
      } catch (e) {
        return null;
      }
    })();
  const meBody = (debugInfo && debugInfo.meBody) || null;
  const meRole =
    (meBody && meBody.user && meBody.user.role) ||
    (meBody && meBody.user && meBody.user.roleType) ||
    (meBody && meBody.user && meBody.user.role_type) ||
    (meBody && meBody.role) ||
    (meBody && meBody.data && meBody.data.user && meBody.data.user.role) ||
    null;
  const hasToken = Boolean(getCookie("token") || localStorage.getItem("token"));
  const normalizedMeRole = meRole ? String(meRole).toLowerCase() : null;
  const normalizedLocalRole =
    localUser && localUser.role ? String(localUser.role).toLowerCase() : null;
  const isMeStockist =
    normalizedMeRole &&
    (normalizedMeRole === "stockist" ||
      normalizedMeRole === "admin" ||
      normalizedMeRole === "proprietor" ||
      normalizedMeRole.includes("propriet"));
  const isLocalStockist =
    normalizedLocalRole &&
    (normalizedLocalRole === "stockist" || normalizedLocalRole === "admin");
  const isAuthorized = Boolean(isLocalStockist || isMeStockist);

  if (typeof window !== "undefined")
    window.__staffAuthDebug = {
      localUser,
      meBody,
      meRole,
      hasToken,
      isAuthorized,
      attemptedProfile,
    };

  return (
    <div
      className="min-h-screen flex items-start justify-center p-6"
      style={{ backgroundColor: "#f8fafc" }}
    >
      {profileLoading ? (
        <div className="w-full max-w-2xl bg-white p-8 rounded-2xl shadow-lg border border-gray-100 text-center">
          <div className="w-10 h-10 mx-auto mb-4 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
          <div className="text-gray-600">Verifying session...</div>
        </div>
      ) : !attemptedProfile && !localUser && hasToken ? (
        <div className="w-full max-w-2xl bg-white p-8 rounded-2xl shadow-lg border border-gray-100 text-center">
          <div className="w-10 h-10 mx-auto mb-4 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
          <div className="text-gray-600">Verifying session...</div>
        </div>
      ) : !isAuthorized ? (
        <div className="w-full max-w-2xl bg-white p-8 rounded-2xl shadow-lg border border-gray-100 text-center">
          <h2 className="text-xl font-semibold mb-4">Unauthorized</h2>
          <p className="text-gray-600 mb-6">
            Only stockists or admins can add staff members.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => (window.location.href = "/stockist-login")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg"
            >
              Go to Login
            </button>
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 border border-gray-200 rounded-lg"
            >
              Go Back
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-2xl bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
          <div className="text-center mb-8">
            <Logo className="w-28 h-20 text-white" />
            <h2 className="text-2xl font-semibold text-gray-800">
              Create Staff
            </h2>
            <p className="text-gray-500 mt-1">
              Add new team member information
            </p>
          </div>

          <div className="space-y-6">
            {user && user.role === "admin" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign to Stockist
                </label>
                <select
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                  value={selectedStockist}
                  onChange={(e) => setSelectedStockist(e.target.value)}
                >
                  <option value="">-- Select stockist (optional) --</option>
                  {stockistsList.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name || s.title || s.companyName || s.email}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter full name"
                value={form.fullName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, fullName: e.target.value }))
                }
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Number
              </label>
              <input
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter contact number"
                value={form.contact}
                onChange={(e) =>
                  setForm((f) => ({ ...f, contact: e.target.value }))
                }
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter email address"
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <input
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter address"
                value={form.address}
                onChange={(e) =>
                  setForm((f) => ({ ...f, address: e.target.value }))
                }
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Photo
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
                    accept="image/*"
                    onChange={(e) => setImage(e.target.files[0])}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Upload profile photo
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Aadhar Card
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
                    accept="image/*"
                    onChange={(e) => setAadhar(e.target.files[0])}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Upload Aadhar card image
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                onClick={submit}
                disabled={loading}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-semibold py-4 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Creating Staff...
                  </>
                ) : (
                  "Create Staff Member"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
