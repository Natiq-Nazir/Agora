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

// ─── GET ADMIN ISSUES QUEUE ──────────────────────────────────────────
// Fetches all citizen-reported infrastructure issues for the admin feed
router.get("/admin/issues", authMiddleware, authorizeRoles("admin"), async (req, res) => {
  try {
    // Import your MongoDB Issue model at the top of your file if not already present
    // e.g., import Issue from "../models/Issue.js";
    const issues = await Issue.find().sort({ createdAt: -1 }); 
    res.json(issues);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch administrative queue." });
  }
});

// ─── PATCH ISSUE STATUS (The Missing Piece) ──────────────────────────
// Handles updating the lifecycle stage of a specific complaint item
router.patch("/admin/issues/:id/status", authMiddleware, authorizeRoles("admin"), async (req, res) => {
  const { status } = req.body; // Expects "Acknowledged", "In Progress", or "Resolved"
  
  try {
    const updatedIssue = await Issue.findByIdAndUpdate(
      req.params.id,
      { 
        status,
        // Optional: Push an object to a history array if tracking timeline audits
        $push: { statusHistory: { status, timestamp: new Date() } } 
      },
      { new: true } // Returns the modified document
    );

    if (!updatedIssue) {
      return res.status(404).json({ message: "Target report item not found." });
    }

    res.json({ 
      success: true, 
      message: `Status updated to ${status} successfully.`, 
      issue: updatedIssue 
    });
  } catch (err) {
    res.status(500).json({ message: "Server failed to patch status step." });
  }
});


export default router;