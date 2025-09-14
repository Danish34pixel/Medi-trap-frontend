import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function LandingPage() {
  const navigate = useNavigate();

  const handleLoginClick = () => {
    navigate("/login"); // route to your login page
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6 text-center">
      {/* Floating Logo */}
      <motion.div
        className="mb-6"
        animate={{ y: [-10, 10, -10] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        <h1 className="text-4xl sm:text-5xl font-bold text-slate-800">
          DK Pharma
        </h1>
      </motion.div>

      {/* Tagline */}
      <p className="text-lg sm:text-xl text-sky-700 mb-10 max-w-md">
        Committed to healthcare innovation and excellence
      </p>

      {/* Login Button */}
      <button
        onClick={handleLoginClick}
        className="bg-blue-600 hover:bg-blue-700 text-white text-lg font-medium px-8 py-3 rounded-full transition"
      >
        Login
      </button>
    </div>
  );
}
