// src/pages/Home.jsx

import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

// ── Stat card data ─────────────────────────────────────────────────────────────
const STATS = [
  { label: "Open Issues",     value: "0", color: "text-amber-400",   bg: "bg-amber-400/10",   border: "border-amber-400/20" },
  { label: "In Progress",     value: "0", color: "text-blue-400",    bg: "bg-blue-400/10",    border: "border-blue-400/20" },
  { label: "Resolved",        value: "0", color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20" },
  { label: "Reputation Score",value: "0", color: "text-indigo-400",  bg: "bg-indigo-400/10",  border: "border-indigo-400/20" },
];

// ── Quick action definitions ────────────────────────────────────────────────────
const ACTIONS = [
  {
    title: "Report an Issue",
    description: "Submit a new civic problem with photo and GPS location",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 9v3m0 0v3m0-3h3m-3 0H9m12-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: "text-indigo-400",
    bg: "bg-indigo-400/10",
    border: "border-indigo-400/20 hover:border-indigo-400/50",
  },
  {
    title: "Browse Public Feed",
    description: "View all reported issues across your city in real time",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    color: "text-sky-400",
    bg: "bg-sky-400/10",
    border: "border-sky-400/20 hover:border-sky-400/50",
  },
  {
    title: "View Map",
    description: "Explore geo-tagged issues on an interactive city map",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/20 hover:border-emerald-400/50",
  },
  {
    title: "My Reports",
    description: "Track statuses and updates on issues you have submitted",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    color: "text-violet-400",
    bg: "bg-violet-400/10",
    border: "border-violet-400/20 hover:border-violet-400/50",
  },
];

const Home = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">

      {/* ── Top Navigation Bar ──────────────────────────────────────────────── */}
      <header className="border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <span className="font-bold text-white text-lg tracking-tight">Agora</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-white">{user?.email}</p>
              <p className="text-xs text-zinc-500 capitalize">{user?.role} account</p>
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

      {/* ── Main Content ────────────────────────────────────────────────────── */}
      <main className="max-w-6xl mx-auto px-6 py-10">

        {/* Welcome Banner */}
        <div className="mb-10">
          <h2 className="text-3xl font-bold text-white tracking-tight">
            Welcome back
          </h2>
          <p className="text-zinc-400 mt-1 text-sm">
            Here is a snapshot of civic activity in your area.
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className={`${stat.bg} ${stat.border} border rounded-xl p-5`}
            >
              <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-zinc-400 text-sm mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions Grid */}
        <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-widest mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          {ACTIONS.map((action) => (
            <button
              key={action.title}
              className={`group text-left bg-zinc-900 border ${action.border}
                          rounded-xl p-5 transition duration-150 cursor-pointer`}
            >
              <div className={`inline-flex items-center justify-center w-10 h-10
                               rounded-lg ${action.bg} ${action.color} mb-4`}>
                {action.icon}
              </div>
              <p className="font-semibold text-white text-sm">{action.title}</p>
              <p className="text-zinc-500 text-xs mt-1 leading-relaxed">
                {action.description}
              </p>
            </button>
          ))}
        </div>

        {/* Recent Activity Placeholder */}
        <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-widest mb-4">
          Recent Activity
        </h3>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
          <p className="text-zinc-600 text-sm">
            No activity yet. Submit your first issue to get started.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Home;