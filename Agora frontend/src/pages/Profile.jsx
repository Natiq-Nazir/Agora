// src/pages/Profile.jsx
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  User,
  Shield,
  Star,
  MapPin,
  CheckCircle2,
  Clock,
  Circle,
  TrendingUp,
  RefreshCw,
  AlertTriangle,
  FileText,
  ArrowLeft,
  Sun,
  Moon,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

// ─── API Base ─────────────────────────────────────────────────────────────────

const API_BASE = "http://localhost:3000";

// ─── Theme token builder — mirrors existing Agora dashboard aesthetic ─────────

const buildTheme = (dark) => ({
  page:       dark ? "bg-black text-white"        : "bg-zinc-50 text-zinc-900",
  topbar:     dark
    ? "bg-zinc-950/80 border-b border-zinc-800/60 backdrop-blur-xl"
    : "bg-white/80 border-b border-zinc-200 backdrop-blur-xl",
  card:       dark
    ? "rounded-2xl border border-zinc-800/60 bg-zinc-900/80"
    : "rounded-2xl border border-zinc-200 bg-white shadow-sm",
  cardHdr:    dark ? "border-b border-zinc-800/50"  : "border-b border-zinc-100",
  cardTitle:  dark
    ? "text-base font-bold text-white leading-snug"
    : "text-base font-bold text-zinc-900 leading-snug",
  cardDesc:   dark
    ? "text-sm text-zinc-400 leading-relaxed"
    : "text-sm text-zinc-500 leading-relaxed",
  profileCard: dark
    ? "bg-zinc-900/80 border border-zinc-800/60 rounded-2xl"
    : "bg-white border border-zinc-200 shadow-sm rounded-2xl",
  metricCard: dark
    ? "bg-zinc-900/60 border border-zinc-800/60 rounded-2xl"
    : "bg-white border border-zinc-200 shadow-sm rounded-2xl",
  glass:      dark
    ? "bg-zinc-800/60 border border-zinc-700/40 text-zinc-300 backdrop-blur-sm"
    : "bg-white/80 border border-zinc-200 text-zinc-600 backdrop-blur-sm",
  pill:       dark
    ? "bg-zinc-800/60 border border-zinc-700/40 text-zinc-400"
    : "bg-zinc-100 border border-zinc-200 text-zinc-500",
  loc:        dark
    ? "border-zinc-700/50 bg-zinc-800/50 text-zinc-400"
    : "border-zinc-200 bg-zinc-50 text-zinc-500",
  imgBox:     dark
    ? "border-zinc-800/60 bg-zinc-800/40 text-zinc-600"
    : "border-zinc-200 bg-zinc-50 text-zinc-300",
  title:      dark ? "text-white"    : "text-zinc-900",
  body:       dark ? "text-zinc-400" : "text-zinc-600",
  muted:      dark ? "text-zinc-500" : "text-zinc-400",
  faint:      dark ? "text-zinc-600" : "text-zinc-400",
  divider:    dark ? "border-zinc-800/60"  : "border-zinc-100",
  navLink:    dark
    ? "text-zinc-400 hover:text-white"
    : "text-zinc-500 hover:text-zinc-900",
  iconBtn:    dark
    ? "border-zinc-700 bg-zinc-800/60 text-zinc-300 hover:bg-zinc-700 hover:text-white"
    : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
  emptyBox:   dark
    ? "bg-zinc-900/60 border border-zinc-800/60 rounded-2xl"
    : "bg-white border border-zinc-200 shadow-sm rounded-2xl",
  errorBox:   dark
    ? "bg-red-900/20 border border-red-800/40 rounded-2xl"
    : "bg-red-50 border border-red-200 rounded-2xl",
  scroll: dark
    ? "scrollbar-thin scrollbar-track-transparent scrollbar-thumb-zinc-800"
    : "scrollbar-thin scrollbar-track-transparent scrollbar-thumb-zinc-300",
});

// ─── Priority / urgency colour config — mirrors AdminDashboard ────────────────

const PRIORITY_CONFIG = {
  Low:      { color: "text-emerald-400", colorLight: "text-emerald-700", score: "text-emerald-400" },
  Medium:   { color: "text-yellow-400",  colorLight: "text-yellow-700",  score: "text-yellow-400"  },
  High:     { color: "text-amber-400",   colorLight: "text-amber-700",   score: "text-amber-400"   },
  Critical: { color: "text-red-400",     colorLight: "text-red-700",     score: "text-red-400"     },
};

const STATUS_CONFIG = {
  Reported:              { color: "text-zinc-400",   colorLight: "text-zinc-500",   icon: Circle      },
  Acknowledged:          { color: "text-blue-400",   colorLight: "text-blue-600",   icon: Clock       },
  "In Progress":         { color: "text-amber-400",  colorLight: "text-amber-600",  icon: TrendingUp  },
  "Verification Pending":{ color: "text-purple-400", colorLight: "text-purple-600", icon: RefreshCw   },
  Resolved:              { color: "text-emerald-400",colorLight: "text-emerald-600",icon: CheckCircle2},
};

const URGENCY_SCORE_MAP = { Critical: 40, High: 30, Medium: 20, Low: 10 };

// ─── Helpers ──────────────────────────────────────────────────────────────────

const calcPriorityScore = (issue) => {
  if (typeof issue.priorityScore === "number" && issue.priorityScore > 0) {
    return issue.priorityScore;
  }
  return URGENCY_SCORE_MAP[issue.urgency] ?? 10;
};

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
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1
                  rounded-full text-xs font-semibold border ${className}`}
    >
      {children}
    </span>
  );
}

// ─── Role Badge ───────────────────────────────────────────────────────────────
// Renders a colour-coded pill that reflects user.role from the auth context.

function RoleBadge({ role, dark }) {
  // Normalise so "admin", "ADMIN", "Admin" all resolve correctly
  const normalised = (role ?? "citizen").toLowerCase();

  const config = {
    admin: {
      label:  "Administrator",
      icon:   Shield,
      styles: dark
        ? "bg-blue-900/30 border-blue-700/40 text-blue-400"
        : "bg-blue-50 border-blue-200 text-blue-600",
    },
    citizen: {
      label:  "Citizen",
      icon:   User,
      styles: dark
        ? "bg-emerald-900/30 border-emerald-700/40 text-emerald-400"
        : "bg-emerald-50 border-emerald-200 text-emerald-600",
    },
  };

  // Graceful fallback for unknown roles
  const cfg = config[normalised] ?? {
    label:  role ?? "Unknown",
    icon:   Star,
    styles: dark
      ? "bg-zinc-800/60 border-zinc-700/40 text-zinc-400"
      : "bg-zinc-100 border-zinc-200 text-zinc-500",
  };

  const Icon = cfg.icon;

  return (
    <GlassBadge className={cfg.styles}>
      <Icon className="w-3 h-3 shrink-0" />
      {cfg.label}
    </GlassBadge>
  );
}

// ─── Issue Card (citizen read-only view) ──────────────────────────────────────
// Slimmer than the admin card — no status controls or comment input.

function IssueCard({ issue, t, dark }) {
  const score      = calcPriorityScore(issue);
  const priCfg     = PRIORITY_CONFIG[issue.urgency] ?? PRIORITY_CONFIG.Low;
  const statusCfg  = STATUS_CONFIG[issue.status]   ?? STATUS_CONFIG.Reported;
  const StatusIcon = statusCfg.icon;

  return (
    <Card className={"w-full min-w-0 overflow-hidden " + t.card}>

      {/* Card Header */}
      <CardHeader className={"px-4 sm:px-5 pt-4 pb-3 " + t.cardHdr}>
        <div className="flex items-start justify-between gap-3">

          {/* Left: category + date */}
          <div className="flex flex-col gap-1 min-w-0">
            <GlassBadge className={`${t.glass} w-fit`}>
              {issue.category ?? "General"}
            </GlassBadge>
            <span className={`text-xs truncate ${t.muted}`}>
              {formatShortDate(issue.createdAt)}
            </span>
          </div>

          {/* Right: priority score + status badge */}
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <div className="flex items-baseline gap-1.5">
              <span
                className={`text-xl font-black tracking-tight leading-none
                  ${dark ? priCfg.score : priCfg.colorLight}`}
              >
                {score}
              </span>
              <span
                className={`text-[10px] font-bold uppercase tracking-widest
                  ${dark ? priCfg.color : priCfg.colorLight}`}
              >
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

      {/* Card Body */}
      <CardContent className="px-4 sm:px-5 py-4 space-y-3">

        {/* Title */}
        <h3 className={t.cardTitle}>{issue.title ?? "Untitled Issue"}</h3>

        {/* Description */}
        <p className={t.cardDesc}>
          {issue.description ?? "No description provided."}
        </p>

        {/* Photo placeholder */}
        <div
          className={`border rounded-lg aspect-video flex items-center
                      justify-center text-sm font-mono ${t.imgBox}`}
        >
          {issue.imageUrl ? (
            <img
              src={issue.imageUrl}
              alt="Issue attachment"
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <span className="opacity-50">[ photo attachment ]</span>
          )}
        </div>

        {/* Location */}
        {issue.locationCode && (
          <div
            className={`flex items-center gap-2 font-mono text-xs border
                        rounded-md px-3 py-2 ${t.loc}`}
          >
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="font-semibold shrink-0">location::</span>
            <span className="truncate">{issue.locationCode}</span>
          </div>
        )}

        {/* District tag */}
        {issue.district && (
          <div
            className={`flex items-center gap-1.5 text-xs w-fit
                        rounded-md px-2.5 py-1 border ${t.pill}`}
          >
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="capitalize font-medium">{issue.district}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Metric Tile ──────────────────────────────────────────────────────────────

function MetricTile({ label, value, color, t }) {
  return (
    <div className={`flex flex-col gap-1 px-6 py-5 ${t.metricCard}`}>
      <span className={`text-2xl sm:text-3xl font-black tracking-tight ${color}`}>
        {value}
      </span>
      <span className={`text-xs font-medium uppercase tracking-widest ${t.muted}`}>
        {label}
      </span>
    </div>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton({ dark }) {
  const pulse = dark ? "bg-zinc-800/80 animate-pulse rounded-xl" : "bg-zinc-200 animate-pulse rounded-xl";
  return (
    <div className="flex flex-col gap-4 w-full max-w-2xl mx-auto px-4 pt-10">
      <div className={`h-40 w-full ${pulse}`} />
      <div className="grid grid-cols-2 gap-3">
        <div className={`h-20 ${pulse}`} />
        <div className={`h-20 ${pulse}`} />
      </div>
      <div className={`h-48 w-full ${pulse}`} />
      <div className={`h-48 w-full ${pulse}`} />
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Profile — main page component
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function Profile() {
  const navigate = useNavigate();

  // ── Auth context ──────────────────────────────────────────────────────────
  // `loading` covers the async window while the context resolves the user
  // from the stored session / token so we never flash a broken state.
  const { user, loading: authLoading } = useAuth();

  // ── Dark mode — persisted in localStorage, same key as the rest of Agora ──
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem("agora_dark");
    return stored !== null ? stored === "true" : true;
  });

  const t = buildTheme(dark);

  // ── Issue feed state ──────────────────────────────────────────────────────
  const [allIssues,    setAllIssues]    = useState([]);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [fetchError,   setFetchError]   = useState(null);

  // ── Fetch all issues once the user is confirmed ───────────────────────────
  // Requirement 3: filter client-side by reportedBy === user._id | user.id
  // so only this citizen's own submissions appear in the activity feed.
  useEffect(() => {
    // Do not attempt the fetch while auth is still resolving
    if (authLoading) return;

    // If there is no logged-in user after auth resolves, redirect to login
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    const fetchIssues = async () => {
      setFetchLoading(true);
      setFetchError(null);

      try {
        const { data } = await axios.get(
          `${API_BASE}/api/issues`,
          { withCredentials: true }
        );

        // Controller returns { success, count, data: [...] }
        const list = Array.isArray(data) ? data : (data?.data ?? []);
        setAllIssues(list);

      } catch (err) {
        console.error("[Profile] Issue fetch failed:", err?.message);
        setFetchError(
          err?.response?.data?.message ??
          "Failed to load your reports. Please try again."
        );
      } finally {
        setFetchLoading(false);
      }
    };

    fetchIssues();
  }, [user, authLoading, navigate]);

  // ── Filter: only this user's issues ──────────────────────────────────────
  // Requirement 3: match reportedBy against both user.id (JWT shape) and
  // user._id (Mongoose document shape) so either auth pattern works cleanly.
  const myIssues = useMemo(() => {
    if (!user || !allIssues.length) return [];

    const uid = user._id ?? user.id;

    return allIssues.filter((issue) => {
      // reportedBy may be an ObjectId string or a populated object
      const reportedById =
        typeof issue.reportedBy === "object"
          ? (issue.reportedBy?._id ?? issue.reportedBy?.id)
          : issue.reportedBy;

      return String(reportedById) === String(uid);
    });
  }, [allIssues, user]);

  // ── Derived metrics ───────────────────────────────────────────────────────
  const totalReports  = myIssues.length;
  const totalResolved = myIssues.filter((i) => i.status === "Resolved").length;

  // ── Toggle theme and persist ──────────────────────────────────────────────
  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("agora_dark", String(next));
  };

  // ── Requirement 1: show loading fallback while auth resolves ──────────────
  if (authLoading) {
    return (
      <div
        className={`min-h-screen flex flex-col transition-colors duration-300 ${t.page}`}
      >
        <LoadingSkeleton dark={dark} />
      </div>
    );
  }

  // ── Defensive: user somehow null after auth resolved (edge case) ──────────
  if (!user) return null;

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${t.page}`}
    >

      {/* ══ Top Navigation Bar ════════════════════════════════════════════ */}
      <header
        className={`sticky top-0 z-20 h-14 flex items-center justify-between
                    px-4 sm:px-6 ${t.topbar}`}
      >
        {/* Left: back button */}
        <button
          onClick={() => navigate("/home")}
          className={`flex items-center gap-2 text-sm font-medium
                      transition-colors duration-150 ${t.navLink}`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back to Feed</span>
        </button>

        {/* Centre: logo */}
        <img
          src="/img/wed.png"
          alt="Agora"
          className="h-8 sm:h-9 w-auto object-contain"
        />

        {/* Right: theme toggle */}
        <Button
          variant="outline"
          size="icon"
          onClick={toggleDark}
          className={`h-9 w-9 rounded-full shrink-0 ${t.iconBtn}`}
        >
          {dark
            ? <Sun  className="w-4 h-4" />
            : <Moon className="w-4 h-4" />
          }
        </Button>
      </header>

      {/* ══ Page Content ══════════════════════════════════════════════════ */}
      <div className="max-w-2xl mx-auto px-4 pt-8 pb-20 space-y-6">

        {/* ── Requirement 1: Profile Card ─────────────────────────────── */}
        <div className={`p-6 sm:p-8 space-y-5 ${t.profileCard}`}>

          {/* Avatar row */}
          <div className="flex items-center gap-4">
            {/* Avatar circle — initials derived from username */}
            <div
              className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600
                          to-purple-700 flex items-center justify-center
                          text-white text-xl font-black shrink-0 shadow-lg"
            >
              {user.username?.[0]?.toUpperCase() ?? "?"}
            </div>

            {/* Name + role */}
            <div className="flex flex-col gap-1.5 min-w-0">
              {/* Requirement 1: username displayed prominently */}
              <h1
                className={`text-xl sm:text-2xl font-black tracking-tight
                            truncate ${t.title}`}
              >
                {user.username}
              </h1>
              {/* Requirement 1: role badge */}
              <RoleBadge role={user.role} dark={dark} />
            </div>
          </div>

          {/* Divider */}
          <div className={`border-t ${t.divider}`} />

          {/* Secondary identity row */}
          <div className="flex flex-wrap items-center gap-3">
            {/* User ID pill */}
            <div
              className={`flex items-center gap-1.5 text-xs rounded-lg
                          px-3 py-1.5 font-mono ${t.pill}`}
            >
              <User className="w-3 h-3 shrink-0" />
              <span className="truncate max-w-[180px]">
                {user._id ?? user.id ?? "—"}
              </span>
            </div>

            {/* Zone pill — shown only when present */}
            {user.zone && (
              <div
                className={`flex items-center gap-1.5 text-xs rounded-lg
                            px-3 py-1.5 ${t.pill}`}
              >
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="capitalize">{user.zone}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Requirement 2: Metrics Row ──────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <MetricTile
            label="Total Reports"
            value={fetchLoading ? "—" : totalReports}
            color={dark ? "text-white" : "text-zinc-900"}
            t={t}
          />
          <MetricTile
            label="Issues Resolved"
            value={fetchLoading ? "—" : totalResolved}
            color="text-emerald-400"
            t={t}
          />
        </div>

        {/* ── Activity Feed header ────────────────────────────────────── */}
        <div
          className={`flex items-center justify-between
                      pb-2 border-b ${t.divider}`}
        >
          <span className={`text-sm font-bold uppercase tracking-widest ${t.muted}`}>
            My Civic Reports
          </span>
          {!fetchLoading && (
            <span className={`text-xs ${t.faint}`}>
              {totalReports} {totalReports === 1 ? "report" : "reports"}
            </span>
          )}
        </div>

        {/* ── Requirement 3 + 4: Filtered Activity Feed ──────────────── */}

        {/* State A: fetching */}
        {fetchLoading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div
              className="w-8 h-8 rounded-full border-2 border-blue-500
                          border-t-transparent animate-spin"
            />
            <span className={`text-sm ${t.muted}`}>
              Loading your reports…
            </span>
          </div>
        )}

        {/* State B: fetch error */}
        {!fetchLoading && fetchError && (
          <div
            className={`flex flex-col items-center gap-3 px-6 py-10
                        text-center ${t.errorBox}`}
          >
            <AlertTriangle
              className={`w-8 h-8 ${dark ? "text-red-400" : "text-red-500"}`}
            />
            <p className={`text-sm font-medium ${dark ? "text-red-300" : "text-red-600"}`}>
              {fetchError}
            </p>
            <button
              onClick={() => window.location.reload()}
              className={`text-xs underline underline-offset-2 transition-colors
                ${dark
                  ? "text-zinc-400 hover:text-white"
                  : "text-zinc-500 hover:text-zinc-900"
                }`}
            >
              Try again
            </button>
          </div>
        )}

        {/* State C: Requirement 4 — no reports yet */}
        {!fetchLoading && !fetchError && myIssues.length === 0 && (
          <div
            className={`flex flex-col items-center gap-4 px-8 py-14
                        text-center ${t.emptyBox}`}
          >
            <div
              className={`w-14 h-14 rounded-full flex items-center justify-center
                ${dark
                  ? "bg-zinc-800/80 border border-zinc-700/60"
                  : "bg-zinc-100 border border-zinc-200"
                }`}
            >
              <FileText
                className={`w-6 h-6 ${dark ? "text-zinc-500" : "text-zinc-400"}`}
              />
            </div>
            <div className="space-y-2">
              <p className={`text-sm font-semibold ${t.title}`}>
                No reports submitted yet
              </p>
              {/* Requirement 4: exact placeholder copy */}
              <p className={`text-sm leading-relaxed max-w-sm ${t.body}`}>
                You haven't submitted any civic reports yet. Help improve your
                community by filing your first report!
              </p>
            </div>
            <button
              onClick={() => navigate("/report")}
              className={`mt-2 px-5 py-2.5 rounded-xl text-sm font-bold
                          border-2 transition-all duration-200 active:scale-[0.98]
                ${dark
                  ? "bg-white text-black hover:bg-zinc-100 border-transparent"
                  : "bg-zinc-900 text-white hover:bg-zinc-800 border-transparent"
                }`}
            >
              Submit a Report
            </button>
          </div>
        )}

        {/* State D: Requirement 3 — user's own issue cards */}
        {!fetchLoading && !fetchError && myIssues.length > 0 && (
          <div className="flex flex-col gap-4">
            {myIssues.map((issue) => (
              <IssueCard
                key={issue._id}
                issue={issue}
                t={t}
                dark={dark}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}