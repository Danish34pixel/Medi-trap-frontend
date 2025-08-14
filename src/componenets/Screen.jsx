import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Phone,
  ArrowLeft,
  ExternalLink,
  Search,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

function Screen() {
  const navigate = useNavigate();
  const [selectedSection, setSelectedSection] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  // Check if the viewport is mobile sized
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);

    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  const sectionData = [
    {
      title: "Amit Marketing",
      phone: "9826000000",
      address: "NH Road, Indore",
      image: "/api/placeholder/600/400",
      items: ["Leeford", "Zevintus"],
      Medicines: ["Tramonil-plus"],
    },
    {
      title: "Jain Brothers",
      phone: "9826111111",
      address: "MG Road, Bhopal",
      items: ["Abbott", "Abb"],
      Medicines: ["Vomiford-md"],
    },
    {
      title: "Vishal Marketing",
      phone: "9826222222",
      address: "Station Road, Ujjain",
      items: ["Another Brand 1", "Another Brand 2"],
      Medicines: ["Dsr", "Tramonil-plus"],
    },
    {
      title: "Rajesh Marketing",
      phone: "9826333333",
      address: "Main Market, Dewas",
      items: ["More Products", "Leeford", "Zevintus"],
    },
    {
      title: "Amit Marketing 2",
      phone: "9826000000",
      address: "NH Road, Indore",
      items: ["Leeford", "Zevintus"],
    },
    {
      title: "Jain Brothers 2",
      phone: "9826444444",
      address: "MG Road, Bhopal",
      items: ["Abbott", "Abb"],
    },
    {
      title: "Vishal Marketing 2",
      phone: "9826555555",
      address: "Station Road, Ujjain",
      items: ["Another Brand 1", "Another Brand 2"],
    },
  ];

  // We're now showing all sections without filtering
  const filteredSections = sectionData;

  const generateRandomColor = (index) => {
    const colors = [
      "bg-gradient-to-br from-blue-500 to-blue-600",
      "bg-gradient-to-br from-purple-500 to-purple-600",
      "bg-gradient-to-br from-indigo-500 to-indigo-600",
      "bg-gradient-to-br from-pink-500 to-pink-600",
      "bg-gradient-to-br from-green-500 to-green-600",
      "bg-gradient-to-br from-yellow-500 to-yellow-600",
      "bg-gradient-to-br from-red-500 to-red-600",
    ];
    return colors[index % colors.length];
  };

  const sections = filteredSections.map((section, index) => (
    <motion.div
      key={index}
      className="bg-white rounded-xl overflow-hidden shadow-lg cursor-pointer transform transition-all flex flex-col h-full"
      whileHover={{ scale: isMobile ? 1.01 : 1.03, y: isMobile ? -2 : -5 }}
      transition={{ type: "spring", stiffness: 300 }}
      onClick={() => setSelectedSection(index)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0, transition: { delay: index * 0.05 } }}
    >
      {section.image ? (
        <div className="relative h-40 md:h-48 overflow-hidden">
          <img
            src={section.image}
            alt={section.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        </div>
      ) : (
        <div
          className={`relative h-40 md:h-48 ${generateRandomColor(
            index
          )} flex items-center justify-center`}
        >
          <span className="text-4xl font-bold text-white opacity-80">
            {section.title.charAt(0)}
          </span>
          <div className="absolute inset-0 bg-black bg-opacity-10"></div>
        </div>
      )}

      <div className="p-4 md:p-5 flex-grow flex flex-col">
        <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">
          {section.title}
        </h3>

        <div className="mt-1 flex items-center text-gray-600 mb-1">
          <Phone size={16} className="mr-2 flex-shrink-0" />
          <span className="text-sm">{section.phone}</span>
        </div>

        <div className="flex items-start text-gray-600">
          <MapPin size={16} className="mr-2 mt-1 flex-shrink-0" />
          <span className="text-sm">{section.address}</span>
        </div>

        <div className="mt-3 md:mt-4 flex-grow">
          <div className="flex flex-wrap gap-1 md:gap-2">
            {section.items.slice(0, isMobile ? 2 : 3).map((item, idx) => (
              <span
                key={idx}
                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md"
              >
                {item}
              </span>
            ))}
            {section.items.length > (isMobile ? 2 : 3) && (
              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
                +{section.items.length - (isMobile ? 2 : 3)} more
              </span>
            )}
          </div>
        </div>

        <div className="mt-3 md:mt-4 pt-2 border-t border-gray-100 flex justify-between items-center">
          {section.Medicines && (
            <div className="flex items-center">
              <span className="text-xs text-green-600 font-medium">
                {section.Medicines.length} medicines
              </span>
            </div>
          )}
          <span className="text-xs text-blue-600 font-medium flex items-center gap-1">
            View details
            <ExternalLink size={12} />
          </span>
        </div>
      </div>
    </motion.div>
  ));

  const renderSectionContent = () => {
    if (selectedSection === null) {
      return (
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Results count - no search bar now, so just showing total */}
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              {filteredSections.length}{" "}
              {filteredSections.length === 1 ? "result" : "results"}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {sections}
          </div>
        </motion.div>
      );
    }

    const currentSection = filteredSections[selectedSection];

    return (
      <motion.div
        className="flex items-center justify-center py-4 md:py-8 px-0 md:px-24"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          className="bg-white rounded-xl overflow-hidden w-full max-w-4xl shadow-xl"
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.4, type: "spring", stiffness: 120 }}
        >
          {currentSection.image ? (
            <div className="relative h-48 sm:h-64 md:h-80 w-full">
              <img
                src={currentSection.image}
                alt={currentSection.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
              <div className="absolute bottom-0 left-0 p-4 md:p-8 text-white">
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-1 md:mb-2">
                  {currentSection.title}
                </h2>
                <p className="text-white/80 text-sm md:text-base max-w-2xl">
                  {currentSection.address}
                </p>
              </div>
            </div>
          ) : (
            <div
              className={`relative h-48 sm:h-64 md:h-80 w-full ${generateRandomColor(
                selectedSection
              )}`}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
              <div className="absolute bottom-0 left-0 p-4 md:p-8 text-white">
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-1 md:mb-2">
                  {currentSection.title}
                </h2>
                <p className="text-white/80 text-sm md:text-base max-w-2xl">
                  {currentSection.address}
                </p>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-6xl md:text-8xl font-bold text-white/30">
                  {currentSection.title.charAt(0)}
                </span>
              </div>
            </div>
          )}

          <div className="p-4 md:p-8">
            {/* Mobile Specific Call Button (Sticky at Top) */}
            {isMobile && (
              <div className="mb-6 -mt-2">
                <a
                  href={`tel:${currentSection.phone}`}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Phone size={20} />
                  Call {currentSection.title}
                </a>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-6 md:mb-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-3 md:mb-4">
                  Contact Information
                </h3>
                <div className="space-y-3">
                  {currentSection.phone && (
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                        <Phone size={20} className="text-blue-600" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Phone</div>
                        <div className="text-gray-800 font-medium">
                          {currentSection.phone}
                        </div>
                      </div>
                    </div>
                  )}

                  {currentSection.address && (
                    <div className="flex items-start">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3 mt-1">
                        <MapPin size={20} className="text-blue-600" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Address</div>
                        <div className="text-gray-800 font-medium">
                          {currentSection.address}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-3 md:mb-4">
                  Company
                </h3>
                <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
                  <ul className="space-y-2">
                    {currentSection.items.map((item, idx) => (
                      <li key={idx} className="flex items-center">
                        <span className="w-6 h-6 flex items-center justify-center bg-blue-600 text-white rounded-full text-xs mr-3">
                          {idx + 1}
                        </span>
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {currentSection.Medicines && (
                  <div className="mt-5 md:mt-6">
                    <h3 className="text-lg font-semibold text-gray-700 mb-3 md:mb-4">
                      Medicines
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {currentSection.Medicines.map((medicine, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                        >
                          {medicine}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center border-t border-gray-100 pt-4 md:pt-6">
              <button
                className="flex items-center gap-1 md:gap-2 px-3 md:px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm md:text-base"
                onClick={() => setSelectedSection(null)}
              >
                <ArrowLeft size={isMobile ? 16 : 20} />
                {isMobile ? "Back" : "Back to directory"}
              </button>

              {/* Call Button is only in the footer for Desktop */}
              {!isMobile && (
                <a
                  href={`tel:${currentSection.phone}`}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <Phone size={20} />
                  Call now
                </a>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 min-h-screen">
      <div className="container mx-auto px-4 py-6 md:py-12">
        <header className="mb-6 md:mb-10">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Marketing Directory
            </h1>
            <p className="text-gray-600 mt-1 md:mt-2 text-sm md:text-base">
              Find the best marketing partners for your business
            </p>
          </div>
        </header>

        <AnimatePresence mode="wait">{renderSectionContent()}</AnimatePresence>
      </div>

      {/* Mobile Bottom Action Bar - Only visible when in main view */}
      {isMobile && selectedSection === null && (
        <motion.div
          className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-around shadow-lg"
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <button className="flex flex-col items-center">
            <svg
              className="w-6 h-6 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            <span className="text-xs mt-1">Home</span>
          </button>
          <button className="flex flex-col items-center">
            <svg
              className="w-6 h-6 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 10h16M4 14h16M4 18h16"
              />
            </svg>
            <span className="text-xs mt-1">Categories</span>
          </button>
          <button className="flex flex-col items-center">
            <svg
              className="w-6 h-6 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
              />
            </svg>
            <span className="text-xs mt-1">Saved</span>
          </button>
          <button className="flex flex-col items-center">
            <svg
              className="w-6 h-6 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span
              onClick={() => navigate("/profile")}
              className="text-xs mt-1 cursor-pointer"
            >
              Profile
            </span>
          </button>
        </motion.div>
      )}
    </div>
  );
}

export default Screen;
