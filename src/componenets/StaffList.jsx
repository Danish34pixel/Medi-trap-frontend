import React, { useEffect, useState } from "react";
import { apiUrl } from "./config/api";
import StaffCard from "./StaffCard";
import StaffModal from "./StaffModal";
import { Link } from "react-router-dom";

export default function StaffList() {
  const [staffs, setStaffs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(apiUrl("/api/staff"));
        const data = await res.json().catch(() => ({}));
        if (res.ok && data?.data) setStaffs(data.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Staff</h2>
        <Link to="/adminCreateStaff" className="text-emerald-600">
          Create
        </Link>
      </div>
      {loading && <div>Loading...</div>}
      <div className="space-y-3">
        {staffs.map((s) => (
          <StaffCard key={s._id} staff={s} onOpen={(st) => setSelected(st)} />
        ))}
        {!loading && staffs.length === 0 && (
          <div className="text-slate-500">No staff found</div>
        )}
      </div>
      {selected && (
        <StaffModal staff={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
