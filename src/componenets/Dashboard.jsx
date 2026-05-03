import React from "react";
import { useNavigate } from "react-router-dom";
import Nav from "./Nav";
import Screen from "./Screen";

export default function Dashboard() {
  // try to get react-router navigate; fallback to window.history
  let navigateFn;
  try {
    const useNav = useNavigate();
    navigateFn = (path) => useNav(path);
  } catch (e) {
    navigateFn = (path) => {
      // allow both path strings and { name: '...', params: {...} } if someone passes that
      if (typeof path === "string") {
        window.location.href = path;
      } else if (path && path.name) {
        // fallback: try simple mapping to URL
        window.location.href = path.name;
      }
    };
  }

  // Provide a navigation-like object for components expecting `navigation.navigate(...)`
  const navigation = {
    navigate: navigateFn,
    goBack: () => window.history.back(),
    // you can add more helpers if needed (replace, push, etc.)
  };

  return (
    <div className="min-h-screen bg-white overflow-y-auto">
      {/* Nav and Screen are expected to be React components (web). 
          They will receive a `navigation` prop similar to React Native. */}
      <Nav navigation={navigation} />
      {/* Special 'Add Admin' button for a specific email */}
      {(() => {
        try {
          const userStr = localStorage.getItem("user");
          if (!userStr) return null;
          const user = JSON.parse(userStr);
          const email = (user && (user.email || "")).toString().toLowerCase();
          if (email === "danishkhaannn34@gmail.com") {
            return (
              <div className="p-6">
                <button
                  onClick={() => {
                    try {
                      navigation && navigation.navigate
                        ? navigation.navigate("/adminpanel")
                        : (window.location.href = "/adminpanel");
                    } catch (e) {
                      window.location.href = "/adminpanel";
                    }
                  }}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-4 py-2 rounded"
                >
                  Add Admin
                </button>
              </div>
            );
          }
        } catch (e) {
          return null;
        }
        return null;
      })()}
      <Screen navigation={navigation} />
    </div>
  );
}
