// Ported from the MediTrap React Native app's utils/getHomeRouteForRole.js.
// Single source of truth for role -> route mapping. Pure function, no side effects.
// See docs/LOGIC_REFERENCE.md §1.5 and docs/APP_WIRING_REFERENCE.md §1.
//
// Web route mapping (adapted from RN routes):
//   RN /Home                      -> web /dashboard
//   RN /Purchaser/{userId}        -> web /purchaser/{userId}
//   RN /Stockist/stockist-dashboard -> web /stockist-outcode
//   RN /Staff/{userId}            -> web /staff/{userId}
//   RN /Admin                     -> web /adminpanel (existing admin route)
//   RN / (fallback)               -> web / (role-select)
export default function getHomeRouteForRole(role, userId) {
  const normalized = String(role || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, "");

  if (
    ["medicalowner", "medicalretailer", "retailer", "medical", "user"].includes(
      normalized
    )
  ) {
    return "/dashboard";
  }

  if (normalized === "purchaser") {
    return userId ? `/purchaser/${userId}` : "/purchaserLogin";
  }

  if (normalized === "stockist") {
    return "/stockist-outcode";
  }

  if (normalized === "staff") {
    return userId ? `/staff/${userId}` : "/staff-login";
  }

  if (normalized === "admin") {
    return "/adminpanel";
  }

  console.warn(`getHomeRouteForRole: unrecognized role "${role}", falling back to /`);
  return "/";
}
