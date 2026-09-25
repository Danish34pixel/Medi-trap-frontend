import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { fetchJson } from "../config/api";
import { getCookie } from "../utils/cookies";
import { logout as authFlowLogout } from "../utils/authFlow";

// Centralized session state. Does NOT replace the existing
// localStorage/cookie contract (authFlow.js, config/api.js, and every
// login screen still read/write "token"/"user"/"role" directly) — it wraps
// that contract so most components can stop re-parsing localStorage
// themselves. authFlow.persistAuthState()/logout() dispatch a
// window "meditrap:auth-changed" event so this context re-syncs after a
// login/logout that happened outside of it, without requiring every
// existing screen to be rewritten in one pass.
const AuthContext = createContext(null);

function readUserFromStorage() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function readTokenFromStorage() {
  try {
    return localStorage.getItem("token") || getCookie("token") || null;
  } catch {
    return null;
  }
}

function snapshotFromStorage() {
  const user = readUserFromStorage();
  const token = readTokenFromStorage();
  return {
    user,
    token,
    role: (user && user.role) || localStorage.getItem("role") || null,
    isAuthenticated: Boolean(token),
  };
}

export function AuthProvider({ children }) {
  const [state, setState] = useState(() => ({
    ...snapshotFromStorage(),
    loading: true,
  }));

  const syncFromStorage = useCallback(() => {
    setState((prev) => ({ ...prev, ...snapshotFromStorage() }));
  }, []);

  // One-time session restore on mount: paint instantly from whatever is
  // already cached in localStorage, then best-effort refresh from
  // GET /auth/me in the background (mirrors nebula's payment-pending /
  // profile.jsx pattern of "cache first, refresh after"). Runs once — never
  // on every route change, so no duplicate-call / refetch loop.
  useEffect(() => {
    let cancelled = false;
    const snap = snapshotFromStorage();
    setState({ ...snap, loading: false });

    if (snap.token) {
      fetchJson("/auth/me")
        .then((data) => {
          if (cancelled) return;
          const freshUser = data?.user || data;
          if (freshUser && typeof freshUser === "object") {
            try {
              localStorage.setItem(
                "user",
                JSON.stringify({ ...freshUser }),
              );
              if (freshUser.role) localStorage.setItem("role", freshUser.role);
            } catch {
              // ignore storage failures
            }
            setState((prev) => ({
              ...prev,
              user: freshUser,
              role: freshUser.role || prev.role,
              isAuthenticated: true,
            }));
          }
        })
        .catch(() => {
          // Token invalid/expired and refresh already failed inside
          // fetchJson (it clears storage on a failed refresh) — resync from
          // whatever storage now looks like rather than throwing.
          if (!cancelled) syncFromStorage();
        });
    }

    const onAuthChanged = () => syncFromStorage();
    window.addEventListener("meditrap:auth-changed", onAuthChanged);
    window.addEventListener("storage", onAuthChanged);
    return () => {
      cancelled = true;
      window.removeEventListener("meditrap:auth-changed", onAuthChanged);
      window.removeEventListener("storage", onAuthChanged);
    };
  }, [syncFromStorage]);

  const logout = useCallback(
    (navigate) => {
      authFlowLogout(navigate);
      setState({
        user: null,
        token: null,
        role: null,
        isAuthenticated: false,
        loading: false,
      });
    },
    [],
  );

  const refreshUser = useCallback(async () => {
    try {
      const data = await fetchJson("/auth/me");
      const freshUser = data?.user || data;
      if (freshUser && typeof freshUser === "object") {
        localStorage.setItem("user", JSON.stringify({ ...freshUser }));
        if (freshUser.role) localStorage.setItem("role", freshUser.role);
      }
      syncFromStorage();
      return freshUser;
    } catch (e) {
      syncFromStorage();
      throw e;
    }
  }, [syncFromStorage]);

  return (
    <AuthContext.Provider
      value={{ ...state, logout, refreshUser, syncFromStorage }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth() must be used inside <AuthProvider>");
  }
  return ctx;
}

// Pure helper (no hook) for the rare non-component call site that needs a
// role check without subscribing to context updates.
export function normalizeRole(role) {
  return String(role || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, "");
}
