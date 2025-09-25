import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Package, ShoppingCart, Stethoscope } from "lucide-react";

// Mock Logo component for demonstration
const Logo = ({ className }) => (
  <div className={`${className}  rounded-lg flex items-center justify-center`}>
    <span className="text-white font-bold text-xl">
      <Logo />
      <img src="/logo.png" alt="" />
    </span>
  </div>
);

export default function SelectRolePage() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState("Purchaser");
  const [isHovered, setIsHovered] = useState(null);

  const roles = [
    {
      id: "Stockist",
      name: "Stockist",
      icon: Package,
      gradient: "from-emerald-400 to-teal-500",
      bgGlow: "bg-emerald-500/10",
      description: "Manage inventory",
      color: "emerald",
    },
    {
      id: "Purchaser",
      name: "Purchaser",
      icon: ShoppingCart,
      gradient: "from-blue-400 to-indigo-500",
      bgGlow: "bg-blue-500/10",
      description: "Handle procurement",
      color: "blue",
    },
    {
      id: "Medical Owner",
      name: "Medical Owner",
      icon: Stethoscope,
      gradient: "from-orange-400 to-red-500",
      bgGlow: "bg-orange-500/10",
      description: "Clinic management",
      color: "orange",
    },
  ];

  const handleRoleSelect = (roleId) => {
    setSelectedRole(roleId);
    // Save selected role to localStorage if needed
    localStorage.setItem("selectedRole", roleId);
    // If Staff is clicked, go directly to the staff listing page
    if (roleId === "Staff") {
      navigate("/staffs");
      return;
    }
  };

  const handleConfirm = () => {
    // Save confirmed role to localStorage if needed
    localStorage.setItem("confirmedRole", selectedRole);
    // Navigate to the appropriate page
    if (selectedRole === "Purchaser") {
      navigate("/purchaser");
      return;
    }
    if (selectedRole === "Stockist") {
      navigate("/adminCreateStockist");
      return;
    }
    if (selectedRole === "Medical Owner") {
      navigate("/signup");
      return;
    }
    // Default navigation for other roles
    navigate("/dashboard");
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
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
          </div>
          <p className="text-gray-600 text-base mt-4 font-medium">
            Choose your primary function to get started
          </p>
        </div>

        {/* Enhanced Role Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
          {roles.map((role, index) => {
            const IconComponent = role.icon;
            const isActive = selectedRole === role.id;
            const isHovering = isHovered === role.id;

            return (
              <div
                key={role.id}
                onClick={() => handleRoleSelect(role.id)}
                onMouseEnter={() => setIsHovered(role.id)}
                onMouseLeave={() => setIsHovered(null)}
                className={`
                  group relative flex flex-col items-center p-8 rounded-3xl cursor-pointer transition-all duration-500 transform hover:scale-110 hover:-translate-y-2
                  ${
                    isActive
                      ? "bg-gradient-to-br from-white/90 to-white/70 border-2 border-blue-400/60 shadow-2xl shadow-blue-500/30"
                      : "bg-white/70 border-2 border-gray-200/40 hover:bg-white/90 hover:border-gray-300/60 hover:shadow-xl"
                  }
                `}
                style={{
                  animationDelay: `${index * 150}ms`,
                }}
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
                  className={`
                  relative p-6 rounded-2xl mb-6 transition-all duration-500 transform group-hover:scale-110 group-hover:rotate-3
                  ${
                    isActive
                      ? `bg-gradient-to-r ${role.gradient} shadow-2xl`
                      : "bg-gradient-to-r from-gray-100/90 to-gray-200/90 group-hover:from-gray-200/90 group-hover:to-gray-300/90"
                  }
                `}
                >
                  <IconComponent
                    size={32}
                    className={`
                      transition-all duration-500
                      ${
                        isActive
                          ? "text-white drop-shadow-lg"
                          : "text-gray-600 group-hover:text-gray-700"
                      }
                    `}
                  />

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
                  className={`
                  text-xl font-bold mb-3 transition-all duration-500 text-center tracking-wide
                  ${
                    isActive
                      ? "text-gray-800 drop-shadow-sm"
                      : "text-gray-700 group-hover:text-gray-800"
                  }
                `}
                >
                  {role.name}
                </h3>

                {/* Enhanced Description */}
                <p
                  className={`
                  text-sm transition-all duration-500 text-center font-medium
                  ${
                    isActive
                      ? "text-gray-600"
                      : "text-gray-500 group-hover:text-gray-600"
                  }
                `}
                >
                  {role.description}
                </p>

                {/* Enhanced Selection indicator */}
                <div
                  className={`
                  absolute -top-3 -right-3 w-8 h-8 rounded-full border-3 border-white transition-all duration-500 flex items-center justify-center
                  ${
                    isActive
                      ? "bg-gradient-to-r from-blue-500 to-indigo-600 scale-100 shadow-lg"
                      : "bg-gray-400/60 scale-0 group-hover:scale-75 group-hover:bg-gray-500/60"
                  }
                `}
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
                  className={`
                  absolute bottom-0 left-1/2 transform -translate-x-1/2 h-1 rounded-t-full transition-all duration-500
                  ${
                    isActive
                      ? "w-full bg-gradient-to-r from-blue-500 to-indigo-600"
                      : "w-0 bg-gray-400"
                  }
                `}
                ></div>
              </div>
            );
          })}
        </div>

        {/* Enhanced Confirm Button */}
        <div className="text-center mb-8">
          <button
            onClick={handleConfirm}
            className="group relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-800 text-white font-bold py-5 px-16 rounded-full transition-all duration-500 transform hover:scale-110 hover:shadow-2xl hover:shadow-blue-500/40 min-w-[220px] overflow-hidden text-lg tracking-wide"
          >
            {/* Enhanced shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>

            {/* Pulsing background */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/50 to-purple-600/50 rounded-full animate-pulse"></div>

            {/* Button content */}
            <span className="relative flex items-center justify-center gap-3">
              <span>CONFIRM ROLE</span>
              <div className="w-2 h-2 bg-white rounded-full animate-bounce group-hover:animate-pulse"></div>
            </span>

            {/* Button border animation */}
            <div className="absolute inset-0 rounded-full border-2 border-white/20 group-hover:border-white/40 transition-colors duration-300"></div>
          </button>
        </div>

        {/* Progress indicator */}
        <div className="flex justify-center space-x-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-blue-400/60 rounded-full animate-pulse delay-200"></div>
          <div className="w-2 h-2 bg-blue-300/40 rounded-full animate-pulse delay-400"></div>
        </div>
      </div>
    </div>
  );
}
