import React from "react";

export function CompanyCard({ c, onView, onContact }) {
  const title = c.name || c.title || c.companyName || "Untitled Company";
  const subtitle = c.email || c.phone || c.contact || "";
  const key = c._id || c.id || title;

  return (
    <div
      key={key}
      className="bg-white rounded-xl shadow-sm border hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden group"
    >
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            {title.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 mb-1 truncate group-hover:text-sky-600 transition-colors">
              {title}
            </h3>
            {subtitle && (
              <p className="text-sm text-gray-500 truncate">{subtitle}</p>
            )}
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <button
            onClick={() => onView && onView(c)}
            className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            View Details
          </button>
          <button
            onClick={() => onContact && onContact(c)}
            className="flex-1 px-3 py-2 text-sm font-medium text-sky-700 bg-sky-50 rounded-lg hover:bg-sky-100 transition-colors"
          >
            Contact
          </button>
        </div>
      </div>
    </div>
  );
}

export function MedicineCard({ m, onView, onOrder }) {
  const title = m.name || m.medicineName || m.title || "Untitled Medicine";
  const subtitle = m.company || m.manufacturer || "";
  const key = m._id || m.id || title;

  return (
    <div
      key={key}
      className="bg-white rounded-xl shadow-sm border hover:shock-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden group"
    >
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-500 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            {title.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 mb-1 truncate group-hover:text-emerald-600 transition-colors">
              {title}
            </h3>
            {subtitle && (
              <p className="text-sm text-gray-500 truncate">{subtitle}</p>
            )}
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <button
            onClick={() => onView && onView(m)}
            className="flex items-center justify-center gap-2 flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Details
          </button>
          <button
            onClick={() => onOrder && onOrder(m)}
            className="flex-1 px-3 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
          >
            Order
          </button>
        </div>
      </div>
    </div>
  );
}

export function StaffCard({ st, onView, onDelete, isAdminOrOwner }) {
  const key = st._id || st.id || `${st.firstName || ""}-${st.lastName || ""}`;
  const title =
    st.fullName ||
    st.name ||
    `${st.firstName || ""} ${st.lastName || ""}`.trim() ||
    "Unnamed Staff";

  return (
    <div
      key={key}
      className="bg-white rounded-xl shadow-sm border hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden"
    >
      <div className="p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-600 to-violet-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            {(title.slice(0, 2) || "S").toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 mb-1 truncate">
              {title}
            </h3>
            <p className="text-sm text-gray-500 truncate">
              {st.contact || st.contactNo || st.phone || "No contact info"}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onView && onView(st)}
            className="flex items-center justify-center gap-2 flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            View
          </button>
          {isAdminOrOwner && (
            <button
              onClick={() => onDelete && onDelete(st)}
              className="flex items-center justify-center px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
