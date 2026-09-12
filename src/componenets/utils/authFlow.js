// Ported from the MediTrap React Native app's AuthFlowScreen + authService.
// See docs/LOGIC_REFERENCE.md §1.3-1.6 and §5 (state/storage table).
import { setCookie, removeCookie } from "./cookies";
import getHomeRouteForRole from "./getHomeRouteForRole";

// Tolerate multiple backend response shapes for the auth payload
// (data.token, data.accessToken, data.data.token, data.user, data.purchaser,
// data.profile, etc — backend field-name variance, per LOGIC_REFERENCE §1.4/§4).
export function extractAuthPayload(data) {
  if (!data || typeof data !== "object") return {};
  const nested = data.data && typeof data.data === "object" ? data.data : {};
  const accessToken =
    data.accessToken || data.token || nested.accessToken || nested.token || null;
  const refreshToken =
    data.refreshToken || nested.refreshToken || data.refresh_token || null;
  const user = data.user || data.purchaser || data.profile || nested.user || null;
  return { accessToken, refreshToken, user };
}

// Trial-expired / payment-required detection rule (LOGIC_REFERENCE §4, §6):
// success:false (or thrown error) but the response still carries an
// accessToken == payment required, NOT a real login failure. Message text is
// explicitly not treated as a stable enum, so we never pattern-match on it.
export function isTrialExpiredResponse(success, data) {
  if (success !== false) return false;
  const { accessToken } = extractAuthPayload(data || {});
  return Boolean(accessToken);
}

// Persist auth state to localStorage + cookie (web equivalent of
// AsyncStorage + secureStorage — see LOGIC_REFERENCE §5 storage table).
export function persistAuthState({ accessToken, refreshToken, user, role }) {
  try {
    if (accessToken) {
      localStorage.setItem("token", accessToken);
      setCookie("token", accessToken, 7);
    }
    if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
    if (user) localStorage.setItem("user", JSON.stringify(user));
    if (role) localStorage.setItem("role", role);
  } catch (e) {
    // ignore storage failures (private mode, quota, etc.)
  }
}

// Stockist approval check — tolerates two backend conventions
// (LOGIC_REFERENCE §4): user.approved === true OR user.status in
// {"approved","Approved"}.
export function isStockistApproved(user) {
  if (!user) return false;
  if (user.approved === true) return true;
  if (user.status === "approved" || user.status === "Approved") return true;
  return false;
}

// The core redirect logic (LOGIC_REFERENCE §1.4). `requestedRole` is the role
// the user logged in as (the prop/role passed to the login screen); the
// backend's returned user.role is the single source of truth for routing.
export function applyAuthResult(data, { requestedRole, navigate } = {}) {
  const { accessToken, refreshToken, user } = extractAuthPayload(data);
  const dbRole = (user && user.role) || requestedRole;

  persistAuthState({ accessToken, refreshToken, user, role: dbRole });

  if (import.meta.env.DEV) {
    console.debug("applyAuthResult:", {
      requestedRole,
      returnedRole: user && user.role,
      dbRole,
      uid: user && (user._id || user.id),
      user,
    });
  }

  const normalizedRole = String(dbRole || "").toLowerCase();
  if (normalizedRole === "stockist" && !isStockistApproved(user)) {
    try {
      if (user && (user._id || user.id)) {
        localStorage.setItem("pendingStockistId", user._id || user.id);
      }
    } catch (e) {}
    navigate("/stockist/verification", { replace: true });
    return { destination: "/stockist/verification", user, dbRole };
  }

  const uid = user && (user._id || user.id);
  const destination = getHomeRouteForRole(dbRole, uid);
  navigate(destination, { replace: true });
  return { destination, user, dbRole };
}

// Called when isTrialExpiredResponse() is true: persist the auth state
// (user is already "logged in" for authenticated calls even though they
// haven't reached a home screen — LOGIC_REFERENCE §6) and return the
// accountStatus to drive the payment modal.
export function handleTrialExpired(data, { requestedRole } = {}) {
  const { accessToken, refreshToken, user } = extractAuthPayload(data);
  const dbRole = (user && user.role) || requestedRole;
  persistAuthState({ accessToken, refreshToken, user, role: dbRole });
  return data && data.accountStatus;
}

// "Pay Now" / "Check Status" CTA routing (LOGIC_REFERENCE §6):
// pending_admin_verification -> /payment-pending (already paid, awaiting
// admin approval, avoids a duplicate charge); otherwise -> /SubscriptionPlans.
export function goToPayment(navigate, accountStatus) {
  if (accountStatus === "pending_admin_verification") {
    navigate("/payment-pending");
  } else {
    navigate("/SubscriptionPlans");
  }
}

// Remember-me identifier persistence, keyed per role so switching roles
// doesn't clobber another role's saved identifier (LOGIC_REFERENCE §3/§5:
// rememberedIdentifier / remembered{Role}Identifier).
function roleKey(role) {
  const r = String(role || "");
  return `remembered${r.charAt(0).toUpperCase()}${r.slice(1)}Identifier`;
}

export function loadRememberedIdentifier(role) {
  try {
    return localStorage.getItem(roleKey(role)) || localStorage.getItem("rememberedIdentifier") || "";
  } catch (e) {
    return "";
  }
}

export function saveRememberedIdentifier(role, identifier, remember) {
  try {
    if (remember) {
      localStorage.setItem(roleKey(role), identifier);
      localStorage.setItem("rememberedIdentifier", identifier);
    } else {
      localStorage.removeItem(roleKey(role));
    }
  } catch (e) {
    // ignore storage failures
  }
}

// Canonical logout: clear token/refreshToken/user/lastSubscription and
// redirect to "/" (role-select) — reused everywhere logout happens
// (LOGIC_REFERENCE §1.6, APP_WIRING_REFERENCE §5).
export function logout(navigate) {
  try {
    removeCookie("token");
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    localStorage.removeItem("lastSubscription");
  } catch (e) {
    // ignore
  }
  navigate("/", { replace: true });
}
