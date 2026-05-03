import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminPanel() {
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = (() => {
    try {
      return useNavigate();
    } catch (e) {
      return null;
    }
  })();

  useEffect(() => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) return;
      const user = JSON.parse(userStr);
      setIsAdmin(user && user.role === "admin");
    } catch (err) {
      console.warn("AdminPanel: could not read user from storage", err);
    }
  }, []);

  // Special-case: show 'Add Admin' if logged in user has this specific email
  const isSuperEmail = (() => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) return false;
      const user = JSON.parse(userStr);
      const email = (user && (user.email || user.contactNo || ""))
        .toString()
        .toLowerCase();
      return email === "danishkhaannn34@gmail.com";
    } catch (e) {
      return false;
    }
  })();

  if (!isAdmin && !isSuperEmail) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-start p-6">
        <h1 className="text-2xl font-bold text-slate-800 mb-4">Admin Panel</h1>
        <p className="text-slate-500">
          You must be an admin to access this page.
        </p>
      </div>
    );
  }

  const goTo = (path) => {
    if (navigate) navigate(path);
    else window.location.href = path;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-start p-6">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Admin Panel</h1>

      <button
        onClick={() => goTo("/adminCreateStockist")}
        className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg mb-3"
      >
        Create Stockist
      </button>

      <button
        onClick={() => goTo("/adminCreateCompany")}
        className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg mb-3"
      >
        Create Company
      </button>

      <button
        onClick={() => goTo("/adminCreateMedicine")}
        className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg"
      >
        Create Medicine
      </button>

      <div className="mt-6 space-y-3 w-full sm:w-auto">
        <button
          onClick={() => goTo("/admin/stockists")}
          className="w-full sm:w-auto bg-gray-800 hover:bg-gray-900 text-white font-semibold px-6 py-3 rounded-lg"
        >
          Admin Page
        </button>

        <button
          onClick={() => goTo("/user-admin")}
          className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-lg"
        >
          User Admin
        </button>
      </div>
    </div>
  );
}
