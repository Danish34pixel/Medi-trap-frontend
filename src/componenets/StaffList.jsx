import React, { useEffect, useState } from "react";
import { QRCodeSVG } from 'qrcode.react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiUrl } from "./config/api";

// Mock StaffCard component
const StaffCard = ({ staff, onOpen }) => {
  const handleClick = () => onOpen(staff);
  
  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg border border-gray-100 hover:border-blue-200 cursor-pointer transition-all duration-300 group"
    >
  <div className="flex items-center gap-4">
        <div className="relative">
          {staff.image ? (
            <img src={staff.image} alt={staff.fullName} className="w-14 h-14 rounded-xl object-cover" />
          ) : (
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-semibold text-lg">
              {staff.fullName.charAt(0)}
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors duration-200">
            {staff.fullName}
          </h3>
          <p className="text-sm text-gray-500">{staff.contact}</p>
          <p className="text-xs text-gray-400 mt-1">{staff.email}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-gray-400">ID: {staff._id.slice(-6)}</div>
            <div className="text-xs text-green-600 font-medium">Active</div>
          </div>
          <div className="hidden sm:block">
            <div className="w-10 h-10 bg-white p-1 rounded-md shadow-sm">
              <QRCodeSVG value={`${window.location.origin}/staff/${staff._id}`} size={36} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Mock StaffModal component
const StaffModal = ({ staff, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Staff Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            {staff.image ? (
              <img src={staff.image} alt={staff.fullName} className="w-16 h-16 rounded-xl object-cover" />
            ) : (
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                {staff.fullName.charAt(0)}
              </div>
            )}
            <div>
              <h3 className="font-semibold text-gray-800">{staff.fullName}</h3>
              <p className="text-sm text-gray-500">{staff.contact}</p>
            </div>
          </div>
          
          <div className="space-y-3 pt-4 border-t border-gray-100">
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wide">Email</label>
              <p className="text-sm text-gray-800">{staff.email}</p>
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wide">Address</label>
              <p className="text-sm text-gray-800">{staff.address}</p>
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wide">Status</label>
              <p className="text-sm text-green-600 font-medium">Active</p>
            </div>
          </div>

          {/* QR Code */}
          <div className="mt-6 flex items-center justify-center">
            <div className="bg-gray-50 p-4 rounded-xl">
              <QRCodeSVG value={`${window.location.origin}/staff/${staff._id}`} size={128} />
            </div>
          </div>
        </div>
        
        <div className="flex gap-3 mt-8">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors duration-200"
          >
            Close
          </button>
          <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200">
            Edit Staff
          </button>
        </div>
      </div>
    </div>
  );
};

// Staff list is loaded from backend via apiUrl('/api/staff')

export default function StaffList() {
  const [staffs, setStaffs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(apiUrl('/api/staff'));
        const data = await res.json().catch(() => []);
        if (!mounted) return;
        if (res.ok && Array.isArray(data)) setStaffs(data);
        else if (res.ok && data && Array.isArray(data.data)) setStaffs(data.data);
      } catch (e) {
        console.error('Failed to load staff list', e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [location.key]);

  const navigateToCreate = () => navigate('/adminCreateStaff');

  const filteredStaffs = staffs.filter(staff =>
    staff.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.contact.includes(searchTerm) ||
    staff.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-4 mb-2">
                <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                <h1 className="text-3xl font-bold text-gray-800">Staff Management</h1>
              </div>
              <p className="text-gray-600 ml-8">Manage your team members and their information</p>
            </div>
            <button
              onClick={navigateToCreate}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add New Staff
            </button>
          </div>

          {/* Search and Stats */}
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              <div className="relative">
                <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search staff by name, contact, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 outline-none"
                />
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100 min-w-[120px]">
                <div className="text-2xl font-bold text-blue-600">{staffs.length}</div>
                <div className="text-sm text-gray-500">Total Staff</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100 min-w-[120px]">
                <div className="text-2xl font-bold text-green-600">{staffs.length}</div>
                <div className="text-sm text-gray-500">Active</div>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <svg className="animate-spin w-8 h-8 text-blue-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-gray-600">Loading staff members...</p>
            </div>
          </div>
        )}

        {/* Staff Grid */}
        {!loading && (
          <div className="space-y-4">
            {filteredStaffs.map((staff) => (
              <StaffCard key={staff._id} staff={staff} onOpen={(st) => setSelected(st)} />
            ))}
            
            {!loading && filteredStaffs.length === 0 && staffs.length > 0 && (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">No staff found</h3>
                <p className="text-gray-500">Try adjusting your search criteria</p>
              </div>
            )}
            
            {!loading && staffs.length === 0 && (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">No staff members yet</h3>
                <p className="text-gray-500 mb-6">Get started by adding your first staff member</p>
                <button
                  onClick={navigateToCreate}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200 inline-flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add First Staff Member
                </button>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        {!loading && staffs.length > 0 && (
          <div className="mt-8">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors duration-200 text-left">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h4 className="font-medium text-gray-800">Export Staff List</h4>
                  <p className="text-sm text-gray-500">Download staff data as CSV</p>
                </button>
                
                <button className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors duration-200 text-left">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h4 className="font-medium text-gray-800">Staff Analytics</h4>
                  <p className="text-sm text-gray-500">View performance metrics</p>
                </button>
                
                <button className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors duration-200 text-left">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mb-3">
                    <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                    </svg>
                  </div>
                  <h4 className="font-medium text-gray-800">Bulk Actions</h4>
                  <p className="text-sm text-gray-500">Manage multiple staff</p>
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