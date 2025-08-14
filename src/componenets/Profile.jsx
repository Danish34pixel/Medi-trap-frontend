import React, { useEffect, useState } from "react";
import {
  User,
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  Image as ImageIcon,
  LogOut,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:5000";

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadMe = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to load profile");
        if (data.success && data.user) {
          setUser(data.user);
          localStorage.setItem("user", JSON.stringify(data.user));
        } else {
          throw new Error("Invalid response format");
        }
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    // If we don't have full user (e.g., after refresh), fetch it
    if (!user) loadMe();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  if (!localStorage.getItem("token")) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-blue-50 via-white to-green-50">
        <div className="bg-white/80 backdrop-blur-sm text-yellow-800 px-8 py-6 rounded-2xl border border-yellow-200 shadow-xl max-w-md text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User size={32} className="text-yellow-600" />
          </div>
          <h2 className="text-xl font-semibold mb-2">
            Authentication Required
          </h2>
          <p className="text-yellow-700 mb-4">
            Please log in to view your profile.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2 rounded-xl font-medium hover:shadow-lg transition-all duration-200 transform hover:scale-105"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <User size={48} className="text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Your Profile
          </h1>
          <p className="text-gray-600">Manage your medical store information</p>
        </div>

        {/* Loading and Error States */}
        {loading && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 text-center border border-gray-100 mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-gray-600 text-lg">Loading your profile...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50/80 backdrop-blur-sm text-red-700 px-6 py-4 rounded-2xl border border-red-200 mb-6 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 text-lg">⚠️</span>
              </div>
              <div>
                <h3 className="font-semibold">Error Loading Profile</h3>
                <p>{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Profile Content */}
        {user && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Personal Information */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Details Card */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Building2 size={24} className="text-blue-600" />
                  Store Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
                      <div className="flex items-center gap-3 mb-2">
                        <Building2 size={20} className="text-blue-600" />
                        <span className="text-gray-500 text-sm font-medium">
                          Medical Store Name
                        </span>
                      </div>
                      <p className="text-gray-900 font-semibold text-lg">
                        {user.medicalName}
                      </p>
                    </div>

                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100">
                      <div className="flex items-center gap-3 mb-2">
                        <User size={20} className="text-green-600" />
                        <span className="text-gray-500 text-sm font-medium">
                          Owner Name
                        </span>
                      </div>
                      <p className="text-gray-900 font-semibold text-lg">
                        {user.ownerName}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-100">
                      <div className="flex items-center gap-3 mb-2">
                        <Mail size={20} className="text-purple-600" />
                        <span className="text-gray-500 text-sm font-medium">
                          Email Address
                        </span>
                      </div>
                      <p className="text-gray-900 font-semibold break-all">
                        {user.email}
                      </p>
                    </div>

                    <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-xl border border-orange-100">
                      <div className="flex items-center gap-3 mb-2">
                        <Phone size={20} className="text-orange-600" />
                        <span className="text-gray-500 text-sm font-medium">
                          Contact Number
                        </span>
                      </div>
                      <p className="text-gray-900 font-semibold">
                        {user.contactNo}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Address and License Card */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <MapPin size={24} className="text-green-600" />
                  Location & License
                </h2>
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100">
                    <div className="flex items-center gap-3 mb-2">
                      <MapPin size={20} className="text-green-600" />
                      <span className="text-gray-500 text-sm font-medium">
                        Store Address
                      </span>
                    </div>
                    <p className="text-gray-900 font-semibold">
                      {user.address}
                    </p>
                  </div>

                  <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-xl border border-indigo-100">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText size={20} className="text-indigo-600" />
                      <span className="text-gray-500 text-sm font-medium">
                        Drug License Number
                      </span>
                    </div>
                    <p className="text-gray-900 font-semibold text-lg font-mono">
                      {user.drugLicenseNo}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Drug License Image */}
            <div className="space-y-6">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <ImageIcon size={24} className="text-purple-600" />
                  Drug License Image
                </h2>
                <div className="border-2 border-dashed border-purple-200 rounded-xl overflow-hidden bg-gradient-to-br from-purple-50 to-pink-50">
                  {user.drugLicenseImage ? (
                    <img
                      src={
                        user.drugLicenseImage.startsWith("http")
                          ? user.drugLicenseImage
                          : `${API_BASE}${user.drugLicenseImage}`
                      }
                      alt="Drug License"
                      className="w-full h-80 object-contain bg-white"
                    />
                  ) : (
                    <div className="h-80 flex flex-col items-center justify-center text-gray-400">
                      <ImageIcon size={48} className="mb-2 text-gray-300" />
                      <p className="text-center">No image uploaded</p>
                      <p className="text-sm text-gray-300">
                        Upload your drug license
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Logout Button */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95"
                >
                  <LogOut size={20} />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
