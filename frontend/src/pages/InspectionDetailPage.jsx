import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { Layout } from "../components/Layout.jsx";
import { Loader, Modal, Button, Badge } from "../components/Common.jsx";
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
  FileText,
  ArrowRight,
  AlertTriangle,
  Trash2,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Zap,
  BarChart3,
  ScanLine,
  Gauge,
  Hash,
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

function StatCard({ icon: Icon, label, value, sublabel, color = "sky" }) {
  const themeColors = {
    sky: { text: "var(--primary)", bg: "var(--primary-glow-sm)" },
    rose: { text: "var(--urgent)", bg: "var(--urgent-surface)" },
    emerald: { text: "var(--success)", bg: "var(--success-surface)" },
    amber: { text: "var(--warning)", bg: "var(--warning-surface)" },
  }[color] || { text: "var(--primary)", bg: "var(--primary-glow-sm)" };

  return (
    <div className="p-4 flex flex-col justify-between" style={cardStyle}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[9px] font-bold uppercase tracking-widest"
              style={{ fontFamily: "var(--font-body)", color: "var(--on-surface-muted)" }}>
          {label}
        </span>
        <div className="p-1.5 rounded-lg flex items-center justify-center"
             style={{ background: themeColors.bg, border: "1px solid var(--border-hairline)" }}>
          <Icon size={13} style={{ color: themeColors.text }} />
        </div>
      </div>
      <div>
        <p className="text-lg font-light"
           style={{ fontFamily: "var(--font-headline)", color: themeColors.text }}>
          {value}
        </p>
        {sublabel && (
          <p className="text-[9px] mt-0.5"
             style={{ fontFamily: "var(--font-body)", color: "var(--on-surface-muted)" }}>
            {sublabel}
          </p>
        )}
      </div>
    </div>
  );
}

function MetricBar({ label, value, max = 100, color, icon: Icon, suffix = "%" }) {
  const pct = Math.min((value / max) * 100, 100);
  const barColor = color || (
    pct >= 75 ? "var(--urgent)" : pct >= 50 ? "var(--warning)" : "var(--success)"
  );

  return (
    <div className="space-y-1">
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

function DetailSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="p-6 h-32" style={cardStyle} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24" style={cardStyle} />
        ))}
      </div>
    </div>
  );
}

export default function InspectionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [caseData, setCaseData] = useState(null);
  const [reviewData, setReviewData] = useState(null);
  const [reportsList, setReportsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEmpty, setIsEmpty] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [riskFilter, setRiskFilter] = useState("all");
  const [deletingId, setDeletingId] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  useEffect(() => {
    if (!id) {
      setLoading(true);
      getTriageQueue({ page: 1, pageSize: 100 })
        .then((res) => {
          if (res?.items?.length) {
            setReportsList(res.items);
            setIsEmpty(false);
          } else setIsEmpty(true);
        })
        .catch(() => setIsEmpty(true))
        .finally(() => setLoading(false));
    } else {
      setIsEmpty(false);
      setLoading(true);
      Promise.all([getCaseById(id), fetchCaseForReview(id)])
        .then(([c, r]) => {
          setCaseData(c);
          setReviewData(r);
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const merged = useMemo(() => ({ ...caseData, ...reviewData }), [caseData, reviewData]);
  const pipelineComplete = merged.pipelineComplete === true || (merged.metrics && merged.metrics.length > 0 && merged.fraudScore != null);

  const ssim = merged.metrics?.find((m) => m.name.includes("SSIM"))?.score ?? null;
  const keypoint = merged.metrics?.find((m) => m.name.includes("Keypoint"))?.score ?? null;
  const vectorMatchRaw = merged.metrics?.find((m) => m.name?.includes("Vector"))?.score;
  const vectorMatchScore = vectorMatchRaw != null ? parseFloat(vectorMatchRaw) : null;
  const ocrResults = merged.ocrResults || [];
  const ocrText = ocrResults[0]?.extracted || "";
  const ocrExpected = ocrResults[0]?.expected || "";
  const ocrMatch = !pipelineComplete ? null : (ocrResults[0]?.match ?? (ocrText && ocrExpected && ocrExpected !== "N/A font / board label" ? ocrText === ocrExpected : null));
  const recommendation = merged.recommendation || {};

  const rawAction = recommendation.decision || merged.pipelineAction || merged.recommendation?.decision;
  const recDecision = !pipelineComplete
    ? null
    : rawAction === "Accept"
      ? REVIEW_DECISION.APPROVED
      : rawAction === "Quarantine & Escalate" || rawAction === "Escalate with evidence" || rawAction === "Escalate to vendor"
      ? REVIEW_DECISION.REJECTED
      : REVIEW_DECISION.NEEDS_MORE_EVIDENCE;

  const heatmapUrl = merged.heatmapUrl || null;
  const fraudScore = merged.fraudScore ?? null;
  const aiConfidence = recommendation.confidence ?? merged.confidencePct ?? null;

  const aiClassification = pipelineComplete
    ? (merged.pipelineVerdict || merged.metadata?.status || merged.result?.verdict || merged.status || "UNKNOWN").toUpperCase()
    : (merged.status || "pending").toUpperCase();

  const rawCategory = merged.pipelineCategory || merged.category || merged.metadata?.category || merged.result?.category;
  const currentVerdict = (merged.pipelineVerdict || merged.metadata?.status || merged.status || "").toLowerCase();
  const currentAction = (merged.pipelineAction || recommendation.decision || "").toLowerCase();

  const anomalyCategory = !pipelineComplete
    ? null
    : rawCategory || (
        currentVerdict === "tampered" || currentAction.includes("quarantine") || currentAction.includes("escalate")
          ? "Swap detection"
          : currentVerdict === "missing"
          ? "Missing QC label"
          : currentVerdict === "mismatched"
          ? "Altered serial number"
          : currentVerdict === "reused"
          ? "Reused board"
          : "Clean (OEM Verified)"
      );

  const filteredReports = useMemo(() => {
    let r = [...reportsList];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      r = r.filter(
        (x) =>
          x.caseId?.toLowerCase().includes(q) ||
          x.partNumber?.toLowerCase().includes(q) ||
          x.commodity?.toLowerCase().includes(q)
      );
    }
    if (riskFilter !== "all") {
      r = r.filter((x) => {
        const s = x.riskScore ?? 0;
        return riskFilter === "high"
          ? s >= 70
          : riskFilter === "medium"
          ? s >= 40 && s < 70
          : riskFilter === "low"
          ? s < 40
          : true;
      });
    }
    r.sort((a, b) =>
      sortBy === "risk"
        ? (b.riskScore ?? 0) - (a.riskScore ?? 0)
        : sortBy === "name"
        ? (a.partNumber ?? "").localeCompare(b.partNumber ?? "")
        : new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0)
    );
    return r;
  }, [reportsList, searchQuery, riskFilter, sortBy]);

  const handleDownloadPDF = () => {
    if (!id) return;
    window.open(
      `http://127.0.0.1:8000/api/reports/${id}/pdf?token=${encodeURIComponent(
        localStorage.getItem("fraudshield_auth_token") || ""
      )}`,
      "_blank"
    );
  };

  const handleDelete = (eOrCaseId, caseId) => {
    let target = caseId;
    if (typeof eOrCaseId === "string") {
      target = eOrCaseId;
    } else if (eOrCaseId && eOrCaseId.stopPropagation) {
      eOrCaseId.stopPropagation();
    }
    if (!target) return;
    setDeleteTargetId(target);
  };

  const executeDelete = async () => {
    if (!deleteTargetId) return;
    const targetId = deleteTargetId;
    setDeletingId(targetId);
    try {
      await deleteCase(targetId);
      setDeleteTargetId(null);
      setReportsList((prev) => prev.filter((x) => x.caseId !== targetId && x.id !== targetId));
      if (id) {
        navigate(ROUTES.CASE_DETAIL);
      } else {
        const res = await getTriageQueue({ page: 1, pageSize: 100 });
        if (res?.items) {
          setReportsList(res.items);
          setIsEmpty(res.items.length === 0);
        }
      }
    } catch (err) {
      alert(err.message || "Delete failed.");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <Layout>
        {id ? (
          <DetailSkeleton />
        ) : (
          <Loader fullPage={false} label="Fetching inspection archive records…" />
        )}
      </Layout>
    );
  }

  if (isEmpty) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-20 text-center px-4" style={cardStyle}>
          <div className="h-16 w-16 rounded-2xl flex items-center justify-center mb-4"
               style={{ background: "var(--primary-glow-sm)", border: "1px solid rgba(0,125,184,0.25)", color: "var(--primary)" }}>
            <FileText size={28} />
          </div>
          <h2 className="text-base font-semibold" style={{ fontFamily: "var(--font-headline)", color: "var(--on-surface)" }}>
            No Inspection Reports Found
          </h2>
          <p className="text-xs max-w-sm mt-1.5 mb-6" style={{ fontFamily: "var(--font-body)", color: "var(--on-surface-muted)" }}>
            Run a hardware diagnostic scan to record audit data.
          </p>
          <Button variant="primary" size="md" onClick={() => navigate(ROUTES.TRIAGE)} icon={<Zap size={15} />}>
            Launch Inspection Triage Console
          </Button>
        </div>
      </Layout>
    );
  }

  /* LIST ARCHIVE VIEW (No ID) */
  if (!id) {
    return (
      <Layout title="Inspection Reports Archive" subtitle="Review historical RMA compliance reports & audit trails">
        <div className="p-4 mb-4 flex flex-col md:flex-row justify-between items-center gap-3" style={cardStyle}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl text-sky-600 dark:text-sky-400"
                 style={{ background: "var(--primary-glow-sm)", border: "1px solid rgba(0,125,184,0.20)" }}>
              <FileText size={18} style={{ color: "var(--primary)" }} />
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider"
                  style={{ fontFamily: "var(--font-headline)", color: "var(--on-surface)" }}>
                Audit Reports Library
              </h2>
              <p className="text-[10px] font-mono mt-0.5" style={{ color: "var(--on-surface-muted)" }}>
                {reportsList.length} Archived Case Scans
              </p>
            </div>
          </div>
          <Button variant="primary" size="sm" onClick={() => navigate(ROUTES.TRIAGE)} icon={<Zap size={13} />}>
            New Inspection
          </Button>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="p-3 mb-4 space-y-3" style={cardStyle}>
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--on-surface-muted)" }} />
              <input
                type="text"
                placeholder="Search by case ID, part code, commodity..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-8 pl-9 pr-8 text-xs aura-input"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--on-surface-muted)" }}
                >
                  <XCircle size={14} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                icon={<Filter size={13} />}
              >
                Filters
              </Button>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-8 px-3 text-xs aura-input font-bold"
              >
                <option value="newest">Newest First</option>
                <option value="risk">Highest Risk</option>
                <option value="name">Part Code</option>
              </select>
            </div>
          </div>

          {showFilters && (
            <div className="flex items-center gap-3 pt-2.5 border-t text-xs" style={{ borderColor: "var(--border-hairline)" }}>
              <span className="text-[9px] font-bold uppercase tracking-widest" style={{ fontFamily: "var(--font-body)", color: "var(--on-surface-muted)" }}>
                Risk Level:
              </span>
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
                    className="px-2.5 py-0.5 rounded-full font-mono text-[9px] font-bold border transition-all duration-150"
                    style={{
                      background: active ? "var(--primary-glow-sm)" : "transparent",
                      borderColor: active ? "var(--primary)" : "var(--border-default)",
                      color: active ? "var(--primary)" : "var(--on-surface-variant)",
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Reports Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReports.map((r) => {
            const score = r.riskScore ?? 0;
            return (
              <div
                key={r.id}
                onClick={() => navigate(`${ROUTES.CASE_DETAIL}/${r.caseId}`)}
                className="p-4 space-y-3.5 cursor-pointer hover-backlit"
                style={cardStyle}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-mono font-bold text-xs" style={{ color: "var(--on-surface)" }}>{r.caseId}</p>
                    <p className="text-[9px] font-mono uppercase" style={{ color: "var(--on-surface-muted)" }}>{r.commodity || "N/A"}</p>
                  </div>
                  <Badge status={r.status} size="sm" />
                </div>

                <div className="flex items-center gap-1.5 text-xs font-mono" style={{ color: "var(--on-surface-variant)" }}>
                  <Hash size={12} style={{ color: "var(--on-surface-muted)" }} />
                  <span>{r.partNumber}</span>
                </div>

                <MetricBar label="Risk Score" value={score} max={100} suffix="%" />

                <div className="flex justify-between items-center pt-2.5 border-t text-[9px]"
                     style={{ borderColor: "var(--border-hairline)", color: "var(--on-surface-muted)" }}>
                  <span className="font-mono"><Clock size={10} className="inline mr-1" />{r.createdAt || "Recent"}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleDelete(e, r.caseId)}
                      className="p-1 transition"
                      style={{ color: "var(--on-surface-muted)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "var(--urgent)")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--on-surface-muted)")}
                    >
                      <Trash2 size={12} />
                    </button>
                    <span className="font-bold uppercase flex items-center gap-0.5" style={{ color: "var(--primary)" }}>
                      Details <ArrowRight size={10} />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <Modal
          open={Boolean(deleteTargetId)}
          onClose={() => setDeleteTargetId(null)}
          title="Confirm Report Deletion"
          size="sm"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button variant="outline" size="sm" onClick={() => setDeleteTargetId(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                loading={Boolean(deletingId)}
                onClick={executeDelete}
                icon={<Trash2 size={14} />}
              >
                Delete Permanently
              </Button>
            </div>
          }
        >
          <div className="space-y-2 text-xs" style={{ fontFamily: "var(--font-body)", color: "var(--on-surface)" }}>
            <p className="font-semibold">
              Are you sure you want to delete inspection report <span className="font-mono text-rose-500">{deleteTargetId}</span>?
            </p>
            <p style={{ color: "var(--on-surface-muted)" }}>This action will remove the case and evidence log permanently.</p>
          </div>
        </Modal>
      </Layout>
    );
  }

  /* SINGLE CASE AUDIT DETAIL VIEW */
  return (
    <Layout>
      {/* Header Banner */}
      <div className="p-4 mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3" style={cardStyle}>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(ROUTES.CASE_DETAIL)}
              className="text-xs font-bold font-mono"
              style={{ color: "var(--on-surface-muted)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--primary)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--on-surface-muted)")}
            >
              ← Reports Archive
            </button>
            <span style={{ color: "var(--border-strong)" }}>/</span>
            <span className="font-mono font-bold text-xs" style={{ color: "var(--primary)" }}>#{merged.id}</span>
            <Badge status={merged.status} size="sm" />
          </div>
          <h1 className="text-base font-semibold" style={{ fontFamily: "var(--font-headline)", color: "var(--on-surface)" }}>
            Audit Report: <span className="font-mono">{merged.partCode}</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleDownloadPDF} icon={<Download size={13} />}>
            PDF Report
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate(`${ROUTES.HUMAN_REVIEW}?caseId=${merged.id}`)}
            icon={<ShieldAlert size={13} />}
          >
            QA Review
          </Button>
          <button
            onClick={() => handleDelete(merged.id)}
            className="p-1.5 rounded-xl border text-slate-400 hover:text-rose-500 transition-colors duration-150"
            style={{ borderColor: "var(--border-default)", background: "rgba(0,0,0,0.15)", color: "var(--on-surface-muted)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--urgent)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--on-surface-muted)")}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        <StatCard
          icon={Gauge}
          label="Fraud Score"
          value={fraudScore != null ? `${fraudScore}/100` : "N/A"}
          sublabel={fraudScore == null ? "Pipeline incomplete" : fraudScore >= 70 ? "Critical Risk" : fraudScore >= 40 ? "Warning" : "Passed"}
          color={fraudScore == null ? "sky" : fraudScore >= 70 ? "rose" : fraudScore >= 40 ? "amber" : "emerald"}
        />
        <StatCard
          icon={BarChart3}
          label="SSIM Score"
          value={ssim != null ? `${(ssim * 100).toFixed(1)}%` : "N/A"}
          sublabel={ssim == null ? "No result" : ssim >= 0.8 ? "Match" : "Structural Diff"}
          color={ssim == null ? "sky" : ssim >= 0.8 ? "emerald" : "amber"}
        />
        <StatCard
          icon={Zap}
          label="Vector Sim"
          value={vectorMatchScore != null ? `${vectorMatchScore.toFixed(1)}%` : "N/A"}
          sublabel="512-Dim Cosine"
          color="sky"
        />
        <StatCard
          icon={ScanLine}
          label="Keypoint Match"
          value={keypoint != null ? `${(keypoint * 100).toFixed(1)}%` : "N/A"}
          sublabel="ORB Descriptors"
          color="sky"
        />
        <StatCard
          icon={CheckCircle2}
          label="OCR Label"
          value={ocrMatch == null ? "N/A" : ocrMatch ? "PASS" : "FAIL"}
          sublabel={ocrMatch == null ? "No result" : ocrMatch ? "Serial Verified" : "Mismatch Detected"}
          color={ocrMatch == null ? "sky" : ocrMatch ? "emerald" : "rose"}
        />
      </div>

      {/* Decision Judge Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4">
        <div className="lg:col-span-8">
          {pipelineComplete ? (
            <RecommendationCard
              recommendation={recDecision}
              confidence={aiConfidence}
              reasoning={recommendation.reasoning || "AI confidence score requires operator verification."}
              flags={recommendation.flags || []}
            />
          ) : (
            <div className="p-4 flex flex-col justify-center gap-2" style={cardStyle}>
              <p className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-2" style={{ fontFamily: "var(--font-body)", color: "var(--warning)" }}>
                <AlertCircle size={14} /> Pipeline Incomplete
              </p>
              <p className="text-xs" style={{ fontFamily: "var(--font-body)", color: "var(--on-surface-muted)" }}>
                The AI pipeline did not complete for this inspection. No verdict has been issued.
                Submit a new scan or check the backend pipeline logs.
              </p>
            </div>
          )}
        </div>
        <div className="lg:col-span-4 p-4 flex flex-col items-center justify-center" style={cardStyle}>
          <p className="text-[9px] font-bold uppercase tracking-widest mb-3" style={{ fontFamily: "var(--font-body)", color: "var(--on-surface-muted)" }}>
            Overall Risk Gauge
          </p>
          <FraudScore score={fraudScore ?? 0} size="md" showLabel={false} />
          {!pipelineComplete && (
            <p className="text-[9px] font-mono mt-1" style={{ color: "var(--on-surface-muted)" }}>No result data</p>
          )}
        </div>
      </div>

      {/* Image Comparison */}
      <div className="mb-4">
        <ImageComparison
          goldenUrl={merged.goldenImageUrl}
          uploadedUrl={merged.uploadedImageUrl}
          imageHash={merged.imageHash}
        />
      </div>

      {/* Heatmap + Reasoning */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <HeatmapViewer
          imageUrl={merged.uploadedImageUrl}
          heatmapUrl={heatmapUrl}
          label={heatmapUrl ? "SSIM Anomaly Heatmap Overlay" : "AI Region of Interest"}
        />

        <div className="p-4 space-y-3.5" style={cardStyle}>
          <h3 className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-2"
              style={{ fontFamily: "var(--font-headline)", color: "var(--on-surface)" }}>
            <FileText size={15} style={{ color: "var(--primary)" }} /> AI Audit Narrative &amp; Justification
          </h3>
          <div className="p-3.5 rounded-xl text-xs leading-relaxed"
               style={{
                 background: "rgba(0,0,0,0.15)",
                 border: "1px solid var(--border-default)",
                 fontFamily: "var(--font-body)",
                 color: "var(--on-surface-variant)",
               }}>
            {recommendation.reasoning || "Diagnostic complete."}
          </div>
          <div className="text-[9px] font-mono" style={{ color: "var(--on-surface-muted)" }}>
            Pipeline method: Multi-agent SSIM alignment + EasyOCR serial verification + Vector Embedding Cosine search.
          </div>
        </div>
      </div>

      {/* OCR + Classification */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4">
        <div className="lg:col-span-7">
          <OCRResults results={ocrResults} />
        </div>
        <div className="lg:col-span-5 p-4 space-y-3.5" style={cardStyle}>
          <h3 className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-2"
              style={{ fontFamily: "var(--font-headline)", color: "var(--on-surface)" }}>
            <FileText size={15} style={{ color: "var(--primary)" }} /> Pipeline Verdict &amp; Anomaly Category
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 font-mono text-xs">
            <div className="p-2.5 rounded-xl"
                 style={{ background: "rgba(0,0,0,0.15)", border: "1px solid var(--border-default)" }}>
              <span className="text-[8px] font-bold uppercase block" style={{ color: "var(--on-surface-muted)" }}>Anomaly Category</span>
              <span className="font-bold font-sans text-[10px] block truncate mt-0.5 text-ellipsis overflow-hidden"
                    style={{ color: "var(--primary)" }} title={anomalyCategory || "—"}>
                {anomalyCategory || "—"}
              </span>
            </div>
            <div className="p-2.5 rounded-xl"
                 style={{ background: "rgba(0,0,0,0.15)", border: "1px solid var(--border-default)" }}>
              <span className="text-[8px] font-bold uppercase block" style={{ color: "var(--on-surface-muted)" }}>Verdict</span>
              <span className="font-bold uppercase text-[10px] block mt-0.5"
                    style={{ color: pipelineComplete ? "var(--success)" : "var(--on-surface-muted)" }}>
                {aiClassification}
              </span>
            </div>
            <div className="p-2.5 rounded-xl"
                 style={{ background: "rgba(0,0,0,0.15)", border: "1px solid var(--border-default)" }}>
              <span className="text-[8px] font-bold uppercase block" style={{ color: "var(--on-surface-muted)" }}>Action</span>
              <span className="font-bold font-sans text-[10px] block truncate mt-0.5 text-ellipsis overflow-hidden"
                    style={{ color: "var(--warning)" }} title={recommendation.decision || "—"}>
                {recommendation.decision || "—"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics & Metadata */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4">
        <div className="lg:col-span-7">
          <DetectorMetrics metrics={merged.metrics || []} />
        </div>
        <div className="lg:col-span-5">
          <MetadataCard caseData={merged} />
        </div>
      </div>

      {/* Telemetry Log */}
      <div className="p-4 space-y-3 mb-4 font-mono text-xs" style={cardStyle}>
        <div className="flex items-center gap-2 font-bold pb-2" style={{ borderBottom: "1px solid var(--border-hairline)", color: "var(--on-surface)" }}>
          <Terminal size={14} style={{ color: "var(--primary)" }} /> Execution Log
        </div>
        <div className="bg-[#0b0f17] text-slate-300 p-3.5 rounded-xl text-[10px] space-y-1.5 overflow-x-auto border border-hairline"
             style={{ borderColor: "var(--border-default)" }}>
          <p className="text-slate-500">&gt; Session: {merged.updatedAt || "Active"}</p>
          {pipelineComplete ? (
            <>
              <p className="text-sky-400">&gt; Agent-1 (Selector): Ingest &amp; aspect ratio check OK | Commodity: {merged.commodity || "N/A"}</p>
              <p className="text-emerald-400">&gt; Agent-2 (Triage): Frame alignment {merged.evidence?.alignment?.status || "aligned"} | Keypoint Match: {keypoint != null ? (keypoint * 100).toFixed(1) : "N/A"}%</p>
              <p className="text-sky-400">&gt; Agent-3 (Detector): SSIM Score: {ssim != null ? `${(ssim * 100).toFixed(1)}%` : "N/A"} | Thermal heatmap generated</p>
              <p className={ocrMatch === false ? "text-rose-400" : ocrMatch === true ? "text-emerald-400" : "text-amber-400"}>
                &gt; Agent-3 (OCR): Expected "{ocrExpected || "N/A"}" vs Got "{ocrText || "N/A"}" ({ocrMatch === true ? "PASS" : ocrMatch === false ? "MISMATCH" : "INCONCLUSIVE"})
              </p>
              <p className="text-amber-400">&gt; Agent-4 (Decision): Verdict: {merged.pipelineVerdict || merged.status || "N/A"} | Category: {anomalyCategory || "N/A"} | Risk Score: {fraudScore != null ? `${fraudScore}/100` : "N/A"}</p>
              <p className="text-amber-400">&gt; Agent-4 (Action): Recommended Action: {merged.pipelineAction || recommendation.decision || "N/A"}</p>
              <p className="text-emerald-400">&gt; Agent-5 (Explainer): AI narrative generated successfully.</p>
            </>
          ) : (
            <>
              <p className="text-amber-400">&gt; [WARN] Pipeline execution pending or incomplete.</p>
              <p className="text-rose-400">&gt; [INFO] Inspection case status: {merged.status || "pending"}</p>
              <p className="text-slate-500">&gt; Agents 2–5 did not run. Submit a new scan via Triage Console to generate results.</p>
            </>
          )}
        </div>
      </div>

      {/* Timeline */}
      <EvidenceTimeline events={merged.timeline || []} />

      <Modal
        open={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        title="Confirm Report Deletion"
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="outline" size="sm" onClick={() => setDeleteTargetId(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={Boolean(deletingId)}
              onClick={executeDelete}
              icon={<Trash2 size={14} />}
            >
              Delete Permanently
            </Button>
          </div>
        }
      >
        <div className="space-y-2 text-xs" style={{ fontFamily: "var(--font-body)", color: "var(--on-surface)" }}>
          <p className="font-semibold">
            Permanently delete report <span className="font-mono text-rose-500">{deleteTargetId}</span>?
          </p>
        </div>
      </Modal>
    </Layout>
  );
}
