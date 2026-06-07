// src/pages/Home.jsx
import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Menu, MapPin, Send, LogOut, User, Info, MessageSquare,
  Flag, ArrowUpCircle, AlertTriangle, Search, Plus,
  SlidersHorizontal, UserRound as UserIcon, X, Sun, Moon,
  ChevronDown, ChevronUp,
} from "lucide-react";

import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// ─── Auth ─────────────────────────────────────────────────────────────────────
const TOKEN_KEY = "agora_token";

// ─── Priority ────────────────────────────────────────────────────────────────
const WEIGHTS = { low: 1, high: 2, critical: 3 };
const calcPriorityScore = (f) =>
  f.low * WEIGHTS.low + f.high * WEIGHTS.high + f.critical * WEIGHTS.critical;

const getPriorityLabel = (score) => {
  if (score >= 20) return { label: "CRITICAL", dc: "text-red-400",    lc: "text-red-500"    };
  if (score >= 10) return { label: "HIGH",     dc: "text-amber-400",  lc: "text-amber-500"  };
  if (score >= 4)  return { label: "MEDIUM",   dc: "text-yellow-400", lc: "text-yellow-600" };
  return              { label: "LOW",      dc: "text-zinc-500",  lc: "text-zinc-400"  };
};

// ─── Badge maps ──────────────────────────────────────────────────────────────
const CAT_BADGE = {
  "Water Supply":      { d: "bg-blue-500/10 border border-blue-400/40 text-blue-300",       l: "bg-blue-500/10 border border-blue-500/30 text-blue-600"       },
  "Roads & Transport": { d: "bg-red-500/10 border border-red-400/40 text-red-300",          l: "bg-red-500/10 border border-red-500/30 text-red-600"           },
  "Waste Management":  { d: "bg-orange-500/10 border border-orange-400/40 text-orange-300", l: "bg-orange-500/10 border border-orange-500/30 text-orange-600"  },
  "Electricity":       { d: "bg-yellow-500/10 border border-yellow-400/40 text-yellow-300", l: "bg-yellow-500/10 border border-yellow-500/30 text-yellow-600"  },
};
const STAT_BADGE = {
  Reported:      { d: "bg-zinc-500/10 border border-zinc-400/40 text-zinc-300",          l: "bg-zinc-500/10 border border-zinc-400/30 text-zinc-600"          },
  Acknowledged:  { d: "bg-blue-500/10 border border-blue-400/40 text-blue-300",          l: "bg-blue-500/10 border border-blue-400/30 text-blue-600"          },
  "In Progress": { d: "bg-amber-500/10 border border-amber-400/40 text-amber-300",       l: "bg-amber-500/10 border border-amber-400/30 text-amber-600"       },
  Resolved:      { d: "bg-emerald-500/10 border border-emerald-400/40 text-emerald-300", l: "bg-emerald-500/10 border border-emerald-400/30 text-emerald-600" },
};

const GlassBadge = ({ label, map, dark, className = "" }) => {
  const s = map?.[label] ?? { d: "bg-zinc-500/10 border border-zinc-400/40 text-zinc-300", l: "bg-zinc-500/10 border border-zinc-400/30 text-zinc-500" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold backdrop-blur-sm ${dark ? s.d : s.l} ${className}`}>
      {label}
    </span>
  );
};

// ─── Seed data ────────────────────────────────────────────────────────────────
// TODO: swap with GET /api/issues
const SEED = [
  {
    id: "RPT-0041", reporter: "@natiq", department: "@gmc_srinagar",
    title: "Broken water main flooding road",
    description: "Water gushing for 6 hours. Traffic blocked near Lal Chowk. Crew yet to arrive.",
    category: "Water Supply", status: "Reported", image: null,
    locationCode: "23,56,2886,3", zone: "srinagar", ward: "Ward 12 — Central",
    createdAt: "2h ago", createdAtMs: Date.now() - 7200000,
    flags: { low: 2, high: 5, critical: 8 },
    comments: [
      { id: 1, user: "@faizan_k", text: "Like this since morning.", createdAt: "1h ago",
        replies: [
          { id: 101, user: "@admin_jk",  text: "Team on the way.",        createdAt: "45m ago" },
          { id: 102, user: "@meera_v",   text: "Still no sign of anyone.", createdAt: "30m ago" },
        ],
      },
      { id: 2, user: "@road_watch", text: "Three lanes submerged.", createdAt: "50m ago", replies: [] },
    ],
  },
  {
    id: "RPT-0042", reporter: "@driver_01", department: "@pwd_kashmir",
    title: "Pothole cluster on NH-44",
    description: "Deep potholes near Pantha Chowk. Three vehicles damaged this week.",
    category: "Roads & Transport", status: "Acknowledged", image: null,
    locationCode: "19,44,2101,7", zone: "pulwama", ward: "Ward 7 — North",
    createdAt: "5h ago", createdAtMs: Date.now() - 18000000,
    flags: { low: 1, high: 9, critical: 3 },
    comments: [
      { id: 1, user: "@road_user", text: "Lost my suspension here.", createdAt: "4h ago",
        replies: [{ id: 101, user: "@zara_k", text: "Bike tyre burst on this stretch.", createdAt: "3h ago" }],
      },
    ],
  },
  {
    id: "RPT-0043", reporter: "@resident_sq4", department: "@sek_jammu",
    title: "Uncollected waste for 4 days",
    description: "Garbage piling at sector 4 market. Health hazard developing.",
    category: "Waste Management", status: "Reported", image: null,
    locationCode: "08,12,1774,2", zone: "kulgam", ward: "Ward 19 — East",
    createdAt: "1d ago", createdAtMs: Date.now() - 86400000,
    flags: { low: 6, high: 2, critical: 0 },
    comments: [],
  },
  {
    id: "RPT-0044", reporter: "@resident_c4", department: "@jed_srinagar",
    title: "Street light outage — Block C",
    description: "No lighting for 3 nights. Multiple safety concerns raised.",
    category: "Electricity", status: "In Progress", image: null,
    locationCode: "31,62,2991,5", zone: "srinagar", ward: "Ward 12 — Central",
    createdAt: "3h ago", createdAtMs: Date.now() - 10800000,
    flags: { low: 0, high: 4, critical: 6 },
    comments: [
      { id: 1, user: "@neighbor_c", text: "Unsafe for women at night.", createdAt: "2h ago",
        replies: [{ id: 101, user: "@block_c_rep", text: "Raised with ward office.", createdAt: "1h ago" }],
      },
    ],
  },
];

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORIES   = ["Roads & Transport", "Water Supply", "Waste Management", "Electricity"];
const STATUSES     = ["Reported", "Acknowledged", "In Progress", "Resolved"];
const WARDS        = ["Ward 12 — Central", "Ward 7 — North", "Ward 19 — East"];
const ZONES        = ["all", "srinagar", "pulwama", "kulgam"]; // "all" first
const SORT_OPTIONS = [{ key: "priority", label: "Priority" }, { key: "recent", label: "Recent" }];
const FLAG_TIERS   = [
  { key: "low",      label: "Low",      icon: Flag,          ac: "bg-zinc-700 text-white border-zinc-500"  },
  { key: "high",     label: "High",     icon: ArrowUpCircle, ac: "bg-amber-500 text-white border-amber-400" },
  { key: "critical", label: "Critical", icon: AlertTriangle, ac: "bg-red-600 text-white border-red-500"     },
];
const NAV_ITEMS = [
  { label: "login / profile", icon: User,          href: "#profile"  },
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
  flagLbl:     d ? "text-zinc-500"                                                : "text-zinc-400",
  scoreBadge:  d ? "bg-zinc-800/60 text-zinc-300 border-zinc-700/60"              : "bg-zinc-100/80 text-zinc-700 border-zinc-200/80",
  flagDiv:     d ? "border-zinc-800/60"                                           : "border-zinc-200/60",
  flagOff:     d ? "bg-transparent border-zinc-700/60 text-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-200" : "bg-transparent border-zinc-200/80 text-zinc-500 hover:bg-zinc-100/80 hover:text-zinc-700",
  cBorder:     d ? "border-zinc-800/60"                                           : "border-zinc-200/60",
  cBg:         d ? "bg-zinc-900/20"                                               : "bg-zinc-50/50",
  cLabel:      d ? "text-zinc-500"                                                : "text-zinc-400",
  cCard:       d ? "bg-zinc-800/30 border-zinc-700/40"                            : "bg-white/80 border-zinc-200/60",
  cUser:       d ? "text-zinc-200 font-semibold"                                  : "text-zinc-800 font-semibold",
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
// Applied via style prop on any scrollable container to suppress the track.
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
// SidebarContent — rendered in both desktop aside and mobile drawer
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const SidebarContent = ({
  showClose, onClose, onLogout,
  activeCategories, onToggleCategory,
  activeStatuses,   onToggleStatus,
  activeWards,      onToggleWard,
  activeFilterCount, t,
}) => (
  <div className="flex flex-col h-full">
    {/* Header row */}
    <div className={`flex items-center justify-between px-5 pt-5 pb-4 border-b shrink-0 ${t.sbBorder}`}>
      <span className={`text-sm font-bold flex items-center gap-2 ${t.sbTitle}`}>
        <SlidersHorizontal className="w-4 h-4" />
        Filters &amp; Menu
      </span>
      {/* X close — only rendered on mobile (showClose=true) */}
      {showClose && (
        <button onClick={onClose} className={`lg:hidden transition-colors ${t.navLink}`}>
          <X className="w-4 h-4" />
        </button>
      )}
    </div>

    {/* Independently scrollable body — scrollbar hidden */}
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
      <Separator className={t.sbDivider} />
      <FilterSection
        title="Ward / Zone" items={WARDS}
        active={activeWards} onToggle={onToggleWard} t={t}
      />

      {activeFilterCount > 0 && (
        <button
          onClick={() => { onToggleCategory("__clear__"); onToggleStatus("__clear__"); onToggleWard("__clear__"); }}
          className={`text-xs font-semibold underline underline-offset-2 ${t.clear}`}
        >
          Clear all filters ({activeFilterCount})
        </button>
      )}

      <Separator className={t.sbDivider} />

      {/* Nav links */}
      <div className="space-y-1">
        <p className={`text-xs font-bold uppercase tracking-[0.2em] mb-3 ${t.sbNavHdr}`}>Navigation</p>
        {NAV_ITEMS.map(({ label, icon: Icon, href }) => (
          <a
            key={label}
            href={href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${t.sbLink}`}
          >
            <Icon className={`w-4 h-4 shrink-0 ${t.sbIcon}`} />
            {label}
          </a>
        ))}

        {/* Logout — directly below nav links, no empty footer gap */}
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
// CommentThread
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const CommentThread = ({ comment, onReply, t }) => {
  const [open, setOpen] = useState(false);
  const hasReplies = comment.replies?.length > 0;

  return (
    <div className="space-y-1.5">
      {/* Parent */}
      <div className={`text-xs border rounded-lg px-3 py-2.5 ${t.cCard}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <span className={t.cUser}>{comment.user}</span>
            <span className={`ml-2 ${t.cTxt}`}>{comment.text}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0 mt-0.5">
            <span className={`text-[10px] ${t.cMeta}`}>{comment.createdAt}</span>
            <button onClick={() => onReply(comment.user, comment.id)}
              className={`text-[10px] font-semibold transition-colors ${t.cReply}`}>Reply</button>
          </div>
        </div>
        {hasReplies && (
          <button onClick={() => setOpen((p) => !p)}
            className={`mt-2 flex items-center gap-1 text-[10px] font-semibold transition-colors ${t.cThread}`}>
            {open
              ? <><ChevronUp className="w-3 h-3" />── Hide replies</>
              : <><ChevronDown className="w-3 h-3" />── View replies ({comment.replies.length})</>}
          </button>
        )}
      </div>

      {/* Indented sub-replies */}
      {hasReplies && open && (
        <div className="ml-4 pl-3 relative space-y-1.5">
          <div className={`absolute left-0 top-0 bottom-0 w-px ${t.rLine}`} />
          {comment.replies.map((r) => (
            <div key={r.id} className={`text-xs border rounded-lg px-3 py-2 ${t.rCard}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <span className={t.cUser}>{r.user}</span>
                  <span className={`ml-2 ${t.cTxt}`}>{r.text}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 mt-0.5">
                  <span className={`text-[10px] ${t.cMeta}`}>{r.createdAt}</span>
                  {/* Reply on sub-reply → same parent thread, captures sub-reply author */}
                  <button onClick={() => onReply(r.user, comment.id)}
                    className={`text-[10px] font-semibold transition-colors ${t.cReply}`}>Reply</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// IssueCard
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const IssueCard = ({ issue, onFlag, onAddComment, onAddReply, t, dark }) => {
  const [cInput, setCInput]       = useState("");
  const [replyTarget, setRT]      = useState(null); // { parentId, username }
  const [userVote, setUserVote]   = useState(null);

  const score = calcPriorityScore(issue.flags);
  const pm    = getPriorityLabel(score);
  const sc    = dark ? pm.dc : pm.lc;

  const handleFlag = (key) => {
    if (userVote === key) { onFlag(issue.id, key, "dec"); setUserVote(null); }
    else {
      if (userVote) onFlag(issue.id, userVote, "dec");
      onFlag(issue.id, key, "inc");
      setUserVote(key);
    }
  };

  const setReply = (username, parentId) => { setRT({ parentId, username }); setCInput(`${username} `); };
  const cancelReply = () => { setRT(null); setCInput(""); };

  const submit = (e) => {
    e.preventDefault();
    if (!cInput.trim()) return;
    replyTarget ? onAddReply(issue.id, replyTarget.parentId, cInput.trim()) : onAddComment(issue.id, cInput.trim());
    setRT(null); setCInput("");
  };

  return (
    <Card className={`w-full min-w-0 overflow-hidden ${t.card}`}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <CardHeader className={`px-4 sm:px-5 pt-4 pb-3 ${t.cardHdr}`}>
        <div className="flex items-center justify-between gap-2 min-w-0">

          {/* Avatar + 2-line text stack */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-9 h-9 rounded-full border flex items-center justify-center shrink-0 ${t.avatar}`}>
              <UserIcon className={`w-4 h-4 ${t.avatarIc}`} />
            </div>
            <div className="flex flex-col leading-tight gap-0.5 min-w-0">
              {/* Line 1: reporter */}
              <span className={`font-mono truncate ${t.reporter}`}>{issue.reporter}</span>
              {/* Line 2: department • timestamp */}
              <span className={`font-mono truncate ${t.dept}`}>
                {issue.department}
                <span className={`ml-1.5 ${t.ts}`}>• {issue.createdAt}</span>
              </span>
            </div>
          </div>

          {/* Priority score + status */}
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <div className="flex items-baseline gap-1.5">
              <span className={`text-xl font-black tracking-tight leading-none ${sc}`}>{score}</span>
              <span className={`text-[10px] font-black uppercase tracking-widest ${sc}`}>{pm.label}</span>
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
          {issue.image
            ? <img src={issue.image} alt={issue.title} className="w-full h-full object-cover rounded-lg" />
            : <span className={`text-xs font-mono uppercase tracking-widest text-center px-2 ${t.imgTxt}`}>[ photo attachment ]</span>
          }
        </div>

        {/* Location */}
        <div className={`flex items-center gap-2 font-mono text-xs border rounded-md px-3 py-2 ${t.loc}`}>
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span className="font-semibold shrink-0">location::</span>
          <span className="truncate">{issue.locationCode}</span>
        </div>

        {/* Flag panel */}
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
                <span className="font-mono opacity-70 shrink-0">{issue.flags[key]}</span>
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
          Community Thread ({issue.comments.length})
        </div>

        {/* Scrollable thread — scrollbar hidden */}
        <div className="max-h-[200px] overflow-y-auto space-y-2.5" style={NO_SCROLL_STYLE}>
          {issue.comments.length === 0
            ? <p className={`text-xs italic ${t.cEmpty}`}>No comments yet. Be the first.</p>
            : issue.comments.map((c) => (
                <CommentThread key={c.id} comment={c} onReply={setReply} t={t} />
              ))
          }
        </div>

        {replyTarget && (
          <div className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-[11px] border ${t.cCard}`}>
            <span className={t.cTxt}>Replying to <span className={t.cUser}>{replyTarget.username}</span></span>
            <button onClick={cancelReply} className={`transition-colors ${t.cReply}`}><X className="w-3 h-3" /></button>
          </div>
        )}

        <form onSubmit={submit} className="flex items-center gap-2">
          <Input
            value={cInput}
            onChange={(e) => setCInput(e.target.value)}
            placeholder={replyTarget ? `Reply to ${replyTarget.username}...` : "add comments..."}
            className={`h-9 text-xs rounded-full min-w-0 ${t.cInput}`}
          />
          <button type="submit"
            className={`h-9 w-9 shrink-0 rounded-full border flex items-center justify-center transition-colors duration-150 ${t.cSend}`}>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </CardFooter>
    </Card>
  );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Home
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const Home = () => {
  const navigate = useNavigate();

  const [issues, setIssues]       = useState(SEED);
  const [zone, setZone]           = useState("all");   // spec 2: default "all"
  const [sortBy, setSortBy]       = useState("priority");
  const [query, setQuery]         = useState("");
  const [mobileOpen, setMobile]   = useState(false);
  const [dark, setDark]           = useState(true);

  const [cats,   setCats]   = useState([]);
  const [stats,  setStats]  = useState([]);
  const [wards,  setWards]  = useState([]);

  const t = T(dark);

  // ── Auth guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) navigate("/login", { replace: true });
  }, [navigate]);

  // ── Inject global scrollbar-none on html/body ─────────────────────────────
  // Removes native track from the entire viewport without disabling scrolling.
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

  const handleFlag = (id, key, dir) =>
    setIssues((p) => p.map((i) => i.id !== id ? i : {
      ...i, flags: { ...i.flags, [key]: Math.max(0, i.flags[key] + (dir === "inc" ? 1 : -1)) },
    }));

  const handleAddComment = (id, text) =>
    setIssues((p) => p.map((i) => i.id !== id ? i : {
      ...i, comments: [...i.comments, { id: Date.now(), user: "@you", text, createdAt: "just now", replies: [] }],
    }));

  const handleAddReply = (issueId, parentId, text) =>
    setIssues((p) => p.map((i) => i.id !== issueId ? i : {
      ...i,
      comments: i.comments.map((c) => c.id !== parentId ? c : {
        ...c, replies: [...c.replies, { id: Date.now(), user: "@you", text, createdAt: "just now" }],
      }),
    }));

  // ── Filter + sort pipeline ────────────────────────────────────────────────
  const visible = useMemo(() => {
    // "all" → merge all zones; otherwise filter by selected zone
    let r = zone === "all" ? [...issues] : issues.filter((i) => i.zone === zone);

    if (query.trim()) {
      const q = query.toLowerCase();
      r = r.filter((i) =>
        i.title.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q)
      );
    }
    if (cats.length)  r = r.filter((i) => cats.includes(i.category));
    if (stats.length) r = r.filter((i) => stats.includes(i.status));
    if (wards.length) r = r.filter((i) => wards.includes(i.ward));

    return sortBy === "priority"
      ? [...r].sort((a, b) => calcPriorityScore(b.flags) - calcPriorityScore(a.flags))
      : [...r].sort((a, b) => b.createdAtMs - a.createdAtMs);
  }, [issues, zone, query, cats, stats, wards, sortBy]);

  const filterCount = cats.length + stats.length + wards.length;

  const sidebarProps = {
    onLogout: handleLogout,
    activeCategories: cats, onToggleCategory: toggler(setCats),
    activeStatuses:  stats, onToggleStatus:   toggler(setStats),
    activeWards:     wards, onToggleWard:      toggler(setWards),
    activeFilterCount: filterCount, t,
  };

  return (
    /*
      Root: h-screen + overflow-hidden on the wrapper.
      The main scrollable region is <main> inside the right column.
      This lets the sidebar scroll independently without affecting the
      document scroll position.
    */
    <div className={`h-screen overflow-hidden transition-colors duration-300 ${t.page}`}>

      {/* ── Mobile drawer overlay ────────────────────────────────────────── */}
      {mobileOpen && (
        <>
          {/* Backdrop — tap to close, hidden on lg+ */}
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setMobile(false)}
          />
          {/* Slide-in panel — hidden on lg+ */}
          <div className={`fixed top-0 left-0 h-full w-72 z-50 flex flex-col lg:hidden ${t.sidebar}`}>
            <SidebarContent showClose onClose={() => setMobile(false)} {...sidebarProps} />
          </div>
        </>
      )}

      {/*
        ── True side-by-side layout ──────────────────────────────────────────
        flex h-full: sidebar and right column share the full viewport height.
        The header lives INSIDE the right column so it starts to the right
        of the sidebar — not above it — eliminating the top gap.
      */}
      <div className="flex h-full">

        {/* ══ DESKTOP SIDEBAR — top-flush, full-height, always visible ══════
            hidden below lg; flex column from the very top of the viewport.
            h-full = 100vh because the parent is h-screen.
        ════════════════════════════════════════════════════════════════════ */}
        <aside className={`hidden lg:flex flex-col shrink-0 w-72 h-full ${t.sidebar}`}>
          <SidebarContent showClose={false} {...sidebarProps} />
        </aside>

        {/* ══ RIGHT COLUMN — header + controls + scrollable feed ════════════
            overflow-hidden here; only <main> scrolls.
        ════════════════════════════════════════════════════════════════════ */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* ── Navbar ────────────────────────────────────────────────────
              Sits only above the feed, BESIDE the sidebar, not above it.
              shrink-0 keeps it fixed while main scrolls below.
          ──────────────────────────────────────────────────────────────── */}
          <header className={`shrink-0 z-20 ${t.header}`}>
            <div className="flex items-center gap-3 sm:gap-5 px-4 sm:px-6 h-14">

              {/* Hamburger — mobile only (lg:hidden) */}
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

              {/* Logo */}
              <img src="/img/wed.png" alt="Agora" className="h-8 sm:h-9 w-auto shrink-0 object-contain" />

              {/* Tagline */}
              <div className="flex-1 flex items-center justify-center pointer-events-none min-w-0">
                <span className={`text-[10px] sm:text-xs font-semibold truncate ${t.tagline}`}>
                  VOICE • REPORT • RESOLVE
                </span>
              </div>

              {/* Right nav — hidden on small screens */}
              <nav className="hidden sm:flex items-center gap-4 shrink-0">
                <a href="#about"   className={`text-xs font-medium uppercase tracking-wider transition-colors ${t.navLink}`}>About</a>
                <a href="#contact" className={`text-xs font-medium uppercase tracking-wider transition-colors ${t.navLink}`}>Contact</a>
              </nav>

              {/* Theme toggle */}
              <Button
                variant="outline" size="icon"
                onClick={() => setDark((p) => !p)}
                className={`shrink-0 h-9 w-9 rounded-full ${t.themeTgl}`}
              >
                {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
            </div>
          </header>

          {/* ── Controls row ─────────────────────────────────────────────── */}
          <div className={`shrink-0 px-4 sm:px-6 py-3 ${t.ctrlBg}`}>
            <div className="flex items-center gap-2 overflow-x-auto" style={NO_SCROLL_STYLE}>

              {/* Search */}
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

              {/* Sort pills */}
              {SORT_OPTIONS.map(({ key, label }) => (
                <Button key={key} size="sm" variant="outline"
                  onClick={() => setSortBy(key)}
                  className={`shrink-0 h-8 text-xs font-bold uppercase tracking-wider px-3 sm:px-4 rounded-full border transition-all duration-150 ${sortBy === key ? t.sortOn : t.sortOff}`}>
                  {label}
                </Button>
              ))}

              <div className={`w-px h-5 mx-0.5 shrink-0 ${t.div}`} />

              {/* Zone pills — "all" renders uppercase, others capitalize */}
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
                    onClick={() => { setCats([]); setStats([]); setWards([]); }}
                    className={`shrink-0 text-xs font-semibold underline underline-offset-2 whitespace-nowrap transition-colors ${t.clear}`}>
                    {filterCount} filter{filterCount !== 1 ? "s" : ""} — clear
                  </button>
                </>
              )}
            </div>
          </div>

          {/* ── Main scrollable feed ─────────────────────────────────────────
              overflow-y-auto here; scrollbar hidden via style prop.
              This is the ONLY scroll container for the feed.
          ──────────────────────────────────────────────────────────────── */}
          <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-6" style={NO_SCROLL_STYLE}>
            {visible.length === 0 ? (
              <div className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl py-20 gap-4 ${t.emptyB}`}>
                <Search className={`w-8 h-8 ${t.emptyIc}`} />
                <p className={`text-sm font-mono text-center px-4 ${t.emptyTxt}`}>[ no matching reports found ]</p>
                {(query || filterCount > 0) && (
                  <button
                    onClick={() => { setQuery(""); setCats([]); setStats([]); setWards([]); }}
                    className={`text-xs underline underline-offset-2 font-medium ${t.clear}`}>
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              <>
                {/*
                  Responsive grid:
                  grid-cols-1   → mobile (single centred card)
                  xl:grid-cols-2 → wide desktop (two columns)
                  Using xl instead of md/lg because when the sidebar is open
                  on a ~1280px monitor the cards still need room to breathe.
                */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-5">
                  {visible.map((issue) => (
                    <IssueCard
                      key={issue.id}
                      issue={issue}
                      onFlag={handleFlag}
                      onAddComment={handleAddComment}
                      onAddReply={handleAddReply}
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

      {/* ══ FAB — viewport-fixed, always accessible ══════════════════════ */}
      <button
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