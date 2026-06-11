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

export const AuthProvider = ({ children }) => {
  // ── 1. Hydrate state directly from localStorage on startup ──────────────────
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(true);

  // ── 2. Session Persistence Check ─────────────────────────────────────────────
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data } = await axios.get("/api/auth/profile");
        if (data.success) {
          setUser(data.user);
          // 🔥 Keep localStorage perfectly synced with the complete object
          localStorage.setItem("user", JSON.stringify(data.user));
        }
      } catch (err) {
        // If the session cookie is expired, flush everything
        setUser(null);
        localStorage.removeItem("user");
        localStorage.removeItem("agora_token");
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

// — Login
  // Called by Login.jsx after a successful POST /api/auth/login.
  // Receives the user object returned by the backend and stores it globally.
  const login = (userData) => {
    setUser(userData);
    // 🔥 PERSIST THE WHOLE OBJECT SO REFRESHES DON'T WIPE IT OUT!
    localStorage.setItem("user", JSON.stringify(userData));
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
      // 🔥 CLEAR EVERYTHING OUT ON SIGN-OUT!
      localStorage.removeItem("user");
      localStorage.removeItem("agora_token"); 
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