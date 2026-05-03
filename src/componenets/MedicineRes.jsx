import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Phone,
  MapPin,
  Pill,
  ChevronLeft,
  Info,
  Store,
  Clock,
  X,
} from "lucide-react";

function MedicineRes() {
  const location = useLocation();
  const { medicine, stockists } = location.state || {};
  const [selectedStockist, setSelectedStockist] = useState(null);
  const [searchQuery, setSearchQuery] = useState(medicine || "");
  const [isLoading, setIsLoading] = useState(true);

  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  if (!medicine || !stockists || stockists.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <motion.div
          className="text-center bg-white p-8 rounded-2xl shadow-xl max-w-md mx-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <X size={40} className="text-red-500" />
          </div>
          <h1 className="text-3xl font-bold mb-4 text-gray-800">
            No Results Found
          </h1>
          <p className="text-gray-600 mb-6">
            We couldn't find any stockists for your search. Please try searching
            for a different medicine.
          </p>
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-lg transform transition-all hover:scale-105"
            onClick={() => window.history.back()}
          >
            Go Back
          </button>
        </motion.div>
      </div>
    );
  }

  const filteredStockists = stockists.filter((stockist) =>
    stockist.Medicines?.some((med) =>
      med.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  // Styled stockist cards with improved layout
  const StockistCard = ({ stockist, index }) => {
    return (
      <motion.div
        className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300"
        onClick={() => setSelectedStockist(stockist)}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        whileHover={{ y: -5 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="relative">
          {stockist.image ? (
            <img
              src={stockist.image}
              alt={stockist.title}
              className="w-full h-48 object-cover"
            />
          ) : (
            <div className="w-full h-32 bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center justify-center">
              <Store size={40} className="text-white" />
            </div>
          )}
          <div className="absolute top-3 right-3 bg-blue-600 text-white text-xs font-bold py-1 px-2 rounded-full">
            Stockist
          </div>
        </div>

        <div className="p-5">
          <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-1">
            {stockist.title}
          </h3>

          <div className="space-y-2 mb-4">
            {stockist.phone && (
              <div className="flex items-center text-sm text-gray-600">
                <Phone size={16} className="mr-2 text-blue-500" />
                <span>{stockist.phone}</span>
              </div>
            )}
            {stockist.address && (
              <div className="flex items-center text-sm text-gray-600">
                <MapPin size={16} className="mr-2 text-blue-500" />
                <span className="line-clamp-1">{stockist.address}</span>
              </div>
            )}
          </div>

          <div className="flex items-center mt-auto pt-2 border-t border-gray-100">
            <Pill size={16} className="mr-2 text-blue-500" />
            <span className="text-sm font-medium text-blue-600">
              {stockist.Medicines?.length || 0} medicine(s) available
            </span>
          </div>
        </div>
      </motion.div>
    );
  };

  // Enhanced stockist details modal
  const StockistDetails = () => {
    if (!selectedStockist) return null;

    return (
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setSelectedStockist(null)}
      >
        <motion.div
          className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: "spring", damping: 25 }}
          onClick={(e) => e.stopPropagation()}
        >
          {selectedStockist.image ? (
            <div className="relative h-56 md:h-64">
              <img
                src={selectedStockist.image}
                alt={selectedStockist.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <button
                className="absolute top-4 left-4 bg-white p-2 rounded-full text-gray-800 hover:bg-gray-100"
                onClick={() => setSelectedStockist(null)}
              >
                <ChevronLeft size={24} />
              </button>
            </div>
          ) : (
            <div className="relative h-40 bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
              <Store size={60} className="text-white" />
              <button
                className="absolute top-4 left-4 bg-white p-2 rounded-full text-gray-800 hover:bg-gray-100"
                onClick={() => setSelectedStockist(null)}
              >
                <ChevronLeft size={24} />
              </button>
            </div>
          )}

          <div className="p-6 md:p-8">
            <h2 className="text-3xl font-bold mb-2 text-gray-800">
              {selectedStockist.title}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-xl">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <Info size={20} className="mr-2 text-blue-600" />
                    Contact Information
                  </h3>
                  <div className="space-y-3">
                    {selectedStockist.phone && (
                      <div className="flex items-center">
                        <Phone size={18} className="mr-3 text-blue-500" />
                        <div>
                          <div className="text-sm text-gray-500">Phone</div>
                          <div className="font-medium">
                            {selectedStockist.phone}
                          </div>
                        </div>
                      </div>
                    )}
                    {selectedStockist.address && (
                      <div className="flex items-start">
                        <MapPin size={18} className="mr-3 mt-1 text-blue-500" />
                        <div>
                          <div className="text-sm text-gray-500">Address</div>
                          <div className="font-medium">
                            {selectedStockist.address}
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="flex items-start">
                      <Clock size={18} className="mr-3 mt-1 text-blue-500" />
                      <div>
                        <div className="text-sm text-gray-500">
                          Business Hours
                        </div>
                        <div className="font-medium">Mon-Sat: 9am - 8pm</div>
                        <div className="text-sm text-gray-500">
                          Sunday: Closed
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="bg-green-50 p-4 rounded-xl">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <Pill size={20} className="mr-2 text-green-600" />
                    Available Medicines
                  </h3>
                  {selectedStockist.Medicines &&
                  selectedStockist.Medicines.length > 0 ? (
                    <ul className="space-y-2">
                      {selectedStockist.Medicines.map((medicine, idx) => (
                        <li
                          key={idx}
                          className="flex items-center bg-white p-3 rounded-lg shadow-sm"
                        >
                          <span className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                            <Pill size={16} className="text-green-600" />
                          </span>
                          <span className="font-medium">{medicine}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-600">No medicines listed</p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-gray-200 flex justify-between items-center">
              <p className="text-sm text-gray-500">
                Last updated: April 28, 2025
              </p>
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow transition-all hover:shadow-lg"
                onClick={() => setSelectedStockist(null)}
              >
                Close Details
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-blue-400 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-lg text-gray-700">Loading stockists...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        {/* Header section */}
        <div className="mb-8">
          <motion.div
            className="flex flex-col md:flex-row md:items-center md:justify-between"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="mb-4 md:mb-0">
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800">
                <span className="text-blue-700">Medicine</span> Stockists
              </h1>
              <p className="text-gray-600 mt-2">
                Showing stockists with{" "}
                <span className="font-semibold text-blue-600">{medicine}</span>
              </p>
            </div>

            <div className="relative w-full md:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                className="bg-white border border-gray-200 text-gray-700 rounded-lg pl-10 pr-4 py-2 w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                placeholder="Search medicines..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </motion.div>

          <motion.div
            className="mt-4 bg-blue-600 text-white p-4 rounded-lg shadow-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <div className="flex items-start">
              <Pill size={24} className="mr-3 mt-1" />
              <div>
                <h2 className="font-bold text-lg">
                  Why Choose Local Stockists?
                </h2>
                <p className="mt-1 text-blue-100">
                  Supporting local stockists ensures you get authentic medicines
                  and personalized service. Click on any stockist to see more
                  details.
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Main content */}
        <AnimatePresence mode="wait">
          {selectedStockist ? (
            <StockistDetails />
          ) : (
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {filteredStockists.length > 0 ? (
                filteredStockists.map((stockist, index) => (
                  <StockistCard key={index} stockist={stockist} index={index} />
                ))
              ) : (
                <div className="col-span-full flex justify-center py-16">
                  <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md">
                    <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Info size={32} className="text-amber-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">
                      No Results
                    </h3>
                    <p className="text-gray-600">
                      No stockists found with medicine "
                      <strong>{searchQuery}</strong>". Try searching for a
                      different medicine or checking your spelling.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer section */}
        <motion.div
          className="mt-12 text-center text-gray-500 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          <p>
            © 2025 DK Pharma. All stockist information is updated regularly.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default MedicineRes;
