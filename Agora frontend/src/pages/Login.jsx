// src/pages/Login.jsx

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data } = await axios.post("/api/auth/login", formData);

      if (data.success) {
        login(data.user);
        if (data.user.role === "admin") {
          navigate("/admin/dashboard", { replace: true });
        } else {
          navigate("/home", { replace: true });
        }
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* ── Brand Header ─────────────────────────────────────────────── */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 mb-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Welcome to Agora
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Sign in to access the civic platform
          </p>
        </div>

        {/* ── Card ─────────────────────────────────────────────────────── */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl px-8 py-8">

          {/* Error Banner */}
          {error && (
            <div className="mb-5 flex items-start gap-3 bg-red-950/60 border border-red-800/60 text-red-400 text-sm px-4 py-3 rounded-lg">
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-9v4a1 1 0 102 0V9a1 1 0 10-2 0zm1-4a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-zinc-300">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500
                           rounded-lg px-3.5 py-2.5 text-sm
                           focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                           transition duration-150"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-zinc-300">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500
                           rounded-lg px-3.5 py-2.5 text-sm
                           focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                           transition duration-150"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800
                         disabled:cursor-not-allowed text-white font-semibold text-sm
                         rounded-lg px-4 py-2.5 mt-1
                         focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                         focus:ring-offset-zinc-900 transition duration-150"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800" />
            </div>
            <div className="relative flex justify-center text-xs text-zinc-500 bg-zinc-900 px-2 w-fit mx-auto">
              New to Agora?
            </div>
          </div>

          {/* Register Link */}
          <Link
            to="/register"
            className="block w-full text-center border border-zinc-700 hover:border-zinc-500
                       text-zinc-300 hover:text-white text-sm font-medium
                       rounded-lg px-4 py-2.5 transition duration-150"
          >
            Create a citizen account
          </Link>
        </div>

        <p className="text-center text-xs text-zinc-600 mt-6">
          Agora Civic Platform — Public Record System
        </p>
      </div>
    </div>
  );
};

export default Login;