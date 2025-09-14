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
      <Screen navigation={navigation} />
    </div>
  );
}
