// routes/issue.route.js
// ─── Agora Civic Platform — Issue Routes ──────────────────────────────────────
// Maps all civic report endpoints to their controller functions.
// Every route is protected by authMiddleware — no unauthenticated access.

import express              from "express";
import { authMiddleware }   from "../middlewares/auth.middleware.js";
import {
  createIssue,
  getAllIssues,
  updateIssueStatus,
  addAdminComment,
} from "../controllers/issue.controller.js";

const router = express.Router();

// ─── Route Definitions ────────────────────────────────────────────────────────
//
//  Method   Path               Middleware       Controller
//  ───────  ─────────────────  ───────────────  ──────────────────
//  POST     /                  authMiddleware   createIssue
//  GET      /                  authMiddleware   getAllIssues
//  PATCH    /:id/status        authMiddleware   updateIssueStatus
//  POST     /:id/comments      authMiddleware   addAdminComment
//
// ─────────────────────────────────────────────────────────────────────────────

// Create a new civic issue report
// Citizen or admin — reporter auto-assigned from auth token
router.post(
  "/create",
  authMiddleware,
  createIssue
);


// Fetch all issues sorted by priority score descending
// Powers the admin dashboard issue queue
router.get(
  "/",
  authMiddleware,
  getAllIssues
);

// Advance an issue through the status pipeline (admin action)
// Enforces strict one-step handshake: Reported → Acknowledged → In Progress → Verification Pending
router.patch(
  "/:id/status",
  authMiddleware,
  updateIssueStatus
);

// Post an official admin comment into the issue's community thread
// Username and role are always sourced from the verified auth token
router.post(
  "/:id/comments",
  authMiddleware,
  addAdminComment
);

export default router;