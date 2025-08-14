import React, { useState, useEffect } from "react";
import {
  Search,
  Menu,
  X,
  Home,
  Info,
  Phone,
  LogIn,
  UserPlus,
  ChevronDown,
  User,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

function Nav() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filterType, setFilterType] = useState("company");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedStockists, setSelectedStockists] = useState([]);
  const [showAllResults, setShowAllResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const sectionData = [
    {
      title: "Amit Marketing",
      phone: "9826000000",
      address: "NH Road, Indore",
      items: ["Leeford", "Zevintus", "Cipla", "Sun Pharma"],
      Medicines: ["Tramonil-plus", "Paracetamol", "Amoxicillin", "Omeprazole"],
    },
    {
      title: "Jain Brothers",
      phone: "9826111111",
      address: "MG Road, Bhopal",
      items: ["Abbott", "Abb", "Dr. Reddy's", "Lupin"],
      Medicines: ["Vomiford-md", "concor 2.5", "Azithromycin", "Metformin"],
    },
    {
      title: "Vishal Marketing",
      phone: "9826222222",
      address: "Station Road, Ujjain",
      items: ["Another Brand 1", "Another Brand 2", "Glenmark", "Torrent"],
      Medicines: ["Dsr", "Cetirizine", "Pantoprazole", "Amlodipine"],
    },
    {
      title: "Rajesh Marketing",
      phone: "9826333333",
      address: "Main Market, Dewas",
      items: ["More Products", "Leeford", "Zevintus", "Cadila"],
      Medicines: ["Ibuprofen", "Ranitidine", "Cetirizine", "Metronidazole"],
    },
    {
      title: "MediCare Solutions",
      phone: "9826444444",
      address: "Central Plaza, Indore",
      items: ["Abbott", "Abb", "Biocon", "Wockhardt"],
      Medicines: ["Insulin", "Glimepiride", "Sitagliptin", "Vildagliptin"],
    },
    {
      title: "HealthCare Plus",
      phone: "9826555555",
      address: "Business Park, Bhopal",
      items: ["Another Brand 1", "Another Brand 2", "Aurobindo", "Divis"],
      Medicines: ["Losartan", "Telmisartan", "Olmesartan", "Valsartan"],
    },
    {
      title: "Pharma Express",
      phone: "9826666666",
      address: "Industrial Area, Ujjain",
      items: ["Leeford", "Zevintus", "Alkem", "Intas"],
      Medicines: ["Atorvastatin", "Rosuvastatin", "Simvastatin", "Pravastatin"],
    },
    {
      title: "MediLink Distributors",
      phone: "9826777777",
      address: "Trade Center, Dewas",
      items: ["Cipla", "Sun Pharma", "Glenmark", "Torrent"],
      Medicines: [
        "Montelukast",
        "Levocetirizine",
        "Fexofenadine",
        "Desloratadine",
      ],
    },
  ];

  // Get all unique items for each filter type
  const getAllItems = (type) => {
    if (type === "company") {
      const allCompanies = new Set();
      sectionData.forEach((section) =>
        section.items?.forEach((item) => allCompanies.add(item))
      );
      return Array.from(allCompanies);
    } else if (type === "stockist") {
      return sectionData.map((section) => section.title);
    } else if (type === "medicine") {
      const allMedicines = new Set();
      sectionData.forEach((section) =>
        section.Medicines?.forEach((med) => allMedicines.add(med))
      );
      return Array.from(allMedicines);
    }
    return [];
  };

  // Handle filter type change
  const handleFilterTypeChange = (newType) => {
    setFilterType(newType);
    setSearchQuery("");
    setSelectedStockists([]);
    setShowAllResults(true);

    // Show all items of the selected type
    const allItems = getAllItems(newType);
    if (newType === "stockist") {
      setSelectedStockists(sectionData);
    } else if (newType === "company") {
      const companyStockists = [];
      allItems.forEach((company) => {
        const stockists = sectionData.filter(
          (section) => section.items && section.items.includes(company)
        );
        companyStockists.push(...stockists);
      });
      setSelectedStockists([...new Set(companyStockists)]);
    } else if (newType === "medicine") {
      const medicineStockists = [];
      allItems.forEach((medicine) => {
        const stockists = sectionData.filter(
          (section) => section.Medicines && section.Medicines.includes(medicine)
        );
        medicineStockists.push(...stockists);
      });
      setSelectedStockists([...new Set(medicineStockists)]);
    }
  };

  useEffect(() => {
    const query = searchQuery.toLowerCase();
    let resultSet = new Set();

    if (filterType === "company") {
      sectionData.forEach((section) =>
        section.items?.forEach((item) => {
          if (item.toLowerCase().includes(query)) {
            resultSet.add(item);
          }
        })
      );
    } else if (filterType === "stockist") {
      sectionData.forEach((section) => {
        if (section.title.toLowerCase().includes(query)) {
          resultSet.add(section.title);
        }
      });
    } else if (filterType === "medicine") {
      sectionData.forEach((section) =>
        section.Medicines?.forEach((med) => {
          if (med.toLowerCase().includes(query)) {
            resultSet.add(med);
          }
        })
      );
    }

    const results = [...resultSet];
    setSuggestions(results);
    setShowSuggestions(query.length > 0 && results.length > 0);
  }, [searchQuery, filterType]);

  const handleSuggestionClick = (suggestion) => {
    setIsLoading(true);
    setSearchQuery(suggestion);
    setShowSuggestions(false);

    // Simulate a small delay for better UX
    setTimeout(() => {
      let stockists = [];
      if (filterType === "stockist") {
        stockists = sectionData.filter(
          (section) => section.title === suggestion
        );
      } else if (filterType === "company") {
        stockists = sectionData.filter(
          (section) => section.items && section.items.includes(suggestion)
        );
      } else if (filterType === "medicine") {
        stockists = sectionData.filter(
          (section) =>
            section.Medicines && section.Medicines.includes(suggestion)
        );
      }
      setSelectedStockists(stockists);
      setShowAllResults(false);
      setIsLoading(false);
    }, 300);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    if (e.target.value === "") {
      setShowAllResults(true);
      // Show all items of current filter type
      const allItems = getAllItems(filterType);
      if (filterType === "stockist") {
        setSelectedStockists(sectionData);
      } else if (filterType === "company") {
        const companyStockists = [];
        allItems.forEach((company) => {
          const stockists = sectionData.filter(
            (section) => section.items && section.items.includes(company)
          );
          companyStockists.push(...stockists);
        });
        setSelectedStockists([...new Set(companyStockists)]);
      } else if (filterType === "medicine") {
        const medicineStockists = [];
        allItems.forEach((medicine) => {
          const stockists = sectionData.filter(
            (section) =>
              section.Medicines && section.Medicines.includes(medicine)
          );
          medicineStockists.push(...stockists);
        });
        setSelectedStockists([...new Set(medicineStockists)]);
      }
    }
  };

  const clearResults = () => {
    setSearchQuery("");
    setSelectedStockists([]);
    setShowSuggestions(false);
    setShowAllResults(false);
  };

  const handleLoginClick = () => navigate("/login");
  const handleSignupClick = () => navigate("/signup");
  const handleProfileClick = () => navigate("/profile");

  // Filter type options with icons
  const filterOptions = [
    { value: "medicine", label: "Medicine", icon: "💊" },
    { value: "company", label: "Company", icon: "🏢" },
    { value: "stockist", label: "Stockist", icon: "🏪" },
  ];

  // Navigation links
  const navLinks = [
    { href: "#", label: "Home", icon: <Home size={18} /> },
    { href: "#", label: "About", icon: <Info size={18} /> },
    { href: "#", label: "Contact", icon: <Phone size={18} /> },
  ];

  // Initialize with all companies on component mount
  useEffect(() => {
    handleFilterTypeChange("company");
  }, []);

  return (
    <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-amber-50 w-full shadow-xl relative">
      <div className="max-w-7xl mx-auto">
        {/* Header section */}
        <div className="flex items-center justify-between px-4 py-4 md:py-6">
          {/* Logo */}
          <div className="relative flex items-center justify-center">
            <div className="relative w-20 h-20 flex items-center justify-center">
              <span className="text-blue-600 text-4xl font-bold absolute z-10 left-3">
                D
              </span>
              <span className="text-red-600 text-4xl font-bold absolute z-10 right-4">
                K
              </span>
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-red-100 rounded-full flex items-center justify-center shadow-lg">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-inner">
                  {"/cd774852582f4e41232a6ebd5886e0bc-removebg-preview.png" && (
                    <img
                      src="/cd774852582f4e41232a6ebd5886e0bc-removebg-preview.png"
                      alt="MedTrap Logo"
                    />
                  )}
                </div>
              </div>
            </div>
            <div className="ml-3">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-red-600 bg-clip-text text-transparent">
                MedTrap
              </h1>
              <p className="text-xs text-gray-600 -mt-1">Medical Solutions</p>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              className="p-3 rounded-full bg-white shadow-lg text-blue-600 hover:bg-blue-50 transition-all duration-200 transform hover:scale-105 active:scale-95"
              onClick={() => setIsMenuOpen((prev) => !prev)}
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center gap-8">
            <nav className="flex items-center space-x-8">
              {navLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.href}
                  className="flex items-center gap-2 font-medium text-gray-700 hover:text-blue-600 transition-all duration-200 relative group transform hover:scale-105 active:scale-95"
                >
                  <span className="text-blue-500 group-hover:text-blue-600 transition-colors">
                    {link.icon}
                  </span>
                  <span>{link.label}</span>
                  <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300"></div>
                </a>
              ))}
            </nav>
            <div className="flex items-center gap-3">
              {localStorage.getItem("token") ? (
                <button
                  onClick={handleProfileClick}
                  className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-2.5 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 font-medium transform hover:scale-105 active:scale-95 hover:-translate-y-0.5"
                >
                  <User size={18} />
                  <span>Profile</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={handleLoginClick}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2.5 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 font-medium transform hover:scale-105 active:scale-95 hover:-translate-y-0.5"
                  >
                    <LogIn size={18} />
                    <span>Login</span>
                  </button>
                  <button
                    onClick={handleSignupClick}
                    className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-2.5 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 font-medium transform hover:scale-105 active:scale-95 hover:-translate-y-0.5"
                  >
                    <UserPlus size={18} />
                    <span>Sign Up</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden overflow-hidden animate-in slide-in-from-top-2 duration-300">
            <div className="px-4 pb-4">
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-4 border border-white/20">
                <div className="space-y-3">
                  {navLinks.map((link, index) => (
                    <a
                      key={index}
                      href={link.href}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 group transform hover:scale-105 active:scale-95"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <span className="text-blue-600 group-hover:text-blue-700 transition-colors">
                        {link.icon}
                      </span>
                      <span className="font-medium text-gray-700 group-hover:text-blue-700 transition-colors">
                        {link.label}
                      </span>
                    </a>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                  {localStorage.getItem("token") ? (
                    <button
                      onClick={handleProfileClick}
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95"
                    >
                      <User size={18} />
                      <span>Profile</span>
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleLoginClick}
                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95"
                      >
                        <LogIn size={18} />
                        <span>Login</span>
                      </button>
                      <button
                        onClick={handleSignupClick}
                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95"
                      >
                        <UserPlus size={18} />
                        <span>Sign Up</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search section */}
        <div className="px-4 pb-6 relative">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-4 border border-white/20">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search size={20} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-gray-800 rounded-xl pl-12 pr-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 placeholder-gray-500"
                  placeholder={`Search for ${filterType}...`}
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => setShowSuggestions(true)}
                />
                {searchQuery && (
                  <button
                    onClick={clearResults}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>

              <div className="relative min-w-48">
                <select
                  value={filterType}
                  onChange={(e) => handleFilterTypeChange(e.target.value)}
                  className="bg-gradient-to-r from-blue-100 to-indigo-100 border border-blue-200 text-gray-800 rounded-xl px-4 py-3 w-full appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 font-medium"
                >
                  {filterOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.icon} {option.label}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <ChevronDown size={20} className="text-gray-500" />
                </div>
              </div>
            </div>

            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-4 right-4 mt-2 bg-white/95 backdrop-blur-sm border border-blue-100 rounded-xl shadow-2xl z-[999] max-h-72 overflow-auto animate-in slide-in-from-top-2 duration-200">
                <div className="p-2">
                  <div className="px-3 py-2 border-b border-gray-100 mb-2">
                    <p className="text-sm text-gray-600 font-medium">
                      Click on any suggestion to see detailed results
                    </p>
                  </div>
                  {suggestions.map((suggestion, i) => {
                    let phone = null;
                    let additionalInfo = "";

                    if (filterType === "stockist") {
                      const stockist = sectionData.find(
                        (section) => section.title === suggestion
                      );
                      phone = stockist ? stockist.phone : null;
                      additionalInfo = stockist
                        ? `${stockist.items?.length || 0} companies, ${
                            stockist.Medicines?.length || 0
                          } medicines`
                        : "";
                    } else if (filterType === "company") {
                      const stockists = sectionData.filter(
                        (section) =>
                          section.items && section.items.includes(suggestion)
                      );
                      additionalInfo = `Available at ${
                        stockists.length
                      } stockist${stockists.length > 1 ? "s" : ""}`;
                    } else if (filterType === "medicine") {
                      const stockists = sectionData.filter(
                        (section) =>
                          section.Medicines &&
                          section.Medicines.includes(suggestion)
                      );
                      additionalInfo = `Available at ${
                        stockists.length
                      } stockist${stockists.length > 1 ? "s" : ""}`;
                    }

                    return (
                      <div
                        key={i}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 cursor-pointer rounded-lg transition-all duration-200 group transform hover:scale-105 active:scale-95 border border-transparent hover:border-blue-200"
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        <span className="text-xl group-hover:scale-110 transition-transform duration-200">
                          {filterType === "medicine" ? (
                            "💊"
                          ) : filterType === "company" ? (
                            "🏢"
                          ) : (
                            <Phone
                              size={18}
                              className="inline-block text-blue-500"
                            />
                          )}
                        </span>
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-gray-700 group-hover:text-blue-700 transition-colors block">
                            {suggestion}
                          </span>
                          {additionalInfo && (
                            <span className="text-xs text-gray-500 block mt-1">
                              {additionalInfo}
                            </span>
                          )}
                        </div>
                        {phone && (
                          <span className="text-sm text-gray-500 font-semibold flex items-center gap-1 flex-shrink-0">
                            <Phone
                              size={16}
                              className="inline-block text-green-500"
                            />
                            {phone}
                          </span>
                        )}
                        <span className="text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          →
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          {/* Results Display */}
          {selectedStockists.length > 0 && (
            <div className="mt-6">
              {/* Loading Indicator */}
              {isLoading && (
                <div className="mb-4 text-center">
                  <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700"></div>
                    <span className="text-sm font-medium">
                      Loading results...
                    </span>
                  </div>
                </div>
              )}

              {/* Search Result Counter */}
              {searchQuery && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🔍</span>
                      <div>
                        <p className="font-semibold text-blue-800">
                          Search Results for "{searchQuery}"
                        </p>
                        <p className="text-sm text-blue-600">
                          {selectedStockists.length} result
                          {selectedStockists.length > 1 ? "s" : ""} found
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        handleFilterTypeChange(filterType);
                      }}
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 font-medium transform hover:scale-105 active:scale-95"
                    >
                      Show All{" "}
                      {filterType === "stockist"
                        ? "Stockists"
                        : filterType === "company"
                        ? "Companies"
                        : "Medicines"}
                    </button>
                  </div>
                </div>
              )}

              {/* Results Header */}
              <div className="mb-4 text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  {searchQuery ? (
                    <>
                      Search Results for "{searchQuery}"
                      <span className="block text-lg text-blue-600 mt-1">
                        {filterType === "stockist" && "Stockist Details"}
                        {filterType === "company" &&
                          "Stockists with this Company"}
                        {filterType === "medicine" &&
                          "Stockists with this Medicine"}
                      </span>
                    </>
                  ) : (
                    <>
                      {filterType === "stockist" && "All Stockists"}
                      {filterType === "company" && "All Companies"}
                      {filterType === "medicine" && "All Medicines"}
                    </>
                  )}
                </h2>
                <p className="text-gray-600 mb-4">
                  {searchQuery ? (
                    `Found ${selectedStockists.length} result${
                      selectedStockists.length > 1 ? "s" : ""
                    }`
                  ) : (
                    <>
                      {filterType === "stockist" &&
                        `Showing ${selectedStockists.length} stockists`}
                      {filterType === "company" &&
                        `Showing ${selectedStockists.length} stockists with companies`}
                      {filterType === "medicine" &&
                        `Showing ${selectedStockists.length} stockists with medicines`}
                    </>
                  )}
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={clearResults}
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 font-medium transform hover:scale-105 active:scale-95"
                  >
                    Clear Results
                  </button>
                </div>
              </div>

              {/* Results Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {selectedStockists.map((stockist, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-xl shadow-lg p-6 border border-blue-100 hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                  >
                    <h3 className="text-xl font-bold text-blue-700 mb-3">
                      {stockist.title}
                    </h3>

                    <div className="space-y-2 mb-4">
                      <p className="text-gray-700 flex items-center gap-2">
                        <Phone size={16} className="text-green-500" />
                        <span className="font-semibold">Phone:</span>{" "}
                        <span className="text-blue-600">{stockist.phone}</span>
                      </p>
                      <p className="text-gray-700 flex items-center gap-2">
                        <span className="text-gray-500">📍</span>
                        <span className="font-semibold">Address:</span>{" "}
                        <span className="text-blue-600">
                          {stockist.address}
                        </span>
                      </p>
                    </div>

                    {filterType === "company" && stockist.items && (
                      <div className="mb-3">
                        <p className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                          <span className="text-xl">🏢</span>
                          Companies:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {stockist.items.map((company, companyIdx) => (
                            <span
                              key={companyIdx}
                              className={`px-3 py-1 rounded-full text-sm font-medium ${
                                searchQuery &&
                                company
                                  .toLowerCase()
                                  .includes(searchQuery.toLowerCase())
                                  ? "bg-blue-200 text-blue-800 border-2 border-blue-400"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {company}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {filterType === "medicine" && stockist.Medicines && (
                      <div className="mb-3">
                        <p className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                          <span className="text-xl">💊</span>
                          Medicines:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {stockist.Medicines.map((medicine, medIdx) => (
                            <span
                              key={medIdx}
                              className={`px-3 py-1 rounded-full text-sm font-medium ${
                                searchQuery &&
                                medicine
                                  .toLowerCase()
                                  .includes(searchQuery.toLowerCase())
                                  ? "bg-green-200 text-green-800 border-2 border-green-400"
                                  : "bg-green-100 text-green-700"
                              }`}
                            >
                              {medicine}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {filterType === "stockist" && (
                      <div className="space-y-2">
                        {stockist.items && (
                          <div>
                            <p className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                              <span className="text-xl">🏢</span>
                              Companies:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {stockist.items.map((company, companyIdx) => (
                                <span
                                  key={companyIdx}
                                  className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium"
                                >
                                  {company}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {stockist.Medicines && (
                          <div>
                            <p className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                              <span className="text-xl">💊</span>
                              Medicines:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {stockist.Medicines.map((medicine, medIdx) => (
                                <span
                                  key={medIdx}
                                  className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium"
                                >
                                  {medicine}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {searchQuery && <div className="mt-6 text-center"></div>}
            </div>
          )}
        </div>

        {/* Quick stats or additional info */}
        <div className="px-4 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-200 transform hover:scale-105">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🏥</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Stockists</h3>
                  <p className="text-sm text-gray-600">
                    Find verified stockists
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-200 transform hover:scale-105">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">💊</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Medicines</h3>
                  <p className="text-sm text-gray-600">Search all medicines</p>
                </div>
              </div>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-200 transform hover:scale-105">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🏢</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Companies</h3>
                  <p className="text-sm text-gray-600">
                    Browse pharma companies
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Nav;
