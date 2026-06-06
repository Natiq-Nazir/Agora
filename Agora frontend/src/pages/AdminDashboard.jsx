// src/pages/AdminDashboard.jsx

import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

// ── Sidebar navigation items ───────────────────────────────────────────────────
const NAV_ITEMS = [
  {
    id: "queue",
    label: "Issue Queue",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    id: "map",
    label: "Geographic View",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
  },
  {
    id: "audit",
    label: "Audit Log",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
];

// ── Priority badge helper ──────────────────────────────────────────────────────
const PRIORITY_STYLES = {
  Critical:    "bg-red-500/10 text-red-400 border-red-500/30",
  "High Impact": "bg-amber-500/10 text-amber-400 border-amber-500/30",
  "Low Impact":  "bg-zinc-700/50 text-zinc-400 border-zinc-600",
};

// ── Status badge helper ────────────────────────────────────────────────────────
const STATUS_STYLES = {
  Reported:     "bg-zinc-700/50 text-zinc-300",
  Acknowledged: "bg-blue-500/10 text-blue-400",
  "In Progress":"bg-amber-500/10 text-amber-400",
  Resolved:     "bg-emerald-500/10 text-emerald-400",
};

// ── Admin KPI stats ────────────────────────────────────────────────────────────
const KPI = [
  { label: "Pending Review",  value: "0", color: "text-red-400",     border: "border-red-400/20",     bg: "bg-red-400/5" },
  { label: "Acknowledged",    value: "0", color: "text-blue-400",    border: "border-blue-400/20",    bg: "bg-blue-400/5" },
  { label: "In Progress",     value: "0", color: "text-amber-400",   border: "border-amber-400/20",   bg: "bg-amber-400/5" },
  { label: "Resolved Today",  value: "0", color: "text-emerald-400", border: "border-emerald-400/20", bg: "bg-emerald-400/5" },
];

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("queue");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">

      {/* ── Top Bar ───────────────────────────────────────────────────────── */}
      <header className="border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="h-16 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Sidebar toggle (mobile) */}
            <button
              onClick={() => setSidebarOpen((p) => !p)}
              className="text-zinc-400 hover:text-white transition lg:hidden"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <span className="font-bold text-white tracking-tight">Agora</span>
            <span className="hidden sm:inline-flex items-center gap-1.5 ml-1 text-xs font-medium
                             bg-indigo-500/10 text-indigo-400 border border-indigo-500/20
                             px-2.5 py-1 rounded-full">
              Admin Console
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-white">{user?.email}</p>
              <p className="text-xs text-zinc-500">
                {user?.jobTitle || "Authority"} · {user?.department || "—"}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-zinc-400 hover:text-white border border-zinc-700
                         hover:border-zinc-500 rounded-lg px-3 py-1.5 transition duration-150"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* ── Sidebar ─────────────────────────────────────────────────────── */}
        <aside className={`${sidebarOpen ? "w-56" : "w-0 overflow-hidden"}
                           lg:w-56 border-r border-zinc-800 bg-zinc-900
                           flex-shrink-0 transition-all duration-200`}>
          <nav className="p-4 space-y-1 pt-6">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                             font-medium transition duration-150
                             ${activeTab === item.id
                               ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                               : "text-zinc-400 hover:text-white hover:bg-zinc-800 border border-transparent"
                             }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>

          {/* Admin trust badge in sidebar footer */}
          <div className="absolute bottom-6 left-4 right-4 lg:w-48">
            <div className="bg-zinc-800/60 border border-zinc-700 rounded-xl p-3">
              <p className="text-xs text-zinc-500 mb-1">Trust Score</p>
              <div className="flex items-end gap-1">
                <span className="text-xl font-bold text-white">—</span>
                <span className="text-xs text-zinc-500 mb-0.5">pts</span>
              </div>
              <div className="mt-2 h-1.5 bg-zinc-700 rounded-full">
                <div className="h-1.5 bg-indigo-500 rounded-full w-0" />
              </div>
            </div>
          </div>
        </aside>

        {/* ── Main Panel ──────────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">

          {/* KPI row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {KPI.map((k) => (
              <div key={k.label}
                   className={`${k.bg} border ${k.border} rounded-xl p-5`}>
                <p className={`text-3xl font-bold ${k.color}`}>{k.value}</p>
                <p className="text-zinc-400 text-sm mt-1">{k.label}</p>
              </div>
            ))}
          </div>

          {/* Tab content */}
          {activeTab === "queue" && (
            <section>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-white">
                  Priority Issue Queue
                </h2>
                <span className="text-xs text-zinc-500 bg-zinc-800 border border-zinc-700
                                  px-3 py-1.5 rounded-lg">
                  Sorted by weighted score ↓
                </span>
              </div>

              {/* Empty state */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12
                                 bg-zinc-800 rounded-xl mb-4">
                  <svg className="w-5 h-5 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-zinc-500 text-sm">
                  The issue queue is empty. Reported issues will appear here ranked by community priority score.
                </p>
              </div>
            </section>
          )}

          {activeTab === "map" && (
            <section>
              <h2 className="text-lg font-semibold text-white mb-5">Geographic View</h2>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
                <p className="text-zinc-500 text-sm">
                  Leaflet/OSM map integration will be mounted here.
                </p>
              </div>
            </section>
          )}

          {activeTab === "audit" && (
            <section>
              <h2 className="text-lg font-semibold text-white mb-5">Audit Log</h2>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
                <p className="text-zinc-500 text-sm">
                  All administrative actions with timestamps will be listed here.
                </p>
              </div>
            </section>
          )}

          {activeTab === "analytics" && (
            <section>
              <h2 className="text-lg font-semibold text-white mb-5">Analytics</h2>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
                <p className="text-zinc-500 text-sm">
                  Resolution rate trends, category breakdowns, and SLA metrics will render here.
                </p>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;