import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { apiUrl } from "./config/api";

const PurchaserDetails = () => {
  const { id } = useParams();
  const [purchaser, setPurchaser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPurchaser = async () => {
      setLoading(true);
      try {
        const res = await axios.get(apiUrl(`/api/purchaser/${id}`));
        setPurchaser(res.data.data);
        setError(null);
      } catch (err) {
        setError("Failed to fetch purchaser details");
      }
      setLoading(false);
    };
    fetchPurchaser();
  }, [id]);

  if (loading) return <div className="text-sky-600 py-4">Loading...</div>;
  if (error) return <div className="text-red-600 py-4">{error}</div>;
  if (!purchaser)
    return <div className="text-slate-500 py-4">No details found.</div>;

  return (
    <div className="bg-sky-50 min-h-screen py-8">
      <div className="max-w-md mx-auto px-4">
        <div className="bg-white rounded-2xl shadow p-6 border border-sky-100 flex flex-col items-center gap-4">
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-sky-300 bg-sky-50 flex items-center justify-center">
            {purchaser.photo ? (
              <img
                src={purchaser.photo}
                alt="Photo"
                className="object-cover w-full h-full"
              />
            ) : (
              <span className="text-5xl">🧑‍💼</span>
            )}
          </div>
          <div className="text-2xl font-bold text-sky-700">
            {purchaser.fullName}
          </div>
          <div className="text-slate-600 text-center">{purchaser.address}</div>
          <div className="text-slate-700 font-medium">
            {purchaser.contactNo}
          </div>
          <div className="w-full flex flex-col items-center gap-2 mt-4">
            <div className="font-semibold text-sky-600">Aadhar Image</div>
            {purchaser.aadharImage ? (
              <img
                src={purchaser.aadharImage}
                alt="Aadhar"
                className="w-48 h-32 object-cover rounded border border-sky-200"
              />
            ) : (
              <span className="text-slate-400">No Aadhar image</span>
            )}
          </div>
          <div className="mt-2 text-xs text-slate-400">ID: {purchaser._id}</div>
        </div>
      </div>
    </div>
  );
};

export default PurchaserDetails;
