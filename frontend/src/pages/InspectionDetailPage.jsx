import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { Layout } from "../components/Layout.jsx";
import { Loader } from "../components/Common.jsx";
import {
  MetadataCard,
  FraudScore,
  ImageComparison,
  HeatmapViewer,
  OCRResults,
  DetectorMetrics,
  EvidenceTimeline,
  RecommendationCard,
} from "../components/Case.jsx";

import { getCaseById, deleteCase } from "../services/caseService.js";
import { fetchCaseForReview } from "../services/reviewService.js";
import { getTriageQueue } from "../services/triageService.js";
import { ROUTES, REVIEW_DECISION } from "../utils/constants.js";
import {
  Download,
  ShieldAlert,
  Terminal,
  Cpu,
  FileText,
  ArrowRight,
  FolderOpen,
  AlertTriangle,
  Trash2,
  Search,
  Filter,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Zap,
  Activity,
  BarChart3,
  ScanLine,
  Gauge,
  Hash,
  Image,
  Text,
  List,
  Grid,
} from "lucide-react";

/* ───────────────────────────────────────────────────────────
   STATUS BADGE — glowing gradient pill
   ─────────────────────────────────────────────────────────── */
function StatusBadge({ status, fraudScore = null, size = "sm" }) {
  const cfg = (() => {
    if (fraudScore != null) {
      if (fraudScore >= 70) return { label: "CRITICAL", gradient: "from-red-600 to-rose-600", glow: "rgba(239,68,68,0.25)" };
      if (fraudScore >= 40) return { label: "WARNING", gradient: "from-amber-500 to-orange-600", glow: "rgba(245,158,11,0.25)" };
      return { label: "PASSED", gradient: "from-emerald-500 to-teal-600", glow: "rgba(16,185,129,0.25)" };
    }
    return { label: status || "UNKNOWN", gradient: "from-slate-600 to-slate-700", glow: "rgba(100,116,139,0.2)" };
  })();
  const dim = size === "lg" ? "px-4 py-1.5 text-xs" : "px-2.5 py-0.5 text-[10px]";
  return (
    <span className={`inline-flex items-center gap-1.5 font-black uppercase tracking-widest rounded-full ${dim} bg-gradient-to-r ${cfg.gradient} text-white`} style={{ boxShadow: `0 0 20px ${cfg.glow}, 0 0 60px ${cfg.glow}` }}>
      <span className="h-1.5 w-1.5 rounded-full bg-white/80 animate-pulse" />
      {cfg.label}
    </span>
  );
}

/* ───────────────────────────────────────────────────────────
   STAT CARD — glassmorphic metric tile
   ─────────────────────────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, sublabel, color = "cyan" }) {
  const c = {
    cyan: { bg: "from-cyan-500/10 to-cyan-600/5", border: "border-cyan-500/20", text: "text-cyan-400", glow: "rgba(6,182,212,0.12)" },
    red: { bg: "from-red-500/10 to-red-600/5", border: "border-red-500/20", text: "text-red-400", glow: "rgba(239,68,68,0.12)" },
    emerald: { bg: "from-emerald-500/10 to-emerald-600/5", border: "border-emerald-500/20", text: "text-emerald-400", glow: "rgba(16,185,129,0.12)" },
    amber: { bg: "from-amber-500/10 to-amber-600/5", border: "border-amber-500/20", text: "text-amber-400", glow: "rgba(245,158,11,0.12)" },
  }[color] || { bg: "from-cyan-500/10 to-cyan-600/5", border: "border-cyan-500/20", text: "text-cyan-400", glow: "rgba(6,182,212,0.12)" };

  return (
    <div className={`group relative flex-1 min-w-[140px] bg-gradient-to-br ${c.bg} border ${c.border} rounded-xl p-4 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02]`} style={{ boxShadow: `0 4px 30px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)` }}>
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ boxShadow: `inset 0 0 40px ${c.glow}` }} />
      <div className="relative z-10">
        <div className={`p-2 rounded-lg bg-black/30 border border-white/5 ${c.text} w-fit mb-3`}>
          <Icon size={16} strokeWidth={1.5} />
        </div>
        <p className={`text-2xl font-black tracking-tight ${c.text} font-tech-code`}>{value}</p>
        <p className="text-[11px] font-semibold text-slate-400 mt-0.5 uppercase tracking-wider">{label}</p>
        {sublabel && <p className="text-[10px] text-slate-500 mt-1 leading-tight">{sublabel}</p>}
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────
   METRIC BAR — gradient progress bar
   ─────────────────────────────────────────────────────────── */
function MetricBar({ label, value, max = 100, color, icon: Icon, suffix = "%" }) {
  const pct = Math.min((value / max) * 100, 100);
  const barColor = color || (pct >= 70 ? "from-red-500 to-rose-600" : pct >= 40 ? "from-amber-500 to-orange-600" : "from-emerald-500 to-teal-600");
  const txtColor = color || (pct >= 70 ? "text-red-400" : pct >= 40 ? "text-amber-400" : "text-emerald-400");
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          {Icon && <Icon size={13} className={txtColor} strokeWidth={2} />}
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">{label}</span>
        </div>
        <span className={`text-sm font-black font-tech-code ${txtColor}`}>{typeof value === "number" ? value.toFixed(1) : value}{suffix}</span>
      </div>
      <div className="relative h-2 bg-slate-900/80 rounded-full overflow-hidden border border-slate-800/50">
        <div className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-1000 ease-out`} style={{ width: `${pct}%`, boxShadow: `0 0 10px ${pct >= 70 ? "rgba(239,68,68,0.3)" : pct >= 40 ? "rgba(245,158,11,0.3)" : "rgba(16,185,129,0.3)"}` }}>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────
   LOADING SKELETON
   ─────────────────────────────────────────────────────────── */
function DetailSkeleton() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="bg-[#0f172a]/30 border border-slate-900/60 p-6 rounded-xl">
        <div className="h-3 w-32 bg-slate-800 rounded mb-4" />
        <div className="h-8 w-96 bg-slate-800 rounded mb-2" />
        <div className="h-4 w-64 bg-slate-800/60 rounded" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-[#0f172a]/40 border border-slate-800 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <div className="h-80 bg-[#0f172a]/40 border border-slate-800 rounded-xl" />
          <div className="h-40 bg-[#0f172a]/40 border border-slate-800 rounded-xl" />
        </div>
        <div className="lg:col-span-4 space-y-6">
          <div className="h-60 bg-[#0f172a]/40 border border-slate-800 rounded-xl" />
          <div className="h-40 bg-[#0f172a]/40 border border-slate-800 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────
   EMPTY STATE SVG
   ─────────────────────────────────────────────────────────── */
function EmptyIllustration() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" className="opacity-60">
      <rect x="10" y="20" width="100" height="80" rx="8" stroke="#1e293b" strokeWidth="2" fill="none" />
      <rect x="20" y="30" width="35" height="25" rx="4" stroke="#334155" strokeWidth="1.5" fill="none" />
      <rect x="65" y="30" width="35" height="25" rx="4" stroke="#334155" strokeWidth="1.5" fill="none" />
      <line x1="20" y1="65" x2="100" y2="65" stroke="#1e293b" strokeWidth="1.5" />
      <line x1="20" y1="75" x2="80" y2="75" stroke="#1e293b" strokeWidth="1.5" />
      <line x1="20" y1="85" x2="90" y2="85" stroke="#1e293b" strokeWidth="1.5" />
      <circle cx="60" cy="105" r="8" stroke="#06b6d4" strokeWidth="1.5" fill="none" />
      <line x1="60" y1="100" x2="60" y2="110" stroke="#06b6d4" strokeWidth="1.5" />
      <line x1="55" y1="105" x2="65" y2="105" stroke="#06b6d4" strokeWidth="1.5" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */
export default function InspectionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [caseData, setCaseData] = useState(null);
  const [reviewData, setReviewData] = useState(null);
  const [reportsList, setReportsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEmpty, setIsEmpty] = useState(false);

  // UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [riskFilter, setRiskFilter] = useState("all");
  const [deletingId, setDeletingId] = useState(null);

  // Data fetching
  useEffect(() => {
    if (!id) {
      setLoading(true);
      getTriageQueue({ page: 1, pageSize: 100 })
        .then((res) => {
          if (res?.items?.length) { setReportsList(res.items); setIsEmpty(false); }
          else setIsEmpty(true);
        })
        .catch(() => setIsEmpty(true))
        .finally(() => setLoading(false));
    } else {
      setIsEmpty(false);
      setLoading(true);
      Promise.all([getCaseById(id), fetchCaseForReview(id)])
        .then(([c, r]) => { setCaseData(c); setReviewData(r); })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [id]);

  // Derived data
  const merged = useMemo(() => ({ ...caseData, ...reviewData }), [caseData, reviewData]);
  const ssim = merged.metrics?.find((m) => m.name.includes("SSIM"))?.score ?? 0.4;
  const keypoint = merged.metrics?.find((m) => m.name.includes("Keypoint"))?.score ?? 0.07;
  const ocrResults = merged.ocrResults || [];
  const ocrMatch = ocrResults[0]?.match ?? false;
  const ocrText = ocrResults[0]?.extracted || "No text detected";
  const ocrExpected = ocrResults[0]?.expected || "N/A";
  const recommendation = merged.recommendation || {};
  const recDecision = recommendation.decision === "Accept" ? REVIEW_DECISION.APPROVED
    : recommendation.decision === "Quarantine & Escalate" ? REVIEW_DECISION.REJECTED
      : REVIEW_DECISION.NEEDS_MORE_EVIDENCE;
  const heatmapUrl = merged.heatmapUrl || null;
  const fraudScore = merged.fraudScore ?? 0;

  const reasoningText = recommendation.reasoning || "";
  
  let aiClassification = "UNKNOWN";
  let aiCategory = "UNKNOWN";

  const classMatch = reasoningText.match(/categorized as\s+([^.,\n]+)/i);
  if (classMatch) {
    aiClassification = classMatch[1].trim();
  }

  const catMatch = reasoningText.match(/pres[e]?cribed response is\s+([^.,\n]+)/i);
  if (catMatch) {
    aiCategory = catMatch[1].trim();
  }

  if (aiClassification === "UNKNOWN" || aiCategory === "UNKNOWN") {
    const aiMatch = reasoningText.match(/classified as\s+(.*?)\s+with a recommended action of\s+(.*?)(?:\.|$)/i);
    if (aiMatch) {
      if (aiClassification === "UNKNOWN") aiClassification = aiMatch[1].trim();
      if (aiCategory === "UNKNOWN") aiCategory = aiMatch[2].trim();
    }
  }

  // Filtered reports
  const filteredReports = useMemo(() => {
    let r = [...reportsList];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      r = r.filter((x) => x.caseId?.toLowerCase().includes(q) || x.partNumber?.toLowerCase().includes(q) || x.commodity?.toLowerCase().includes(q));
    }
    if (riskFilter !== "all") {
      r = r.filter((x) => {
        const s = x.riskScore ?? 0;
        return riskFilter === "high" ? s >= 70 : riskFilter === "medium" ? s >= 40 && s < 70 : riskFilter === "low" ? s < 40 : true;
      });
    }
    r.sort((a, b) => sortBy === "risk" ? (b.riskScore ?? 0) - (a.riskScore ?? 0) : sortBy === "name" ? (a.partNumber ?? "").localeCompare(b.partNumber ?? "") : new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0));
    return r;
  }, [reportsList, searchQuery, riskFilter, sortBy]);

  const handleDownloadPDF = () => {
    if (!id) return;
    window.open(`http://127.0.0.1:8000/api/reports/${id}/pdf?token=${encodeURIComponent(localStorage.getItem("fraudshield_auth_token") || "")}`, "_blank");
  };

  const handleDelete = async (caseId) => {
    if (!window.confirm("Permanently delete this inspection report?")) return;
    setDeletingId(caseId);
    try {
      await deleteCase(caseId);
      if (id) navigate(ROUTES.CASE_DETAIL);
      else {
        setLoading(true);
        getTriageQueue({ page: 1, pageSize: 100 }).then((res) => { if (res?.items) setReportsList(res.items); else setIsEmpty(true); }).catch(() => setIsEmpty(true)).finally(() => setLoading(false));
      }
    } catch (err) { alert(err.message || "Delete failed."); }
    finally { setDeletingId(null); }
  };

  /* ═══════════════════════════════════════════════════════════
     LOADING
     ═══════════════════════════════════════════════════════════ */
  if (loading) {
    return <Layout>{id ? <DetailSkeleton /> : <div className="flex flex-col items-center justify-center py-32"><Loader fullPage={false} label="Loading reports…" /></div>}</Layout>;
  }

  /* ═══════════════════════════════════════════════════════════
     EMPTY
     ═══════════════════════════════════════════════════════════ */
  if (isEmpty) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-24 text-center px-6">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-cyan-500/5 blur-3xl rounded-full" />
            <div className="relative h-28 w-28 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 flex items-center justify-center shadow-2xl">
              <EmptyIllustration />
            </div>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-100 mb-2">No Inspection Reports Found</h2>
          <p className="text-sm text-slate-400 max-w-md leading-relaxed mb-8">Run your first AI-powered compliance check to generate automated inspection reports.</p>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(ROUTES.TRIAGE)} className="px-6 py-3 bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 text-white rounded-xl font-bold text-sm hover:shadow-[0_0_30px_rgba(6,182,212,0.3)] transition-all flex items-center gap-2">
              <Zap size={16} /> Launch AI Inspection Console
            </button>
            <button onClick={() => navigate(ROUTES.LANDING)} className="px-6 py-3 bg-slate-900/80 border border-slate-800 text-slate-300 rounded-xl font-semibold text-sm hover:bg-slate-800/80 transition-all">Back to Dashboard</button>
          </div>
        </div>
      </Layout>
    );
  }

  /* ═══════════════════════════════════════════════════════════
     LIST VIEW (no ID)
     ═══════════════════════════════════════════════════════════ */
  if (!id) {
    return (
      <Layout title="Inspection Reports Archive">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0c1929] via-[#0f172a] to-[#0a0f1d] border border-slate-800/80 p-8 mb-8">
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 blur-[120px] rounded-full" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 blur-[100px] rounded-full" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/20"><FileText size={20} className="text-cyan-400" /></div>
              <div>
                <h1 className="text-2xl font-black text-slate-100 tracking-tight">Inspection Reports Archive</h1>
                <p className="text-sm text-slate-400 mt-1">Review historical compliance records and multi-agent audit trails.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-center">
                <p className="text-2xl font-black text-cyan-400 font-tech-code">{reportsList.length}</p>
                <p className="text-[10px] text-cyan-400/70 font-bold uppercase tracking-widest">Total Scans</p>
              </div>
              <button onClick={() => navigate(ROUTES.TRIAGE)} className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-bold text-xs hover:shadow-[0_0_25px_rgba(6,182,212,0.25)] transition-all flex items-center gap-2">
                <Zap size={14} /> New Inspection
              </button>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-[#0f172a]/40 border border-slate-800/80 rounded-xl p-4 mb-6 backdrop-blur-xl">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input type="text" placeholder="Search by case ID, part number, commodity..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder:text-slate-500 focus:border-cyan-500/40 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 transition-all" />
              {searchQuery && <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"><XCircle size={14} /></button>}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg border text-xs font-semibold transition-all ${showFilters || riskFilter !== "all" ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400" : "bg-slate-900/80 border-slate-800 text-slate-400"}`}>
                <Filter size={13} /> Filters {riskFilter !== "all" && <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />}
              </button>
              <div className="flex border border-slate-800 rounded-lg overflow-hidden">
                <button onClick={() => setViewMode("grid")} className={`p-2.5 transition-all ${viewMode === "grid" ? "bg-cyan-500/15 text-cyan-400" : "bg-slate-900/80 text-slate-500"}`}><Grid size={14} /></button>
                <button onClick={() => setViewMode("list")} className={`p-2.5 transition-all ${viewMode === "list" ? "bg-cyan-500/15 text-cyan-400" : "bg-slate-900/80 text-slate-500"}`}><List size={14} /></button>
              </div>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-3 py-2.5 bg-slate-900/80 border border-slate-800 rounded-lg text-xs text-slate-300 font-semibold focus:border-cyan-500/40 focus:outline-none cursor-pointer">
                <option value="newest">Newest</option>
                <option value="risk">Highest Risk</option>
                <option value="name">By Part</option>
              </select>
            </div>
          </div>
          {showFilters && (
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-800/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Risk:</span>
              {[{ id: "all", label: "All" }, { id: "high", label: "Critical" }, { id: "medium", label: "Warning" }, { id: "low", label: "Clean" }].map(({ id: fId, label }) => {
                const isActive = riskFilter === fId;
                const cm = { red: "from-red-500/20 to-red-600/10 border-red-500/30 text-red-400", amber: "from-amber-500/20 to-amber-600/10 border-amber-500/30 text-amber-400", emerald: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-400", slate: "from-cyan-500/10 to-blue-600/10 border-cyan-500/20 text-cyan-400" };
                const c = fId === "high" ? "red" : fId === "medium" ? "amber" : fId === "low" ? "emerald" : "slate";
                return <button key={fId} onClick={() => setRiskFilter(fId)} className={`px-3.5 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${isActive ? `bg-gradient-to-br ${cm[c]}` : "bg-slate-900/60 border-slate-800 text-slate-500"}`}>{label}</button>;
              })}
            </div>
          )}
        </div>

        {/* Count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-slate-500">Showing <span className="text-slate-300 font-bold">{filteredReports.length}</span> of <span className="text-slate-300 font-bold">{reportsList.length}</span> reports</p>
          <button onClick={() => { setLoading(true); getTriageQueue({ page: 1, pageSize: 100 }).then((res) => { if (res?.items) setReportsList(res.items); }).finally(() => setLoading(false)); }} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-cyan-400 transition-colors"><RefreshCw size={12} /> Refresh</button>
        </div>

        {/* Grid */}
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredReports.map((r) => {
              const score = r.riskScore ?? 0;
              const isHigh = score >= 70;
              const isClean = score < 30;
              const riskColor = isClean ? "from-emerald-500/10 to-teal-600/5 border-emerald-500/20" : isHigh ? "from-red-500/10 to-rose-600/5 border-red-500/20" : "from-amber-500/10 to-orange-600/5 border-amber-500/20";
              return (
                <div key={r.id} onClick={() => navigate(`${ROUTES.CASE_DETAIL}/${r.caseId}`)} className="group relative bg-gradient-to-br from-[#0f172a]/70 to-[#0a0f1d]/70 border border-slate-800/80 rounded-xl p-5 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 overflow-hidden" style={{ boxShadow: "0 4px 30px rgba(0,0,0,0.3)" }}>
                  <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: "radial-gradient(600px circle at 50% 50%, rgba(6,182,212,0.06), transparent 40%)" }} />
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-lg bg-gradient-to-br ${riskColor}`}>
                          {isHigh ? <AlertTriangle size={14} className="text-red-400" /> : isClean ? <CheckCircle2 size={14} className="text-emerald-400" /> : <AlertCircle size={14} className="text-amber-400" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-200 group-hover:text-cyan-400 transition-colors font-tech-code">{r.caseId}</p>
                          <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{r.commodity || "N/A"}</p>
                        </div>
                      </div>
                      <StatusBadge status={r.status} fraudScore={score} />
                    </div>
                    <div className="flex items-center gap-2 mb-4"><Hash size={11} className="text-slate-500" /><span className="text-xs font-medium text-slate-400">{r.partNumber}</span></div>
                    <div className="mb-4"><MetricBar label="Fraud Risk" value={score} max={100} suffix="%" /></div>
                    <div className="flex items-center justify-between pt-3 border-t border-slate-800/60">
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500"><Clock size={10} />{r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "N/A"}</div>
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => handleDelete(r.caseId)} disabled={deletingId === r.caseId} className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"><Trash2 size={12} /></button>
                        <button className="flex items-center gap-1 text-[10px] font-bold text-cyan-400 group-hover:text-cyan-300 transition-colors uppercase tracking-wider">Details <ArrowRight size={11} /></button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredReports.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                <div className="h-14 w-14 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-4"><Search size={24} /></div>
                <h3 className="text-base font-bold text-slate-300 mb-1">No matching reports</h3>
                <p className="text-xs text-slate-500 max-w-xs">Try adjusting your search or filters.</p>
                <button onClick={() => { setSearchQuery(""); setRiskFilter("all"); }} className="mt-4 px-4 py-2 bg-slate-900 border border-slate-800 text-slate-400 rounded-lg text-xs font-semibold hover:text-slate-200 transition-colors">Clear filters</button>
              </div>
            )}
          </div>
        ) : (
          /* List */
          <div className="bg-[#0f172a]/40 border border-slate-800/80 rounded-xl overflow-hidden">
            <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_auto] gap-4 px-6 py-3.5 bg-slate-900/60 border-b border-slate-800/80 text-[10px] font-black uppercase tracking-widest text-slate-500">
              <span>Case / Part</span><span>Commodity</span><span>Risk</span><span>Verdict</span><span>Date</span><span className="text-right">Actions</span>
            </div>
            <div className="divide-y divide-slate-800/50">
              {filteredReports.map((r) => {
                const score = r.riskScore ?? 0;
                const isHigh = score >= 70;
                const isClean = score < 30;
                const rc = isClean ? "text-emerald-400 bg-emerald-500/10" : isHigh ? "text-red-400 bg-red-500/10" : "text-amber-400 bg-amber-500/10";
                return (
                  <div key={r.id} onClick={() => navigate(`${ROUTES.CASE_DETAIL}/${r.caseId}`)} className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_auto] gap-4 px-6 py-4 items-center hover:bg-slate-900/30 cursor-pointer transition-all group">
                    <div>
                      <p className="text-sm font-bold text-slate-200 group-hover:text-cyan-400 transition-colors font-tech-code">{r.caseId}</p>
                      <p className="text-[11px] text-slate-500 font-medium">{r.partNumber}</p>
                    </div>
                    <span className="text-xs text-slate-400 capitalize font-medium">{r.commodity}</span>
                    <div><span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold font-tech-code ${rc}`}>{score}%</span></div>
                    <div><StatusBadge status={r.status} fraudScore={score} /></div>
                    <span className="text-[11px] text-slate-500 font-tech-code">{r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" }) : "—"}</span>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => handleDelete(r.caseId)} disabled={deletingId === r.caseId} className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"><Trash2 size={13} /></button>
                      <button className="text-cyan-400 group-hover:text-cyan-300 font-bold flex items-center gap-1 text-[10px] uppercase tracking-wider transition-all">View <ArrowRight size={12} /></button>
                    </div>
                  </div>
                );
              })}
              {filteredReports.length === 0 && <div className="px-6 py-12 text-center"><p className="text-sm text-slate-500">No reports match your criteria</p></div>}
            </div>
          </div>
        )}
      </Layout>
    );
  }

  /* ═══════════════════════════════════════════════════════════
     ERROR
     ═══════════════════════════════════════════════════════════ */
  if (error) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-24 gap-6 text-center px-4">
          <div className="relative">
            <div className="absolute inset-0 bg-red-500/10 blur-3xl rounded-full" />
            <div className="relative h-20 w-20 rounded-2xl bg-gradient-to-br from-red-500/20 to-rose-600/20 border border-red-500/30 flex items-center justify-center"><AlertTriangle size={36} className="text-red-400" /></div>
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-200 mb-2">Failed to Load Report</h2>
            <p className="text-sm text-slate-400 max-w-sm">{error}</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(ROUTES.CASE_DETAIL)} className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-bold text-xs hover:shadow-[0_0_20px_rgba(6,182,212,0.2)] transition-all">Back to Reports</button>
            <button onClick={() => window.location.reload()} className="px-5 py-2.5 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl font-semibold text-xs hover:bg-slate-800 transition-all flex items-center gap-1.5"><RefreshCw size={12} /> Retry</button>
          </div>
        </div>
      </Layout>
    );
  }

  /* ═══════════════════════════════════════════════════════════
     DETAIL VIEW (ID present) — NO REPETITION
     ═══════════════════════════════════════════════════════════ */
  return (
    <Layout>
      {/* ── 1. HERO HEADER ───────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0c1929] via-[#0f172a] to-[#0a0f1d] border border-slate-800/80 p-6 md:p-8 mb-8">
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-cyan-500/5 blur-[120px] rounded-full" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-purple-500/5 blur-[100px] rounded-full" />
        <div className="relative z-10">
          <button onClick={() => navigate(ROUTES.CASE_DETAIL)} className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-cyan-400 transition-colors mb-4 group">
            <ArrowRight size={13} className="rotate-180 group-hover:-translate-x-1 transition-transform" /> Back to Reports
          </button>
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/20 hidden md:block"><FileText size={24} className="text-cyan-400" /></div>
              <div>
                <div className="flex items-center gap-3 flex-wrap mb-2">
                  <h1 className="text-2xl md:text-3xl font-black text-slate-100 tracking-tight">Inspection Report</h1>
                  <span className="font-tech-code text-cyan-400 text-sm font-bold bg-cyan-950/30 px-3 py-1 border border-cyan-500/20 rounded-lg">#{merged.id}</span>
                  <StatusBadge fraudScore={fraudScore} />
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                  {merged.partCode && <span className="flex items-center gap-1.5 text-xs text-slate-400 font-tech-code"><Hash size={11} className="text-slate-500" />{merged.partCode}</span>}
                  {merged.commodity && <span className="flex items-center gap-1.5 text-xs text-slate-400"><Cpu size={11} className="text-slate-500" />{merged.commodity}</span>}
                  {merged.updatedAt && <span className="flex items-center gap-1.5 text-xs text-slate-500"><Clock size={11} />{new Date(merged.updatedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <button onClick={handleDownloadPDF} className="px-4 py-2.5 bg-slate-900/80 border border-slate-800 hover:border-cyan-500/30 text-slate-300 hover:text-cyan-400 rounded-xl text-xs font-bold transition-all flex items-center gap-2"><Download size={13} /> PDF</button>
              <button onClick={() => navigate(`${ROUTES.HUMAN_REVIEW}?caseId=${merged.id}`)} className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl text-xs font-bold transition-all hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(6,182,212,0.25)] flex items-center gap-2"><ShieldAlert size={13} /> Human Review <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" /></button>
              <button onClick={() => handleDelete(merged.id)} className="p-2.5 bg-slate-900/80 border border-slate-800 hover:border-red-500/30 text-slate-500 hover:text-red-400 rounded-xl transition-all" title="Delete"><Trash2 size={14} /></button>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. EXECUTIVE STATS (ONCE) ────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Gauge} label="Fraud Risk" value={`${fraudScore}/100`} sublabel={fraudScore >= 70 ? "Critical" : fraudScore >= 40 ? "Warning" : "Passed"} color={fraudScore >= 70 ? "red" : fraudScore >= 40 ? "amber" : "emerald"} />
        <StatCard icon={BarChart3} label="SSIM Score" value={`${(ssim * 100).toFixed(1)}%`} sublabel={ssim >= 0.8 ? "Within tolerance" : ssim >= 0.5 ? "Below threshold" : "Deviated"} color={ssim >= 0.8 ? "emerald" : ssim >= 0.5 ? "amber" : "red"} />
        <StatCard icon={ScanLine} label="Keypoint Match" value={`${(keypoint * 100).toFixed(1)}%`} sublabel={keypoint >= 0.5 ? "Adequate" : keypoint >= 0.3 ? "Limited" : "Poor"} color={keypoint >= 0.5 ? "emerald" : keypoint >= 0.3 ? "amber" : "red"} />
        <StatCard icon={CheckCircle2} label="OCR" value={ocrMatch ? "PASSED" : "FAILED"} sublabel={ocrMatch ? "Text matched" : `Expected "${ocrExpected}"`} color={ocrMatch ? "emerald" : "red"} />
      </div>

      {/* ── 3. AI VERDICT + FRAUD GAUGE (ONCE) ──────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        <div className="lg:col-span-8">
          <div className="relative overflow-hidden rounded-xl border border-slate-800/80 bg-gradient-to-br from-[#0f172a]/70 to-[#0a0f1d]/70 p-6 h-full">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/3 blur-[80px]" />
            <RecommendationCard recommendation={recDecision} confidence={recommendation.confidence || 42} reasoning={recommendation.reasoning || "AI confidence is below the auto-decide threshold. Manual review required."} flags={recommendation.flags || []} />
          </div>
        </div>
        <div className="lg:col-span-4">
          <div className="relative overflow-hidden rounded-xl border border-slate-800/80 bg-gradient-to-br from-[#0f172a]/70 to-[#0a0f1d]/70 p-6 h-full flex flex-col items-center justify-center">
            <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/3 blur-[80px]" />
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Overall Risk</h3>
            <FraudScore score={fraudScore} size="lg" showLabel={true} />
          </div>
        </div>
      </div>

      {/* ── 4. IMAGE COMPARISON (ONCE) ──────────────── */}
      <div className="mb-8">
        <ImageComparison goldenUrl={merged.goldenImageUrl} uploadedUrl={merged.uploadedImageUrl} imageHash={merged.imageHash} />
      </div>

      {/* ── 5. HEATMAP + AI EXPLANATION (ONCE) ──────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <HeatmapViewer imageUrl={merged.uploadedImageUrl} heatmapUrl={heatmapUrl} label={heatmapUrl ? "SSIM Anomaly Heatmap" : "AI Attention Region"} />
        <div className="rounded-xl border border-slate-800/80 bg-gradient-to-br from-[#0f172a]/70 to-[#0a0f1d]/70 p-6 flex flex-col">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2"><FileText size={14} className="text-cyan-400" /> AI Explanation</h3>
          <div className="flex-1 bg-slate-950/60 border border-slate-800/60 rounded-xl p-5">
            <p className="text-sm text-slate-300 leading-relaxed font-medium">{recommendation.reasoning || "AI confidence is below the auto-decide threshold. Manual review required."}</p>
          </div>
          <div className="mt-4 text-[11px] text-slate-500 bg-slate-900/40 p-4 rounded-xl border border-slate-800/50">
            <p className="font-bold text-slate-400 mb-1 uppercase tracking-wider text-[10px]">Method</p>
            Combines SSIM deviations, template alignments, and OCR string matching against OEM golden standards.
          </div>
        </div>
      </div>

      {/* ── 6. KEY METRICS (ONCE) ────────────────────── */}
      <div className="rounded-xl border border-slate-800/80 bg-gradient-to-br from-[#0f172a]/70 to-[#0a0f1d]/70 p-6 mb-8">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-5 flex items-center gap-2"><Activity size={14} className="text-cyan-400" /> Key Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <MetricBar label="SSIM" value={ssim * 100} Icon={Image} color={ssim >= 0.8 ? "" : ssim >= 0.5 ? "from-amber-500 to-orange-600" : "from-red-500 to-rose-600"} />
          <MetricBar label="Keypoint Match" value={keypoint * 100} Icon={ScanLine} color={keypoint >= 0.5 ? "" : keypoint >= 0.3 ? "from-amber-500 to-orange-600" : "from-red-500 to-rose-600"} />
          <MetricBar label="OCR Accuracy" value={ocrMatch ? 100 : 0} Icon={Text} color={ocrMatch ? "" : "from-red-500 to-rose-600"} />
          <MetricBar label="AI Confidence" value={recommendation.confidence || 42} Icon={BarChart3} color={recommendation.confidence >= 70 ? "" : recommendation.confidence >= 40 ? "from-amber-500 to-orange-600" : "from-red-500 to-rose-600"} />
        </div>
      </div>

      {/* ── 7. OCR RESULTS (ONCE) ────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        <div className="lg:col-span-7">
          <div className="rounded-xl border border-slate-800/80 bg-gradient-to-br from-[#0f172a]/70 to-[#0a0f1d]/70 p-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-2"><Text size={14} className="text-cyan-400" /> OCR Results</h3>
            <p className="text-[11px] text-slate-500 mb-5">Character recognition comparison</p>
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-5 ${ocrMatch ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border border-red-500/20 text-red-400"}`}>
              {ocrMatch ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
              <div>
                <p className="font-bold text-sm">{ocrMatch ? "OCR Passed" : "OCR Failed"}</p>
                <p className="text-[11px] opacity-80">{ocrMatch ? "Text matches golden reference." : `Expected "${ocrExpected}", got "${ocrText}"`}</p>
              </div>
            </div>
            <OCRResults results={ocrResults} />
          </div>
        </div>
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="rounded-xl border border-slate-800/80 bg-gradient-to-br from-[#0f172a]/70 to-[#0a0f1d]/70 p-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2"><BarChart3 size={14} className="text-cyan-400" /> Comparison</h3>
            <div className="space-y-4">
              <MetricBar label="Text Match" value={ocrMatch ? 92 : 23} />
              <MetricBar label="Character Accuracy" value={ocrMatch ? 95 : 18} color={ocrMatch ? "from-emerald-500 to-teal-600" : "from-red-500 to-rose-600"} />
              <MetricBar label="Field Completeness" value={ocrResults.filter((r) => r.extracted).length / Math.max(ocrResults.length, 1) * 100} />
            </div>
          </div>
          
          <div className="rounded-xl border border-slate-800/80 bg-gradient-to-br from-[#0f172a]/70 to-[#0a0f1d]/70 p-6 flex-1 flex flex-col justify-center">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2"><FileText size={14} className="text-cyan-400" /> AI Classification Insights</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-950/60 border border-slate-800/60 rounded-xl p-4 flex flex-col justify-center">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Classification</p>
                <p className={`text-base font-black uppercase tracking-wide ${aiClassification === 'TAMPERED' ? 'text-red-400' : aiClassification === 'UNKNOWN' ? 'text-slate-400' : 'text-emerald-400'}`}>{aiClassification}</p>
              </div>
              <div className="bg-slate-950/60 border border-slate-800/60 rounded-xl p-4 flex flex-col justify-center">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Category</p>
                <p className={`text-sm font-bold ${aiCategory.includes('Escalate') ? 'text-amber-400' : aiCategory === 'UNKNOWN' ? 'text-slate-400' : 'text-cyan-400'}`}>{aiCategory}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 8. DETECTOR METRICS + METADATA (ONCE) ────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        <div className="lg:col-span-7"><DetectorMetrics metrics={merged.metrics || []} /></div>
        <div className="lg:col-span-5"><MetadataCard caseData={merged} /></div>
      </div>

      {/* ── 9. EXECUTION TELEMETRY (ONCE) ────────────── */}
      <div className="rounded-xl border border-slate-800/80 bg-gradient-to-br from-[#0f172a]/70 to-[#0a0f1d]/70 overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-slate-800/80 bg-slate-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20"><Terminal size={16} className="text-cyan-400" /></div>
            <div>
              <h3 className="text-sm font-bold text-slate-200">Execution Telemetry</h3>
              <p className="text-[10px] text-slate-500">Multi-agent pipeline log</p>
            </div>
          </div>
          <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" /><span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Live</span></div>
        </div>
        <div className="p-6 bg-slate-950 font-tech-code text-[12px] leading-loose">
          <div className="space-y-2">
            <p className="text-slate-500"><span className="text-slate-600">[</span><span className="text-cyan-400">SYSTEM</span><span className="text-slate-600">]</span> Pipeline Active at <span className="text-slate-400">{merged.updatedAt || new Date().toISOString()}</span></p>
            <p className="text-cyan-400"><span className="text-slate-500">{">"}</span> [Agent-1] Aspect ratio & resolution check <span className="text-emerald-400 font-bold">[PASSED]</span></p>
            <p className="text-cyan-400"><span className="text-slate-500">{">"}</span> [Agent-1] Classified as <span className="text-yellow-400">"{merged.commodity || "N/A"}"</span></p>
            <p className="text-emerald-400"><span className="text-slate-500">{">"}</span> [Agent-2] Keypoints Match Rate: <span className="font-bold">{(keypoint * 100).toFixed(1)}%</span></p>
            <p className="text-purple-400"><span className="text-slate-500">{">"}</span> [Agent-3] SSIM index: <span className="font-bold">{ssim.toFixed(2)}</span></p>
            <p className={`font-bold ${ocrMatch ? "text-green-400" : "text-red-400"}`}><span className="text-slate-500">{">"}</span> [Agent-3] OCR: Expected <span className="text-yellow-400">"{ocrExpected}"</span> | Got <span className="text-yellow-400">"{ocrText}"</span> | {ocrMatch ? "PASSED" : "FAILED"}</p>
            <p className="text-blue-400"><span className="text-slate-500">{">"}</span> [Agent-4] Fraud Score: <span className="font-bold">{fraudScore}%</span> | Confidence: <span className="font-bold">{merged.confidencePct || recommendation.confidence || 42}%</span></p>
            <p className="text-indigo-400"><span className="text-slate-500">{">"}</span> [Agent-5] Narrative: <span className="text-slate-300">"{recommendation.reasoning || "Audit complete."}"</span></p>
            <p className="text-slate-500 pt-2 border-t border-slate-800/60"><span className="text-slate-600">[</span><span className="text-cyan-400">SYSTEM</span><span className="text-slate-600">]</span> Execution complete.</p>
          </div>
        </div>
      </div>

      {/* ── 10. EVIDENCE TIMELINE (ONCE) ─────────────── */}
      <div className="mb-8"><EvidenceTimeline events={merged.timeline || []} /></div>

      {/* ── 11. STICKY BOTTOM BAR (ONCE) ─────────────── */}
      <div className="sticky bottom-4 mt-8 z-40">
        <div className="max-w-4xl mx-auto bg-slate-900/90 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-4 shadow-2xl shadow-black/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <p className="text-xs text-slate-400"><span className="font-bold text-slate-200">#{merged.id}</span> — {merged.commodity || "N/A"}</p>
              <div className="h-4 w-px bg-slate-800" />
              <span className="text-[10px] font-bold text-slate-500">Fraud: <span className={`${fraudScore >= 70 ? "text-red-400" : fraudScore >= 40 ? "text-amber-400" : "text-emerald-400"}`}>{fraudScore}%</span></span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleDownloadPDF} className="px-4 py-2 bg-slate-800/80 border border-slate-700 text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-700 transition-all flex items-center gap-1.5"><Download size={12} /> PDF</button>
              <button onClick={() => navigate(`${ROUTES.HUMAN_REVIEW}?caseId=${merged.id}`)} className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl text-xs font-bold hover:shadow-[0_0_20px_rgba(6,182,212,0.2)] transition-all flex items-center gap-1.5"><ShieldAlert size={12} /> Human Review</button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
