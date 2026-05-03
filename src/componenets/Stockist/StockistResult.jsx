import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Phone,
  Search,
  ArrowLeft,
  X,
  Building,
  Image as ImageIcon,
} from "lucide-react";

function StockistResult() {
  const location = useLocation();
  const { company, stockists } = location.state || {};
  const [selectedStockist, setSelectedStockist] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredStockists, setFilteredStockists] = useState([]);

  useEffect(() => {
    console.log(stockists); // Debugging: Check stockists data
    if (stockists) {
      setFilteredStockists(stockists);
    }
  }, [stockists]);

  useEffect(() => {
    if (stockists) {
      const filtered = stockists.filter(
        (stockist) =>
          stockist.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (stockist.address &&
            stockist.address.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredStockists(filtered);
    }
  }, [searchTerm, stockists]);

  if (!company || !stockists || stockists.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md">
          <div className="flex justify-center mb-6">
            <Building size={48} className="text-blue-500" />
          </div>
          <h1 className="text-3xl font-bold mb-4 text-gray-800">
            No Results Found
          </h1>
          <p className="text-lg text-gray-600">
            Please try searching for a different company or stockist.
          </p>
          <button
            onClick={() => window.history.back()}
            className="mt-8 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow transition-all font-medium"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const renderStockistCard = (stockist, index) => (
    <motion.div
      key={index}
      className="bg-white shadow-lg rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col h-full"
      onClick={() => setSelectedStockist(index)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ y: -5 }}
    >
      {stockist.image ? (
        <div className="relative h-48 overflow-hidden">
          <img
            src={stockist.image}
            alt={stockist.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
        </div>
      ) : (
        <div className="h-48 bg-gray-100 flex items-center justify-center">
          <ImageIcon size={48} className="text-gray-300" />
        </div>
      )}

      <div className="p-5 flex-grow flex flex-col justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-800 mb-3 line-clamp-2">
            {stockist.title}
          </h3>

          <div className="space-y-2">
            {stockist.phone && (
              <div className="flex items-center text-gray-600">
                <Phone size={16} className="mr-2 flex-shrink-0 text-blue-500" />
                <p className="text-sm">{stockist.phone}</p>
              </div>
            )}

            {stockist.address && (
              <div className="flex items-start text-gray-600">
                <MapPin
                  size={16}
                  className="mr-2 mt-1 flex-shrink-0 text-blue-500"
                />
                <p className="text-sm line-clamp-2">{stockist.address}</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100">
          <button className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium text-sm py-2 rounded-lg transition-colors">
            View Details
          </button>
        </div>
      </div>
    </motion.div>
  );

  const renderStockistDetails = () => {
    if (selectedStockist === null) {
      return (
        <>
          <div className="mb-6 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search stockists by name or address..."
              className="w-full pl-10 pr-4 py-3 bg-white rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {filteredStockists.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-8 text-center">
              <div className="flex justify-center mb-4">
                <Search size={48} className="text-gray-300" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No matching stockists
              </h3>
              <p className="text-gray-600">Try adjusting your search terms</p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <motion.div
              key="list"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              {filteredStockists.map((stockist, index) =>
                renderStockistCard(stockist, index)
              )}
            </motion.div>
          )}
        </>
      );
    }

    const stockist = stockists[selectedStockist];

    return (
      <motion.div
        key="details"
        className="bg-white shadow-xl rounded-xl overflow-hidden max-w-4xl mx-auto"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.4 }}
      >
        <div className="relative">
          {stockist.image ? (
            <div className="relative h-64 md:h-80">
              <img
                src={stockist.image}
                alt={stockist.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
              <h2 className="absolute bottom-0 left-0 p-6 text-3xl font-bold text-white">
                {stockist.title}
              </h2>
            </div>
          ) : (
            <div className="bg-blue-600 p-6">
              <h2 className="text-3xl font-bold text-white">
                {stockist.title}
              </h2>
            </div>
          )}

          <button
            onClick={() => setSelectedStockist(null)}
            className="absolute top-4 right-4 bg-white/90 hover:bg-white p-2 rounded-full shadow-md transition-all"
            aria-label="Close details"
          >
            <X size={20} className="text-gray-800" />
          </button>
        </div>

        <div className="p-6 md:p-8">
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {stockist.phone && (
              <div className="flex items-start">
                <Phone
                  size={20}
                  className="mr-3 text-blue-600 flex-shrink-0 mt-1"
                />
                <div>
                  <h3 className="font-semibold text-gray-700 mb-1">Phone</h3>
                  <p className="text-gray-600">{stockist.phone}</p>
                </div>
              </div>
            )}

            {stockist.address && (
              <div className="flex items-start">
                <MapPin
                  size={20}
                  className="mr-3 text-blue-600 flex-shrink-0 mt-1"
                />
                <div>
                  <h3 className="font-semibold text-gray-700 mb-1">Address</h3>
                  <p className="text-gray-600">{stockist.address}</p>
                </div>
              </div>
            )}
          </div>

          {stockist.items && stockist.items.length > 0 && (
            <div className="mt-6">
              <h3 className="text-xl font-bold mb-4 text-gray-800">
                Available Items
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <ul className="space-y-2">
                  {stockist.items.map((item, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className=" bg-blue-100 text-blue-800 font-medium rounded-full h-6 w-6 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div className="mt-8 flex justify-center">
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow transition-all flex items-center font-medium"
              onClick={() => setSelectedStockist(null)}
            >
              <ArrowLeft size={18} className="mr-2" />
              Back to Stockists
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-blue-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="mb-8 bg-white rounded-xl shadow-md p-6 flex flex-col sm:flex-row items-center justify-between"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4 sm:mb-0 text-center sm:text-left">
            Stockists <span className="text-blue-600">{company}</span>
          </h1>

          <div className="flex items-center text-gray-600">
            {filteredStockists.length > 0 && (
              <span className="bg-blue-100 text-blue-800 font-medium py-1 px-3 rounded-full text-sm">
                {filteredStockists.length}{" "}
                {filteredStockists.length === 1 ? "location" : "locations"}{" "}
                found
              </span>
            )}
            {selectedStockist !== null && (
              <button
                onClick={() => setSelectedStockist(null)}
                className="flex items-center text-blue-600 hover:text-blue-800 font-medium ml-4"
              >
                <ArrowLeft size={16} className="mr-1" />
                Back to List
              </button>
            )}
          </div>
        </motion.div>

        {renderStockistDetails()}
      </div>
    </div>
  );
}

export default StockistResult;
