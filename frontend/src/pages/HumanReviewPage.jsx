import { useMemo, useState, useEffect } from "react";
import { Layout } from "../components/Layout.jsx";
import {
  EvidencePanel,
  ConfidenceBadge,
  CaseVelocity,
  ReviewerComment,
  ReviewDecision,
} from "../components/Review.jsx";
import { Loader, Button, Badge } from "../components/Common.jsx";
import { useReview } from "../hooks/useReview.js";
import { getTriageQueue } from "../services/triageService.js";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ROUTES } from "../utils/constants.js";
import {
  ArrowRight,
  FileText,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Search,
  XCircle,
  Activity,
} from "lucide-react";

const cardStyle = {
  background: "var(--glass-bg)",
  backdropFilter: "var(--glass-blur)",
  WebkitBackdropFilter: "var(--glass-blur)",
  border: "1px solid var(--border-hairline)",
  borderTopColor: "var(--border-light-top)",
  borderRadius: "var(--radius-lg)",
  boxShadow: "var(--glass-shadow-sm), var(--glass-inset)",
};

function MetricBar({ label, value, max = 100, color, icon: Icon, suffix = "%" }) {
  const pct = Math.min((value / max) * 100, 100);

  const barColor = color || (
    pct >= 75 ? "var(--urgent)" : pct >= 50 ? "var(--warning)" : "var(--success)"
  );

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-1.5">
          {Icon && <Icon size={12} style={{ color: "var(--on-surface-muted)" }} />}
          <span className="font-bold uppercase text-[9px] tracking-wider"
                style={{ fontFamily: "var(--font-body)", color: "var(--on-surface-muted)" }}>
            {label}
          </span>
        </div>
        <span className="font-bold" style={{ color: "var(--on-surface)" }}>
          {typeof value === "number" ? value.toFixed(1) : value}
          {suffix}
        </span>
      </div>
      <div className="w-full h-1.5 rounded-full overflow-hidden"
           style={{ background: "rgba(0,0,0,0.25)", border: "1px solid var(--border-hairline)" }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: barColor }}
        />
      </div>
    </div>
  );
}

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
      list = list.filter(
        (c) =>
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
    list.sort((a, b) => (b.riskScore ?? 0) - (a.riskScore ?? 0));
    return list;
  }, [cases, searchQuery, riskFilter]);

  if (loading) {
    return (
      <Layout title="Human Review Queue" subtitle="Perform manual verification & verdict overrides">
        <Loader label="Loading QA review queue…" />
      </Layout>
    );
  }

  if (cases.length === 0) {
    return (
      <Layout title="Human Review Queue" subtitle="Perform manual verification & verdict overrides">
        <div className="p-12 text-center space-y-4" style={cardStyle}>
          <ShieldAlert size={32} style={{ color: "var(--primary)" }} className="mx-auto" />
          <h2 className="text-sm font-semibold" style={{ fontFamily: "var(--font-headline)", color: "var(--on-surface)" }}>
            No Pending Reviews
          </h2>
          <p className="text-xs max-w-sm mx-auto" style={{ fontFamily: "var(--font-body)", color: "var(--on-surface-muted)" }}>
            All triage cases cleared. Run a new inspection to populate queue.
          </p>
          <Button variant="primary" size="sm" onClick={() => navigate(ROUTES.TRIAGE)} icon={<Zap size={13} />}>
            New Inspection
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Human Review Queue" subtitle="Perform manual verification & verdict overrides">
      {/* Search & Filter Toolbar */}
      <div className="p-3 mb-4 space-y-3" style={cardStyle}>
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--on-surface-muted)" }} />
            <input
              type="text"
              placeholder="Search case ID, part code, commodity..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-9 pr-8 text-xs aura-input"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2" style={{ color: "var(--on-surface-muted)" }}>
                <XCircle size={14} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            {[
              { id: "all", label: "All" },
              { id: "high", label: "Critical" },
              { id: "medium", label: "Warning" },
              { id: "low", label: "Clean" },
            ].map(({ id: fId, label }) => {
              const active = riskFilter === fId;
              return (
                <button
                  key={fId}
                  onClick={() => setRiskFilter(fId)}
                  className="px-3 py-1 rounded-full font-mono text-[9px] font-bold border transition-all duration-150"
                  style={{
                    background: active ? "var(--primary-container)" : "transparent",
                    borderColor: active ? "rgba(0,125,184,0.30)" : "var(--border-default)",
                    color: active ? "#ffffff" : "var(--on-surface-variant)",
                    boxShadow: active ? "0 0 10px var(--primary-glow-sm)" : "none",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Case List */}
      <div className="space-y-3">
        {filteredCases.map((c) => {
          const score = c.riskScore ?? 0;

          return (
            <div
              key={c.id}
              onClick={() => navigate(`${ROUTES.HUMAN_REVIEW}?caseId=${c.caseId}`)}
              className="p-4 cursor-pointer transition-all duration-150 hover-backlit flex flex-col md:flex-row md:items-center justify-between gap-4"
              style={cardStyle}
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl text-sky-500" style={{ background: "rgba(0,0,0,0.15)", border: "1px solid var(--border-default)" }}>
                  <ShieldAlert size={18} style={{ color: "var(--primary)" }} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs" style={{ color: "var(--on-surface)" }}>{c.caseId}</span>
                    <Badge status={c.status} size="sm" />
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-mono mt-1" style={{ color: "var(--on-surface-muted)" }}>
                    <span>Part: {c.partNumber}</span>
                    <span>Type: {c.commodity}</span>
                  </div>
                </div>
              </div>

              <div className="w-48">
                <MetricBar label="Risk" value={score} max={100} suffix="%" />
              </div>

              <Button variant="outline" size="sm" icon={<ArrowRight size={12} />}>
                Review Case
              </Button>
            </div>
          );
        })}
      </div>
    </Layout>
  );
}

function ReviewDetailWorkspace({ caseId }) {
  const navigate = useNavigate();
  const {
    caseData,
    detailData,
    loading,
    error,
    notes,
    setNotes,
    region,
    handleRegionChange,
    handleRegionCommit,
    decisionState,
    submitDecision,
    learningStatus,
  } = useReview(caseId);

  const fraudScore = detailData?.fraudScore ?? 0;
  const aiConfidence = detailData?.confidencePct ?? caseData?.confidencePct ?? 0;
  const recommendation = detailData?.recommendation || {};
  const verdict = detailData?.status || "UNKNOWN";

  if (loading) {
    return (
      <Layout>
        <Loader label="Loading case inspection evidence…" />
      </Layout>
    );
  }

  if (error || (!caseData && !detailData)) {
    return (
      <Layout>
        <div className="p-8 text-center space-y-4" style={cardStyle}>
          <AlertTriangle size={32} style={{ color: "var(--urgent)" }} className="mx-auto" />
          <h2 className="text-sm font-semibold" style={{ fontFamily: "var(--font-headline)", color: "var(--on-surface)" }}>
            Unable to load case record
          </h2>
          <p className="text-xs" style={{ fontFamily: "var(--font-body)", color: "var(--on-surface-muted)" }}>
            {error || "Case record missing or deleted."}
          </p>
          <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.HUMAN_REVIEW)}>
            Back to Review Queue
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header */}
      <div className="p-4 mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3" style={cardStyle}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(ROUTES.HUMAN_REVIEW)}
            className="text-xs font-bold"
            style={{ fontFamily: "var(--font-body)", color: "var(--on-surface-muted)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--primary)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--on-surface-muted)")}
          >
            ← Queue
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold" style={{ fontFamily: "var(--font-headline)", color: "var(--on-surface)" }}>
                QA Verification: <span className="font-mono">#{caseData?.id || caseId}</span>
              </h1>
              <Badge status={caseData?.status || detailData?.status} size="sm" />
            </div>
            <p className="text-[10px] font-mono mt-0.5" style={{ color: "var(--on-surface-muted)" }}>
              Part Code: {caseData?.partCode || detailData?.partCode || "N/A"} · {detailData?.commodity || "Standard"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ConfidenceBadge confidencePct={aiConfidence} />
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`${ROUTES.CASE_DETAIL}/${caseId}`)}
            icon={<FileText size={13} />}
          >
            Full Report
          </Button>
        </div>
      </div>

      {/* AI Summary Banner */}
      <div className="p-4 mb-4 space-y-2" style={cardStyle}>
        <div className="flex items-center justify-between text-xs pb-2" style={{ borderBottom: "1px solid var(--border-hairline)" }}>
          <div className="flex items-center gap-2">
            <Zap size={14} style={{ color: "var(--primary)" }} />
            <span className="font-bold uppercase text-[10px]" style={{ fontFamily: "var(--font-body)", color: "var(--on-surface-muted)" }}>
              AI Pipeline Verdict:
            </span>
            <span className="font-mono font-bold uppercase" style={{ color: "var(--urgent)" }}>{verdict}</span>
          </div>
          <span className="font-mono font-bold" style={{ color: "var(--on-surface)" }}>Risk Score: {fraudScore}%</span>
        </div>
        {recommendation.reasoning && (
          <p className="text-xs leading-relaxed" style={{ fontFamily: "var(--font-body)", color: "var(--on-surface-variant)" }}>
            {recommendation.reasoning}
          </p>
        )}
      </div>

      {/* Main Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4">
        <div className="lg:col-span-8">
          <EvidencePanel
            caseData={caseData}
            region={region}
            onRegionChange={handleRegionChange}
            onRegionCommit={handleRegionCommit}
            learningStatus={learningStatus}
          />
        </div>

        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="p-4 space-y-4" style={cardStyle}>
            <div className="flex items-center gap-2 pb-2" style={{ borderBottom: "1px solid var(--border-hairline)" }}>
              <ShieldAlert size={14} style={{ color: "var(--primary)" }} />
              <h2 className="text-[11px] font-bold uppercase tracking-wider"
                  style={{ fontFamily: "var(--font-headline)", color: "var(--on-surface)" }}>
                Inspector Sign-off
              </h2>
            </div>

            <ReviewerComment value={notes} onChange={setNotes} />

            <ReviewDecision
              onDecide={submitDecision}
              pending={decisionState.pending}
              lastResult={decisionState.lastResult}
            />

            {decisionState.error && (
              <div className="p-3 rounded-xl text-xs"
                   style={{
                     background: "var(--urgent-surface)",
                     border: "1px solid var(--urgent-border)",
                     color: "var(--urgent)",
                     fontFamily: "var(--font-body)",
                   }}>
                {decisionState.error}
              </div>
            )}

            {decisionState.lastResult && !decisionState.pending && (
              <div className="p-3.5 rounded-xl text-xs flex gap-2 items-center animate-slide-up"
                   style={{
                     background: "var(--success-surface)",
                     border: "1px solid var(--success-border)",
                     color: "var(--success)",
                     fontFamily: "var(--font-body)",
                   }}>
                <CheckCircle2 size={14} /> Decision saved. Feed injected to training loop.
              </div>
            )}
          </div>

          {caseData && (
            <CaseVelocity
              targetMinutes={caseData.targetResolutionMinutes}
              elapsedMinutes={caseData.elapsedMinutes}
            />
          )}
        </div>
      </div>

      {/* Training Feedback Loop Indicator */}
      <div className="p-4 space-y-2" style={cardStyle}>
        <div className="flex items-center gap-2 text-xs font-bold uppercase"
             style={{ fontFamily: "var(--font-body)", color: "var(--on-surface)" }}>
          <Activity size={14} style={{ color: "var(--primary)" }} /> Active Learning Feedback Loop
        </div>
        <p className="text-xs leading-relaxed" style={{ fontFamily: "var(--font-body)", color: "var(--on-surface-muted)" }}>
          Your sign-off decision and ROI adjustments update neural weights for future RMA triage classifications.
        </p>
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
