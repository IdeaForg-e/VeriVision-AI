import { useMemo, useState, useEffect } from "react";
import { Layout } from "../components/Layout.jsx";
import {
  EvidencePanel,
  ConfidenceBadge,
  CaseVelocity,
  CaseStatusTracker,
  ReviewerComment,
  ReviewDecision,
} from "../components/Review.jsx";
import {
  FraudScore,
  DetectorMetrics,
  OCRResults,
  EvidenceTimeline,
} from "../components/Case.jsx";
import { Loader } from "../components/Common.jsx";
import { useReview } from "../hooks/useReview.js";
import { getTriageQueue } from "../services/triageService.js";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ROUTES, REVIEW_DECISION } from "../utils/constants.js";
import {
  ArrowRight,
  FileText,
  ShieldAlert,
  Gauge,
  BarChart3,
  ScanLine,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Hash,
  Cpu,
  Activity,
  Download,
  RefreshCw,
  Text,
  Zap,
  Image,
  Search,
  AlertCircle,
  Filter,
} from "lucide-react";

/* ───────────────────────────────────────────────────────────
   STATUS BADGE — glowing gradient pill (shared with detail page)
   ─────────────────────────────────────────────────────────── */
function StatusBadge({ fraudScore = null }) {
  const cfg = (() => {
    if (fraudScore != null) {
      if (fraudScore >= 70) return { label: "CRITICAL", gradient: "from-red-600 to-rose-600", glow: "rgba(239,68,68,0.25)" };
      if (fraudScore >= 40) return { label: "WARNING", gradient: "from-amber-500 to-orange-600", glow: "rgba(245,158,11,0.25)" };
      return { label: "PASSED", gradient: "from-emerald-500 to-teal-600", glow: "rgba(16,185,129,0.25)" };
    }
    return { label: "UNKNOWN", gradient: "from-slate-600 to-slate-700", glow: "rgba(100,116,139,0.2)" };
  })();
  return (
    <span className={`inline-flex items-center gap-1.5 font-black uppercase tracking-widest rounded-full px-3 py-1 text-[10px] bg-gradient-to-r ${cfg.gradient} text-white`} style={{ boxShadow: `0 0 20px ${cfg.glow}, 0 0 60px ${cfg.glow}` }}>
      <span className="h-1.5 w-1.5 rounded-full bg-white/80 animate-pulse" />
      {cfg.label}
    </span>
  );
}

/* ───────────────────────────────────────────────────────────
   METRIC BAR — compact progress bar for review context
   ─────────────────────────────────────────────────────────── */
function MetricBar({ label, value, max = 100, color, icon: Icon, suffix = "%" }) {
  const pct = Math.min((value / max) * 100, 100);
  const barColor = color || (pct >= 70 ? "from-red-500 to-rose-600" : pct >= 40 ? "from-amber-500 to-orange-600" : "from-emerald-500 to-teal-600");
  const txtColor = color ? "text-slate-300" : (pct >= 70 ? "text-red-400" : pct >= 40 ? "text-amber-400" : "text-emerald-400");
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          {Icon && <Icon size={12} className={txtColor} strokeWidth={2} />}
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
        </div>
        <span className={`text-xs font-black font-tech-code ${txtColor}`}>{typeof value === "number" ? value.toFixed(1) : value}{suffix}</span>
      </div>
      <div className="relative h-1.5 bg-slate-900/80 rounded-full overflow-hidden border border-slate-800/50">
        <div className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-1000 ease-out`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────
   REVIEW QUEUE LIST — shown when no caseId is selected
   ─────────────────────────────────────────────────────────── */
function ReviewQueueList() {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");

  useEffect(() => {
    setLoading(true);
    getTriageQueue({ page: 1, pageSize: 100 })
      .then((res) => setCases(res?.items || []))
      .catch(() => setCases([]))
      .finally(() => setLoading(false));
  }, []);

  const filteredCases = useMemo(() => {
    let list = [...cases];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((c) =>
        c.caseId?.toLowerCase().includes(q) ||
        c.partNumber?.toLowerCase().includes(q) ||
        c.commodity?.toLowerCase().includes(q)
      );
    }
    if (riskFilter !== "all") {
      list = list.filter((c) => {
        const s = c.riskScore ?? 0;
        return riskFilter === "high" ? s >= 70 : riskFilter === "medium" ? s >= 40 && s < 70 : s < 40;
      });
    }
    // Sort by highest risk first — most urgent reviews on top
    list.sort((a, b) => (b.riskScore ?? 0) - (a.riskScore ?? 0));
    return list;
  }, [cases, searchQuery, riskFilter]);

  if (loading) {
    return (
      <Layout title="Human Review Workspace" subtitle="Perform manual override verification on flagged components.">
        <div className="flex flex-col items-center justify-center py-32">
          <Loader fullPage={false} label="Loading review queue…" />
        </div>
      </Layout>
    );
  }

  if (cases.length === 0) {
    return (
      <Layout title="Human Review Workspace" subtitle="Perform manual override verification on flagged components.">
        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-cyan-500/5 blur-3xl rounded-full" />
            <div className="relative h-20 w-20 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 flex items-center justify-center shadow-2xl">
              <ShieldAlert size={36} className="text-cyan-400" />
            </div>
          </div>
          <h2 className="text-xl font-extrabold text-slate-100">No Cases Available</h2>
          <p className="text-sm text-slate-400 max-w-md mt-2 leading-relaxed">
            No inspection cases found. Run an AI inspection first to generate cases for review.
          </p>
          <div className="flex items-center gap-3 mt-6">
            <button onClick={() => navigate(ROUTES.TRIAGE)} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-bold hover:shadow-[0_0_25px_rgba(6,182,212,0.25)] transition-all text-xs">
              <Zap size={14} /> New Inspection
            </button>
            <button onClick={() => navigate(ROUTES.CASE_DETAIL)} className="flex items-center gap-2 px-5 py-3 bg-slate-900/80 border border-slate-800 text-slate-300 rounded-xl font-semibold text-xs hover:bg-slate-800/80 transition-all">
              <FileText size={14} /> Reports Archive
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Human Review Workspace" subtitle="Perform manual override verification on flagged components.">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0c1929] via-[#0f172a] to-[#0a0f1d] border border-slate-800/80 p-6 md:p-8 mb-6">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/5 blur-[100px] rounded-full" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-600/20 border border-purple-500/20">
              <ShieldAlert size={20} className="text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-100 tracking-tight">Review Queue</h1>
              <p className="text-sm text-slate-400 mt-0.5">Select a case to perform manual verification and override AI verdicts.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-xl text-center">
              <p className="text-2xl font-black text-purple-400 font-tech-code">{cases.length}</p>
              <p className="text-[10px] text-purple-400/70 font-bold uppercase tracking-widest">Total Cases</p>
            </div>
            <div className="px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
              <p className="text-2xl font-black text-red-400 font-tech-code">{cases.filter((c) => (c.riskScore ?? 0) >= 70).length}</p>
              <p className="text-[10px] text-red-400/70 font-bold uppercase tracking-widest">Critical</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="bg-[#0f172a]/40 border border-slate-800/80 rounded-xl p-4 mb-5 backdrop-blur-xl">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by case ID, part number, commodity..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder:text-slate-500 focus:border-cyan-500/40 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                <XCircle size={14} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {[
              { id: "all", label: "All", color: "cyan" },
              { id: "high", label: "Critical", color: "red" },
              { id: "medium", label: "Warning", color: "amber" },
              { id: "low", label: "Clean", color: "emerald" },
            ].map(({ id: fId, label, color }) => {
              const isActive = riskFilter === fId;
              const colors = {
                cyan: "bg-cyan-500/10 border-cyan-500/30 text-cyan-400",
                red: "bg-red-500/10 border-red-500/30 text-red-400",
                amber: "bg-amber-500/10 border-amber-500/30 text-amber-400",
                emerald: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
              };
              return (
                <button
                  key={fId}
                  onClick={() => setRiskFilter(fId)}
                  className={`px-3 py-2 rounded-lg text-[11px] font-bold border transition-all ${isActive ? colors[color] : "bg-slate-900/60 border-slate-800 text-slate-500 hover:text-slate-400"}`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-slate-500">
          Showing <span className="text-slate-300 font-bold">{filteredCases.length}</span> of <span className="text-slate-300 font-bold">{cases.length}</span> cases
          <span className="text-slate-600 ml-2">· Sorted by highest risk</span>
        </p>
        <button
          onClick={() => {
            setLoading(true);
            getTriageQueue({ page: 1, pageSize: 100 }).then((res) => setCases(res?.items || [])).finally(() => setLoading(false));
          }}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-cyan-400 transition-colors"
        >
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {/* Cases List */}
      <div className="space-y-3">
        {filteredCases.map((c) => {
          const score = c.riskScore ?? 0;
          const isHigh = score >= 70;
          const isClean = score < 30;
          const borderColor = isHigh ? "border-l-red-500" : isClean ? "border-l-emerald-500" : "border-l-amber-500";

          return (
            <div
              key={c.id}
              onClick={() => navigate(`${ROUTES.HUMAN_REVIEW}?caseId=${c.caseId}`)}
              className={`group relative bg-gradient-to-br from-[#0f172a]/70 to-[#0a0f1d]/70 border border-slate-800/80 border-l-4 ${borderColor} rounded-xl p-5 cursor-pointer transition-all duration-300 hover:scale-[1.005] hover:border-slate-700/80 overflow-hidden`}
              style={{ boxShadow: "0 2px 20px rgba(0,0,0,0.2)" }}
            >
              <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: "radial-gradient(600px circle at 50% 50%, rgba(6,182,212,0.04), transparent 40%)" }} />
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Left — Case Info */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className={`p-2.5 rounded-lg flex-shrink-0 ${isHigh ? "bg-red-500/10 border border-red-500/20" : isClean ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-amber-500/10 border border-amber-500/20"}`}>
                    {isHigh ? <AlertTriangle size={18} className="text-red-400" /> : isClean ? <CheckCircle2 size={18} className="text-emerald-400" /> : <AlertCircle size={18} className="text-amber-400" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <p className="text-sm font-bold text-slate-200 group-hover:text-cyan-400 transition-colors font-tech-code">{c.caseId}</p>
                      <StatusBadge fraudScore={score} />
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {c.partNumber && <span className="flex items-center gap-1 text-[11px] text-slate-400 font-tech-code"><Hash size={10} className="text-slate-500" />{c.partNumber}</span>}
                      {c.commodity && <span className="flex items-center gap-1 text-[11px] text-slate-400"><Cpu size={10} className="text-slate-500" />{c.commodity}</span>}
                      {c.createdAt && <span className="flex items-center gap-1 text-[11px] text-slate-500"><Clock size={10} />{new Date(c.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>}
                    </div>
                  </div>
                </div>

                {/* Center — Risk Bar */}
                <div className="w-40 flex-shrink-0 hidden lg:block">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-slate-500 font-semibold uppercase">Risk</span>
                    <span className={`text-xs font-black font-tech-code ${isHigh ? "text-red-400" : isClean ? "text-emerald-400" : "text-amber-400"}`}>{score}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-900/80 rounded-full overflow-hidden border border-slate-800/50">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${isHigh ? "bg-gradient-to-r from-red-500 to-rose-600" : isClean ? "bg-gradient-to-r from-emerald-500 to-teal-600" : "bg-gradient-to-r from-amber-500 to-orange-600"}`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>

                {/* Right — Action */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-cyan-600/20 border border-purple-500/20 text-purple-300 group-hover:text-white group-hover:from-purple-500 group-hover:to-cyan-600 rounded-lg text-xs font-bold transition-all">
                    <ShieldAlert size={13} />
                    Review
                    <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredCases.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-14 w-14 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-4">
              <Search size={24} />
            </div>
            <h3 className="text-base font-bold text-slate-300 mb-1">No matching cases</h3>
            <p className="text-xs text-slate-500 max-w-xs">Try adjusting your search or filter criteria.</p>
            <button onClick={() => { setSearchQuery(""); setRiskFilter("all"); }} className="mt-4 px-4 py-2 bg-slate-900 border border-slate-800 text-slate-400 rounded-lg text-xs font-semibold hover:text-slate-200 transition-colors">
              Clear filters
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}

function ReviewDetailWorkspace({ caseId }) {
  const navigate = useNavigate();
  const { caseData, detailData, loading, error, notes, setNotes, region, handleRegionChange, handleRegionCommit, decisionState, submitDecision, learningStatus } =
    useReview(caseId);

  // Derive from backend
  const fraudScore = detailData?.fraudScore ?? 0;
  const aiConfidence = detailData?.confidencePct ?? caseData?.confidencePct ?? 0;
  const recommendation = detailData?.recommendation || {};
  const verdict = detailData?.status || "UNKNOWN";
  const recDecision = recommendation.decision || "N/A";

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-32">
          <div className="relative">
            <div className="absolute inset-0 bg-cyan-500/10 blur-3xl rounded-full animate-pulse" />
            <div className="relative h-16 w-16 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 flex items-center justify-center">
              <RefreshCw size={24} className="text-cyan-400 animate-spin" />
            </div>
          </div>
          <p className="text-sm text-slate-400 mt-4 font-medium">Loading case for review…</p>
        </div>
      </Layout>
    );
  }

  if (error || (!caseData && !detailData)) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-24 gap-6 text-center px-4">
          <div className="relative">
            <div className="absolute inset-0 bg-red-500/10 blur-3xl rounded-full" />
            <div className="relative h-20 w-20 rounded-2xl bg-gradient-to-br from-red-500/20 to-rose-600/20 border border-red-500/30 flex items-center justify-center">
              <AlertTriangle size={36} className="text-red-400" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-200 mb-2">Failed to Load Case</h2>
            <p className="text-sm text-slate-400 max-w-sm">{error || "Case data could not be retrieved from the server."}</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(ROUTES.HUMAN_REVIEW)} className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-bold text-xs hover:shadow-[0_0_20px_rgba(6,182,212,0.2)] transition-all">Back to Queue</button>
            <button onClick={() => window.location.reload()} className="px-5 py-2.5 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl font-semibold text-xs hover:bg-slate-800 transition-all flex items-center gap-1.5"><RefreshCw size={12} /> Retry</button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* ── 1. COMPACT HEADER ─────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0c1929] via-[#0f172a] to-[#0a0f1d] border border-slate-800/80 p-5 mb-6">
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-purple-500/5 blur-[120px] rounded-full" />
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate(ROUTES.HUMAN_REVIEW)} className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-cyan-500/30 text-slate-400 hover:text-cyan-400 transition-all" title="Back to Queue">
                <ArrowRight size={14} className="rotate-180" />
              </button>
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-600/20 border border-purple-500/20 hidden md:flex items-center justify-center">
                <ShieldAlert size={20} className="text-purple-400" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl font-black text-slate-100 tracking-tight">Human Review</h1>
                  <span className="font-tech-code text-cyan-400 text-xs font-bold bg-cyan-950/30 px-2.5 py-0.5 border border-cyan-500/20 rounded-lg">#{caseData?.id || caseId}</span>
                  <StatusBadge fraudScore={fraudScore} />
                </div>
                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                  {(caseData?.partCode || detailData?.partCode) && (
                    <span className="text-[11px] text-slate-400 font-tech-code">{caseData?.partCode || detailData?.partCode}</span>
                  )}
                  {detailData?.commodity && (
                    <span className="text-[11px] text-slate-500">· {detailData.commodity}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ConfidenceBadge confidencePct={aiConfidence} />
              <button onClick={() => navigate(`${ROUTES.CASE_DETAIL}/${caseId}`)} className="px-3.5 py-2 bg-slate-900/80 border border-slate-800 hover:border-cyan-500/30 text-slate-400 hover:text-cyan-400 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5">
                <FileText size={12} /> Full Report
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. AI SUMMARY — what the AI thinks ────────── */}
      <div className="rounded-xl border border-slate-800/80 bg-gradient-to-br from-[#0f172a]/70 to-[#0a0f1d]/70 p-5 mb-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className={`p-2.5 rounded-lg flex-shrink-0 ${fraudScore >= 70 ? "bg-red-500/10 border border-red-500/20" : fraudScore >= 40 ? "bg-amber-500/10 border border-amber-500/20" : "bg-emerald-500/10 border border-emerald-500/20"}`}>
              <Zap size={18} className={fraudScore >= 70 ? "text-red-400" : fraudScore >= 40 ? "text-amber-400" : "text-emerald-400"} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">AI Says</p>
              <p className="text-sm text-slate-300 leading-relaxed">
                Verdict: <span className={`font-black uppercase ${["tampered", "missing", "mismatched", "reused"].includes(verdict?.toLowerCase()) ? "text-red-400" : verdict?.toLowerCase() === "clean" ? "text-emerald-400" : "text-slate-400"}`}>{verdict}</span>
                {" "}· Action: <span className={`font-bold ${recDecision === "Accept" ? "text-emerald-400" : recDecision?.includes("Escalate") ? "text-red-400" : "text-amber-400"}`}>{recDecision}</span>
                {" "}· Risk: <span className={`font-black font-tech-code ${fraudScore >= 70 ? "text-red-400" : fraudScore >= 40 ? "text-amber-400" : "text-emerald-400"}`}>{fraudScore}%</span>
              </p>
            </div>
          </div>
          {recommendation.reasoning && (
            <p className="text-[11px] text-slate-500 max-w-sm leading-relaxed italic border-l-2 border-slate-800 pl-3">
              "{recommendation.reasoning.length > 150 ? recommendation.reasoning.substring(0, 150) + "…" : recommendation.reasoning}"
            </p>
          )}
        </div>
      </div>

      {/* ── 3. EVIDENCE + FEEDBACK ───────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6">
        {/* Evidence Panel — golden vs uploaded images with ROI editor */}
        <EvidencePanel
          caseData={caseData}
          region={region}
          onRegionChange={handleRegionChange}
          onRegionCommit={handleRegionCommit}
          learningStatus={learningStatus}
        />

        {/* Simple Feedback Sidebar */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          {/* Reviewer Decision */}
          <div className="rounded-xl border border-slate-800/80 bg-gradient-to-br from-[#0f172a]/70 to-[#0a0f1d]/70 p-5 flex flex-col gap-4">
            <h2 className="text-sm font-black text-slate-200 flex items-center gap-2 uppercase tracking-wider">
              <span className="material-symbols-outlined text-purple-400 text-[18px]">gavel</span>
              Your Decision
            </h2>

            <ReviewerComment value={notes} onChange={setNotes} />

            {/* Approve / Reject / Needs Evidence */}
            <ReviewDecision
              onDecide={submitDecision}
              pending={decisionState.pending}
              lastResult={decisionState.lastResult}
            />

            {decisionState.error && (
              <p className="text-red-400 text-xs font-medium bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{decisionState.error}</p>
            )}

            {/* Success feedback */}
            {decisionState.lastResult && !decisionState.pending && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-start gap-3">
                <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-emerald-400">Decision Recorded ✓</p>
                  <p className="text-[11px] text-emerald-400/70 mt-0.5">
                    Your "{decisionState.lastResult.decision}" feedback is now training data for the AI model.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Case Velocity */}
          {caseData && <CaseVelocity targetMinutes={caseData.targetResolutionMinutes} elapsedMinutes={caseData.elapsedMinutes} />}
        </div>
      </div>

      {/* ── 4. LEARNING LOOP VISUALIZATION ────────────── */}
      <div className="rounded-xl border border-slate-800/80 bg-gradient-to-br from-[#0f172a]/70 to-[#0a0f1d]/70 overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-slate-800/80 bg-slate-900/50 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <Zap size={16} className="text-purple-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-200">Human-in-the-Loop Learning</h3>
            <p className="text-[10px] text-slate-500">Your review decisions train the AI to make better predictions</p>
          </div>
        </div>
        <div className="p-6">
          {/* 4-Step Learning Loop Flow */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-2">
            {/* Step 1: AI Predicts */}
            <div className={`flex-1 flex flex-col items-center text-center p-4 rounded-xl border transition-all duration-500 ${
              !decisionState.lastResult && !decisionState.pending
                ? "bg-cyan-500/10 border-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.1)]"
                : "bg-slate-900/40 border-slate-800/60"
            }`}>
              <div className={`p-3 rounded-full mb-3 ${!decisionState.lastResult && !decisionState.pending ? "bg-cyan-500/20" : "bg-slate-800/60"}`}>
                <Gauge size={20} className={!decisionState.lastResult && !decisionState.pending ? "text-cyan-400" : "text-slate-500"} />
              </div>
              <p className="text-xs font-bold text-slate-300 mb-1">AI Predicts</p>
              <p className="text-[10px] text-slate-500 leading-tight">Model analyzes images & returns verdict</p>
            </div>

            <ArrowRight size={20} className="text-slate-700 hidden md:block flex-shrink-0" />
            <div className="h-6 w-px bg-slate-800 md:hidden" />

            {/* Step 2: Human Reviews */}
            <div className={`flex-1 flex flex-col items-center text-center p-4 rounded-xl border transition-all duration-500 ${
              decisionState.pending
                ? "bg-purple-500/10 border-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.1)] animate-pulse"
                : !decisionState.lastResult
                  ? "bg-slate-900/40 border-slate-800/60"
                  : "bg-slate-900/40 border-slate-800/60"
            }`}>
              <div className={`p-3 rounded-full mb-3 ${decisionState.pending ? "bg-purple-500/20" : "bg-slate-800/60"}`}>
                <ShieldAlert size={20} className={decisionState.pending ? "text-purple-400" : "text-slate-500"} />
              </div>
              <p className="text-xs font-bold text-slate-300 mb-1">Human Reviews</p>
              <p className="text-[10px] text-slate-500 leading-tight">Expert validates or overrides AI decision</p>
            </div>

            <ArrowRight size={20} className="text-slate-700 hidden md:block flex-shrink-0" />
            <div className="h-6 w-px bg-slate-800 md:hidden" />

            {/* Step 3: Feedback Saved */}
            <div className={`flex-1 flex flex-col items-center text-center p-4 rounded-xl border transition-all duration-500 ${
              learningStatus === "learning"
                ? "bg-cyan-500/10 border-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.1)] animate-pulse"
                : learningStatus === "success"
                  ? "bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                  : "bg-slate-900/40 border-slate-800/60"
            }`}>
              <div className={`p-3 rounded-full mb-3 ${
                learningStatus === "learning" ? "bg-cyan-500/20"
                  : learningStatus === "success" ? "bg-emerald-500/20"
                    : "bg-slate-800/60"
              }`}>
                <Activity size={20} className={
                  learningStatus === "learning" ? "text-cyan-400 animate-spin"
                    : learningStatus === "success" ? "text-emerald-400"
                      : "text-slate-500"
                } />
              </div>
              <p className="text-xs font-bold text-slate-300 mb-1">
                {learningStatus === "learning" ? "Training…" : learningStatus === "success" ? "Model Updated!" : "Feedback Saved"}
              </p>
              <p className="text-[10px] text-slate-500 leading-tight">Decision stored as training data</p>
            </div>

            <ArrowRight size={20} className="text-slate-700 hidden md:block flex-shrink-0" />
            <div className="h-6 w-px bg-slate-800 md:hidden" />

            {/* Step 4: AI Improves */}
            <div className={`flex-1 flex flex-col items-center text-center p-4 rounded-xl border transition-all duration-500 ${
              learningStatus === "success"
                ? "bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                : "bg-slate-900/40 border-slate-800/60"
            }`}>
              <div className={`p-3 rounded-full mb-3 ${learningStatus === "success" ? "bg-emerald-500/20" : "bg-slate-800/60"}`}>
                <BarChart3 size={20} className={learningStatus === "success" ? "text-emerald-400" : "text-slate-500"} />
              </div>
              <p className="text-xs font-bold text-slate-300 mb-1">AI Improves</p>
              <p className="text-[10px] text-slate-500 leading-tight">Better predictions on future inspections</p>
            </div>
          </div>

          {/* Explanation */}
          <div className="mt-5 bg-slate-950/60 border border-slate-800/60 rounded-xl p-4 text-[11px] text-slate-500 leading-relaxed">
            <span className="font-bold text-slate-400">How it works:</span> When you approve, reject, or request more evidence, your decision is saved alongside the case data. 
            The ROI corrections you make on the uploaded image are also ingested as training examples for the <span className="font-tech-code text-cyan-400">{caseData?.neuralModel || "FraudSense"}</span> model. 
            Over time, these corrections improve the AI's accuracy on similar components.
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default function HumanReviewPage() {
  const [searchParams] = useSearchParams();
  const caseId = searchParams.get("caseId");

  if (!caseId) {
    return <ReviewQueueList />;
  }

  return <ReviewDetailWorkspace caseId={caseId} />;
}

