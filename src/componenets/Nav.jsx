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
} from "lucide-react";
import { useNavigate } from "react-router-dom";

function Nav() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filterType, setFilterType] = useState("company");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const sectionData = [
    {
      title: "Amit Marketing",
      phone: "9826000000",
      address: "NH Road, Indore",
      items: ["Leeford", "Zevintus"],
      Medicines: ["Tramonil-plus"],
    },
    {
      title: "Jain Brothers",
      phone: "9826111111",
      address: "MG Road, Bhopal",
      items: ["Abbott", "Abb"],
      Medicines: ["Vomiford-md", "concor 2.5"],
    },
    {
      title: "Vishal Marketing",
      phone: "9826222222",
      address: "Station Road, Ujjain",
      items: ["Another Brand 1", "Another Brand 2"],
      Medicines: ["Dsr"],
    },
    {
      title: "Rajesh Marketing",
      phone: "9826333333",
      address: "Main Market, Dewas",
      items: ["More Products", "Leeford", "Zevintus"],
    },
    {
      title: "Amit Marketing",
      phone: "9826000000",
      address: "NH Road, Indore",
      items: ["Leeford", "Zevintus"],
    },
    {
      title: "Jain Brothers",
      phone: "9826444444",
      address: "MG Road, Bhopal",
      items: ["Abbott", "Abb"],
    },
    {
      title: "Vishal Marketing",
      phone: "9826555555",
      address: "Station Road, Ujjain",
      items: ["Another Brand 1", "Another Brand 2"],
    },
  ];

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
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    // Navigation logic would go here
    console.log(`Navigating to: ${suggestion}`);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleLoginClick = () => navigate("/signup");
  const handleSignupClick = () => navigate("/login");

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
              </div>

              <div className="relative min-w-48">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
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
              <div className="absolute top-full left-4 right-4 mt-2 bg-white/95 backdrop-blur-sm border border-blue-100 rounded-xl shadow-2xl z-50 max-h-72 overflow-auto animate-in slide-in-from-top-2 duration-200">
                <div className="p-2">
                  {suggestions.map((suggestion, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 cursor-pointer rounded-lg transition-all duration-200 group transform hover:scale-105 active:scale-95"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      <span className="text-xl group-hover:scale-110 transition-transform duration-200">
                        {filterType === "medicine"
                          ? "💊"
                          : filterType === "company"
                          ? "🏢"
                          : "🏪"}
                      </span>
                      <span className="font-medium text-gray-700 group-hover:text-blue-700 transition-colors">
                        {suggestion}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
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
