import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Package, ShoppingCart, Users, Stethoscope } from "lucide-react";
import Logo from "./Logo";

export default function SelectRolePage() {
  const [selectedRole, setSelectedRole] = useState("Purchaser");
  const navigate = useNavigate();

  const roles = [
    {
      id: "Stockist",
      name: "Stockist",
      icon: Package,
      gradient: "from-emerald-400 to-teal-500",
      bgGlow: "bg-emerald-500/10",
      description: "Manage inventory",
    },
    {
      id: "Purchaser",
      name: "Purchaser",
      icon: ShoppingCart,
      gradient: "from-blue-400 to-indigo-500",
      bgGlow: "bg-blue-500/10",
      description: "Handle procurement",
    },
    {
      id: "Staff",
      name: "Staff",
      icon: Users,
      gradient: "from-purple-400 to-pink-500",
      bgGlow: "bg-purple-500/10",
      description: "Team operations",
    },
    {
      id: "Medical Owner",
      name: "Medical Owner",
      icon: Stethoscope,
      gradient: "from-orange-400 to-red-500",
      bgGlow: "bg-orange-500/10",
      description: "Clinic management",
    },
  ];

  const handleRoleSelect = (roleId) => {
    setSelectedRole(roleId);
    // Persist selection immediately
    try {
      localStorage.setItem("selectedRole", roleId);
    } catch (e) {
      // ignore
    }

    // If Staff is clicked, go directly to the staff listing page
    if (roleId === "Staff") {
      navigate("/staffs");
      return;
    }
  };

  const handleConfirm = () => {
    // Persist the selected role so other parts of the app can access it
    try {
      localStorage.setItem("selectedRole", selectedRole);
    } catch (e) {
      console.warn("Could not persist role", e);
    }

    // Navigate to the Purchaser page when Purchaser is selected
    if (selectedRole === "Purchaser") {
      navigate("/purchaser");
      return;
    }

    // Navigate to stockist creation when Stockist selected
    if (selectedRole === "Stockist") {
      navigate("/adminCreateStockist");
      return;
    }

    // Navigate to signup when Medical Owner selected
    if (selectedRole === "Medical Owner") {
      navigate("/signup");
      return;
    }

    // Default navigation for other roles
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-64 h-64 bg-purple-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-400/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8 w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="mt-10" >
            <Logo className="h-45 w-45"/>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
            Select Your Role
          </h1>
          <p className="text-gray-500 text-sm">
            Choose your primary function to get started
          </p>
        </div>

        {/* Role Cards Grid */}
        <div className="grid grid-cols-2 gap-4 mb-12">
          {roles.map((role) => {
            const IconComponent = role.icon;
            const isActive = selectedRole === role.id;

            return (
              <div
                key={role.id}
                onClick={() => handleRoleSelect(role.id)}
                className={`
                  group relative flex flex-col items-center p-6 rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-105 hover:-translate-y-1
                  ${
                    isActive
                      ? "bg-gradient-to-br from-blue-500/20 to-indigo-600/20 border-2 border-blue-400/50 shadow-xl shadow-blue-500/25"
                      : "bg-white/60 border border-gray-200/50 hover:bg-white/80 hover:border-gray-300/50 hover:shadow-lg"
                  }
                `}
              >
                {/* Glow effect for active card */}
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-600/10 rounded-2xl blur-xl"></div>
                )}

                {/* Icon container */}
                <div
                  className={`
                  relative p-4 rounded-2xl mb-4 transition-all duration-300
                  ${
                    isActive
                      ? `bg-gradient-to-r ${role.gradient} shadow-lg`
                      : "bg-gray-100/80 group-hover:bg-gray-200/80"
                  }
                `}
                >
                  <IconComponent
                    size={28}
                    className={`
                      transition-colors duration-300
                      ${
                        isActive
                          ? "text-white"
                          : "text-gray-600 group-hover:text-gray-700"
                      }
                    `}
                  />

                  {/* Floating particles effect */}
                  {isActive && (
                    <>
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-white/60 rounded-full animate-ping"></div>
                      <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-white/40 rounded-full animate-ping delay-500"></div>
                    </>
                  )}
                </div>

                {/* Role name */}
                <h3
                  className={`
                  text-lg font-semibold mb-2 transition-colors duration-300 text-center
                  ${
                    isActive
                      ? "text-gray-800"
                      : "text-gray-600 group-hover:text-gray-800"
                  }
                `}
                >
                  {role.name}
                </h3>

                {/* Description */}
                <p
                  className={`
                  text-xs transition-colors duration-300 text-center
                  ${
                    isActive
                      ? "text-gray-600"
                      : "text-gray-400 group-hover:text-gray-500"
                  }
                `}
                >
                  {role.description}
                </p>

                {/* Selection indicator */}
                <div
                  className={`
                  absolute -top-2 -right-2 w-6 h-6 rounded-full border-2 border-white transition-all duration-300
                  ${
                    isActive
                      ? "bg-gradient-to-r from-blue-500 to-indigo-600 scale-100"
                      : "bg-gray-300 scale-0 group-hover:scale-75"
                  }
                `}
                >
                  {isActive && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Confirm Button */}
        <div className="text-center mb-8">
          <button
            onClick={handleConfirm}
            className="group relative bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-semibold py-4 px-12 rounded-full transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/30 min-w-[180px] overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
            <span className="relative">CONFIRM ROLE</span>
          </button>
        </div>

        {/* Pagination Dots */}
       
      </div>
    </div>
  );
}
