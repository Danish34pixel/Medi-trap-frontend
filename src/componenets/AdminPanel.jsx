import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Package,
  PlusCircle,
  UserPlus,
  Pill,
  ChevronRight,
  Megaphone,
  Bell,
  Building2,
  ClipboardList,
} from "lucide-react";
import PageHeader from "./ui/PageHeader";
import Card from "./ui/Card";

// Mirrors Nebula's Admin/index.jsx menu: one row per admin task, each with
// its own gradient icon accent (blue/teal/amber/indigo/pink) + chevron.
const MENU_ITEMS = [
  {
    title: "Purchaser Management",
    subtitle: "Approve or decline purchaser registrations",
    icon: Users,
    gradient: "from-blue-500 to-blue-600",
    path: "/user-admin",
  },
  {
    title: "Stockist Management",
    subtitle: "Verify and approve supplier applications",
    icon: Package,
    gradient: "from-teal-500 to-teal-600",
    path: "/admin/stockists",
  },
  {
    title: "Create Company",
    subtitle: "Register a new pharmaceutical company",
    icon: PlusCircle,
    gradient: "from-amber-400 to-amber-600",
    path: "/adminCreateCompany",
  },
  {
    title: "Manage Companies",
    subtitle: "Edit company details and stockist links",
    icon: Building2,
    gradient: "from-orange-400 to-orange-600",
    path: "/admin/companies",
  },
  {
    title: "Create Stockist",
    subtitle: "Add a new supplier/stockist account",
    icon: UserPlus,
    gradient: "from-indigo-500 to-indigo-600",
    path: "/adminCreateStockist",
  },
  {
    title: "Create Medicine",
    subtitle: "Add new medicine with assignments",
    icon: Pill,
    gradient: "from-pink-400 to-pink-600",
    path: "/adminCreateMedicine",
  },
  {
    title: "Manage Medicines",
    subtitle: "View catalog (backend has no edit/delete API yet)",
    icon: ClipboardList,
    gradient: "from-rose-400 to-rose-600",
    path: "/admin/medicines",
  },
  {
    title: "Ads Management",
    subtitle: "Create, release, pause, and manage advertisements",
    icon: Megaphone,
    gradient: "from-cyan-500 to-cyan-600",
    path: "/admin/ads",
  },
  {
    title: "Announcements",
    subtitle: "Create, release, pause, and manage announcements",
    icon: Bell,
    gradient: "from-emerald-500 to-emerald-600",
    path: "/admin/announcements",
  },
];

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

  const goTo = (path) => {
    if (navigate) navigate(path);
    else window.location.href = path;
  };

  if (!isAdmin && !isSuperEmail) {
    return (
      <div className="min-h-screen bg-slate-50">
        <PageHeader title="Admin Panel" role="slate" showBack />
        <div className="p-6">
          <Card>
            <p className="text-slate-500">
              You must be an admin to access this page.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <PageHeader title="Admin Panel" role="slate" showBack />

      <div className="max-w-2xl mx-auto p-6 space-y-4">
        {MENU_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <Card
              key={item.path}
              padding="p-5"
              elevated
              onClick={() => goTo(item.path)}
              className="flex items-center gap-5 cursor-pointer transition-transform duration-200 hover:scale-[1.01] active:scale-[0.99]"
            >
              <div
                className={`w-16 h-16 shrink-0 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-md`}
              >
                <Icon className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-slate-800">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-500 leading-snug">
                  {item.subtitle}
                </p>
              </div>
              <ChevronRight className="w-6 h-6 text-slate-400 shrink-0" />
            </Card>
          );
        })}
      </div>

      <div className="text-center pb-10">
        <p className="text-xs font-semibold tracking-widest text-slate-400 uppercase">
          Logged in as Administrator
        </p>
      </div>
    </div>
  );
}
