import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Logo = ({ className = "" }) => (
  <div className={`${className} rounded-lg flex items-center justify-center`}>
    <span className="text-white font-bold text-xl">
      <img src="/final-logo.png" alt="MedTrap" />
      <img src="/logo.png" alt="MedTrap small" />
    </span>
  </div>
);

export default function SelectRolePage() {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [lastPointerType, setLastPointerType] = useState(null);
  const clearSelectionTimeout = React.useRef(null);
  // Remove isMobile if not used

  const roles = [
    {
      id: "Stockist",
      name: "Stockist",
      icon: "/stockist-logo.jpg",
      gradient: "from-emerald-400 to-teal-500",
      bgGlow: "bg-emerald-500/10",
      description: "Manage inventory",
      color: "emerald",
    },
    {
      id: "Purchaser",
      name: "Purchaser",
      icon: "/purchaser-logo.jpg",
      gradient: "from-blue-400 to-indigo-500",
      bgGlow: "bg-blue-500/10",
      description: "Handle procurement",
      color: "blue",
    },
    {
      id: "Medical Owner",
      name: "Medical Owner",
      icon: "/medical-owner.jpg",
      gradient: "from-orange-400 to-red-500",
      bgGlow: "bg-orange-500/10",
      description: "Clinic management",
      color: "orange",
    },
  ];

  const handleRoleSelect = (roleId) => {
    localStorage.setItem("selectedRole", roleId);
    if (roleId === "Purchaser") {
      navigate("/purchaser-signup");
    } else if (roleId === "Stockist") {
      // Open stockist login by default for stockist role
      navigate("/stockist-login");
    } else if (roleId === "Medical Owner") {
      // show sign-in page first for Medical Owner
      navigate("/login");
    } else if (roleId === "Staff") {
      navigate("/staffs");
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Enhanced Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-blue-400/15 to-purple-400/15 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-r from-emerald-400/10 to-teal-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-indigo-400/8 to-purple-400/8 rounded-full blur-3xl animate-pulse delay-2000"></div>

        {/* Floating particles */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400/30 rounded-full animate-bounce delay-300"></div>
        <div className="absolute top-3/4 right-1/4 w-3 h-3 bg-emerald-400/30 rounded-full animate-bounce delay-700"></div>
        <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-purple-400/30 rounded-full animate-bounce delay-1100"></div>
      </div>

      <div className="relative bg-white/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/60 p-10 w-full max-w-2xl">
        {/* Enhanced Header */}
        <div className="text-center mb-14">
          <div className="mt-8 mb-6 transform hover:scale-105 transition-transform duration-300">
            <Logo className="h-25 w-32 mx-auto" />
          </div>
          <div className="relative">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3 tracking-tight">
              Select Your Role
            </h1>
          </div>
        </div>

        {/* Enhanced Role Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
          {roles.map((role, index) => {
            const IconComponent = role.icon;
            const isActive = (isHovered === role.id) || (selectedRole === role.id);
            const isHovering = isHovered === role.id;

            return (
              <div
                  key={role.id}
                  onMouseEnter={() => setIsHovered(role.id)}
                  onMouseLeave={() => setIsHovered(null)}
                  onPointerDown={(e) => {
                    // remember pointer type to differentiate touch vs mouse
                    setLastPointerType(e.pointerType);
                    // For touch/pointer (mobile), implement two-tap: first selects, second opens
                    if (e.pointerType === "touch") {
                      if (selectedRole === role.id) {
                        handleRoleSelect(role.id);
                        setSelectedRole(null);
                      } else {
                        setSelectedRole(role.id);
                        // clear selection after a short timeout to avoid permanent selection
                        if (clearSelectionTimeout.current) clearTimeout(clearSelectionTimeout.current);
                        clearSelectionTimeout.current = setTimeout(() => setSelectedRole(null), 3000);
                      }
                    }
                  }}
                  onClick={(e) => {
                    // For mouse/keyboard, open immediately
                    if (lastPointerType !== "touch") {
                      handleRoleSelect(role.id);
                    }
                  }}
                className={`
                  group relative flex flex-col items-center p-8 rounded-3xl cursor-pointer transition-all duration-500 transform hover:scale-110 hover:-translate-y-2 active:scale-105 active:-translate-y-1
                  ${
                    isActive
                      ? "bg-gradient-to-br from-white/90 to-white/70 border-2 border-blue-400/60 shadow-2xl shadow-blue-500/30"
                      : "bg-white/70 border-2 border-gray-200/40 hover:bg-white/90 hover:border-gray-300/60 hover:shadow-xl"
                  }
                `}
                style={{ animationDelay: `${index * 150}ms` }}
              >
                {/* Enhanced glow effect for active card */}
                {isActive && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/15 to-indigo-600/15 rounded-3xl blur-xl animate-pulse"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-indigo-500/10 rounded-3xl"></div>
                  </>
                )}

                {/* Hover glow effect */}
                {isHovering && !isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-400/10 to-gray-500/10 rounded-3xl blur-lg"></div>
                )}

                {/* Enhanced Icon container */}
                <div
                  className={`relative p-6 rounded-2xl mb-6 transition-all duration-500 transform group-hover:scale-110 group-hover:rotate-3 ${
                    isActive
                      ? `bg-gradient-to-r ${role.gradient} shadow-2xl`
                      : "bg-gradient-to-r from-gray-100/90 to-gray-200/90 group-hover:from-gray-200/90 group-hover:to-gray-300/90"
                  }`}
                >
                  {typeof IconComponent === "string" ? (
                    <img
                      src={IconComponent}
                      alt={role.name + " icon"}
                      className={`w-28 h-28 object-contain transition-all duration-500 ${
                        isActive ? "" : "group-hover:opacity-90"
                      }`}
                    />
                  ) : (
                    <IconComponent
                      size={32}
                      className={`transition-all duration-500 ${
                        isActive
                          ? "text-white drop-shadow-lg"
                          : "text-gray-600 group-hover:text-gray-700"
                      }`}
                    />
                  )}

                  {/* Enhanced floating particles effect */}
                  {isActive && (
                    <>
                      <div className="absolute -top-2 -right-2 w-3 h-3 bg-white/70 rounded-full animate-ping"></div>
                      <div className="absolute -bottom-2 -left-2 w-2 h-2 bg-white/50 rounded-full animate-ping delay-500"></div>
                      <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-white/60 rounded-full animate-pulse"></div>
                    </>
                  )}

                  {/* Rotating border effect for active */}
                  {isActive && (
                    <div
                      className="absolute inset-0 rounded-2xl border-2 border-white/30"
                      style={{ animation: "spin 8s linear infinite" }}
                    ></div>
                  )}
                </div>

                {/* Enhanced Role name */}
                <h3
                  className={`text-xl font-bold mb-3 transition-all duration-500 text-center tracking-wide ${
                    isActive
                      ? "text-gray-800 drop-shadow-sm"
                      : "text-gray-700 group-hover:text-gray-800"
                  }`}
                >
                  {role.name}
                </h3>

                {/* Enhanced Description */}
                <p
                  className={`text-sm transition-all duration-500 text-center font-medium ${
                    isActive
                      ? "text-gray-600"
                      : "text-gray-500 group-hover:text-gray-600"
                  }`}
                >
                  {role.description}
                </p>

                {/* Enhanced Selection indicator */}
                <div
                  className={`absolute -top-3 -right-3 w-8 h-8 rounded-full border-3 border-white transition-all duration-500 flex items-center justify-center ${
                    isActive
                      ? "bg-gradient-to-r from-blue-500 to-indigo-600 scale-100 shadow-lg"
                      : "bg-gray-400/60 scale-0 group-hover:scale-75 group-hover:bg-gray-500/60"
                  }`}
                >
                  {isActive && (
                    <>
                      <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                      <div className="absolute inset-0 bg-white/20 rounded-full animate-ping"></div>
                    </>
                  )}
                </div>

                {/* Progress indicator line at bottom */}
                <div
                  className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 h-1 rounded-t-full transition-all duration-500 ${
                    isActive
                      ? "w-full bg-gradient-to-r from-blue-500 to-indigo-600"
                      : "w-0 bg-gray-400"
                  }`}
                ></div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
