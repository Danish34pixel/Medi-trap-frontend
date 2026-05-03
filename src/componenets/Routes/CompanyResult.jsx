// CompanyResult.jsx
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MapPin, Phone, ChevronLeft, X, Package } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CompanyResult(props) {
  const location = useLocation();
  const navigate = useNavigate();

  // Accept company/stockists from either location.state or props
  const { company: pCompany, stockists: pStockists } = props;
  const state = location.state || {};
  const company = pCompany || state.company;
  const stockists = pStockists || state.stockists || [];

  const [selectedStockist, setSelectedStockist] = useState(null);

  // Animated card variants
  const cardVariants = {
    hidden: { opacity: 0, y: 8, scale: 0.995 },
    show: (i) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { delay: i * 0.05 },
    }),
    exit: { opacity: 0, y: -8, transition: { duration: 0.18 } },
  };

  const slideVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { duration: 0.28 } },
    exit: { y: 20, opacity: 0, transition: { duration: 0.2 } },
  };

  if (!company || !stockists || stockists.length === 0) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg max-w-lg w-full p-8 text-center">
          <div className="mx-auto w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mb-6">
            <Package size={36} color="#3B82F6" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            No Results Found
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            Please try searching for a different company.
          </p>
          <button
            onClick={() => (navigate ? navigate(-1) : window.history.back())}
            className="mt-2 inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const StockistCard = ({ stockist, index }) => {
    return (
      <motion.div
        key={stockist._id || index}
        custom={index}
        initial="hidden"
        animate="show"
        exit="exit"
        variants={cardVariants}
        className="bg-white rounded-2xl shadow-md overflow-hidden m-2 w-72 cursor-pointer hover:shadow-lg"
        onClick={() => setSelectedStockist(index)}
      >
        {stockist.image ? (
          <div className="relative h-44 w-full">
            <img
              src={stockist.image}
              alt={stockist.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/30" />
          </div>
        ) : (
          <div
            className="relative h-44 w-full flex items-center justify-center"
            style={{ background: "#DBEAFE" }}
          >
            <div className="text-4xl font-extrabold text-white/90">
              {(stockist.title || "").charAt(0)}
            </div>
            <div className="absolute inset-0 bg-black/10" />
          </div>
        )}

        <div className="p-5">
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            {stockist.title}
          </h3>

          {stockist.address && (
            <div className="flex items-start gap-3 mt-2">
              <MapPin size={16} color="#4B5563" />
              <p className="text-sm text-gray-600 flex-1">{stockist.address}</p>
            </div>
          )}

          {stockist.phone && (
            <div className="flex items-center gap-3 mt-3">
              <Phone size={16} color="#4B5563" />
              <p className="text-sm text-gray-600">{stockist.phone}</p>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-gray-100">
            <button className="w-full text-blue-600 font-medium">
              View Details
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  const StockistDetails = ({ stockist }) => {
    return (
      <motion.div
        key={stockist._id || "detail"}
        initial="hidden"
        animate="show"
        exit="exit"
        variants={slideVariants}
        className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-3xl mx-auto"
      >
        <div className="relative">
          {stockist.image ? (
            <img
              src={stockist.image}
              alt={stockist.title}
              className="w-full h-64 object-cover"
            />
          ) : (
            <div className="h-64 bg-blue-600 flex items-center p-6">
              <h2 className="text-3xl font-bold text-white">
                {stockist.title}
              </h2>
            </div>
          )}

          <button
            onClick={() => setSelectedStockist(null)}
            className="absolute top-4 right-4 bg-white p-2 rounded-full shadow"
            aria-label="close details"
          >
            <X size={18} color="#1F2937" />
          </button>
        </div>

        <div className="p-6">
          {stockist.address && (
            <div className="flex items-start gap-4 mb-4">
              <MapPin size={20} color="#2563EB" />
              <div>
                <div className="font-semibold text-gray-700">Address</div>
                <div className="text-gray-600">{stockist.address}</div>
              </div>
            </div>
          )}

          {stockist.phone && (
            <div className="flex items-start gap-4 mb-4">
              <Phone size={20} color="#2563EB" />
              <div>
                <div className="font-semibold text-gray-700">Phone</div>
                <div className="text-gray-600">{stockist.phone}</div>
              </div>
            </div>
          )}

          {stockist.medicines && stockist.medicines.length > 0 && (
            <div className="mt-6">
              <h4 className="text-xl font-bold mb-4 text-gray-800">
                Available Medicines
              </h4>
              <div className="space-y-2">
                {stockist.medicines.map((medicine, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-medium">
                      {idx + 1}
                    </div>
                    <div className="text-gray-700">{medicine}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8">
            <button
              onClick={() => setSelectedStockist(null)}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-lg"
            >
              <ChevronLeft size={18} />
              <span className="font-medium">Back to All Stockists</span>
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-blue-50 p-6">
      <div className="bg-white rounded-2xl shadow-md p-6 mb-8 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800">
          <span className="text-blue-600">{company}</span> Stockists
        </h1>
        <p className="mt-2 text-gray-600">{stockists.length} locations found</p>
      </div>

      <div className="max-w-6xl mx-auto">
        <AnimatePresence>
          {selectedStockist === null ? (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-wrap gap-4"
            >
              {stockists.map((s, i) => (
                <StockistCard key={s._id || i} stockist={s} index={i} />
              ))}
            </motion.div>
          ) : (
            <StockistDetails stockist={stockists[selectedStockist]} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
