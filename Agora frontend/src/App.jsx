// src/App.jsx

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import AdminDashboard from "./pages/AdminDashboard";

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* ── Root redirect ────────────────────────────────────────────── */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* ── Public Routes ────────────────────────────────────────────── */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* ── Protected: Citizens ──────────────────────────────────────── */}
          <Route element={<ProtectedRoute allowedRoles={["user", "admin"]} />}>
            <Route path="/home" element={<Home />} />
          </Route>

          {/* ── Protected: Admins only ───────────────────────────────────── */}
          <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
          </Route>

          {/* ── Catch-all fallback ───────────────────────────────────────── */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;