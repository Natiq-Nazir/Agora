import express from "express";
const router = express.Router();

import { 
  registerUserController, 
  loginUserController, 
  logoutUserController 
} from "../controllers/auth.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

// ─── PUBLIC ROUTES ─────────────────────────────────────────────────────────
router.post("/register", registerUserController);
router.post("/login", loginUserController);
router.get("/logout", logoutUserController);

// ─── PROTECTED ROUTE (Any logged-in user can access) ────────────────────────
// authMiddleware runs first, decrypts the token, and sets req.user
router.get("/profile", authMiddleware, (req, res) => {
  return res.json({
    success: true,
    user: {
      id: req.user._id,
      email: req.user.email,
      role: req.user.role,
    },
  });
});

// ─── ADMIN ONLY ROUTE ──────────────────────────────────────────────────────
// Chaining: First check if logged in (authMiddleware) ➔ Then check if role is admin (authorizeRoles)
router.get("/admin/dashboard", authMiddleware, authorizeRoles("admin"), (req, res) => {
  return res.json({
    success: true,
    message: `Welcome to the administrative dashboard, ${req.user.email}.`,
    role: req.user.role,
  });
});

export default router;