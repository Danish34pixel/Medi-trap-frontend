import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Search,
  Plus,
  Users,
  UserPlus,
  Download,
  BarChart3,
  Settings2,
} from "lucide-react";
import { apiUrl } from "../config/api";
import { getCookie } from "../utils/cookies";
import StaffCard from "./StaffCard";
import StaffModal from "./StaffModal";

export default function StaffList() {
  const [staffs, setStaffs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [user, setUser] = useState(() => {
    try {
      const u = localStorage.getItem("user");
      return u ? JSON.parse(u) : null;
    } catch (e) {
      return null;
    }
  });
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const token = getCookie("token");
        const isStockist = user && user.role === "stockist";
        const url = isStockist
          ? apiUrl("/api/staff?stockist=me")
          : apiUrl("/api/staff");
        const opts = {};
        if (token) opts.headers = { Authorization: `Bearer ${token}` };

        const res = await fetch(url, opts);
        const data = await res.json().catch(() => []);
        if (!mounted) return;
        if (res.ok && Array.isArray(data)) setStaffs(data);
        else if (res.ok && data && Array.isArray(data.data))
          setStaffs(data.data);
      } catch (e) {
        console.error("Failed to load staff list", e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [location.key, user]);

  const navigateToCreate = () => navigate("/adminCreateStaff");
  const canManage = user && (user.role === "stockist" || user.role === "admin");

  const filteredStaffs = staffs.filter(
    (staff) =>
      staff.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.contact.includes(searchTerm) ||
      staff.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-role-staff-from to-role-staff-to flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800">
                  Staff Management
                </h1>
              </div>
              <p className="text-slate-500 ml-12 text-sm">
                Manage your team members and their information
              </p>
            </div>
            {canManage && (
              <button
                onClick={navigateToCreate}
                className="px-5 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-role-staff-from to-role-staff-to hover:brightness-105 transition shadow-lg shadow-purple-200 flex items-center gap-2 shrink-0"
              >
                <Plus className="w-4 h-4" />
                Add New Staff
              </button>
            )}
          </div>

          {/* Search and Stats */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search staff by name, contact, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:border-role-staff focus:ring-4 focus:ring-purple-100 transition-all duration-200 outline-none shadow-card"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <div className="bg-white rounded-2xl p-4 shadow-card border border-slate-100 min-w-[110px]">
                <div className="text-2xl font-extrabold text-role-staff">
                  {staffs.length}
                </div>
                <div className="text-sm text-slate-500">Total Staff</div>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-card border border-slate-100 min-w-[110px]">
                <div className="text-2xl font-extrabold text-emerald-600">
                  {staffs.length}
                </div>
                <div className="text-sm text-slate-500">Active</div>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="w-10 h-10 mx-auto mb-4 animate-spin rounded-full border-4 border-purple-200 border-t-role-staff" />
              <p className="text-slate-500">Loading staff members...</p>
            </div>
          </div>
        )}

        {/* Staff List */}
        {!loading && (
          <div className="space-y-4">
            {filteredStaffs.map((staff) => (
              <StaffCard
                key={staff._id}
                staff={staff}
                onOpen={(st) => setSelected(st)}
              />
            ))}

            {!loading && filteredStaffs.length === 0 && staffs.length > 0 && (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-card">
                  <Search className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">
                  No staff found
                </h3>
                <p className="text-slate-500">
                  Try adjusting your search criteria
                </p>
              </div>
            )}

            {!loading && staffs.length === 0 && (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-role-staff-from to-role-staff-to flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-200">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">
                  No staff members yet
                </h3>
                <p className="text-slate-500 mb-6">
                  Get started by adding your first staff member
                </p>
                {canManage ? (
                  <button
                    onClick={navigateToCreate}
                    className="px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-role-staff-from to-role-staff-to hover:brightness-105 transition inline-flex items-center gap-2 shadow-lg shadow-purple-200"
                  >
                    <UserPlus className="w-4 h-4" />
                    Add First Staff Member
                  </button>
                ) : (
                  <div className="text-sm text-slate-500">
                    Only stockists or admins can add staff.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        {!loading && staffs.length > 0 && (
          <div className="mt-8">
            <div className="bg-white rounded-3xl p-6 shadow-card-lg border border-slate-100">
              <h3 className="font-semibold text-slate-800 mb-4">
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button className="p-4 border border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors duration-200 text-left">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                    <Download className="w-4 h-4 text-role-staff" />
                  </div>
                  <h4 className="font-medium text-slate-800">
                    Export Staff List
                  </h4>
                  <p className="text-sm text-slate-500">
                    Download staff data as CSV
                  </p>
                </button>

                <button className="p-4 border border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors duration-200 text-left">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center mb-3">
                    <BarChart3 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <h4 className="font-medium text-slate-800">Staff Analytics</h4>
                  <p className="text-sm text-slate-500">
                    View performance metrics
                  </p>
                </button>

                <button className="p-4 border border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors duration-200 text-left">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mb-3">
                    <Settings2 className="w-4 h-4 text-orange-600" />
                  </div>
                  <h4 className="font-medium text-slate-800">Bulk Actions</h4>
                  <p className="text-sm text-slate-500">Manage multiple staff</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal */}
        {selected && (
          <StaffModal staff={selected} onClose={() => setSelected(null)} />
        )}
      </div>
    </div>
  );
}
