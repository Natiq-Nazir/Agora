// controllers/issue.controller.js
// ─── Agora Civic Platform — Issue Controller ──────────────────────────────────
// Handles all business logic for civic report lifecycle management.
// All functions are async and wrapped in try/catch for clean error propagation.

import Issue from "../models/Issue.js";

// ─── Priority Score Map ───────────────────────────────────────────────────────
// Single source of truth for urgency → priorityScore conversion.
// Keeps the calculation DRY if we add more controllers later.

const URGENCY_SCORE_MAP = {
  Critical: 40,
  High:     30,
  Medium:   20,
  Low:      10,
};

// ─── 1. Create Issue ──────────────────────────────────────────────────────────
// POST /api/issues/create
// Protected — citizen or admin. Reporter auto-assigned from auth middleware,
// with username body field accepted as a fallback for citizen submissions.

export const createIssue = async (req, res) => {
  try {
    const { title, description, category, zone, locationCode, attachment, username } = req.body;

    // 1. Map incoming frontend fields safely to match your Mongoose Model enums
    let mappedCategory = category;
    
    // Quick translation mapping in case frontend sends short text names
    if (category === "Roads") mappedCategory = "Roads & Transport";
    if (category === "Waste") mappedCategory = "Waste Management";

    const newIssue = new Issue({
      title: title || "Untitled Issue",
      description: description || "No description provided.",
      category: mappedCategory || "Water Supply", 
      district: zone ? zone.toLowerCase() : "srinagar",   // Forces lowercase enum match
      locationCode: locationCode || null,
      imageUrl: attachment || null,
      reporter: username || "Anonymous",                  // Maps username string directly to reporter
      urgency: "Low",                                     // Fulfills required schema field
    });

    // 2. Save document to MongoDB
    const savedIssue = await newIssue.save();

    return res.status(201).json({
      success: true,
      message: "Issue registered successfully inside Agora network.",
      issue: savedIssue,
    });

  } catch (error) {
    // 🔥 Check your VS Code terminal window below to read this exact message if it fails!
    console.error("❌ MONGOOSE VALIDATION CRASH LOG:", error.message);
    
    return res.status(400).json({
      success: false,
      message: "Database failed to save the civic report.",
      error: error.message,
    });
  }
};
// ─── 2. Get All Issues ────────────────────────────────────────────────────────
// GET /api/issues
// Protected — admin dashboard feed. Sorted by priorityScore descending
// so Critical issues always surface at the top of the queue.

export const getAllIssues = async (req, res) => {
  try {
    const issues = await Issue.find({}).sort({ priorityScore: -1 });

    return res.status(200).json({
      success: true,
      count:   issues.length,
      data:    issues,
    });

  } catch (err) {
    console.error("[getAllIssues] Unexpected error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching issues.",
    });
  }
};

// ─── 3. Update Issue Status ───────────────────────────────────────────────────
// PATCH /api/issues/:id/status
// Protected — admin only. Enforces strict one-step pipeline progression.
// Any attempt to skip a stage is rejected with a 409 Conflict.

// Maps each status to the single valid next status.
// "Verification Pending" → "Resolved" is intentionally omitted here
// because that final step is triggered by citizen verification,
// not by this admin endpoint.
const VALID_TRANSITIONS = {
  "Reported":     "Acknowledged",
  "Acknowledged": "In Progress",
  "In Progress":  "Verification Pending",
};

export const updateIssueStatus = async (req, res) => {
  try {
    const { id }        = req.params;
    const { status: newStatus } = req.body;

    // ── Guard: newStatus must be supplied ────────────────────────────────────
    if (!newStatus) {
      return res.status(400).json({
        success: false,
        message: "Request body must include a 'status' field.",
      });
    }

    // ── Fetch current document ───────────────────────────────────────────────
    const issue = await Issue.findById(id);

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: `No issue found with id: ${id}`,
      });
    }

    const currentStatus = issue.status;

    // ── Already resolved — no further transitions allowed ────────────────────
    if (currentStatus === "Resolved") {
      return res.status(409).json({
        success: false,
        message: "This issue is already resolved and cannot be updated further.",
      });
    }

    // ── Verification Pending — awaiting citizen, not admin ───────────────────
    if (currentStatus === "Verification Pending") {
      return res.status(409).json({
        success: false,
        message:
          "Issue is awaiting citizen verification. " +
          "Only a citizen confirmation can advance it to Resolved.",
      });
    }

    // ── Handshake validation — enforce strict one-step progression ───────────
    const allowedNext = VALID_TRANSITIONS[currentStatus];

    if (newStatus !== allowedNext) {
      return res.status(409).json({
        success: false,
        message:
          `Invalid transition. '${currentStatus}' can only advance to ` +
          `'${allowedNext}', but received '${newStatus}'.`,
        currentStatus,
        allowedNext,
      });
    }

    // ── Apply the transition ──────────────────────────────────────────────────
    issue.status = newStatus;
    await issue.save();

    return res.status(200).json({
      success: true,
      message: `Issue status advanced from '${currentStatus}' to '${newStatus}'.`,
      data:    issue,
    });

  } catch (err) {

    // Malformed MongoDB ObjectId
    if (err.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid issue ID format.",
      });
    }

    console.error("[updateIssueStatus] Unexpected error:", err.message);
    return res.status(500).json({
      success: false,
        message: "Server error while updating issue status.",
    });
  }
};

// ─── 4. Add Admin Comment ─────────────────────────────────────────────────────
// POST /api/issues/:id/comments
// Protected — admin only. Username is always pulled from auth middleware.
// Role is always hardcoded to "admin" — client cannot override this.

export const addAdminComment = async (req, res) => {
  try {
    const { id }   = req.params;
    const { text } = req.body;

    // ── Guard: comment text must be present ──────────────────────────────────
    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment text is required and cannot be blank.",
      });
    }

    // ── Fetch target issue ───────────────────────────────────────────────────
    const issue = await Issue.findById(id);

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: `No issue found with id: ${id}`,
      });
    }

    // ── Build comment object ─────────────────────────────────────────────────
    // username → always from verified auth token, never from request body.
    // role     → always "admin", hardcoded server-side, never from body.
    const newComment = {
      username: req.user.username,
      text:     text.trim(),
      role:     "admin",
    };

    // ── Push into embedded array and persist ─────────────────────────────────
    issue.comments.push(newComment);
    await issue.save();

    // Return only the newly added comment for lightweight frontend update
    const savedComment = issue.comments[issue.comments.length - 1];

    return res.status(201).json({
      success: true,
      message: "Admin comment added successfully.",
      data:    savedComment,
    });

  } catch (err) {

    if (err.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid issue ID format.",
      });
    }

    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(422).json({
        success: false,
        message: "Comment validation failed.",
        errors:  messages,
      });
    }

    console.error("[addAdminComment] Unexpected error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Server error while adding comment.",
    });
  }
};