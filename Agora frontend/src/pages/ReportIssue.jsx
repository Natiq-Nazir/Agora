// src/pages/ReportIssue.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  ArrowLeft,
  MapPin,
  Camera,
  CheckCircle2,
  Loader2,
  Upload,
  AlertTriangle,
  Crosshair,
} from "lucide-react";
import { Input }    from "@/components/ui/input";
import { Button }   from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

// ─── Auth key — same constant used in Home.jsx ────────────────────────────────
const TOKEN_KEY = "agora_token";

// ─── Category definitions — mirror Home.jsx badge palette ────────────────────
const CATEGORIES = [
  { label: "Water Supply",      dark: "bg-blue-500/10 border-blue-400/40 text-blue-300",       light: "bg-blue-500/10 border-blue-500/30 text-blue-600"       },
  { label: "Roads & Transport", dark: "bg-red-500/10 border-red-400/40 text-red-300",          light: "bg-red-500/10 border-red-500/30 text-red-600"           },
  { label: "Waste Management",  dark: "bg-orange-500/10 border-orange-400/40 text-orange-300", light: "bg-orange-500/10 border-orange-500/30 text-orange-600"  },
  { label: "Electricity",       dark: "bg-yellow-500/10 border-yellow-400/40 text-yellow-300", light: "bg-yellow-500/10 border-yellow-500/30 text-yellow-600"  },
];

// ─── Zone options ─────────────────────────────────────────────────────────────
const ZONES = ["Srinagar", "Pulwama", "Budgam","Ganderbal"]; // mirror Home.jsx feed filter options

// ─── Coordinate generator — matches seed format: "DD,MM,SSSS,D" ──────────────
const generateCoordinates = () => {
  const r = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  return `${r(10, 99)},${r(10, 99)},${r(1000, 9999)},${r(1, 9)}`;
};

// ─── Theme token builder — mirrors Home.jsx T() ───────────────────────────────
const getTheme = (dark) => ({
  page:       dark ? "bg-black"                                                         : "bg-[#F5F5F7]",
  header:     dark ? "bg-[#121214]/80 backdrop-blur-md border-b border-zinc-800/60"     : "bg-white/80 backdrop-blur-md border-b border-white/50 shadow-sm",
  navLink:    dark ? "text-zinc-400 hover:text-white"                                   : "text-zinc-500 hover:text-zinc-900",
  iconBtn:    dark ? "border-zinc-700/60 text-zinc-400 hover:bg-zinc-800/60 hover:text-white bg-transparent" : "border-zinc-200 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 bg-transparent",
  card:       dark ? "bg-[#121214]/60 backdrop-blur-md border border-zinc-800/60"       : "bg-white/70 backdrop-blur-md border border-white/60 shadow-sm",
  cardInner:  dark ? "bg-zinc-900/30 border border-zinc-800/40 rounded-xl"              : "bg-zinc-50/60 border border-zinc-200/60 rounded-xl",
  label:      dark ? "text-zinc-300"                                                    : "text-zinc-700",
  labelSub:   dark ? "text-zinc-600"                                                    : "text-zinc-400",
  input:      dark ? "bg-zinc-800/60 border-zinc-700/60 text-white placeholder-zinc-500 focus:border-zinc-500 focus:ring-zinc-500/20 rounded-xl" : "bg-white/80 border-zinc-300/60 text-zinc-900 placeholder-zinc-400 focus:border-orange-400 focus:ring-orange-400/20 rounded-xl",
  textarea:   dark ? "bg-zinc-800/60 border-zinc-700/60 text-white placeholder-zinc-500 focus:border-zinc-500 rounded-xl resize-none" : "bg-white/80 border-zinc-300/60 text-zinc-900 placeholder-zinc-400 focus:border-orange-400 rounded-xl resize-none",
  catOff:     dark ? "bg-zinc-800/50 border-zinc-700/60 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200" : "bg-white/60 border-zinc-200/80 text-zinc-500 hover:border-zinc-400 hover:text-zinc-800",
  divider:    dark ? "bg-zinc-800/60"                                                   : "bg-zinc-200/60",
  tagline:    dark ? "text-zinc-500"                                                    : "text-zinc-400",
  locBtn:     dark ? "border-zinc-700/60 text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200 bg-transparent" : "border-zinc-300/60 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 bg-transparent",
  zoneOff:    dark ? "bg-transparent text-zinc-400 border-zinc-700/50 hover:text-white hover:border-zinc-500" : "bg-transparent text-zinc-500 border-zinc-300 hover:text-zinc-900 hover:border-zinc-400",
  zoneOn:     dark ? "bg-zinc-700/60 text-white border-zinc-600/60"                     : "bg-orange-500/10 text-orange-600 border-orange-500/30",
  submitBtn:  dark ? "bg-white text-black hover:bg-zinc-100 border-transparent shadow-xl" : "bg-zinc-900 text-white hover:bg-zinc-800 border-transparent shadow-lg",
  reporter:   dark ? "bg-zinc-800/60 border-zinc-700/60 text-zinc-300 font-mono"        : "bg-zinc-100/80 border-zinc-300/60 text-zinc-600 font-mono",
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SectionLabel — consistent uppercase bold heading above each form block
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const SectionLabel = ({ children, sub, t }) => (
  <div className="space-y-0.5 mb-2.5">
    <p className={`text-xs font-bold uppercase tracking-[0.18em] ${t.label}`}>{children}</p>
    {sub && <p className={`text-[11px] ${t.labelSub}`}>{sub}</p>}
  </div>
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ReportIssue
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const ReportIssue = () => {
  const navigate = useNavigate();

  // Inherit dark mode preference from localStorage so the page stays
  // consistent with whatever the user last set on Home.jsx
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem("agora_dark");
    return stored !== null ? stored === "true" : true;
  });

  const t = getTheme(dark);

  // ── Auth guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) navigate("/login", { replace: true });
  }, [navigate]);

  // ── Global scrollbar suppression ──────────────────────────────────────────
  useEffect(() => {
    const s = document.createElement("style");
    s.id = "agora-sb-report";
    s.textContent = `html,body{scrollbar-width:none;-ms-overflow-style:none;}html::-webkit-scrollbar,body::-webkit-scrollbar{display:none;}`;
    document.head.appendChild(s);
    return () => document.getElementById("agora-sb-report")?.remove();
  }, []);

  // ── Form state ────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    title:        "",
    description:  "",
    category:     "",
    zone:         "",
    locationCode: "",
    reporter:     "@natiq",       // auto-populated citizen handle
    imageAttached: false,
    imageName:    "",
  });

  const [submitting, setSubmitting] = useState(false);

  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  // ── Coordinate capture mock ───────────────────────────────────────────────
  const captureCoordinates = () => {
    set("locationCode", generateCoordinates());
  };

  // ── File attachment mock ──────────────────────────────────────────────────
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      set("imageAttached", true);
      set("imageName", file.name);
    }
  };

  const handleDropZoneClick = () => {
    if (form.imageAttached) return; // already attached — do nothing on re-click
    document.getElementById("file-input-hidden").click();
  };

  // ── Submission handler ────────────────────────────────────────────────────
  // ✅ UPDATED: Replaced setTimeout mock with live axios.post to /api/issues
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation guard — unchanged from original
    if (!form.title.trim()) { alert("Please enter an issue title."); return; }
    if (!form.category)     { alert("Please select a category."); return; }
    if (!form.zone)         { alert("Please select a zone."); return; }
    if (!form.locationCode) { alert("Please capture location coordinates."); return; }

    setSubmitting(true);

    try {
      // ✅ Build payload mapped to Mongoose Issue schema field names.
      // district: zone.toLowerCase() forces "Srinagar" → "srinagar" so the
      //           enum validator on the backend accepts the value without error.
      // urgency:  hardcoded to "Low" as the citizen-facing form does not expose
      //           urgency selection — the admin pipeline escalates from here.
      // reporter: NOT sent — assigned server-side from req.user.username via
      //           authMiddleware so it cannot be spoofed from the client.
      // priorityScore: NOT sent — computed server-side from urgency by the
      //                createIssue controller before the document is saved.
      const payload = {
        title:        form.title.trim(),
        description:  form.description.trim(),
        category:     form.category,
        district:     form.zone.toLowerCase(),   // ✅ "Srinagar" → "srinagar"
        locationCode: form.locationCode,
        urgency:      "Low",                     // default starting urgency
      };

      // ✅ POST to live backend with session cookie forwarded for auth middleware
      await axios.post(
        "http://localhost:3000/api/issues",
        payload,
        { withCredentials: true }
      );

      // ✅ On success: redirect to feed so citizen sees their new post live
      navigate("/home", { replace: true });

    } catch (err) {
      // Surface the backend validation message if available, else generic fallback
      const msg =
        err?.response?.data?.message ??
        err?.response?.data?.errors?.[0] ??
        "Submission failed. Please try again.";
      alert(msg);
    // Change line 184 to print the raw error object separately so Chrome/Edge can expand it:
console.log("🔥 ACTUAL BACKEND ERROR DEETS:", err.response?.data?.errors || err.response?.data);

    } finally {
      // Always re-enable the submit button whether the call succeeded or failed
      setSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${t.page}`}>

      {/* ── Navbar ──────────────────────────────────────────────────────── */}
      <header className={`sticky top-0 z-20 ${t.header}`}>
        <div className="flex items-center justify-between px-4 sm:px-6 h-14">

          {/* Back to Feed */}
          <button
            onClick={() => navigate("/home")}
            className={`flex items-center gap-2 text-sm font-medium transition-colors duration-150 ${t.navLink}`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Feed</span>
          </button>

          {/* Logo */}
          <img src="/img/wed.png" alt="Agora" className="h-8 sm:h-9 w-auto object-contain" />

          {/* Right: theme toggle */}
          <Button
            variant="outline" size="icon"
            onClick={() => {
              const next = !dark;
              setDark(next);
              localStorage.setItem("agora_dark", String(next));
            }}
            className={`h-9 w-9 rounded-full ${t.iconBtn}`}
          >
            {dark
              ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
              : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>
            }
          </Button>
        </div>
      </header>

      {/* ── Form canvas ─────────────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto mt-8 px-4 pb-20">

        {/* Page title block */}
        <div className="mb-8">
          <h1 className={`text-2xl sm:text-3xl font-black tracking-tight ${dark ? "text-white" : "text-zinc-900"}`}>
            Submit a Civic Report
          </h1>
          <p className={`mt-1.5 text-sm ${t.tagline}`}>
            Your submission is logged publicly and immediately enters the community Priority Score engine.
          </p>
        </div>

        {/* Glass panel */}
        <div className={`rounded-2xl p-6 sm:p-8 space-y-7 ${t.card}`}>
          <form onSubmit={handleSubmit} className="space-y-7">

            {/* ── Reporter handle (auto-populated, read-only) ────────────── */}
            <div>
              <SectionLabel t={t} sub="Automatically linked to your citizen account">
                Reporter Identity
              </SectionLabel>
              <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm ${t.reporter}`}>
                <span className="text-xs opacity-60">handle::</span>
                <span>{form.reporter}</span>
                <CheckCircle2 className="w-3.5 h-3.5 ml-auto text-emerald-500 shrink-0" />
              </div>
            </div>

            <Separator className={t.divider} />

            {/* ── Issue Title ───────────────────────────────────────────── */}
            <div>
              <SectionLabel t={t} sub="Keep it concise — it appears as the card headline">
                Issue Title
              </SectionLabel>
              <Input
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="e.g. Broken water main near Lal Chowk"
                maxLength={100}
                className={`h-11 text-sm px-4 ${t.input}`}
              />
              <p className={`mt-1.5 text-[11px] text-right ${t.labelSub}`}>
                {form.title.length} / 100
              </p>
            </div>

            {/* ── Description ───────────────────────────────────────────── */}
            <div>
              <SectionLabel t={t} sub="Describe the severity, location context, and who is affected">
                Detailed Description
              </SectionLabel>
           <textarea
  value={form.description}
  onChange={(e) => set("description", e.target.value)}
  placeholder="Provide a full account of the issue — what you observed, when it started, and the impact on residents or infrastructure..."
  rows={5}
  maxLength={600}
  className={`w-full min-h-[140px] rounded-xl px-4 py-3 text-sm font-medium transition-all duration-150 resize-none outline-none border block scrollbar-none ${t.textarea}`}
  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
/>
              <p className={`mt-1.5 text-[11px] text-right ${t.labelSub}`}>
                {form.description.length} / 600
              </p>
            </div>

            <Separator className={t.divider} />

            {/* ── Category pill grid ────────────────────────────────────── */}
            <div>
              <SectionLabel t={t} sub="Select the civic department this issue belongs to">
                Issue Category
              </SectionLabel>
              <div className="grid grid-cols-2 gap-2.5">
                {CATEGORIES.map(({ label, dark: ds, light: ls }) => {
                  const isActive = form.category === label;
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => set("category", label)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-semibold border
                                   backdrop-blur-sm transition-all duration-150
                                   ${isActive
                                     ? (dark ? ds : ls)
                                     : t.catOff
                                   }`}
                    >
                      {label}
                      {isActive && (
                        <CheckCircle2 className="inline w-3.5 h-3.5 ml-1.5 opacity-80" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
 <Separator className={t.divider} />
            {/* ── Zone selector ─────────────────────────────────────────── */}
            <div>
              <SectionLabel t={t} sub="Select the municipal zone where this issue was observed">
                Reporting Zone
              </SectionLabel>
              <div className="flex flex-wrap gap-2">
                {ZONES.map((z) => {
                  const isActive = form.zone === z;
                  return (
                    <Button
                      key={z}
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => set("zone", z)}
                      className={`h-8 text-xs font-bold capitalize px-4 rounded-full border
                                   transition-all duration-150
                                   ${isActive ? t.zoneOn : t.zoneOff}`}
                    >
                      {isActive && <MapPin className="w-3 h-3 mr-1 shrink-0" />}
                      {z}
                    </Button>
                  );
                })}
              </div>
            </div>
 <Separator className={t.divider} />
            {/* ── Photo Attachment Drop Zone ────────────────────────────── */}
            <div>
              <SectionLabel t={t} sub="Visual evidence strengthens your report's credibility">
                Photo Attachment
              </SectionLabel>

              {/* Hidden real file input */}
              <input
                id="file-input-hidden"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />

              {/* Drop zone UI */}
              <button
                type="button"
                onClick={handleDropZoneClick}
                className={`w-full rounded-xl border-2 border-dashed
                             flex flex-col items-center justify-center gap-3
                             py-10 px-6 transition-all duration-150 cursor-pointer
                             ${form.imageAttached
                               ? (dark
                                   ? "border-emerald-500/50 bg-emerald-900/10"
                                   : "border-emerald-500/40 bg-emerald-50/60")
                               : (dark
                                   ? "border-zinc-700/60 bg-zinc-900/20 hover:border-zinc-500/60 hover:bg-zinc-800/20"
                                   : "border-zinc-300/60 bg-zinc-50/40 hover:border-zinc-400/60 hover:bg-zinc-100/40")
                             }`}
              >
                {form.imageAttached ? (
                  <>
                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                    <p className={`text-xs font-mono font-semibold tracking-wider ${dark ? "text-emerald-400" : "text-emerald-600"}`}>
                      [ {form.imageName || "image_attachment_ready.jpg"} ]
                    </p>
                    <p className={`text-[11px] ${t.labelSub}`}>
                      Attachment confirmed — included in your report
                    </p>
                  </>
                ) : (
                  <>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center
                                     ${dark ? "bg-zinc-800/80 border border-zinc-700/60" : "bg-zinc-100 border border-zinc-200"}`}>
                      <Camera className={`w-5 h-5 ${dark ? "text-zinc-500" : "text-zinc-400"}`} />
                    </div>
                    <div className="text-center space-y-1">
                      <p className={`text-xs font-semibold ${dark ? "text-zinc-300" : "text-zinc-600"}`}>
                        Click to upload photo evidence
                      </p>
                      <p className={`text-[11px] ${t.labelSub}`}>
                        JPG, PNG, WEBP — max 10MB
                      </p>
                    </div>
                    <div className={`flex items-center gap-1.5 text-[11px] border rounded-full px-3 py-1
                                     ${dark ? "border-zinc-700/60 text-zinc-500" : "border-zinc-200 text-zinc-400"}`}>
                      <Upload className="w-3 h-3" />
                      Browse Files
                    </div>
                  </>
                )}
              </button>
            </div>

           

                  <Separator className={t.divider} />

            {/* ── Location Code ─────────────────────────────────────────── */}
            <div>
              <SectionLabel t={t} sub="Geo-coordinate tag attached to your public report">
                Location Coordinates
              </SectionLabel>
              <div className="flex items-center gap-2.5">
                <Input
                  value={form.locationCode}
                  onChange={(e) => set("locationCode", e.target.value)}
                  placeholder="e.g. 34,05,2198,4"
                  className={`h-10 text-sm font-mono px-4 flex-1 ${t.input}`}
                />
                {/* Capture Coordinates button */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={captureCoordinates}
                  className={`h-10 shrink-0 text-xs font-semibold px-3.5 rounded-xl border
                               flex items-center gap-2 transition-colors duration-150 ${t.locBtn}`}
                >
                  <Crosshair className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">🎯 Capture Coordinates</span>
                  <span className="sm:hidden">🎯 Capture</span>
                </Button>
              </div>
              {form.locationCode && (
                <p className={`mt-1.5 text-[11px] font-mono ${dark ? "text-emerald-500" : "text-emerald-600"}`}>
                  ✓ Coordinates locked: {form.locationCode}
                </p>
              )}
            </div>

            <Separator className={t.divider} />

            {/* ── Priority Score Preview ────────────────────────────────── */}
            <div className={`rounded-xl p-4 space-y-2 ${dark ? "bg-zinc-900/40 border border-zinc-800/60" : "bg-zinc-50/80 border border-zinc-200/60"}`}>
              <p className={`text-xs font-bold uppercase tracking-[0.18em] ${t.label}`}>
                Priority Score Preview
              </p>
              <p className={`text-[11px] leading-relaxed ${t.labelSub}`}>
                Your report starts with a base score of <span className={`font-bold ${dark ? "text-white" : "text-zinc-900"}`}>0</span>.
                Community members will flag it as <span className="text-zinc-400">Low (×1)</span>,{" "}
                <span className="text-amber-400">High (×2)</span>, or{" "}
                <span className="text-red-400">Critical (×3)</span> after submission —
                bubbling it up the administrative priority queue in real time.
              </p>
              <div className="flex items-center gap-2 pt-1">
                {["Low ×1", "High ×2", "Critical ×3"].map((tier, i) => (
                  <span key={tier}
                    className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border backdrop-blur-sm
                                 ${i === 0
                                   ? (dark ? "bg-zinc-500/10 border-zinc-400/40 text-zinc-400" : "bg-zinc-100 border-zinc-300 text-zinc-500")
                                   : i === 1
                                     ? (dark ? "bg-amber-500/10 border-amber-400/40 text-amber-300" : "bg-amber-50 border-amber-300 text-amber-600")
                                     : (dark ? "bg-red-500/10 border-red-400/40 text-red-300" : "bg-red-50 border-red-300 text-red-500")
                                 }`}>
                    {tier}
                  </span>
                ))}
              </div>
            </div>

            {/* ── Submit Button ─────────────────────────────────────────── */}
            <button
              type="submit"
              disabled={submitting}
              className={`w-full flex items-center justify-center gap-2.5 h-12 rounded-xl
                           font-bold text-sm border-2 transition-all duration-200
                           disabled:opacity-60 disabled:cursor-not-allowed
                           active:scale-[0.99] ${t.submitBtn}`}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Registering report...
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  Submit Formal Report
                </>
              )}
            </button>

            {/* Disclaimer */}
            <p className={`text-center text-[11px] ${t.labelSub}`}>
              By submitting, your report becomes a permanent public civic record
              visible to all citizens and administrators on the Agora feed.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReportIssue;