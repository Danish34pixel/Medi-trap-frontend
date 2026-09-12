import React, { useState } from "react";
import {
  UserPlus,
  User,
  Phone,
  Mail,
  MapPin,
  Camera,
  FileText,
  ArrowRight,
  ArrowLeft,
  Building2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "../config/api";
import { getCookie } from "../utils/cookies";
import Input from "../ui/Input";

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
  // became true once we've attempted to resolve profile from backend
  const [attemptedProfile, setAttemptedProfile] = useState(false);
  const [debugInfo, setDebugInfo] = useState({});
  const [image, setImage] = useState(null);
  const [aadhar, setAadhar] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [aadharPreview, setAadharPreview] = useState(null);
  const [stockistsList, setStockistsList] = useState([]);
  const [selectedStockist, setSelectedStockist] = useState("");
  const [loading, setLoading] = useState(false);
  const [contactError, setContactError] = useState("");
  const [emailError, setEmailError] = useState("");
  const navigate = useNavigate();

  React.useEffect(() => {
    // On mount: if a token exists, always resolve the current profile from backend
    // to get authoritative role information. This prevents stale/partial localStorage
    // user objects from causing incorrect 'Unauthorized' UI.
    (async () => {
      try {
        const token = getCookie("token") || localStorage.getItem("token");
        if (!token) return;

        setProfileLoading(true);
        const res = await fetch(apiUrl("/api/auth/me"), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const j = await res.json().catch(() => ({}));

        // store debug info for development troubleshooting
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
          } catch (e) {
            // ignore
          }
          setUser(j.user);

          // If the returned user is admin, load stockists for selection
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
          // if profile endpoint failed, remove any stale local user so UI shows login
          try {
            localStorage.removeItem("user");
          } catch (e) {}
        }

        // mark that we attempted profile resolution (success or failure)
        setAttemptedProfile(true);
        setProfileLoading(false);
      } catch (e) {
        console.error("Failed to load profile on mount", e);
        setAttemptedProfile(true);
        setProfileLoading(false);
      }
    })();
  }, []);

  const onPickImage = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setImage(file);
    try {
      setImagePreview(URL.createObjectURL(file));
    } catch (err) {
      setImagePreview(null);
    }
  };

  const onPickAadhar = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setAadhar(file);
    try {
      setAadharPreview(URL.createObjectURL(file));
    } catch (err) {
      setAadharPreview(null);
    }
  };

  const CONTACT_REGEX = /^\d{10}$/;
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const submit = async (e) => {
    e.preventDefault();
    if (!image || !aadhar) return alert("Please attach image and aadhar card.");

    const isContactValid = CONTACT_REGEX.test(form.contact);
    setContactError(isContactValid ? "" : "Enter a valid 10-digit phone number");

    const isEmailValid = !form.email || EMAIL_REGEX.test(form.email);
    setEmailError(isEmailValid ? "" : "Enter a valid email address");

    if (!isContactValid || !isEmailValid) return;

    setLoading(true);
    try {
      const token = getCookie("token");
      const fd = new FormData();
      fd.append("fullName", form.fullName);
      fd.append("contact", form.contact);
      fd.append("email", form.email);
      fd.append("address", form.address);
      // if admin creating for a specific stockist, include it
      if (user && user.role === "admin" && selectedStockist) {
        fd.append("stockist", selectedStockist);
      }
      fd.append("image", image);
      fd.append("aadharCard", aadhar);

      // POST form to backend
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

  // compute auth signals once so JSX can use a single `isAuthorized` flag
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
  // check several common shapes for the role in the /api/auth/me response
  const meRole =
    (meBody && meBody.user && meBody.user.role) ||
    (meBody && meBody.user && meBody.user.roleType) ||
    (meBody && meBody.user && meBody.user.role_type) ||
    (meBody && meBody.role) ||
    (meBody && meBody.data && meBody.data.user && meBody.data.user.role) ||
    null;
  const hasToken = Boolean(getCookie("token") || localStorage.getItem("token"));
  // normalize role strings (handle values like 'Proprietor')
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

  const verifyingCard = (
    <div className="w-full max-w-2xl bg-white p-8 rounded-4xl shadow-card-lg border border-slate-100 text-center">
      <div className="w-10 h-10 mx-auto mb-4 animate-spin rounded-full border-4 border-purple-200 border-t-role-staff" />
      <div className="text-slate-500 font-medium">Verifying session...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-100 flex flex-col">
      <button
        onClick={() => navigate(-1)}
        className="m-4 w-12 h-12 rounded-full bg-white shadow-card flex items-center justify-center text-slate-800 hover:bg-slate-50 transition-colors"
        aria-label="Go back"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      <div className="flex-1 flex items-start justify-center px-6 pb-10">
        {profileLoading ? (
          verifyingCard
        ) : !attemptedProfile && !localUser && hasToken ? (
          // If we haven't yet attempted profile resolution and no local user exists,
          // show the same verifying UI so we don't flash Unauthorized.
          verifyingCard
        ) : !isAuthorized ? (
          <div className="w-full max-w-2xl bg-white p-8 rounded-4xl shadow-card-lg border border-slate-100 text-center">
            <h2 className="text-xl font-semibold mb-4 text-slate-800">
              Unauthorized
            </h2>
            <p className="text-slate-500 mb-6">
              Only stockists or admins can add staff members.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => (window.location.href = "/stockist-login")}
                className="px-4 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-role-staff-from to-role-staff-to hover:brightness-105 transition"
              >
                Go to Login
              </button>
              <button
                onClick={() => window.history.back()}
                className="px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-2xl lg:max-w-4xl">
            <div className="bg-white rounded-4xl shadow-card-lg p-6 sm:p-8 lg:p-12">
              <div className="text-center mb-8 lg:mb-10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-role-staff-from to-role-staff-to flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-200">
                  <UserPlus className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl sm:text-[28px] lg:text-3xl font-extrabold text-slate-800">
                  Add Team Member
                </h1>
                <p className="text-sm text-slate-500 mt-2 px-4">
                  Add a new team member and assign them to a stockist.
                </p>
              </div>

              <form onSubmit={submit} className="space-y-5 lg:space-y-6">
                {user && user.role === "admin" && (
                  <div className="w-full">
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Assign to Stockist
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                      <select
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-role-staff transition-colors"
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
                  </div>
                )}

                {/* --- Form Fields Grid (2-column on desktop) --- */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6">
                  <Input
                    label="Full Name"
                    icon={User}
                    placeholder="Enter full name"
                    value={form.fullName}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, fullName: e.target.value }))
                    }
                    required
                  />

                  <Input
                    label="Contact Number"
                    icon={Phone}
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="Enter 10-digit phone number"
                    value={form.contact}
                    error={contactError}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                      setForm((f) => ({ ...f, contact: digits }));
                      if (contactError) setContactError("");
                    }}
                    required
                  />

                  <Input
                    label="Email Address"
                    icon={Mail}
                    type="email"
                    placeholder="Enter email address"
                    value={form.email}
                    error={emailError}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, email: e.target.value }));
                      if (emailError) setEmailError("");
                    }}
                  />

                  <Input
                    label="Address"
                    icon={MapPin}
                    placeholder="Enter full address"
                    value={form.address}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, address: e.target.value }))
                    }
                  />
                </div>

                {/* --- File Uploads --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 pt-2">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Profile Photo
                    </label>
                    <label className="relative flex flex-col items-center justify-center h-28 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 hover:border-role-staff hover:bg-purple-50/40 transition-colors cursor-pointer overflow-hidden">
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="Profile preview"
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : (
                        <>
                          <Camera className="w-6 h-6 text-slate-400 mb-1" />
                          <span className="text-xs font-semibold text-slate-400">
                            Upload
                          </span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={onPickImage}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Aadhar Card
                    </label>
                    <label className="relative flex flex-col items-center justify-center h-28 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 hover:border-role-staff hover:bg-purple-50/40 transition-colors cursor-pointer overflow-hidden">
                      {aadharPreview ? (
                        <img
                          src={aadharPreview}
                          alt="Aadhar preview"
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : (
                        <>
                          <FileText className="w-6 h-6 text-slate-400 mb-1" />
                          <span className="text-xs font-semibold text-slate-400">
                            Upload
                          </span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={onPickAadhar}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* --- Submit Button --- */}
                <div className="pt-4 lg:pt-6">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 rounded-2xl font-bold text-white shadow-lg shadow-purple-200 bg-gradient-to-r from-role-staff-from to-role-staff-to hover:brightness-105 transition disabled:opacity-60 flex items-center justify-center text-lg"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Creating Staff...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        Create Staff Member
                        <ArrowRight className="w-5 h-5" />
                      </span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
