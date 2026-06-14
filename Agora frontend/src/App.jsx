// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Login          from "./pages/Login";
import Register       from "./pages/Register";
import Home           from "./pages/Home";
import AdminDashboard from "./pages/AdminDashboard";
import ReportIssue    from "./pages/ReportIssue";
// ─── Requirement 1: Profile import ───────────────────────────────────────────
import Profile        from "./pages/Profile";

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Root redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Public */}
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected: Citizens */}
          {/* Requirement 2 + 3: /profile lives here alongside /home so it  */}
          {/* shares the exact same ProtectedRoute wrapper and allowedRoles  */}
          {/* group, giving it identical auth protection and full access to  */}
          {/* the AuthContext user object that Profile.jsx depends on.       */}
          <Route element={<ProtectedRoute allowedRoles={["user", "admin"]} />}>
            <Route path="/home"    element={<Home />} />
            <Route path="/report"  element={<ReportIssue />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* Protected: Admins only */}
          <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;