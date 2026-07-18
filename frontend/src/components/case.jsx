// Consolidated components for case
import { REVIEW_DECISION } from "../utils/constants.js";
import { formatDateTime } from "../utils/formatDate.js";
import { formatFraudScore } from "../utils/formatScore.js";
import { formatScore } from "../utils/formatScore.js";
import { useState } from "react";

// DetectorMetrics.jsx — Displays per-detector scores from the AI pipeline

/**
 * Props:
 *  metrics  {Array<{name, score, unit, icon, description}>}
 *           score is 0-1 (SSIM, keypoint) or 0-100 (fraud score %)
 *           unit  optional — e.g. "%" or "" (defaults to showing raw score)
 */
export function DetectorMetrics({ metrics = [] }) {
  if (!metrics.length) {
    return (
      <div className="bg-white border border-outline-variant rounded-xl shadow-sm p-card-padding">
        <h3 className="font-headline-sm text-headline-sm flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined text-primary">bar_chart</span>
          Detector Metrics
        </h3>
        <p className="text-on-surface-variant text-body-sm italic">No detector metrics available.</p>
      </div>
    );
  }

  function barColor(score, maxScore) {
    const pct = (score / maxScore) * 100;
    if (pct >= 80) return "bg-green-500";
    if (pct >= 50) return "bg-amber-400";
    return "bg-red-500";
  }

  return (
    <div className="bg-white border border-outline-variant rounded-xl shadow-sm p-card-padding">
      <h3 className="font-headline-sm text-headline-sm flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-primary">bar_chart</span>
        Detector Metrics
      </h3>

      <div className="flex flex-col gap-4">
        {metrics.map((m) => {
          const max = m.unit === "%" ? 100 : 1;
          const pct = Math.min((m.score / max) * 100, 100);
          const color = barColor(m.score, max);

          return (
            <div key={m.name}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  {m.icon && (
                    <span className="material-symbols-outlined text-[18px] text-primary">{m.icon}</span>
                  )}
                  <span className="text-body-sm font-medium text-on-surface">{m.name}</span>
                </div>
                <span className="font-tech-code text-body-sm text-on-surface-variant">
                  {m.unit === "%" ? `${Math.round(m.score)}%` : formatScore(m.score)}
                  {m.unit && m.unit !== "%" ? ` ${m.unit}` : ""}
                </span>
              </div>
              <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${color} transition-all duration-700`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              {m.description && (
                <p className="text-[11px] text-on-surface-variant mt-1 italic">{m.description}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ==========================================

// EvidenceTimeline.jsx — Chronological log of events for a case (status changes, comments, decisions)

const EVENT_CONFIG = {
  created: { icon: "add_circle", color: "text-primary", bg: "bg-primary/10" },
  retake_requested: { icon: "history", color: "text-amber-600", bg: "bg-amber-50" },
  resubmitted: { icon: "publish", color: "text-blue-600", bg: "bg-blue-50" },
  reviewed: { icon: "rate_review", color: "text-primary", bg: "bg-primary/10" },
  approved: { icon: "check_circle", color: "text-green-600", bg: "bg-green-50" },
  rejected: { icon: "cancel", color: "text-red-600", bg: "bg-red-50" },
  needs_evidence: { icon: "radio_button_checked", color: "text-amber-600", bg: "bg-amber-50" },
  final_decision: { icon: "fact_check", color: "text-green-700", bg: "bg-green-50" },
  comment: { icon: "chat", color: "text-on-surface-variant", bg: "bg-surface-container" },
};

function getConfig(type) {
  return EVENT_CONFIG[type] ?? { icon: "circle", color: "text-on-surface-variant", bg: "bg-surface-container" };
}

/**
 * Props:
 *  events {Array<{id, type, label, description, user, timestamp}>}
 */
export function EvidenceTimeline({ events = [] }) {
  if (!events.length) {
    return (
      <div className="bg-white border border-outline-variant rounded-xl shadow-sm p-card-padding">
        <h3 className="font-headline-sm text-headline-sm flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined text-primary">timeline</span>
          Evidence Timeline
        </h3>
        <p className="text-on-surface-variant text-body-sm italic">No events recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-outline-variant rounded-xl shadow-sm p-card-padding">
      <h3 className="font-headline-sm text-headline-sm flex items-center gap-2 mb-5">
        <span className="material-symbols-outlined text-primary">timeline</span>
        Evidence Timeline
      </h3>

      <ol className="relative flex flex-col gap-0">
        {events.map((event, i) => {
          const cfg = getConfig(event.type);
          const isLast = i === events.length - 1;

          return (
            <li key={event.id ?? i} className="flex gap-4 relative">
              {/* Connector line */}
              {!isLast && (
                <div className="absolute left-[15px] top-10 bottom-0 w-[2px] bg-outline-variant" />
              )}

              {/* Icon bubble */}
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full ${cfg.bg} flex items-center justify-center z-10 mt-0.5`}
              >
                <span className={`material-symbols-outlined text-[18px] ${cfg.color}`}>{cfg.icon}</span>
              </div>

              {/* Content */}
              <div className={`flex-1 pb-5 ${isLast ? "" : ""}`}>
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <span className={`text-body-sm font-semibold ${cfg.color}`}>{event.label}</span>
                  <span className="text-[11px] text-on-surface-variant font-tech-code">
                    {formatDateTime(event.timestamp)}
                  </span>
                </div>
                {event.description && (
                  <p className="text-body-sm text-on-surface-variant mt-0.5">{event.description}</p>
                )}
                {event.user && (
                  <p className="text-[11px] text-on-surface-variant mt-0.5">
                    by <span className="font-medium">{event.user}</span>
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ==========================================

// FraudScore.jsx — Circular gauge displaying the AI fraud risk score (0-100)

function getRingColor(score) {
  if (score >= 75) return "#ef4444"; // red — high risk
  if (score >= 50) return "#f59e0b"; // amber — medium risk
  return "#22c55e";                  // green — low risk
}

function getRiskLabel(score) {
  if (score >= 75) return { text: "High Risk", bg: "bg-red-50", text_: "text-red-700" };
  if (score >= 50) return { text: "Medium Risk", bg: "bg-amber-50", text_: "text-amber-700" };
  return { text: "Low Risk", bg: "bg-green-50", text_: "text-green-700" };
}

/**
 * Props:
 *  score        {number} 0-100   fraud score from the AI detector
 *  showLabel    {boolean}        show a "High/Medium/Low Risk" pill
 *  size         {"sm"|"md"|"lg"}
 */
export function FraudScore({ score = 0, showLabel = true, size = "md" }) {
  const normalised = Math.min(Math.max(score, 0), 100);
  const radius = 40;
  const circ = 2 * Math.PI * radius;
  const progress = circ * (1 - normalised / 100);
  const color = getRingColor(normalised);
  const risk = getRiskLabel(normalised);

  const dims = size === "sm" ? "w-20 h-20" : size === "lg" ? "w-36 h-36" : "w-28 h-28";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`${dims} relative`}>
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90" aria-hidden="true">
          {/* Track */}
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="10" />
          {/* Progress */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={progress}
            style={{ transition: "stroke-dashoffset 0.7s ease" }}
          />
        </svg>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-bold leading-none" style={{ color, fontSize: size === "sm" ? "1rem" : "1.5rem" }}>
            {formatFraudScore(normalised)}
          </span>
          <span className="text-[10px] text-on-surface-variant">/100</span>
        </div>
      </div>

      {showLabel && (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${risk.bg} ${risk.text_}`}>
          {risk.text}
        </span>
      )}
    </div>
  );
}

// ==========================================

// HeatmapViewer.jsx — Overlays a heat-map highlight on a part image to show AI attention regions

/**
 * Props:
 *  imageUrl     {string}   — the uploaded image URL
 *  heatmapUrl   {string}   — optional: separate heatmap image URL (overlay mode)
 *  region       {object}   — { x, y, w, h } percentages (used when no heatmapUrl)
 *  alt          {string}
 *  label        {string}   — caption below the viewer
 */
export function HeatmapViewer({
  imageUrl,
  heatmapUrl,
  region,
  alt = "Part under review",
  label = "AI Attention Region",
}) {
  const [showOverlay, setShowOverlay] = useState(true);

  return (
    <div className="bg-white border border-outline-variant rounded-xl shadow-sm p-card-padding">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-headline-sm text-headline-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">thermostat</span>
          Heatmap Viewer
        </h3>
        <button
          onClick={() => setShowOverlay((v) => !v)}
          className="flex items-center gap-1.5 text-body-sm text-on-surface-variant hover:text-primary transition-colors px-3 py-1 rounded-lg border border-outline-variant hover:bg-primary/5"
        >
          <span className="material-symbols-outlined text-[18px]">
            {showOverlay ? "visibility_off" : "visibility"}
          </span>
          {showOverlay ? "Hide" : "Show"} Overlay
        </button>
      </div>

      <div className="relative aspect-square bg-surface-container-lowest rounded-lg overflow-hidden border border-outline-variant select-none">
        {/* Base image */}
        <img
          src={imageUrl}
          alt={alt}
          className="w-full h-full object-cover"
        />

        {/* Overlay: separate heatmap image OR box region */}
        {showOverlay && (
          <>
            {heatmapUrl ? (
              <img
                src={heatmapUrl}
                alt="Heatmap overlay"
                className="absolute inset-0 w-full h-full object-cover mix-blend-multiply opacity-70 transition-opacity duration-300"
              />
            ) : region ? (
              /* Bounding-box overlay derived from ROI region percentages */
              <div
                className="absolute border-2 border-primary rounded shadow-lg"
                style={{
                  left: `${region.x}%`,
                  top: `${region.y}%`,
                  width: `${region.w}%`,
                  height: `${region.h}%`,
                  background: "rgba(0,74,198,0.12)",
                  boxShadow: "0 0 0 9999px rgba(0,0,0,0.25)",
                  pointerEvents: "none",
                }}
              />
            ) : null}
          </>
        )}
      </div>

      {label && (
        <p className="text-center text-body-sm text-on-surface-variant italic mt-3">{label}</p>
      )}
    </div>
  );
}

// ==========================================

// ImageComparison.jsx — Side-by-side golden vs uploaded image viewer with optional diff overlay

/**
 * Props:
 *  goldenUrl    {string}  — OEM reference image URL
 *  uploadedUrl  {string}  — uploaded/defective image URL
 *  altGolden    {string}
 *  altUploaded  {string}
 *  imageHash    {string}  — shown as a tech code label
 */
export function ImageComparison({
  goldenUrl,
  uploadedUrl,
  altGolden = "Golden reference image",
  altUploaded = "Uploaded image",
  imageHash,
}) {
  const [zoom, setZoom] = useState(null); // null | "golden" | "uploaded"

  return (
    <div className="bg-white border border-outline-variant rounded-xl shadow-sm p-card-padding">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-headline-sm text-headline-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">compare</span>
          Image Comparison
        </h3>
        {imageHash && (
          <span className="font-tech-code text-body-sm text-on-surface-variant bg-surface-container-low px-2 py-1 rounded">
            {imageHash}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Golden */}
        <div className="flex flex-col gap-2">
          <span className="font-label-caps text-[10px] uppercase text-on-surface-variant">
            Golden Reference (OEM)
          </span>
          <div
            className="relative aspect-square rounded-lg overflow-hidden border border-outline-variant bg-surface-container-lowest cursor-zoom-in group"
            onClick={() => setZoom(zoom === "golden" ? null : "golden")}
          >
            <img
              src={goldenUrl}
              alt={altGolden}
              className="w-full h-full object-cover grayscale opacity-80 group-hover:opacity-100 group-hover:grayscale-0 transition-all duration-300"
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="material-symbols-outlined text-white text-3xl drop-shadow-lg">zoom_in</span>
            </div>
            <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur px-2 py-0.5 rounded-full text-[10px] font-bold border border-outline-variant uppercase">
              Source: Master_DB
            </div>
          </div>
        </div>

        {/* Uploaded */}
        <div className="flex flex-col gap-2">
          <span className="font-label-caps text-[10px] uppercase text-on-surface-variant">
            Uploaded (Review Required)
          </span>
          <div
            className="relative aspect-square rounded-lg overflow-hidden border border-outline-variant bg-surface-container-lowest cursor-zoom-in group"
            onClick={() => setZoom(zoom === "uploaded" ? null : "uploaded")}
          >
            <img
              src={uploadedUrl}
              alt={altUploaded}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="material-symbols-outlined text-white text-3xl drop-shadow-lg">zoom_in</span>
            </div>
            <div className="absolute top-2 right-2 bg-error text-white px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">
              Flagged
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {zoom && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-8 cursor-zoom-out animate-fade-in"
          onClick={() => setZoom(null)}
        >
          <img
            src={zoom === "golden" ? goldenUrl : uploadedUrl}
            alt={zoom === "golden" ? altGolden : altUploaded}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          />
          <button
            className="absolute top-4 right-4 text-white p-2 rounded-full bg-white/10 hover:bg-white/20"
            onClick={() => setZoom(null)}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      )}
    </div>
  );
}

// ==========================================

// MetadataCard.jsx — Displays structured case/part metadata in a two-column grid

/**
 * Props:
 *  caseData {object}  — the case object from caseService / reviewService
 *  extra    {Array<{label, value}>}  — optional additional rows
 */
export function MetadataCard({ caseData = {}, extra = [] }) {
  const rows = [
    { label: "Case ID", value: caseData.id },
    { label: "Part Code", value: caseData.partCode },
    { label: "Commodity", value: caseData.commodity },
    { label: "Status", value: caseData.status?.replace(/_/g, " ") },
    { label: "Image Hash", value: caseData.imageHash },
    { label: "Neural Model", value: caseData.neuralModel },
    { label: "Updated", value: formatDateTime(caseData.updatedAt) },
    ...extra,
  ].filter((r) => r.value !== undefined && r.value !== null);

  return (
    <div className="bg-white border border-outline-variant rounded-xl shadow-sm p-card-padding">
      <h3 className="font-headline-sm text-headline-sm flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-primary">info</span>
        Case Metadata
      </h3>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
        {rows.map(({ label, value }) => (
          <div key={label} className="flex flex-col gap-0.5">
            <dt className="font-label-caps text-on-surface-variant uppercase text-[11px]">{label}</dt>
            <dd className="font-tech-code text-on-surface text-body-sm break-all">{value ?? "—"}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

// ==========================================

// OCRResults.jsx — Shows OCR-extracted text from a part label vs the expected value
/**
 * Props:
 *  results  {Array<{field, extracted, expected, match}>}
 *           field     — e.g. "Part Number", "Batch Code"
 *           extracted — what the OCR engine read
 *           expected  — golden/reference value (optional)
 *           match     — true | false | null (unknown)
 */
export function OCRResults({ results = [] }) {
  if (!results.length) {
    return (
      <div className="bg-white border border-outline-variant rounded-xl shadow-sm p-card-padding">
        <h3 className="font-headline-sm text-headline-sm flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined text-primary">text_fields</span>
          OCR Results
        </h3>
        <p className="text-on-surface-variant text-body-sm italic">No OCR data available for this case.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-outline-variant rounded-xl shadow-sm p-card-padding">
      <h3 className="font-headline-sm text-headline-sm flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-primary">text_fields</span>
        OCR Results
      </h3>

      <div className="flex flex-col gap-3">
        {results.map((row, i) => {
          const matchIcon = row.match === true ? "check_circle" : row.match === false ? "cancel" : "help";
          const matchColor =
            row.match === true ? "text-green-600" : row.match === false ? "text-red-500" : "text-on-surface-variant";

          return (
            <div
              key={i}
              className="grid grid-cols-[1fr_1fr_auto] gap-3 items-center border-b border-outline-variant pb-3 last:border-0 last:pb-0"
            >
              {/* Field */}
              <div>
                <p className="font-label-caps text-[10px] uppercase text-on-surface-variant mb-0.5">{row.field}</p>
                <p className="font-tech-code text-body-sm text-on-surface">{row.extracted ?? "—"}</p>
              </div>
              {/* Expected */}
              <div>
                <p className="font-label-caps text-[10px] uppercase text-on-surface-variant mb-0.5">Expected</p>
                <p className="font-tech-code text-body-sm text-on-surface-variant">{row.expected ?? "—"}</p>
              </div>
              {/* Match icon */}
              <span className={`material-symbols-outlined text-[22px] ${matchColor}`}>{matchIcon}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ==========================================

// RecommendationCard.jsx — AI-generated next-step recommendation for a case

const DECISION_CONFIG = {
  [REVIEW_DECISION.APPROVED]: {
    icon: "check_circle",
    title: "Approve Part",
    color: "text-green-700",
    bg: "bg-green-50",
    border: "border-green-200",
    badge: "bg-green-100 text-green-800",
  },
  [REVIEW_DECISION.REJECTED]: {
    icon: "cancel",
    title: "Reject Part",
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    badge: "bg-red-100 text-red-800",
  },
  [REVIEW_DECISION.NEEDS_MORE_EVIDENCE]: {
    icon: "find_in_page",
    title: "Request More Evidence",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    badge: "bg-amber-100 text-amber-800",
  },
};

/**
 * Props:
 *  recommendation  {string}  — one of REVIEW_DECISION values
 *  confidence      {number}  — 0-100 confidence in the recommendation
 *  reasoning       {string}  — human-readable explanation from the AI
 *  flags           {string[]} — list of short flag strings ("OCR Mismatch", "Low SSIM")
 */
export function RecommendationCard({
  recommendation,
  confidence,
  reasoning,
  flags = [],
}) {
  const cfg = DECISION_CONFIG[recommendation] ?? {
    icon: "lightbulb",
    title: recommendation ?? "AI Recommendation",
    color: "text-primary",
    bg: "bg-primary/5",
    border: "border-primary/20",
    badge: "bg-primary/10 text-primary",
  };

  return (
    <div className={`rounded-xl border ${cfg.border} ${cfg.bg} p-card-padding shadow-sm`}>
      <div className="flex items-start gap-3 mb-3">
        <span className={`material-symbols-outlined text-3xl ${cfg.color} flex-shrink-0`}>
          {cfg.icon}
        </span>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className={`font-headline-sm text-headline-sm ${cfg.color}`}>{cfg.title}</h3>
            {confidence !== undefined && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.badge}`}>
                {Math.round(confidence)}% confidence
              </span>
            )}
          </div>
          {reasoning && (
            <p className="text-body-sm text-on-surface-variant mt-1 leading-relaxed">{reasoning}</p>
          )}
        </div>
      </div>

      {flags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {flags.map((flag) => (
            <span
              key={flag}
              className="flex items-center gap-1 px-2.5 py-0.5 bg-white/70 border border-outline-variant rounded-full text-[11px] font-medium text-on-surface-variant"
            >
              <span className="material-symbols-outlined text-[14px] text-amber-500">warning</span>
              {flag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
