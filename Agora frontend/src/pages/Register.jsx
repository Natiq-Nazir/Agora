// src/pages/Register.jsx

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

// Fields shown only when registering as an admin authority
const ADMIN_FIELDS = [
  { name: "batchNumber", label: "Batch / Badge Number", placeholder: "e.g. IAS-2019-001" },
  { name: "department",  label: "Department",           placeholder: "e.g. Public Works" },
  { name: "jobTitle",    label: "Job Title",             placeholder: "e.g. Ward Officer" },
  { name: "district",    label: "District",              placeholder: "e.g. South Delhi" },
  { name: "state",       label: "State",                 placeholder: "e.g. Delhi" },
];

const Register = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    role: "user",
    batchNumber: "",
    department: "",
    jobTitle: "",
    district: "",
    state: "",
  });

  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      return setError("Passwords do not match.");
    }
    if (formData.password.length < 8) {
      return setError("Password must be at least 8 characters.");
    }

    setLoading(true);
    setError("");

    try {
      const payload = {
        email:    formData.email,
        password: formData.password,
        role:     formData.role,
        ...(formData.role === "admin" && {
          batchNumber: formData.batchNumber,
          department:  formData.department,
          jobTitle:    formData.jobTitle,
          district:    formData.district,
          state:       formData.state,
        }),
      };

      const { data } = await axios.post("/api/auth/register", payload);

      if (data.success) {
        setSuccess("Account created! Redirecting to login...");
        setTimeout(() => navigate("/login", { replace: true }), 1800);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass = `w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500
                      rounded-lg px-3.5 py-2.5 text-sm
                      focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                      transition duration-150`;

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* ── Brand Header ─────────────────────────────────────────────── */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 mb-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Create your account
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Join the civic platform as a citizen or authority
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

          {/* Success Banner */}
          {success && (
            <div className="mb-5 flex items-start gap-3 bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 text-sm px-4 py-3 rounded-lg">
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Role Selector */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-zinc-300">
                Account type
              </label>
              <div className="grid grid-cols-2 gap-3">
                {["user", "admin"].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, role: r }))}
                    className={`py-2.5 rounded-lg text-sm font-medium border transition duration-150
                      ${formData.role === r
                        ? "bg-indigo-600 border-indigo-500 text-white"
                        : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
                      }`}
                  >
                    {r === "user" ? "🏙️ Citizen" : "🏛️ Authority"}
                  </button>
                ))}
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-zinc-300">
                Email address
              </label>
              <input
                id="email" name="email" type="email"
                autoComplete="email" required
                value={formData.email} onChange={handleChange}
                placeholder="you@example.com"
                className={inputClass}
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-zinc-300">
                Password
              </label>
              <input
                id="password" name="password" type="password"
                autoComplete="new-password" required
                value={formData.password} onChange={handleChange}
                placeholder="Minimum 8 characters"
                className={inputClass}
              />
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-zinc-300">
                Confirm password
              </label>
              <input
                id="confirmPassword" name="confirmPassword" type="password"
                autoComplete="new-password" required
                value={formData.confirmPassword} onChange={handleChange}
                placeholder="••••••••"
                className={inputClass}
              />
            </div>

            {/* Admin-only fields — conditionally rendered */}
            {formData.role === "admin" && (
              <div className="space-y-4 pt-2 border-t border-zinc-800">
                <p className="text-xs text-zinc-500 pt-1">
                  Authority credentials — visible on your public trust profile
                </p>
                {ADMIN_FIELDS.map((field) => (
                  <div key={field.name} className="space-y-1.5">
                    <label htmlFor={field.name} className="block text-sm font-medium text-zinc-300">
                      {field.label}
                    </label>
                    <input
                      id={field.name}
                      name={field.name}
                      type="text"
                      value={formData[field.name]}
                      onChange={handleChange}
                      placeholder={field.placeholder}
                      className={inputClass}
                    />
                  </div>
                ))}
              </div>
            )}

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
                  Creating account...
                </span>
              ) : (
                "Create account"
              )}
            </button>
          </form>

          {/* Divider + Login Link */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800" />
            </div>
            <div className="relative flex justify-center text-xs text-zinc-500 bg-zinc-900 px-2 w-fit mx-auto">
              Already registered?
            </div>
          </div>

          <Link
            to="/login"
            className="block w-full text-center border border-zinc-700 hover:border-zinc-500
                       text-zinc-300 hover:text-white text-sm font-medium
                       rounded-lg px-4 py-2.5 transition duration-150"
          >
            Sign in instead
          </Link>
        </div>

        <p className="text-center text-xs text-zinc-600 mt-6">
          Agora Civic Platform — Public Record System
        </p>
      </div>
    </div>
  );
};

export default Register;
