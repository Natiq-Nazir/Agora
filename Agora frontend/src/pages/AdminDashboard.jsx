import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  SlidersHorizontal, MapPin, Search, X, AlertTriangle,
  CheckCircle2, Clock, Circle, LogOut, User, Shield, Star,
  TrendingUp, Sun, Moon, Send, MessageSquare, ChevronDown,
  ChevronUp, CornerDownRight, Loader2, RefreshCw, Menu,
} from "lucide-react";
import { Button }     from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";

// ─── Scrollbar Suppression (Chrome / Brave / Edge webkit) ────────────────────

const scrollbarHideStyle = `
  .hide-scrollbar::-webkit-scrollbar { display: none; }
`;

// ─── API Base ─────────────────────────────────────────────────────────────────

const API_BASE = "http://localhost:3000";

// ─── Constants ────────────────────────────────────────────────────────────────

// ✅ 4-district municipal scope — Kulgam removed
const REGIONS = ["ALL", "srinagar", "pulwama", "budgam", "ganderbal"];

const STATUS_STAGES = [
  "Reported", "Acknowledged", "In Progress",
  "Verification Pending", "Resolved",
];

const PRIORITY_CONFIG = {
  Low: {
    multiplier: 1,
    color:      "text-emerald-400",
    colorLight: "text-emerald-700",
    badge:      "bg-emerald-900/40 border-emerald-700/50",
    badgeLight: "bg-emerald-50 border-emerald-200 text-emerald-700",
    dot:        "bg-emerald-400",
    score:      "text-emerald-400",
  },
  Medium: {
    multiplier: 2,
    color:      "text-yellow-400",
    colorLight: "text-yellow-700",
    badge:      "bg-yellow-900/40 border-yellow-700/50",
    badgeLight: "bg-yellow-50 border-yellow-200 text-yellow-700",
    dot:        "bg-yellow-400",
    score:      "text-yellow-400",
  },
  High: {
    multiplier: 3,
    color:      "text-amber-400",
    colorLight: "text-amber-700",
    badge:      "bg-amber-900/40 border-amber-700/50",
    badgeLight: "bg-amber-50 border-amber-200 text-amber-700",
    dot:        "bg-amber-400",
    score:      "text-amber-400",
  },
  Critical: {
    multiplier: 4,
    color:      "text-red-400",
    colorLight: "text-red-700",
    badge:      "bg-red-900/40 border-red-700/50",
    badgeLight: "bg-red-50 border-red-200 text-red-700",
    dot:        "bg-red-500",
    score:      "text-red-400",
  },
};

const STATUS_CONFIG = {
  Reported: {
    color: "text-zinc-400",   colorLight: "text-zinc-500",
    ring:  "ring-zinc-500",   bg: "bg-zinc-800/60",   bgLight: "bg-zinc-100",
    icon:  Circle,
  },
  Acknowledged: {
    color: "text-blue-400",   colorLight: "text-blue-600",
    ring:  "ring-blue-500",   bg: "bg-blue-900/40",   bgLight: "bg-blue-50",
    icon:  Clock,
  },
  "In Progress": {
    color: "text-amber-400",  colorLight: "text-amber-600",
    ring:  "ring-amber-500",  bg: "bg-amber-900/40",  bgLight: "bg-amber-50",
    icon:  TrendingUp,
  },
  "Verification Pending": {
    color: "text-purple-400", colorLight: "text-purple-600",
    ring:  "ring-purple-500", bg: "bg-purple-900/40", bgLight: "bg-purple-50",
    icon:  RefreshCw,
  },
  Resolved: {
    color: "text-emerald-400",colorLight: "text-emerald-600",
    ring:  "ring-emerald-500",bg: "bg-emerald-900/40",bgLight: "bg-emerald-50",
    icon:  CheckCircle2,
  },
};

// ─── Theme Token Map ──────────────────────────────────────────────────────────

const buildTheme = (dark) => ({
  page:       dark ? "bg-black text-white"      : "bg-zinc-50 text-zinc-900",
  sidebar:    dark ? "bg-zinc-950 border-r border-zinc-800/60"
                   : "bg-white border-r border-zinc-200",
  sbBorder:   dark ? "border-zinc-800/60"       : "border-zinc-200",
  sbDivider:  dark ? "border-zinc-800/40"       : "border-zinc-100",
  sbTitle:    dark ? "text-zinc-100"            : "text-zinc-800",
  sbLabel:    dark ? "text-zinc-500"            : "text-zinc-400",
  sbItem:     dark ? "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60"
                   : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100",
  sbActive:   dark ? "bg-zinc-800/80 text-zinc-100 font-semibold"
                   : "bg-zinc-100 text-zinc-900 font-semibold",
  topbar:     dark ? "bg-zinc-950/80 border-b border-zinc-800/60 backdrop-blur-xl"
                   : "bg-white/80 border-b border-zinc-200 backdrop-blur-xl",

  card:       dark ? "rounded-2xl border border-zinc-800/60 bg-zinc-900/80"
                   : "rounded-2xl border border-zinc-200 bg-white shadow-sm",
  cardHdr:    dark ? "border-b border-zinc-800/50"  : "border-b border-zinc-100",
  cardTitle:  dark ? "text-base font-bold text-white leading-snug"
                   : "text-base font-bold text-zinc-900 leading-snug",
  cardDesc:   dark ? "text-sm text-zinc-400 leading-relaxed"
                   : "text-sm text-zinc-500 leading-relaxed",
  imgBox:     dark ? "border-zinc-800/60 bg-zinc-800/40 text-zinc-600"
                   : "border-zinc-200 bg-zinc-50 text-zinc-300",
  loc:        dark ? "border-zinc-700/50 bg-zinc-800/50 text-zinc-400"
                   : "border-zinc-200 bg-zinc-50 text-zinc-500",
  glass:      dark ? "bg-zinc-800/60 border border-zinc-700/40 text-zinc-300 backdrop-blur-sm"
                   : "bg-white/80 border border-zinc-200 text-zinc-600 backdrop-blur-sm",

  input:      dark ? "bg-zinc-900/80 border border-zinc-800/60 text-white placeholder:text-zinc-600"
                   : "bg-white border border-zinc-200 text-zinc-900 placeholder:text-zinc-400",
  inputInner: dark ? "bg-transparent text-white placeholder:text-zinc-600"
                   : "bg-transparent text-zinc-900 placeholder:text-zinc-400",

  commentBg:    dark ? "bg-zinc-800/50 border border-zinc-700/40"
                     : "bg-zinc-50 border border-zinc-200",
  replyBg:      dark ? "bg-zinc-800/30 border border-zinc-700/30"
                     : "bg-white border border-zinc-100",
  adminComment: dark ? "bg-blue-900/20 border border-blue-800/40"
                     : "bg-blue-50 border border-blue-200",

  title:    dark ? "text-white"    : "text-zinc-900",
  body:     dark ? "text-zinc-400" : "text-zinc-600",
  muted:    dark ? "text-zinc-500" : "text-zinc-400",
  faint:    dark ? "text-zinc-600" : "text-zinc-400",
  pill:     dark ? "bg-zinc-800/60 border border-zinc-700/40 text-zinc-400"
                 : "bg-zinc-100 border border-zinc-200 text-zinc-500",
  divider:  dark ? "border-zinc-800/60"  : "border-zinc-100",

  scroll:   dark ? "scrollbar-thin scrollbar-track-transparent scrollbar-thumb-zinc-800"
                 : "scrollbar-thin scrollbar-track-transparent scrollbar-thumb-zinc-300",

  themeTgl: dark ? "border-zinc-700 bg-zinc-800/60 text-zinc-300 hover:bg-zinc-700 hover:text-white"
                 : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
});

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_USER = {
  name: "Dev Administrator", department: "Municipal Engineering",
  zone: "srinagar", reputationScore: 120,
  stats: { resolved: 14, inProgress: 5, pending: 3 },
};

const MOCK_ISSUES = [
  {
    _id: "mock-001", title: "Pothole cluster on Residency Road",
    description: "Multiple deep potholes causing traffic hazards near the main junction.",
    category: "Roads",
    // ✅ Live schema field: district (not region)
    district: "srinagar", urgency: "Critical", priorityScore: 40,
    status: "Reported", reporter: "citizen_442", department: "Roads Dept",
    locationCode: "34.0837° N, 74.7973° E", imageUrl: null,
    createdAt: "2024-11-01T08:30:00.000Z",
    comments: [
      {
        _id: "c1", username: "citizen_442", role: "citizen",
        text: "This is really dangerous, please fix urgently!",
        createdAt: "2024-11-01T09:00:00.000Z",
      },
    ],
  },
  {
    _id: "mock-002", title: "Burst water main near Lal Chowk",
    description: "Water logging on main road for 3 days. Pipe burst unattended.",
    category: "Water Supply",
    district: "srinagar", urgency: "High", priorityScore: 30,
    status: "Acknowledged", reporter: "citizen_118", department: "Water Dept",
    locationCode: "34.0908° N, 74.8059° E", imageUrl: null,
    createdAt: "2024-11-02T10:15:00.000Z",
    comments: [],
  },
  {
    _id: "mock-003", title: "Street lights out on Pulwama bypass",
    description: "Entire stretch of bypass road dark at night. Safety concern.",
    category: "Electricity",
    district: "pulwama", urgency: "High", priorityScore: 30,
    status: "In Progress", reporter: "citizen_231", department: "Power Dept",
    locationCode: "33.8797° N, 74.8983° E", imageUrl: null,
    createdAt: "2024-11-03T07:45:00.000Z",
    comments: [],
  },
  {
    _id: "mock-004", title: "Garbage collection lapsed — Budgam ward 4",
    description: "No collection for 10 days. Waste piling up near school.",
    category: "Sanitation",
    district: "budgam", urgency: "Low", priorityScore: 10,
    status: "Verification Pending", reporter: "citizen_089", department: "Sanitation Dept",
    locationCode: "33.7361° N, 74.7172° E", imageUrl: null,
    createdAt: "2024-11-04T12:00:00.000Z",
    comments: [],
  },
  {
    _id: "mock-005", title: "Bridge railing collapse — Ganderbal district",
    description: "Railing on pedestrian bridge has collapsed. Immediate risk.",
    category: "Infrastructure",
    district: "ganderbal", urgency: "Critical", priorityScore: 40,
    status: "Resolved", reporter: "citizen_774", department: "Infrastructure Dept",
    locationCode: "34.2317° N, 74.7742° E", imageUrl: null,
    createdAt: "2024-11-05T06:20:00.000Z",
    comments: [],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

// ✅ Now reads priorityScore directly from the live Issue schema field.
// Falls back to urgency-based calculation for mock data safety.
const URGENCY_SCORE_MAP = { Critical: 40, High: 30, Medium: 20, Low: 10 };

const calcPriorityScore = (issue) => {
  if (typeof issue.priorityScore === "number" && issue.priorityScore > 0) {
    return issue.priorityScore;
  }
  return URGENCY_SCORE_MAP[issue.urgency] ?? 10;
};

// ✅ Maps live schema `urgency` field to PRIORITY_CONFIG keys.
// The live model uses urgency (Low/Medium/High/Critical); config keys match.
const getUrgencyConfig = (issue) =>
  PRIORITY_CONFIG[issue.urgency] ?? PRIORITY_CONFIG.Low;

const formatShortDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short",
    hour: "2-digit", minute: "2-digit",
  });
};

// ─── GlassBadge ──────────────────────────────────────────────────────────────

function GlassBadge({ children, className = "" }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1
                      rounded-full text-xs font-semibold border ${className}`}>
      {children}
    </span>
  );
}

// ─── CommentThread ────────────────────────────────────────────────────────────
// ✅ Updated to read live schema fields: username, role, createdAt
// (replaces old: author, isAdmin, timestamp, replies)

function CommentThread({ comments, t, dark }) {
  if (!comments || comments.length === 0) {
    return (
      <p className={`text-xs text-center py-3 ${t.muted}`}>
        No community comments yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {comments.map((comment, idx) => {
        // ✅ Live schema: role === "admin" | "citizen"
        const isAdmin = comment.role === "admin";
        // ✅ Live schema uses _id (Mongoose ObjectId); fall back to idx for mock
        const key = comment._id ?? `comment-${idx}`;

        return (
          <div key={key} className="flex flex-col gap-1.5">
            <div className={`rounded-xl px-3 py-2.5 flex flex-col gap-1
              ${isAdmin ? t.adminComment : t.commentBg}`}>
              <div className="flex items-center justify-between gap-2">
                <span className={`text-xs font-bold flex items-center gap-1
                  ${isAdmin
                    ? dark ? "text-blue-400" : "text-blue-600"
                    : t.title
                  }`}>
                  {isAdmin && <Shield className="w-3 h-3" />}
                  {/* ✅ Live field: username */}
                  {comment.username}
                  {isAdmin && (
                    <GlassBadge className={dark
                      ? "bg-blue-900/30 border-blue-700/40 text-blue-400 text-[9px] px-1.5 py-0.5"
                      : "bg-blue-50 border-blue-200 text-blue-600 text-[9px] px-1.5 py-0.5"
                    }>
                      Official
                    </GlassBadge>
                  )}
                </span>
                <span className={`text-[10px] shrink-0 ${t.muted}`}>
                  {/* ✅ Live field: createdAt (ISO from Mongoose timestamps) */}
                  {formatShortDate(comment.createdAt)}
                </span>
              </div>
              <p className={`text-xs leading-relaxed ${t.body}`}>{comment.text}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── VerificationGate ─────────────────────────────────────────────────────────

function VerificationGate({ issue, onStatusChange, t, dark }) {
  const { status, _id } = issue;

  if (status === "Reported") {
    return (
      <button
        onClick={() => onStatusChange(_id, "Acknowledged")}
        className={`w-full flex items-center justify-center gap-2 px-4 py-2.5
                    rounded-xl text-sm font-semibold border transition-all duration-200
          ${dark
            ? "bg-blue-900/30 border-blue-700/50 text-blue-300 hover:bg-blue-800/40 hover:border-blue-600"
            : "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
          }`}
      >
        <span>📋</span> Acknowledge Issue
      </button>
    );
  }

  if (status === "Acknowledged") {
    return (
      <button
        onClick={() => onStatusChange(_id, "In Progress")}
        className={`w-full flex items-center justify-center gap-2 px-4 py-2.5
                    rounded-xl text-sm font-semibold border transition-all duration-200
          ${dark
            ? "bg-amber-900/30 border-amber-700/50 text-amber-300 hover:bg-amber-800/40 hover:border-amber-600"
            : "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
          }`}
      >
        <span>🛠️</span> Start Work (In Progress)
      </button>
    );
  }

  if (status === "In Progress") {
    return (
      <button
        onClick={() => onStatusChange(_id, "Verification Pending")}
        className={`w-full flex items-center justify-center gap-2 px-4 py-2.5
                    rounded-xl text-sm font-semibold border transition-all duration-200
          ${dark
            ? "bg-purple-900/30 border-purple-700/50 text-purple-300 hover:bg-purple-800/40 hover:border-purple-600"
            : "bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
          }`}
      >
        <span>📤</span> Request Citizen Verification
      </button>
    );
  }

  if (status === "Verification Pending") {
    return (
      <div className={`w-full flex items-center justify-center gap-2 px-4 py-2.5
                      rounded-xl text-sm font-semibold border cursor-not-allowed
                      select-none opacity-80
        ${dark
          ? "bg-zinc-800/60 border-zinc-700/40 text-zinc-400"
          : "bg-zinc-100 border-zinc-200 text-zinc-400"
        }`}
      >
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        <span>⏳ Awaiting Citizen Verification…</span>
      </div>
    );
  }

  if (status === "Resolved") {
    return (
      <div className={`w-full flex items-center justify-center gap-2 px-4 py-2.5
                      rounded-xl text-sm font-semibold border cursor-default select-none
        ${dark
          ? "bg-emerald-900/20 border-emerald-800/40 text-emerald-400"
          : "bg-emerald-50 border-emerald-200 text-emerald-700"
        }`}
      >
        <CheckCircle2 className="w-4 h-4 shrink-0" />
        <span>✅ Issue Resolved &amp; Closed</span>
      </div>
    );
  }

  return null;
}

// ─── IssueCard ────────────────────────────────────────────────────────────────

function IssueCard({ issue, onStatusChange, onAddComment, user, t, dark }) {
  const score       = calcPriorityScore(issue);
  // ✅ Uses urgency field from live schema instead of old priority field
  const priorityCfg = getUrgencyConfig(issue);
  const statusCfg   = STATUS_CONFIG[issue.status] ?? STATUS_CONFIG.Reported;
  const StatusIcon  = statusCfg.icon;

  const [commentText, setCommentText] = useState("");
  const [sending,     setSending]     = useState(false);
  const commentEndRef = useRef(null);

  useEffect(() => {
    commentEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [issue.comments?.length]);

  const handleSendComment = async () => {
    const trimmed = commentText.trim();
    if (!trimmed) return;
    setSending(true);
    await onAddComment(issue._id, trimmed);
    setCommentText("");
    setSending(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendComment();
    }
  };

  return (
    <Card className={"w-full min-w-0 overflow-hidden " + t.card}>

      {/* ── Card Header ──────────────────────────────────────────────────── */}
      <CardHeader className={"px-4 sm:px-5 pt-4 pb-3 " + t.cardHdr}>
        <div className="flex items-start justify-between gap-3">

          {/* Left: avatar + reporter meta */}
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center
                            text-sm font-bold shrink-0 text-white
                            bg-gradient-to-br from-zinc-600 to-zinc-800`}>
              {issue.reporter?.[0]?.toUpperCase() ?? "C"}
            </div>
            <div className="flex flex-col min-w-0">
              <span className={`text-sm font-semibold truncate ${t.title}`}>
                {issue.reporter ?? "Unknown Citizen"}
              </span>
              <span className={`text-xs truncate ${t.muted}`}>
                {issue.department ?? "General"} · {formatShortDate(issue.createdAt)}
              </span>
            </div>
          </div>

          {/* Right: score + urgency label + status badge */}
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <div className="flex items-baseline gap-1.5">
              <span className={`text-xl font-black tracking-tight leading-none
                ${dark ? priorityCfg.score : priorityCfg.colorLight}`}>
                {score}
              </span>
              {/* ✅ Reads urgency from live schema */}
              <span className={`text-[10px] font-bold uppercase tracking-widest
                ${dark ? priorityCfg.color : priorityCfg.colorLight}`}>
                {issue.urgency ?? "Low"}
              </span>
            </div>
            <GlassBadge className={`${t.glass} text-[10px]`}>
              <StatusIcon className="w-3 h-3" />
              {issue.status}
            </GlassBadge>
          </div>
        </div>
      </CardHeader>

      {/* ── Card Content Body ─────────────────────────────────────────────── */}
      <CardContent className="px-4 sm:px-5 py-4 space-y-4">

        {/* Title + category */}
        <div className="flex flex-col gap-2">
          <h3 className={t.cardTitle}>{issue.title ?? "Untitled Issue"}</h3>
          <GlassBadge className={`${t.glass} w-fit`}>
            {issue.category ?? "General"}
          </GlassBadge>
        </div>

        {/* Description */}
        <p className={t.cardDesc}>
          {issue.description ?? "No description provided."}
        </p>

        {/* Photo attachment box */}
        <div className={`border rounded-lg aspect-video flex items-center
                        justify-center text-sm font-mono ${t.imgBox}`}>
          {issue.imageUrl
            ? (
              <img
                src={issue.imageUrl}
                alt="Issue attachment"
                className="w-full h-full object-cover rounded-lg"
              />
            )
            : <span className="opacity-50">[ photo attachment ]</span>
          }
        </div>

        {/* Location tag */}
        <div className={`flex items-center gap-2 font-mono text-xs border
                        rounded-md px-3 py-2 ${t.loc}`}>
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span className="font-semibold shrink-0">location::</span>
          <span className="truncate">{issue.locationCode ?? "—"}</span>
        </div>

        {/* ✅ District tag — live schema field (replaces old region field) */}
        {issue.district && (
          <div className={`flex items-center gap-1.5 text-xs w-fit
                          rounded-md px-2.5 py-1 border ${t.pill}`}>
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="capitalize font-medium">{issue.district}</span>
          </div>
        )}

        {/* Verification gate */}
        <VerificationGate
          issue={issue}
          onStatusChange={onStatusChange}
          t={t}
          dark={dark}
        />

        {/* Comment thread */}
        <div className="flex flex-col gap-2">
          <div className={`flex items-center gap-1.5 text-xs font-semibold ${t.muted}`}>
            <MessageSquare className="w-3.5 h-3.5" />
            Community Thread
            <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${t.pill}`}>
              {issue.comments?.length ?? 0}
            </span>
          </div>
          <div
            className={`hide-scrollbar max-h-[200px] overflow-y-auto rounded-xl p-2.5
              ${dark ? "bg-zinc-800/30" : "bg-zinc-50/80"}`}
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            <CommentThread comments={issue.comments ?? []} t={t} dark={dark} />
            <div ref={commentEndRef} />
          </div>
        </div>
      </CardContent>

      {/* ── Card Footer: admin comment input ──────────────────────────────── */}
      <CardFooter className="px-4 sm:px-5 pb-4 pt-0">
        <div className={`flex items-center gap-2 w-full rounded-xl border px-3 py-2
          ${dark
            ? "bg-zinc-800/50 border-zinc-700/40"
            : "bg-zinc-50 border-zinc-200"
          }`}
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-600
                          to-purple-700 flex items-center justify-center
                          text-white text-[10px] font-bold shrink-0">
            {user?.name?.[0]?.toUpperCase() ?? "A"}
          </div>
          <input
            type="text"
            placeholder={`Reply as ${
              user?.department
                ? `@${user.department.toLowerCase().replace(/\s+/g, ".")}`
                : "@admin"
            }…`}
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            onKeyDown={handleKeyDown}
            className={`flex-1 text-xs bg-transparent outline-none ${t.inputInner}`}
          />
          <button
            onClick={handleSendComment}
            disabled={!commentText.trim() || sending}
            className={`shrink-0 p-1.5 rounded-lg transition-all duration-150
              ${commentText.trim() && !sending
                ? dark
                  ? "bg-blue-600 text-white hover:bg-blue-500"
                  : "bg-blue-600 text-white hover:bg-blue-700"
                : dark
                  ? "bg-zinc-700/50 text-zinc-600 cursor-not-allowed"
                  : "bg-zinc-200 text-zinc-400 cursor-not-allowed"
              }`}
          >
            {sending
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <Send    className="w-3.5 h-3.5" />
            }
          </button>
        </div>
      </CardFooter>
    </Card>
  );
}

// ─── Sidebar helpers ──────────────────────────────────────────────────────────

function SidebarFilterButton({ label, count, isActive, onClick, dark, t, colorClass }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-between w-full px-3 py-2 rounded-xl
                  text-sm transition-all duration-150
        ${isActive ? t.sbActive : t.sbItem}`}
    >
      <span className="flex items-center gap-2 capitalize">
        {colorClass && (
          <span className={`w-2 h-2 rounded-full shrink-0 ${colorClass}`} />
        )}
        {label}
      </span>
      <span className={`text-xs px-2 py-0.5 rounded-full
        ${isActive
          ? dark ? "bg-white/10 text-zinc-300" : "bg-zinc-900/10 text-zinc-600"
          : dark ? "bg-zinc-800 text-zinc-500"  : "bg-zinc-100 text-zinc-400"
        }`}>
        {count}
      </span>
    </button>
  );
}

function SidebarProfileBlock({ user, isMock, t, dark }) {
  const reputation = user?.reputationScore ?? 0;
  const tier =
    reputation >= 200 ? { label: "Elite",    color: "text-purple-400" } :
    reputation >= 100 ? { label: "Expert",   color: "text-blue-400"   } :
    reputation >= 50  ? { label: "Active",   color: "text-emerald-400"} :
                        { label: "Newcomer", color: "text-zinc-400"   };

  return (
    <div className="flex flex-col gap-3 px-4 py-4">
      {isMock && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-700/40
                        bg-amber-900/20 px-3 py-2">
          <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
          <span className="text-amber-400 text-xs font-medium">
            Mock mode — backend offline
          </span>
        </div>
      )}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-700
                        flex items-center justify-center text-white text-sm font-bold shrink-0">
          {user?.name?.[0]?.toUpperCase() ?? "A"}
        </div>
        <div className="flex flex-col min-w-0">
          <span className={`text-sm font-semibold truncate ${t.title}`}>
            {user?.name ?? "Administrator"}
          </span>
          <span className={`text-xs truncate ${t.muted}`}>
            {user?.department ?? "Municipal Department"}
          </span>
        </div>
      </div>
      {user?.zone && (
        <div className={`flex items-center gap-1.5 text-xs rounded-lg px-3 py-1.5 ${t.pill}`}>
          <MapPin className="w-3 h-3 shrink-0" />
          <span className="capitalize">{user.zone}</span>
        </div>
      )}
      <div className={`flex items-center justify-between rounded-xl px-3 py-2.5 ${t.card}`}>
        <div className="flex items-center gap-2">
          <Star className={`w-3.5 h-3.5 ${tier.color}`} />
          <span className={`text-xs font-medium ${t.muted}`}>Rep Score</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold ${tier.color}`}>{reputation}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full border
            ${dark
              ? "bg-zinc-800 border-zinc-700 text-zinc-400"
              : "bg-zinc-100 border-zinc-200 text-zinc-500"
            }`}>
            {tier.label}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {[
          { label: "Done",    value: user?.stats?.resolved   ?? 0, color: "text-emerald-400" },
          { label: "Active",  value: user?.stats?.inProgress ?? 0, color: "text-amber-400"   },
          { label: "Pending", value: user?.stats?.pending    ?? 0, color: "text-red-400"     },
        ].map(({ label, value, color }) => (
          <div key={label}
            className={`rounded-xl px-2 py-2 flex flex-col items-center gap-0.5 ${t.card}`}>
            <span className={`text-base font-bold ${color}`}>{value}</span>
            <span className={`text-[10px] ${t.muted}`}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MetricsTiles({ issues, t }) {
  const total    = issues.length;
  const resolved = issues.filter(i => i.status === "Resolved").length;
  const critical = issues.filter(i => i.urgency === "Critical").length;
  const avgScore = total
    ? (issues.reduce((s, i) => s + calcPriorityScore(i), 0) / total).toFixed(1)
    : "—";

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-5 pt-4 shrink-0">
      {[
        { label: "Total",     value: total,    color: t.title            },
        { label: "Resolved",  value: resolved, color: "text-emerald-400" },
        { label: "Critical",  value: critical, color: "text-red-400"     },
        { label: "Avg Score", value: avgScore, color: "text-amber-400"   },
      ].map(({ label, value, color }) => (
        <div key={label} className={`rounded-2xl px-4 py-3 flex flex-col gap-0.5 ${t.card}`}>
          <span className={`text-xl font-bold ${color}`}>{value}</span>
          <span className={`text-xs ${t.muted}`}>{label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [dark, setDark]         = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const t = useMemo(() => buildTheme(dark), [dark]);

  const [user,    setUser]    = useState(null);
  const [issues,  setIssues]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMock,  setIsMock]  = useState(false);

  const [activeRegion, setActiveRegion] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery,  setSearchQuery]  = useState("");

  // ── Inject webkit scrollbar-hide CSS once on mount ──────────────────────────
  useEffect(() => {
    const styleId = "agora-scrollbar-hide";
    if (!document.getElementById(styleId)) {
      const el = document.createElement("style");
      el.id = styleId;
      el.textContent = scrollbarHideStyle;
      document.head.appendChild(el);
    }
  }, []);

  // ── Load profile ────────────────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("agora_token");
    if (token !== "true") {
      console.warn("[AdminDashboard] Token missing — loading mock profile.");
      setUser(MOCK_USER);
      setIsMock(true);
      if (MOCK_USER.zone && REGIONS.includes(MOCK_USER.zone)) {
        setActiveRegion(MOCK_USER.zone);
      }
      return;
    }
    axios
      .get(`${API_BASE}/api/auth/profile`, { withCredentials: true })
      .then(({ data }) => {
        setUser(data);
        if (data?.zone && REGIONS.includes(data.zone)) setActiveRegion(data.zone);
      })
      .catch((err) => {
        console.warn("[AdminDashboard] Profile fetch failed — mock fallback.", err?.message);
        setUser(MOCK_USER);
        setIsMock(true);
        if (MOCK_USER.zone && REGIONS.includes(MOCK_USER.zone)) {
          setActiveRegion(MOCK_USER.zone);
        }
      });
  }, []);

  // ── Load issues ─────────────────────────────────────────────────────────────
  // ✅ Endpoint realigned: /api/auth/admin/issues → /api/issues
  useEffect(() => {
    if (!user) return;
    setLoading(true);

    if (isMock) {
      setIssues(MOCK_ISSUES);
      setLoading(false);
      return;
    }

    axios
      .get(`${API_BASE}/api/issues`, { withCredentials: true })
      .then(({ data }) => {
        // ✅ Controller returns { success, count, data: [...] }
        const list = Array.isArray(data) ? data : (data?.data ?? []);
        setIssues(list);
      })
      .catch((err) => {
        console.warn("[AdminDashboard] Issues fetch failed — mock fallback.", err?.message);
        setIssues(MOCK_ISSUES);
        setIsMock(true);
      })
      .finally(() => setLoading(false));
  }, [user, isMock]);

  // ── Status change ───────────────────────────────────────────────────────────
  // ✅ Endpoint realigned: /api/auth/admin/issues/:id/status → /api/issues/:id/status
  const handleStatusChange = (issueId, newStatus) => {
    const snapshot = issues.map(i => ({ ...i }));

    // Optimistic UI update
    setIssues(prev => prev.map(issue => {
      if (issue._id !== issueId) return issue;
      return { ...issue, status: newStatus };
    }));

    if (isMock) {
      console.info(`[AdminDashboard] Mock status: ${issueId} → ${newStatus}`);
      return;
    }

    axios
      .patch(
        // ✅ Exact endpoint required: /api/issues/:id/status
        `${API_BASE}/api/issues/${issueId}/status`,
        // ✅ Exact payload field required by controller: { status }
        { status: newStatus },
        { withCredentials: true }
      )
      .catch((err) => {
        console.warn("[AdminDashboard] Status PATCH failed — rolling back.", err?.message);
        setIssues(snapshot);
      });
  };

  // ── Add comment ─────────────────────────────────────────────────────────────
  // ✅ Endpoint realigned: /api/auth/admin/issues/:id/comments → /api/issues/:id/comments
  // ✅ Payload aligned: controller expects { text } only — username/role set server-side
  const handleAddComment = async (issueId, commentText) => {
    // Optimistic comment — shaped to match live CommentSchema fields
    const optimisticComment = {
      _id:       `optimistic-${Date.now()}`,
      username:  user?.department
                   ? `@${user.department.toLowerCase().replace(/\s+/g, ".")}`
                   : "@admin",
      role:      "admin",
      text:      commentText,
      createdAt: new Date().toISOString(),
    };

    // Append optimistically
    setIssues(prev => prev.map(issue => {
      if (issue._id !== issueId) return issue;
      return { ...issue, comments: [...(issue.comments ?? []), optimisticComment] };
    }));

    if (isMock) {
      console.info(`[AdminDashboard] Mock comment added to ${issueId}`);
      return;
    }

    try {
      const { data } = await axios.post(
        // ✅ Exact endpoint: /api/issues/:id/comments
        `${API_BASE}/api/issues/${issueId}/comments`,
        // ✅ Exact payload field required by controller: { text }
        { text: commentText },
        { withCredentials: true }
      );

      // ✅ Swap the optimistic stub with the real saved sub-document from MongoDB
      // Controller returns { success, data: savedComment }
      const savedComment = data?.data ?? optimisticComment;

      setIssues(prev => prev.map(issue => {
        if (issue._id !== issueId) return issue;
        return {
          ...issue,
          comments: issue.comments.map(c =>
            c._id === optimisticComment._id ? savedComment : c
          ),
        };
      }));

    } catch (err) {
      console.warn("[AdminDashboard] Comment POST failed — removing optimistic stub.", err?.message);
      // Roll back the optimistic comment on failure
      setIssues(prev => prev.map(issue => {
        if (issue._id !== issueId) return issue;
        return {
          ...issue,
          comments: issue.comments.filter(c => c._id !== optimisticComment._id),
        };
      }));
    }
  };

  // ── Filtered + sorted list ──────────────────────────────────────────────────
  // ✅ Filter now reads district field (live schema) instead of old region field
  const filteredIssues = useMemo(() => {
    let list = [...issues];

    if (activeRegion !== "ALL") {
      list = list.filter(i => i.district === activeRegion);
    }
    if (statusFilter !== "ALL") {
      list = list.filter(i => i.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(i =>
        i.title?.toLowerCase().includes(q)       ||
        i.description?.toLowerCase().includes(q) ||
        i.category?.toLowerCase().includes(q)
      );
    }

    // ✅ Sort by priorityScore from live schema (server-computed)
    list.sort((a, b) => calcPriorityScore(b) - calcPriorityScore(a));
    return list;
  }, [issues, activeRegion, statusFilter, searchQuery]);

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className={`h-screen overflow-hidden transition-colors duration-300 ${t.page}`}>
      <div className="flex h-full">

        {/* ══════════ MOBILE BACKDROP ══════════════════════════════════════════ */}
        {menuOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* ══════════ SIDEBAR ══════════════════════════════════════════════════ */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-50 w-72 h-full
            flex flex-col
            transform transition-transform duration-300 ease-in-out
            lg:static lg:translate-x-0
            ${menuOpen ? "translate-x-0" : "-translate-x-full"}
            ${t.sidebar}
          `}
        >
          {/* Sidebar Header */}
          <div className={`flex items-center justify-between
                          px-5 pt-5 pb-4 border-b shrink-0 ${t.sbBorder}`}>
            <span className={`text-sm font-bold flex items-center gap-2 ${t.sbTitle}`}>
              <SlidersHorizontal className="w-4 h-4" />
              Admin Panel Options
            </span>
            {isMock && (
              <span className="flex items-center gap-1 text-[10px] font-semibold
                               text-amber-400 px-2 py-0.5 rounded-full
                               bg-amber-900/20 border border-amber-700/30">
                <AlertTriangle className="w-3 h-3" /> Mock
              </span>
            )}
          </div>

          {/* Scrollable sidebar body */}
          <div className={`flex-1 overflow-y-auto ${t.scroll}`}>

            <div className={`border-b ${t.sbDivider}`}>
              <SidebarProfileBlock user={user} isMock={isMock} t={t} dark={dark} />
            </div>

            {/* Region filters — reads district field from live schema */}
            <div className={`border-b ${t.sbDivider}`}>
              <div className="px-5 pt-4 pb-1">
                <span className={`text-[11px] font-semibold uppercase tracking-widest ${t.sbLabel}`}>
                  District
                </span>
              </div>
              <div className="px-3 pb-3 flex flex-col gap-1">
                {REGIONS.map(region => (
                  <SidebarFilterButton
                    key={region}
                    label={region}
                    count={
                      region === "ALL"
                        ? issues.length
                        // ✅ Count by district field
                        : issues.filter(i => i.district === region).length
                    }
                    isActive={activeRegion === region}
                    onClick={() => {
                      setActiveRegion(region);
                      setMenuOpen(false);
                    }}
                    dark={dark}
                    t={t}
                  />
                ))}
              </div>
            </div>

            {/* Status filters */}
            <div className={`border-b ${t.sbDivider}`}>
              <div className="px-5 pt-4 pb-1">
                <span className={`text-[11px] font-semibold uppercase tracking-widest ${t.sbLabel}`}>
                  Status
                </span>
              </div>
              <div className="px-3 pb-3 flex flex-col gap-1">
                {["ALL", ...STATUS_STAGES].map(stage => {
                  const cfg = STATUS_CONFIG[stage];
                  return (
                    <SidebarFilterButton
                      key={stage}
                      label={stage}
                      count={
                        stage === "ALL"
                          ? issues.length
                          : issues.filter(i => i.status === stage).length
                      }
                      isActive={statusFilter === stage}
                      onClick={() => {
                        setStatusFilter(stage);
                        setMenuOpen(false);
                      }}
                      dark={dark}
                      t={t}
                      colorClass={
                        cfg
                          ? dark
                            ? cfg.color.replace("text-", "bg-")
                            : cfg.colorLight.replace("text-", "bg-")
                          : null
                      }
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar Footer */}
          <div className={`shrink-0 border-t px-4 py-4 ${t.sbBorder}`}>
            <button
              onClick={() => {
                localStorage.removeItem("agora_token");
                navigate("/login");
              }}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm
                         transition-all duration-150 text-red-400 hover:bg-red-900/20
                         border border-transparent hover:border-red-900/40"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </aside>

        {/* ══════════ MAIN CONTENT STAGE ══════════════════════════════════════ */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* Top Navigation Bar */}
          <header className={`shrink-0 h-14 flex items-center justify-between
                             px-4 sm:px-5 border-b ${t.topbar}`}>

            {/* LEFT: hamburger (mobile) + branding */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMenuOpen(true)}
                className={`lg:hidden p-2 rounded-lg transition-colors
                  ${dark
                    ? "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
                    : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
                  }`}
                aria-label="Open navigation"
              >
                <Menu className="w-6 h-6" />
              </button>

              <img
                src="/img/wed.png"
                alt="Agora"
                className="h-8 sm:h-9 w-auto shrink-0 object-contain"
              />

              <span className={`hidden sm:inline-flex text-xs px-2.5 py-1 rounded-full
                               border font-medium
                ${dark
                  ? "bg-blue-900/30 border-blue-700/40 text-blue-400"
                  : "bg-blue-50 border-blue-200 text-blue-600"
                }`}>
                Admin Dashboard
              </span>
            </div>

            {/* RIGHT: user pill (desktop) + theme toggle */}
            <div className="flex items-center gap-2">
              <div className={`hidden lg:flex items-center gap-2 text-xs
                              px-3 py-1.5 rounded-full border ${t.pill}`}>
                <User className="w-3.5 h-3.5 shrink-0" />
                <span className="font-medium">{user?.name ?? "Admin"}</span>
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setDark(p => !p)}
                className={`shrink-0 h-9 w-9 rounded-full ${t.themeTgl}`}
              >
                {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
            </div>
          </header>

          {/* Metrics tiles */}
          <MetricsTiles issues={filteredIssues} t={t} />

          {/* Search bar */}
          <div className="px-5 pt-3 pb-2 shrink-0">
            <div className={`flex items-center gap-3 rounded-2xl px-4 py-2.5 ${t.input}`}>
              <Search className={`w-4 h-4 shrink-0 ${t.muted}`} />
              <input
                type="text"
                placeholder="Search by title, description, or category…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")}>
                  <X className={`w-4 h-4 ${t.muted}`} />
                </button>
              )}
            </div>
          </div>

          {/* Feed header strip */}
          <div className={`flex items-center justify-between
                          px-5 py-2 shrink-0 border-b ${t.sbBorder}`}>
            <span className={`text-sm font-semibold ${t.title}`}>
              Issue Queue
              <span className={`ml-2 text-xs font-normal ${t.muted}`}>
                ({filteredIssues.length}{" "}
                {filteredIssues.length === 1 ? "issue" : "issues"})
              </span>
            </span>
            <span className={`text-xs ${t.faint}`}>Sorted by priority ↓</span>
          </div>

          {/* Main scrollable feed */}
          <main
            className="hide-scrollbar flex-1 overflow-y-auto px-4 sm:px-6 py-6"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {/* Loading */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="w-9 h-9 rounded-full border-2 border-blue-500
                                border-t-transparent animate-spin" />
                <span className={`text-sm ${t.muted}`}>Loading issue queue…</span>
              </div>
            )}

            {/* Empty state */}
            {!loading && filteredIssues.length === 0 && (
              <div className={`flex flex-col items-center justify-center
                              py-24 gap-3 rounded-2xl border ${t.card}`}>
                <Shield className={`w-10 h-10 ${t.muted}`} />
                <span className={`text-sm font-medium ${t.muted}`}>
                  No issues match the current filters.
                </span>
                <button
                  onClick={() => {
                    setActiveRegion("ALL");
                    setStatusFilter("ALL");
                    setSearchQuery("");
                  }}
                  className="text-xs text-blue-400 hover:text-blue-300
                             underline underline-offset-2 transition-colors"
                >
                  Clear all filters
                </button>
              </div>
            )}

            {/* Responsive 2-column grid */}
            {!loading && filteredIssues.length > 0 && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-5">
                {filteredIssues.map(issue => (
                  <IssueCard
                    key={issue._id}
                    issue={issue}
                    onStatusChange={handleStatusChange}
                    onAddComment={handleAddComment}
                    user={user}
                    t={t}
                    dark={dark}
                  />
                ))}
              </div>
            )}
          </main>

        </div>{/* end main content stage */}
      </div>{/* end flex h-full */}
    </div>   /* end root shell */
  );
}