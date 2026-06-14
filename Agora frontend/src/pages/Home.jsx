// src/pages/Home.jsx
import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Menu, MapPin, Send, LogOut, User, Info, MessageSquare,
  Flag, ArrowUpCircle, AlertTriangle, Search, Plus,
  SlidersHorizontal, UserRound as UserIcon, X, Sun, Moon,
  ChevronDown, ChevronUp, Loader2,
} from "lucide-react";

import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// ─── API Base ─────────────────────────────────────────────────────────────────
// ✅ Aligned with backend — same constant used in AdminDashboard
const API_BASE = "http://localhost:3000";

// ─── Auth ─────────────────────────────────────────────────────────────────────
const TOKEN_KEY = "agora_token";

// ─── Priority ────────────────────────────────────────────────────────────────
// ✅ Server computes priorityScore. Client-side map kept for fallback + sorting.
const URGENCY_SCORE_MAP = { Low: 10, Medium: 20, High: 30, Critical: 40 };

const calcPriorityScore = (issue) => {
  if (typeof issue.priorityScore === "number" && issue.priorityScore > 0) {
    return issue.priorityScore;
  }
  return URGENCY_SCORE_MAP[issue.urgency] ?? 10;
};

const getPriorityLabel = (score) => {
  if (score >= 30) return { label: "CRITICAL", dc: "text-red-400",    lc: "text-red-500"    };
  if (score >= 20) return { label: "HIGH",     dc: "text-amber-400",  lc: "text-amber-500"  };
  if (score >= 10) return { label: "MEDIUM",   dc: "text-yellow-400", lc: "text-yellow-600" };
  return              { label: "LOW",      dc: "text-zinc-500",  lc: "text-zinc-400"  };
};

// ─── Badge maps ──────────────────────────────────────────────────────────────
const CAT_BADGE = {
  "Water Supply":      { d: "bg-blue-500/10 border border-blue-400/40 text-blue-300",       l: "bg-blue-500/10 border border-blue-500/30 text-blue-600"       },
  "Roads":             { d: "bg-red-500/10 border border-red-400/40 text-red-300",          l: "bg-red-500/10 border border-red-500/30 text-red-600"           },
  "Sanitation":        { d: "bg-orange-500/10 border border-orange-400/40 text-orange-300", l: "bg-orange-500/10 border border-orange-500/30 text-orange-600"  },
  "Electricity":       { d: "bg-yellow-500/10 border border-yellow-400/40 text-yellow-300", l: "bg-yellow-500/10 border border-yellow-500/30 text-yellow-600"  },
  "Infrastructure":    { d: "bg-purple-500/10 border border-purple-400/40 text-purple-300", l: "bg-purple-500/10 border border-purple-500/30 text-purple-600" },
  "Roads & Transport": { d: "bg-red-500/10 border border-red-400/40 text-red-300",         l: "bg-red-500/10 border border-red-500/30 text-red-600"           },
  "Waste Management":  { d: "bg-orange-500/10 border border-orange-400/40 text-orange-300", l: "bg-orange-500/10 border border-orange-500/30 text-orange-600"  },
};

const STAT_BADGE = {
  Reported:               { d: "bg-zinc-500/10 border border-zinc-400/40 text-zinc-300",          l: "bg-zinc-500/10 border border-zinc-400/30 text-zinc-600"          },
  Acknowledged:           { d: "bg-blue-500/10 border border-blue-400/40 text-blue-300",          l: "bg-blue-500/10 border border-blue-400/30 text-blue-600"          },
  "In Progress":          { d: "bg-amber-500/10 border border-amber-400/40 text-amber-300",       l: "bg-amber-500/10 border border-amber-400/30 text-amber-600"       },
  "Verification Pending": { d: "bg-purple-500/10 border border-purple-400/40 text-purple-300",    l: "bg-purple-500/10 border border-purple-400/30 text-purple-600"    },
  Resolved:               { d: "bg-emerald-500/10 border border-emerald-400/40 text-emerald-300", l: "bg-emerald-500/10 border border-emerald-400/30 text-emerald-600" },
};

const GlassBadge = ({ label, map, dark, className = "" }) => {
  const s = map?.[label] ?? { d: "bg-zinc-500/10 border border-zinc-400/40 text-zinc-300", l: "bg-zinc-500/10 border border-zinc-400/30 text-zinc-500" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold backdrop-blur-sm ${dark ? s.d : s.l} ${className}`}>
      {label}
    </span>
  );
};

// ─── Mock Fallback Data ──────────────────────────────────────────────────────
// ✅ Aligned to live Issue.js schema fields: district, urgency, priorityScore,
//    username, role, createdAt — NO nested replies, NO statusHistory.
const MOCK_ISSUES = [
  {
    _id: "mock-001", title: "Broken water main flooding road",
    description: "Water gushing for 6 hours. Traffic blocked near Lal Chowk. Crew yet to arrive.",
    category: "Water Supply", status: "Reported", imageUrl: null,
    locationCode: "23,56,2886,3",
    district: "srinagar", urgency: "Critical", priorityScore: 40,
    reporter: "citizen_442", department: "GMC Srinagar",
    createdAt: "2024-11-10T08:30:00.000Z",
    comments: [
      { _id: "c1", username: "citizen_442",  role: "citizen", text: "Like this since morning.",        createdAt: "2024-11-10T09:30:00.000Z" },
      { _id: "c2", username: "admin_gmc",    role: "admin",   text: "Team on the way.",                createdAt: "2024-11-10T09:45:00.000Z" },
    ],
  },
  {
    _id: "mock-002", title: "Pothole cluster on NH-44",
    description: "Deep potholes near Pantha Chowk. Three vehicles damaged this week.",
    category: "Roads", status: "Acknowledged", imageUrl: null,
    locationCode: "19,44,2101,7",
    district: "pulwama", urgency: "High", priorityScore: 30,
    reporter: "citizen_231", department: "PWD Kashmir",
    createdAt: "2024-11-09T05:00:00.000Z",
    comments: [
      { _id: "c3", username: "citizen_771", role: "citizen", text: "Lost my suspension here.", createdAt: "2024-11-09T06:00:00.000Z" },
    ],
  },
  {
    _id: "mock-003", title: "Uncollected waste for 4 days",
    description: "Garbage piling at sector 4 market. Health hazard developing.",
    category: "Sanitation", status: "Reported", imageUrl: null,
    locationCode: "08,12,1774,2",
    district: "budgam", urgency: "Medium", priorityScore: 20,
    reporter: "citizen_089", department: "Sanitation Dept",
    createdAt: "2024-11-08T12:00:00.000Z",
    comments: [],
  },
  {
    _id: "mock-004", title: "Street light outage — Block C",
    description: "No lighting for 3 nights. Multiple safety concerns raised.",
    category: "Electricity", status: "In Progress", imageUrl: null,
    locationCode: "31,62,2991,5",
    district: "ganderbal", urgency: "Critical", priorityScore: 40,
    reporter: "citizen_774", department: "JED Srinagar",
    createdAt: "2024-11-10T03:00:00.000Z",
    comments: [
      { _id: "c4", username: "citizen_118", role: "citizen", text: "Unsafe for women at night.",    createdAt: "2024-11-10T04:00:00.000Z" },
      { _id: "c5", username: "admin_jed",   role: "admin",   text: "Raised with ward office.",       createdAt: "2024-11-10T05:00:00.000Z" },
    ],
  },
];

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORIES   = ["Roads", "Water Supply", "Sanitation", "Electricity", "Infrastructure"];
const STATUSES     = ["Reported", "Acknowledged", "In Progress", "Verification Pending", "Resolved"];
// ✅ Lowercase to match live Issue.js district enum exactly
const ZONES        = ["all", "srinagar", "pulwama", "budgam", "ganderbal"];
const SORT_OPTIONS = [{ key: "priority", label: "Priority" }, { key: "recent", label: "Recent" }];

// ✅ Flag tiers kept for UI — votes are local-only until backend vote endpoint is added
const FLAG_TIERS = [
  { key: "Low",      label: "Low",      icon: Flag,          ac: "bg-zinc-700 text-white border-zinc-500"  },
  { key: "High",     label: "High",     icon: ArrowUpCircle, ac: "bg-amber-500 text-white border-amber-400" },
  { key: "Critical", label: "Critical", icon: AlertTriangle, ac: "bg-red-600 text-white border-red-500"     },
];

const NAV_ITEMS = [
  { label: "login / profile", icon: User,          href: "/profile"  },
  { label: "about us",        icon: Info,          href: "#about"    },
  { label: "contact us",      icon: MessageSquare, href: "#contact"  },
  { label: "feed back",       icon: ArrowUpCircle, href: "#feedback" },
];

// ─── Theme ────────────────────────────────────────────────────────────────────
const T = (d) => ({
  page:        d ? "bg-black"                                                     : "bg-[#F5F5F7]",
  header:      d ? "bg-[#121214]/80 backdrop-blur-md border-b border-zinc-800/60" : "bg-white/80 backdrop-blur-md border-b border-white/50 shadow-sm",
  tagline:     d ? "text-zinc-500 tracking-[0.25em]"                             : "text-zinc-400 tracking-[0.25em]",
  navLink:     d ? "text-zinc-400 hover:text-white"                               : "text-zinc-500 hover:text-zinc-900",
  iconBtn:     d ? "border-zinc-700/60 text-zinc-400 hover:bg-zinc-800/60 hover:text-white bg-transparent" : "border-zinc-200 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 bg-transparent",
  themeTgl:    d ? "border-zinc-700/60 text-zinc-400 hover:bg-zinc-800/60 hover:text-white bg-transparent" : "border-zinc-200 text-zinc-500 hover:bg-zinc-100 bg-transparent",
  fBadge:      d ? "bg-white text-black"                                          : "bg-zinc-900 text-white",
  ctrlBg:      d ? "bg-[#121214]/80 backdrop-blur-md border-b border-zinc-800/60" : "bg-white/80 backdrop-blur-md border-b border-white/50",
  sortOn:      d ? "bg-zinc-700/60 text-white border-zinc-600/60"                 : "bg-zinc-900 text-white border-zinc-900",
  sortOff:     d ? "bg-transparent text-zinc-400 border-zinc-700/50 hover:text-white hover:border-zinc-500" : "bg-transparent text-zinc-500 border-zinc-300 hover:text-zinc-900",
  zoneOn:      d ? "bg-zinc-700/60 text-white border-zinc-600/60"                 : "bg-orange-500/10 text-orange-600 border-orange-500/30",
  zoneOff:     d ? "bg-transparent text-zinc-400 border-zinc-700/50 hover:text-white hover:border-zinc-500" : "bg-transparent text-zinc-500 border-zinc-300 hover:text-zinc-900",
  zonePin:     d ? "text-white"                                                   : "text-orange-500",
  search:      d ? "bg-zinc-800/60 border-zinc-700/60 text-white placeholder-zinc-500 focus:border-zinc-500" : "bg-white/80 border-zinc-300/60 text-zinc-900 placeholder-zinc-400 focus:border-orange-400",
  div:         d ? "bg-zinc-800"                                                  : "bg-zinc-200",
  sidebar:     d ? "bg-[#0D0D0F] border-r border-zinc-800/60"                    : "bg-white/95 border-r border-zinc-200/80 shadow-xl",
  sbTitle:     d ? "text-white"                                                   : "text-zinc-900",
  sbDivider:   d ? "bg-zinc-800/80"                                               : "bg-zinc-200/80",
  sbNavHdr:    d ? "text-zinc-600"                                                : "text-zinc-400",
  sbLink:      d ? "text-zinc-400 hover:bg-zinc-800/60 hover:text-white"          : "text-zinc-600 hover:bg-zinc-100/80 hover:text-zinc-900",
  sbIcon:      d ? "text-zinc-600"                                                : "text-zinc-400",
  sbBorder:    d ? "border-zinc-800/60"                                           : "border-zinc-200/60",
  fHdr:        d ? "text-zinc-600"                                                : "text-zinc-400",
  fBtn:        d ? "bg-zinc-800/60 text-zinc-400 border-zinc-700/60 hover:border-zinc-500 hover:text-zinc-200" : "bg-white/60 text-zinc-600 border-zinc-200/80 hover:border-zinc-400 hover:text-zinc-900",
  fBtnOn:      d ? "bg-zinc-700/80 text-white border-zinc-500/80"                 : "bg-orange-500/10 text-orange-600 border-orange-400/60",
  card:        d ? "bg-[#121214]/60 backdrop-blur-md border border-zinc-800/60"   : "bg-white/70 backdrop-blur-md border border-white/50 shadow-sm",
  cardHdr:     d ? "bg-zinc-900/40 border-b border-zinc-800/60"                  : "bg-zinc-50/60 border-b border-zinc-200/60",
  cardTitle:   d ? "text-lg font-bold text-white"                                 : "text-lg font-bold text-zinc-900",
  cardDesc:    d ? "text-sm text-zinc-400 leading-relaxed"                        : "text-sm text-zinc-500 leading-relaxed",
  reporter:    d ? "text-sm font-bold text-white"                                 : "text-sm font-bold text-zinc-900",
  dept:        d ? "text-xs text-zinc-500"                                        : "text-xs text-zinc-400",
  ts:          d ? "text-zinc-600"                                                : "text-zinc-400",
  avatar:      d ? "bg-zinc-800/80 border-zinc-700/60"                            : "bg-zinc-100 border-zinc-200",
  avatarIc:    d ? "text-zinc-500"                                                : "text-zinc-400",
  imgBox:      d ? "border-zinc-700/60 bg-zinc-900/40"                            : "border-zinc-200/60 bg-zinc-50/60",
  imgTxt:      d ? "text-zinc-600"                                                : "text-zinc-400",
  loc:         d ? "text-red-400 bg-red-900/20 border-red-800/40"                 : "text-red-500 bg-red-50/80 border-red-200/60",
  districtBadge: d ? "text-zinc-300 bg-zinc-800/40 border-zinc-700/40"            : "text-zinc-600 bg-zinc-100/80 border-zinc-200/60",
  flagLbl:     d ? "text-zinc-500"                                                : "text-zinc-400",
  scoreBadge:  d ? "bg-zinc-800/60 text-zinc-300 border-zinc-700/60"              : "bg-zinc-100/80 text-zinc-700 border-zinc-200/80",
  flagDiv:     d ? "border-zinc-800/60"                                           : "border-zinc-200/60",
  flagOff:     d ? "bg-transparent border-zinc-700/60 text-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-200" : "bg-transparent border-zinc-200/80 text-zinc-500 hover:bg-zinc-100/80 hover:text-zinc-700",
  cBorder:     d ? "border-zinc-800/60"                                           : "border-zinc-200/60",
  cBg:         d ? "bg-zinc-900/20"                                               : "bg-zinc-50/50",
  cLabel:      d ? "text-zinc-500"                                                : "text-zinc-400",
  cCard:       d ? "bg-zinc-800/30 border-zinc-700/40"                            : "bg-white/80 border-zinc-200/60",
  cUser:       d ? "text-zinc-200 font-semibold"                                  : "text-zinc-800 font-semibold",
  cAdmin:      d ? "text-blue-400 font-semibold"                                  : "text-blue-600 font-semibold",
  cTxt:        d ? "text-zinc-400"                                                : "text-zinc-600",
  cMeta:       d ? "text-zinc-600"                                                : "text-zinc-400",
  cReply:      d ? "text-zinc-600 hover:text-zinc-300"                            : "text-zinc-400 hover:text-zinc-700",
  cThread:     d ? "text-blue-400 hover:text-blue-300"                            : "text-blue-500 hover:text-blue-700",
  rCard:       d ? "bg-zinc-900/40 border-zinc-700/30"                            : "bg-zinc-50/80 border-zinc-200/50",
  rLine:       d ? "bg-zinc-700/50"                                               : "bg-zinc-300/60",
  cEmpty:      d ? "text-zinc-700"                                                : "text-zinc-400",
  cInput:      d ? "bg-zinc-800/60 border-zinc-700/60 text-white placeholder-zinc-600 focus:border-zinc-500" : "bg-white/80 border-zinc-200/60 text-zinc-900 placeholder-zinc-400 focus:border-zinc-400",
  cSend:       d ? "border-zinc-700/60 text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200" : "border-zinc-200/80 text-zinc-500 hover:bg-zinc-100/80",
  emptyB:      d ? "border-zinc-800/60"                                           : "border-zinc-200/60",
  emptyTxt:    d ? "text-zinc-500"                                                : "text-zinc-400",
  emptyIc:     d ? "text-zinc-800"                                                : "text-zinc-300",
  pageTxt:     d ? "text-zinc-700"                                                : "text-zinc-400",
  clear:       d ? "text-zinc-400 hover:text-white"                               : "text-orange-500 hover:text-orange-600",
  fab:         d ? "bg-white text-black hover:bg-zinc-100 border-transparent shadow-2xl" : "bg-zinc-900 text-white hover:bg-zinc-800 border-transparent shadow-xl",
});

// ─── Scrollbar-none style string (inline) ─────────────────────────────────────
const NO_SCROLL_STYLE = { scrollbarWidth: "none", msOverflowStyle: "none" };

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FilterSection
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const FilterSection = ({ title, items, active, onToggle, t }) => (
  <div className="space-y-2.5">
    <p className={`text-xs font-bold uppercase tracking-[0.2em] ${t.fHdr}`}>{title}</p>
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <button
          key={item}
          onClick={() => onToggle(item)}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 ${
            active.includes(item) ? t.fBtnOn : t.fBtn
          }`}
        >
          {item}
        </button>
      ))}
    </div>
  </div>
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SidebarContent
// ─── Requirement 2: accepts `onNavigate` prop so the "login / profile" item
//     can call navigate("/profile") via React Router instead of an href anchor.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const SidebarContent = ({
  showClose, onClose, onLogout,
  activeCategories, onToggleCategory,
  activeStatuses,   onToggleStatus,
  activeFilterCount, t,
  // ── Requirement 2: navigate callback threaded in from Home ────────────────
  onNavigate,
}) => (
  <div className="flex flex-col h-full">
    <div className={`flex items-center justify-between px-5 pt-5 pb-4 border-b shrink-0 ${t.sbBorder}`}>
      <span className={`text-sm font-bold flex items-center gap-2 ${t.sbTitle}`}>
        <SlidersHorizontal className="w-4 h-4" />
        Filters &amp; Menu
      </span>
      {showClose && (
        <button onClick={onClose} className={`lg:hidden transition-colors ${t.navLink}`}>
          <X className="w-4 h-4" />
        </button>
      )}
    </div>

    <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6" style={NO_SCROLL_STYLE}>
      <FilterSection
        title="Category" items={CATEGORIES}
        active={activeCategories} onToggle={onToggleCategory} t={t}
      />
      <Separator className={t.sbDivider} />
      <FilterSection
        title="Lifecycle Status" items={STATUSES}
        active={activeStatuses} onToggle={onToggleStatus} t={t}
      />

      {activeFilterCount > 0 && (
        <button
          onClick={() => { onToggleCategory("__clear__"); onToggleStatus("__clear__"); }}
          className={`text-xs font-semibold underline underline-offset-2 ${t.clear}`}
        >
          Clear all filters ({activeFilterCount})
        </button>
      )}

      <Separator className={t.sbDivider} />

      <div className="space-y-1">
        <p className={`text-xs font-bold uppercase tracking-[0.2em] mb-3 ${t.sbNavHdr}`}>Navigation</p>
        {NAV_ITEMS.map(({ label, icon: Icon, href }) => {
          // ── Requirement 2: "login / profile" is wired to React Router
          //    navigate("/profile"). All other nav items keep their original
          //    <a href="..."> anchor behaviour — zero other items are touched.
          const isProfileLink = label === "login / profile";

          return isProfileLink ? (
            <button
              key={label}
              onClick={() => onNavigate("/profile")}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                          font-medium transition-colors duration-150 w-full
                          text-left ${t.sbLink}`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${t.sbIcon}`} />
              {label}
            </button>
          ) : (
            <a
              key={label}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${t.sbLink}`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${t.sbIcon}`} />
              {label}
            </a>
          );
        })}

        <div className="pt-2">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5
                       bg-zinc-900 hover:bg-zinc-800 border border-zinc-700
                       rounded-lg text-white text-sm font-bold transition-colors duration-150"
          >
            <LogOut className="w-4 h-4 text-white" />
            log out
          </button>
        </div>
      </div>
    </div>
  </div>
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CommentThread — ✅ Updated for live schema (flat, no nested replies)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const CommentThread = ({ comment, t }) => {
  // ✅ Live schema: role === "admin" | "citizen"
  const isAdmin = comment.role === "admin";

  return (
    <div className={`text-xs border rounded-lg px-3 py-2.5 ${
      isAdmin ? (t.dark ? "bg-blue-900/20 border-blue-800/40" : "bg-blue-50 border-blue-200") : t.cCard
    }`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <span className={isAdmin ? t.cAdmin : t.cUser}>
            {/* ✅ Live field: username */}
            {comment.username}
          </span>
          {/* ✅ Live field: role badge */}
          {isAdmin && (
            <span className={`ml-1.5 text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${
              t.dark
                ? "bg-blue-900/30 border border-blue-700/40 text-blue-400"
                : "bg-blue-50 border border-blue-200 text-blue-600"
            }`}>
              Official
            </span>
          )}
          <span className={`ml-2 ${t.cTxt}`}>{comment.text}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0 mt-0.5">
          {/* ✅ Live field: createdAt (ISO from Mongoose timestamps) */}
          <span className={`text-[10px] ${t.cMeta}`}>
            {new Date(comment.createdAt).toLocaleString("en-IN", {
              day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
            })}
          </span>
        </div>
      </div>
    </div>
  );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// IssueCard — ✅ Updated for live schema fields
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const IssueCard = ({ issue, onAddComment, t, dark }) => {
  const [cInput, setCInput]         = useState("");
  const [sending, setSending]       = useState(false);
  const [localVotes, setLocalVotes] = useState({
    Low: 0, High: 0, Critical: 0,
  });
  const [userVote, setUserVote]     = useState(null);

  const score = calcPriorityScore(issue);
  const pm    = getPriorityLabel(score);
  const sc    = dark ? pm.dc : pm.lc;

  const handleFlag = (key) => {
    if (userVote === key) {
      setLocalVotes((p) => ({ ...p, [key]: Math.max(0, p[key] - 1) }));
      setUserVote(null);
    } else {
      if (userVote) {
        setLocalVotes((p) => ({ ...p, [userVote]: Math.max(0, p[userVote] - 1) }));
      }
      setLocalVotes((p) => ({ ...p, [key]: p[key] + 1 }));
      setUserVote(key);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    const trimmed = cInput.trim();
    if (!trimmed || sending) return;
    setSending(true);
    await onAddComment(issue._id, trimmed);
    setCInput("");
    setSending(false);
  };

  const formatShort = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("en-IN", {
      day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
    });
  };

  return (
    <Card className={`w-full min-w-0 overflow-hidden ${t.card}`}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <CardHeader className={`px-4 sm:px-5 pt-4 pb-3 ${t.cardHdr}`}>
        <div className="flex items-center justify-between gap-2 min-w-0">

          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-9 h-9 rounded-full border flex items-center justify-center shrink-0 ${t.avatar}`}>
              <UserIcon className={`w-4 h-4 ${t.avatarIc}`} />
            </div>
            <div className="flex flex-col leading-tight gap-0.5 min-w-0">
              {/* ✅ Live field: reporter (string handle) */}
              <span className={`font-mono truncate ${t.reporter}`}>{issue.reporter}</span>
              <span className={`font-mono truncate ${t.dept}`}>
                {issue.department ?? "General"}
                <span className={`ml-1.5 ${t.ts}`}>• {formatShort(issue.createdAt)}</span>
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <div className="flex items-baseline gap-1.5">
              <span className={`text-xl font-black tracking-tight leading-none ${sc}`}>{score}</span>
              {/* ✅ Live field: urgency */}
              <span className={`text-[10px] font-black uppercase tracking-widest ${sc}`}>{issue.urgency}</span>
            </div>
            <GlassBadge label={issue.status} map={STAT_BADGE} dark={dark} />
          </div>
        </div>
      </CardHeader>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <CardContent className="px-4 sm:px-5 py-4 space-y-4">
        <div className="space-y-2">
          <h3 className={`break-words ${t.cardTitle}`}>{issue.title}</h3>
          <GlassBadge label={issue.category} map={CAT_BADGE} dark={dark} />
        </div>
        <p className={`break-words ${t.cardDesc}`}>{issue.description}</p>

        {/* Image */}
        <div className={`border rounded-lg aspect-video flex items-center justify-center ${t.imgBox}`}>
          {issue.imageUrl
            ? <img src={issue.imageUrl} alt={issue.title} className="w-full h-full object-cover rounded-lg" />
            : <span className={`text-xs font-mono uppercase tracking-widest text-center px-2 ${t.imgTxt}`}>[ photo attachment ]</span>
          }
        </div>

        {/* Location */}
        <div className={`flex items-center gap-2 font-mono text-xs border rounded-md px-3 py-2 ${t.loc}`}>
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span className="font-semibold shrink-0">location::</span>
          <span className="truncate">{issue.locationCode ?? "—"}</span>
        </div>

        {/* ✅ District badge — live schema field (replaces old zone) */}
        {issue.district && (
          <div className={`flex items-center gap-1.5 text-xs w-fit rounded-md px-2.5 py-1 border font-medium capitalize ${t.districtBadge}`}>
            <MapPin className="w-3 h-3 shrink-0" />
            {issue.district}
          </div>
        )}

        {/* ── Flag panel ────────────────────────────────────────────────
            ✅ Votes are local-only optimistic state.
            Backend vote endpoint is needed for persistence. */}
        <div className={`pt-3 border-t ${t.flagDiv}`}>
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className={`text-xs font-semibold uppercase tracking-widest ${t.flagLbl}`}>Flag Urgency</span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold backdrop-blur-sm border ${t.scoreBadge}`}>
              Score: {score}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            {FLAG_TIERS.map(({ key, label, icon: Icon, ac }) => (
              <button
                key={key}
                onClick={() => handleFlag(key)}
                className={`h-8 sm:h-9 rounded-lg text-[11px] sm:text-xs font-semibold
                             flex items-center justify-center gap-1 sm:gap-1.5
                             border transition-all duration-150 ${userVote === key ? ac : t.flagOff}`}
              >
                <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                <span className="truncate">{label}</span>
                <span className="font-mono opacity-70 shrink-0">{localVotes[key]}</span>
              </button>
            ))}
          </div>
          {userVote && (
            <p className={`mt-2 text-[10px] font-mono ${t.cMeta}`}>
              Your vote: <span className="font-bold">{userVote}</span> · tap again to retract
            </p>
          )}
        </div>
      </CardContent>

      {/* ── Comments ────────────────────────────────────────────────────── */}
      <CardFooter className={`flex-col items-stretch gap-3 px-4 sm:px-5 py-4 border-t ${t.cBorder} ${t.cBg}`}>
        <div className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-widest ${t.cLabel}`}>
          <MessageSquare className="w-3.5 h-3.5 shrink-0" />
          Community Thread ({issue.comments?.length ?? 0})
        </div>

        {/* Scrollable thread — ✅ flat list, no nested replies */}
        <div className="max-h-[200px] overflow-y-auto space-y-2.5" style={NO_SCROLL_STYLE}>
          {(!issue.comments || issue.comments.length === 0)
            ? <p className={`text-xs italic ${t.cEmpty}`}>No comments yet. Be the first.</p>
            : issue.comments.map((c, idx) => (
                <CommentThread
                  key={c._id ?? `comment-${idx}`}
                  comment={c}
                  t={t}
                />
              ))
          }
        </div>

        {/* Comment input */}
        <form onSubmit={submit} className="flex items-center gap-2">
          <Input
            value={cInput}
            onChange={(e) => setCInput(e.target.value)}
            placeholder="Add a comment..."
            className={`h-9 text-xs rounded-full min-w-0 ${t.cInput}`}
          />
          <button
            type="submit"
            disabled={!cInput.trim() || sending}
            className={`h-9 w-9 shrink-0 rounded-full border flex items-center justify-center transition-colors duration-150 ${
              cInput.trim() && !sending ? t.cSend : "opacity-40 cursor-not-allowed"
            }`}
          >
            {sending
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <Send    className="w-3.5 h-3.5" />
            }
          </button>
        </form>
      </CardFooter>
    </Card>
  );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Home — ✅ Updated: live API fetch, live schema field names, lowercase zones
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const Home = () => {
  const navigate = useNavigate();

  const [issues, setIssues]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [isMock, setIsMock]       = useState(false);
  const [zone, setZone]           = useState("all");
  const [sortBy, setSortBy]       = useState("priority");
  const [query, setQuery]         = useState("");
  const [mobileOpen, setMobile]   = useState(false);
  const [dark, setDark]           = useState(true);

  const [cats,  setCats]  = useState([]);
  const [stats, setStats] = useState([]);

  const t = T(dark);

  // ── Auth guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) navigate("/login", { replace: true });
  }, [navigate]);

  // ── Inject global scrollbar-none ──────────────────────────────────────────
  useEffect(() => {
    const s = document.createElement("style");
    s.id = "agora-sb";
    s.textContent = `
      html,body{scrollbar-width:none;-ms-overflow-style:none;}
      html::-webkit-scrollbar,body::-webkit-scrollbar{display:none;}
    `;
    document.head.appendChild(s);
    return () => document.getElementById("agora-sb")?.remove();
  }, []);

  // ✅ Fetch issues from live backend — falls back to MOCK_ISSUES on failure
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;

    setLoading(true);
    axios
      .get(`${API_BASE}/api/issues`, { withCredentials: true })
      .then(({ data }) => {
        const list = Array.isArray(data) ? data : (data?.data ?? []);
        setIssues(list);
      })
      .catch((err) => {
        console.warn("[Home] Issues fetch failed — mock fallback.", err?.message);
        setIssues(MOCK_ISSUES);
        setIsMock(true);
      })
      .finally(() => setLoading(false));
  }, []);

  // ── Logout ────────────────────────────────────────────────────────────────
  const handleLogout = () => {
    if (!window.confirm("Do you want to logout?")) return;
    localStorage.removeItem(TOKEN_KEY);
    navigate("/login", { replace: true });
  };

  const toggler = (setter) => (item) => {
    if (item === "__clear__") { setter([]); return; }
    setter((p) => p.includes(item) ? p.filter((x) => x !== item) : [...p, item]);
  };

  // ✅ Add citizen comment — optimistic + POST to /api/issues/:id/comments
  const handleAddComment = async (issueId, text) => {
    const optimisticComment = {
      _id:       `opt-${Date.now()}`,
      username:  "citizen_self",
      role:      "citizen",
      text,
      createdAt: new Date().toISOString(),
    };

    // Optimistic append
    setIssues((p) => p.map((i) =>
      i._id !== issueId ? i : { ...i, comments: [...(i.comments ?? []), optimisticComment] }
    ));

    try {
      const { data } = await axios.post(
        `${API_BASE}/api/issues/${issueId}/comments`,
        { text },
        { withCredentials: true }
      );
      const saved = data?.data ?? optimisticComment;
      setIssues((p) => p.map((i) =>
        i._id !== issueId ? i : {
          ...i,
          comments: i.comments.map(c =>
            c._id === optimisticComment._id ? { ...saved, role: "citizen" } : c
          ),
        }
      ));
    } catch (err) {
      console.warn("[Home] Comment POST failed — keeping optimistic.", err?.message);
    }
  };

  // ── Filter + sort pipeline ────────────────────────────────────────────────
  // ✅ Filters by issue.district (live schema field, lowercase)
  const visible = useMemo(() => {
    let r = zone === "all" ? [...issues] : issues.filter((i) => i.district === zone);

    if (query.trim()) {
      const q = query.toLowerCase();
      r = r.filter((i) =>
        i.title?.toLowerCase().includes(q) ||
        i.description?.toLowerCase().includes(q) ||
        i.category?.toLowerCase().includes(q)
      );
    }
    if (cats.length)  r = r.filter((i) => cats.includes(i.category));
    if (stats.length) r = r.filter((i) => stats.includes(i.status));

    return sortBy === "priority"
      ? [...r].sort((a, b) => calcPriorityScore(b) - calcPriorityScore(a))
      : [...r].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [issues, zone, query, cats, stats, sortBy]);

  const filterCount = cats.length + stats.length;

  // ── Requirement 2: pass navigate down into SidebarContent as onNavigate ──
  const sidebarProps = {
    onLogout:          handleLogout,
    onNavigate:        navigate,            // ← threaded in here
    activeCategories:  cats,   onToggleCategory: toggler(setCats),
    activeStatuses:    stats,  onToggleStatus:   toggler(setStats),
    activeFilterCount: filterCount, t,
  };

  return (
    <div className={`h-screen overflow-hidden transition-colors duration-300 ${t.page}`}>

      {/* ── Mobile drawer overlay ────────────────────────────────────────── */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setMobile(false)}
          />
          <div className={`fixed top-0 left-0 h-full w-72 z-50 flex flex-col lg:hidden ${t.sidebar}`}>
            <SidebarContent showClose onClose={() => setMobile(false)} {...sidebarProps} />
          </div>
        </>
      )}

      <div className="flex h-full">

        {/* ══ DESKTOP SIDEBAR ══════════════════════════════════════════════ */}
        <aside className={`hidden lg:flex flex-col shrink-0 w-72 h-full ${t.sidebar}`}>
          <SidebarContent showClose={false} {...sidebarProps} />
        </aside>

        {/* ══ RIGHT COLUMN ══════════════════════════════════════════════════ */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* Navbar */}
          <header className={`shrink-0 z-20 ${t.header}`}>
            <div className="flex items-center gap-3 sm:gap-5 px-4 sm:px-6 h-14">
              <Button
                variant="outline" size="icon"
                onClick={() => setMobile(true)}
                className={`shrink-0 relative h-9 w-9 rounded-full lg:hidden ${t.iconBtn}`}
              >
                <Menu className="w-4 h-4" />
                {filterCount > 0 && (
                  <span className={`absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px]
                                    font-bold flex items-center justify-center ${t.fBadge}`}>
                    {filterCount}
                  </span>
                )}
              </Button>

              <img src="/img/wed.png" alt="Agora" className="h-8 sm:h-9 w-auto shrink-0 object-contain" />

              <div className="flex-1 flex items-center justify-center pointer-events-none min-w-0">
                <span className={`text-[10px] sm:text-xs font-semibold truncate ${t.tagline}`}>
                  VOICE • REPORT • RESOLVE
                </span>
              </div>

              <nav className="hidden sm:flex items-center gap-4 shrink-0">
                <a href="#about"   className={`text-xs font-medium uppercase tracking-wider transition-colors ${t.navLink}`}>About</a>
                <a href="#contact" className={`text-xs font-medium uppercase tracking-wider transition-colors ${t.navLink}`}>Contact</a>
              </nav>

              <Button
                variant="outline" size="icon"
                onClick={() => setDark((p) => !p)}
                className={`shrink-0 h-9 w-9 rounded-full ${t.themeTgl}`}
              >
                {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
            </div>
          </header>

          {/* Controls row */}
          <div className={`shrink-0 px-4 sm:px-6 py-3 ${t.ctrlBg}`}>
            <div className="flex items-center gap-2 overflow-x-auto" style={NO_SCROLL_STYLE}>
              <div className="relative shrink-0">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none ${dark ? "text-zinc-600" : "text-zinc-400"}`} />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search..."
                  className={`h-8 pl-8 pr-3 text-xs rounded-full w-32 sm:w-44 border ${t.search}`}
                />
              </div>

              <div className={`w-px h-5 mx-0.5 shrink-0 ${t.div}`} />

              {SORT_OPTIONS.map(({ key, label }) => (
                <Button key={key} size="sm" variant="outline"
                  onClick={() => setSortBy(key)}
                  className={`shrink-0 h-8 text-xs font-bold uppercase tracking-wider px-3 sm:px-4 rounded-full border transition-all duration-150 ${sortBy === key ? t.sortOn : t.sortOff}`}>
                  {label}
                </Button>
              ))}

              <div className={`w-px h-5 mx-0.5 shrink-0 ${t.div}`} />

              {/* ✅ Zone pills — lowercase values match live district enum */}
              {ZONES.map((z) => {
                const active = zone === z;
                return (
                  <Button key={z} size="sm" variant="outline"
                    onClick={() => setZone(z)}
                    className={`shrink-0 h-8 text-xs font-bold px-3 sm:px-4 rounded-full border flex items-center gap-1.5 transition-all duration-150 ${active ? t.zoneOn : t.zoneOff}`}>
                    {active && z !== "all" && <MapPin className={`w-3 h-3 shrink-0 ${t.zonePin}`} />}
                    {z === "all" ? "ALL" : z}
                  </Button>
                );
              })}

              {filterCount > 0 && (
                <>
                  <div className={`w-px h-5 mx-0.5 shrink-0 ${t.div}`} />
                  <button
                    onClick={() => { setCats([]); setStats([]); }}
                    className={`shrink-0 text-xs font-semibold underline underline-offset-2 whitespace-nowrap transition-colors ${t.clear}`}>
                    {filterCount} filter{filterCount !== 1 ? "s" : ""} — clear
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Main scrollable feed */}
          <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-6" style={NO_SCROLL_STYLE}>

            {/* ✅ Loading state */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="w-9 h-9 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                <p className={`text-sm font-mono ${t.emptyTxt}`}>[ loading reports… ]</p>
              </div>
            )}

            {/* Mock mode indicator */}
            {!loading && isMock && (
              <div className={`flex items-center justify-center gap-2 mb-4 px-3 py-2 rounded-lg border text-xs ${
                dark ? "border-amber-700/40 bg-amber-900/20 text-amber-400" : "border-amber-200 bg-amber-50 text-amber-600"
              }`}>
                <AlertTriangle className="w-3 h-3 shrink-0" />
                Mock mode — backend offline
              </div>
            )}

            {/* Empty state */}
            {!loading && visible.length === 0 && (
              <div className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl py-20 gap-4 ${t.emptyB}`}>
                <Search className={`w-8 h-8 ${t.emptyIc}`} />
                <p className={`text-sm font-mono text-center px-4 ${t.emptyTxt}`}>[ no matching reports found ]</p>
                {(query || filterCount > 0) && (
                  <button
                    onClick={() => { setQuery(""); setCats([]); setStats([]); }}
                    className={`text-xs underline underline-offset-2 font-medium ${t.clear}`}>
                    Clear all filters
                  </button>
                )}
              </div>
            )}

            {/* Issue grid */}
            {!loading && visible.length > 0 && (
              <>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-5">
                  {visible.map((issue) => (
                    <IssueCard
                      key={issue._id}
                      issue={issue}
                      onAddComment={handleAddComment}
                      t={t} dark={dark}
                    />
                  ))}
                </div>

                <p className={`text-center mt-6 text-xs font-mono ${t.pageTxt}`}>
                  {visible.length} issue{visible.length !== 1 ? "s" : ""} ·{" "}
                  <span className="font-bold capitalize">{zone === "all" ? "all regions" : zone}</span>
                  {filterCount > 0 && (
                    <span className={`ml-1 ${dark ? "text-zinc-500" : "text-orange-500"}`}>
                      · {filterCount} filter{filterCount !== 1 ? "s" : ""} active
                    </span>
                  )}
                </p>
              </>
            )}
          </main>
        </div>
      </div>

      {/* ══ FAB ════════════════════════════════════════════════════════════ */}
      <button
        onClick={() => navigate("/report")}
        className={`fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40
                    flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3
                    font-bold text-sm rounded-full border-2
                    transition-all duration-200 active:scale-95 ${t.fab}`}
      >
        <Plus className="w-4 h-4 shrink-0" />
        <span>Report Issue</span>
      </button>
    </div>
  );
};

export default Home;