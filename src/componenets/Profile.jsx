import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE, { apiUrl } from "./config/api";
import { getCookie, removeCookie } from "./utils/cookies";
import { Shield } from "lucide-react";

const Profile = () => {
  const storedUser = (() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  })();

  const [user, setUser] = useState(storedUser || null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Load/refresh real user data when a token exists
    let mounted = true;
    (async () => {
      try {
        const tokenAtRequest = getCookie("token");
        // If there's no token and no stored user, force the user to login
        if (!tokenAtRequest) {
          if (!storedUser) {
            navigate("/login");
            return;
          }
          // otherwise rely on storedUser already set in state
          return;
        }

        setLoading(true);
        const res = await fetch(apiUrl("/api/auth/me"), {
          headers: { Authorization: `Bearer ${tokenAtRequest}` },
        });
        const json = await res.json().catch(() => ({}));
        if (!mounted) return;
        if (res.ok && json && json.success && json.user) {
          setUser(json.user);
          try {
            // Only persist the fetched user if the token used to fetch
            // matches the current stored token. This avoids overwriting the
            // freshly-logged-in user when a background /me call was made with
            // an older token.
            const currentToken = getCookie("token");
            if (currentToken && tokenAtRequest === currentToken) {
              localStorage.setItem("user", JSON.stringify(json.user));
            } else {
              console.debug(
                "Profile: skipped writing user because token changed",
                {
                  tokenAtRequest:
                    tokenAtRequest && tokenAtRequest.slice(0, 12) + "...",
                  currentToken:
                    currentToken && currentToken.slice(0, 12) + "...",
                }
              );
            }
          } catch (e) {}
        } else {
          // If server returned an error, fall back to stored value
          if (json && json.message) setError(json.message);
        }
      } catch (err) {
        console.warn("Profile: failed to load current user", err);
        setError("Failed to load profile");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleLogout = () => {
    // Clear stored auth and redirect to login
    try {
      removeCookie("token");
      localStorage.removeItem("user");
    } catch (e) {
      // ignore
    }
    navigate("/login");
  };

  // Icon Components
  const User = (props) => (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.5}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  );

  const Building2 = (props) => (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.5}
        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m11 0v-4a2 2 0 00-2-2h-2a2 2 0 00-2 2v4m6 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v12"
      />
    </svg>
  );

  const Mail = (props) => (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.5}
        d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  );

  const Phone = (props) => (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.5}
        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
      />
    </svg>
  );

  const MapPin = (props) => (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.5}
        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.5}
        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );

  const FileText = (props) => (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.5}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );

  const ImageIcon = (props) => (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.5}
        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );

  const LogOut = (props) => (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.5}
        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
      />
    </svg>
  );

  const Pill = ({ imageUrl }) => {
    const initials = (() => {
      const name = user && (user.ownerName || user.medicalName || "");
      if (!name) return "U";
      return name
        .split(" ")
        .map((s) => s[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
    })();

    return (
      <div className="relative">
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg overflow-hidden bg-white">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt="profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-cyan-400 to-cyan-500 flex items-center justify-center text-white text-xl font-bold">
              {initials}
            </div>
          )}
        </div>
        <div className="absolute -top-1 -right-1 w-6 h-6 bg-orange-400 rounded-full"></div>
        <div className="absolute -bottom-1 -left-1 w-5 h-5 bg-orange-300 rounded-full"></div>
      </div>
    );
  };

  // Normalize image URLs coming from backend or user object
  const normalizeImageUrl = (url) => {
    if (!url || typeof url !== "string") return null;
    // protocol-relative URLs
    if (url.startsWith("//")) return `https:${url}`;
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    // relative paths: prefix with API base
    return apiUrl(url.startsWith("/") ? url : `/${url}`);
  };

  const [licenseImageBroken, setLicenseImageBroken] = useState(false);

  // Map the exact signup fields you provided to display variables
  const profileImg = normalizeImageUrl(
    user?.profileImageUrl || user?.profileImage || user?.profileImageUrl || user?.photo || (user && user.logo && user.logo.url) || null
  );
  const storeName = user?.name || user?.medicalName || "";
  const ownerName = user?.contactPerson || user?.ownerName || "";
  const emailAddr = user?.email || "";
  const phone = user?.phone || user?.contactNo || user?.cntxNumber || "";
  const addressFormatted =
    typeof user?.address === "object" && user.address !== null
      ? [user.address.street, user.address.city, user.address.state, user.address.pincode].filter(Boolean).join(", ")
      : user?.address || "";
  const licenseNo = user?.licenseNumber || user?.drugLicenseNo || user?.druglicenseNo || null;
  const licenseImg = normalizeImageUrl(user?.licenseImageUrl || user?.drugLicenseImage || user?.licenseImage || null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            {/* compute profile image from common fields used across models */}
            <Pill
              imageUrl={profileImg}
            />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent mb-2">
            Your Profile
          </h1>
          <p className="text-gray-600 font-medium">
            Manage your medical store information
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-3xl shadow-xl p-8 text-center border-2 border-gray-100 mb-6">
            <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-gray-600 text-lg font-medium">
              Loading your profile...
            </p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 text-red-700 px-6 py-4 rounded-2xl border-2 border-red-200 mb-6 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-red-600 text-lg">⚠</span>
              </div>
              <div>
                <h3 className="font-semibold">Error Loading Profile</h3>
                <p>{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Profile Content */}
        {!loading && !user && (
          <div className="bg-white rounded-3xl shadow-xl p-8 text-center border-2 border-gray-100 mb-6">
            <p className="text-gray-700">You are not logged in. Please <button onClick={() => navigate('/login')} className="text-cyan-600 underline">sign in</button> to view your profile.</p>
          </div>
        )}

        {user && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Personal Information */}
            <div className="lg:col-span-2 space-y-6">
              {/* Store Information Card */}
              <div className="bg-white rounded-3xl shadow-xl p-6 border-2 border-gray-100">
                <h2 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-2">
                  <Building2 className="w-6 h-6 text-cyan-500" />
                  Store Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 p-5 rounded-2xl border-2 border-cyan-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="w-5 h-5 text-cyan-600" />
                      <span className="text-gray-600 text-sm font-semibold">
                        Medical Store Name
                      </span>
                    </div>
                    <p className="text-gray-900 font-bold text-lg">
                      {storeName}
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-5 rounded-2xl border-2 border-orange-200">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-5 h-5 text-orange-600" />
                      <span className="text-gray-600 text-sm font-semibold">
                        Owner Name
                      </span>
                    </div>
                    <p className="text-gray-900 font-bold text-lg">
                      {ownerName}
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-5 rounded-2xl border-2 border-purple-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Mail className="w-5 h-5 text-purple-600" />
                      <span className="text-gray-600 text-sm font-semibold">
                        Email Address
                      </span>
                    </div>
                    <p className="text-gray-900 font-bold break-all">
                      {emailAddr}
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-2xl border-2 border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Phone className="w-5 h-5 text-green-600" />
                      <span className="text-gray-600 text-sm font-semibold">
                        Contact Number
                      </span>
                    </div>
                    <p className="text-gray-900 font-bold">{phone}</p>
                  </div>
                </div>
              </div>

              {/* Address and License Card */}
              <div className="bg-white rounded-3xl shadow-xl p-6 border-2 border-gray-100">
                <h2 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-2">
                  <MapPin className="w-6 h-6 text-cyan-500" />
                  Location & License
                </h2>
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-2xl border-2 border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-5 h-5 text-blue-600" />
                      <span className="text-gray-600 text-sm font-semibold">
                        Store Address
                      </span>
                    </div>
                    <p className="text-gray-900 font-bold">{addressFormatted}</p>
                  </div>

                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-5 rounded-2xl border-2 border-amber-200">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-5 h-5 text-amber-600" />
                      <span className="text-gray-600 text-sm font-semibold">Drug License Number</span>
                    </div>
                    <p className="text-gray-900 font-bold text-lg font-mono">{licenseNo || <span className="text-gray-400">Not provided</span>}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Drug License Image & Actions */}
            <div className="space-y-6">
              {/* Drug License Image Card */}
              <div className="bg-white rounded-3xl shadow-xl p-6 border-2 border-gray-100">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <ImageIcon className="w-6 h-6 text-cyan-500" />
                  Drug License
                </h2>
                <div className="border-3 border-dashed border-gray-200 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
                  {licenseImg ? (
                    <img
                      src={licenseImg}
                      alt="Drug License"
                      className="w-full h-64 object-contain bg-white"
                    />
                  ) : (
                    <div className="h-64 flex flex-col items-center justify-center text-gray-400">
                      <ImageIcon className="w-16 h-16 mb-3 text-gray-300" />
                      <p className="text-center font-semibold text-gray-500">No image uploaded</p>
                      <p className="text-sm text-gray-400 mt-1">Upload your drug license</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions Card */}
              <div className="bg-white rounded-3xl shadow-xl p-6 border-2 border-gray-100">
                <h2 className="text-lg font-bold text-gray-800 mb-4">
                  Quick Actions
                </h2>
                <div className="space-y-3">
                  {/* Edit profile action removed per request */}

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-red-600 text-white px-5 py-3 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
