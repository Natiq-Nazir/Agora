// models/Issue.js
// ─── Agora Civic Platform — Issue Data Model ──────────────────────────────────
// Handles all civic report documents stored in MongoDB.
// Uses ES module syntax consistent with User.js.

import mongoose from "mongoose";

// ─── Sub-Document: CommentSchema ─────────────────────────────────────────────
// Embedded directly into Issue documents as an array.
// Tracks citizen and admin commentary on each report.

const CommentSchema = new mongoose.Schema(
  {
    username: {
      type:     String,
      required: [true, "Comment must have an author username."],
      trim:     true,
    },

    text: {
      type:      String,
      required:  [true, "Comment text cannot be empty."],
      trim:      true,
      maxlength: [1000, "Comment may not exceed 1000 characters."],
    },

    role: {
      type:    String,
      enum:    {
        values:  ["citizen", "admin"],
        message: "Role must be either 'citizen' or 'admin'.",
      },
      default: "citizen",
    },
  },
  {
    // Each comment gets its own createdAt timestamp.
    // updatedAt is intentionally omitted — comments are immutable once posted.
    timestamps: { createdAt: "createdAt", updatedAt: false },
  }
);

// ─── Main Schema: IssueSchema ─────────────────────────────────────────────────

const IssueSchema = new mongoose.Schema(
  {
    // ── Core Information ────────────────────────────────────────────────────

    title: {
      type:      String,
      required:  [true, "Issue title is required."],
      trim:      true,
      maxlength: [120, "Title may not exceed 120 characters."],
    },

    description: {
      type:      String,
      required:  [true, "Issue description is required."],
      trim:      true,
      maxlength: [2000, "Description may not exceed 2000 characters."],
    },

    category: {
      type:     String,
      required: [true, "Issue category is required."],
      trim:     true,
      // Open string — category list managed on the frontend
      // (Roads, Water Supply, Electricity, Sanitation, Infrastructure, etc.)
    },

    locationCode: {
      type:  String,
      trim:  true,
      default: null,
      // Stores coordinate string e.g. "34.0837° N, 74.7973° E"
      // or a named location slug — kept flexible for v1.
    },

    imageUrl: {
      type:    String,
      trim:    true,
      default: null,
      // Optional — populated after file upload to storage bucket.
    },

    // ── Strict 4-District Restriction ──────────────────────────────────────

    district: {
      type:     String,
      required: [true, "A valid district is required."],
      enum: {
        values: ["srinagar", "pulwama", "budgam", "ganderbal"],
        message:
          "District must be one of: srinagar, pulwama, budgam, or ganderbal.",
      },
    },

    // ── Urgency & Analytics ─────────────────────────────────────────────────

    urgency: {
      type:     String,
      required: [true, "Urgency level is required."],
      enum: {
        values:  ["Low", "Medium", "High", "Critical"],
        message: "Urgency must be one of: Low, Medium, High, or Critical.",
      },
      default: "Low",
    },

    priorityScore: {
      type:    Number,
      default: 0,
      min:     [0, "Priority score cannot be negative."],
      // Computed field — calculated by the server before save
      // based on urgency multiplier × base upvote/report weight.
    },

    reporter: {
      type:     String,
      required: [true, "Reporter handle is required."],
      trim:     true,
      // Stores the citizen's username string handle, e.g. "citizen_442".
      // Kept as a string reference (not ObjectId) for v1 simplicity.
    },

    department: {
      type:    String,
      trim:    true,
      default: null,
      // Assigned by admin after acknowledgement,
      // e.g. "Roads Dept", "Water Dept", "Power Dept".
    },

    // ── Status Lifecycle ────────────────────────────────────────────────────

    status: {
      type:    String,
      enum: {
        values: [
          "Reported",
          "Acknowledged",
          "In Progress",
          "Verification Pending",
          "Resolved",
        ],
        message:
          "Status must follow the operational pipeline: " +
          "Reported → Acknowledged → In Progress → Verification Pending → Resolved.",
      },
      default: "Reported",
    },

    // ── Embedded Comment Thread ─────────────────────────────────────────────

    comments: {
      type:    [CommentSchema],
      default: [],
      // Array of embedded CommentSchema sub-documents.
      // Pushed to via $push in the comments POST route.
    },
  },

  // ── Schema-Level Options ──────────────────────────────────────────────────
  {
    // Automatically manages createdAt + updatedAt at the document level.
    timestamps: true,

    // Prevents accidental extra fields from slipping into documents.
    strict: true,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
// Optimise the most common admin dashboard query patterns:
// filter by district, filter by status, sort by priorityScore descending.

IssueSchema.index({ district: 1 });
IssueSchema.index({ status:   1 });
IssueSchema.index({ priorityScore: -1 });

// Compound index for the most frequent combined dashboard query:
// "show me all Reported issues in srinagar, sorted by score"
IssueSchema.index({ district: 1, status: 1, priorityScore: -1 });

// ─── Model Export ─────────────────────────────────────────────────────────────

const Issue = mongoose.model("Issue", IssueSchema);

export default Issue;