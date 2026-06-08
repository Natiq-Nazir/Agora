// src/context/AuthContext.jsx

import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

// ─── Axios Global Configuration ───────────────────────────────────────────────
// Set once here so every axios call across the entire app automatically
// sends the HTTP-only cookie with each request. Never set this per-call.
axios.defaults.baseURL = "http://localhost:5173/";
axios.defaults.withCredentials = true;

// ─── Context Creation ─────────────────────────────────────────────────────────
const AuthContext = createContext(null);

// ─── Provider Component ───────────────────────────────────────────────────────
export const AuthProvider = ({ children }) => {
  // user shape: { id, email, role } | null
  const [user, setUser] = useState(null);

  // loading stays true until the initial profile check resolves.
  // This prevents ProtectedRoute from flashing a redirect before
  // we know whether a valid cookie session already exists.
  const [loading, setLoading] = useState(true);

  // ── Session Persistence Check ──────────────────────────────────────────────
  // Runs once on mount. If the browser holds a valid HTTP-only token cookie
  // from a previous session, the backend will return the user profile and
  // we silently restore their logged-in state without forcing a re-login.
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data } = await axios.get("/api/auth/profile");
        if (data.success) {
          setUser(data.user); // { id, email, role }
        }
      } catch {
        // 401 means no valid cookie — user is simply not logged in.
        // We do not surface this as an error; just leave user as null.
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  // ── Login ──────────────────────────────────────────────────────────────────
  // Called by Login.jsx after a successful POST /api/auth/login.
  // Receives the user object returned by the backend and stores it globally.
 const login = (userData) => {
  setUser(userData); 
  // Write the key your Home.jsx is aggressively hunting for!
  localStorage.setItem("agora_token", "true"); 
};
  // ── Logout ─────────────────────────────────────────────────────────────────
  // Hits the backend to clear the HTTP-only cookie (cannot be done from JS),
  // then wipes local state.
 const logout = async () => {
  try {
    await axios.get("/api/auth/logout");
  } finally {
    setUser(null);
    localStorage.removeItem("agora_token"); // Clear it on sign-out
  }
};
  // ── Derived helpers exposed to consumers ───────────────────────────────────
  const isAuthenticated = !!user;
  const isAdmin = user?.role === "admin";




  

  return (
    <AuthContext.Provider
      value={{ user, loading, isAuthenticated, isAdmin, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ─── Custom Hook ──────────────────────────────────────────────────────────────
// Import useAuth() anywhere in the app instead of useContext(AuthContext).
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an <AuthProvider>.");
  }
  return context;
};