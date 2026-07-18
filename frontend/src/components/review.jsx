// Consolidated components for review
import { confidenceTone, toneClasses } from "../utils/statusColor.js";
import { useCallback, useRef, useState } from "react";


const STEPS = [
  { key: "needs_evidence", label: "Needs Evidence", icon: "radio_button_checked" },
  { key: "retake_requested", label: "Retake Requested", icon: "history" },
  { key: "resubmitted", label: "Re-submitted", icon: "publish" },
  { key: "final_decision", label: "Final Decision", icon: "fact_check" },
];

export function ConfidenceBadge({ confidencePct }) {
  const tone = confidenceTone(confidencePct);
  return (
    <div className={`px-4 py-2 rounded-full border flex items-center gap-2 shadow-sm font-medium ${toneClasses(tone)}`}>
      <span className="material-symbols-outlined text-[20px]">warning</span>
      <span className="font-label-caps uppercase">
        Confidence: {confidencePct}% — {confidencePct < 50 ? "below auto-decide threshold" : "review recommended"}
      </span>
    </div>
  );
}

export function CaseVelocity({ targetMinutes, elapsedMinutes }) {
  const remaining = Math.max(targetMinutes - elapsedMinutes, 0);
  const pct = Math.min((elapsedMinutes / targetMinutes) * 100, 100);
  return (
    <div className="bg-white border border-outline-variant rounded-xl p-6 shadow-sm">
      <div className="flex justify-between items-center mb-2">
        <span className="font-label-caps text-on-surface-variant uppercase">Case Velocity</span>
        <span className="font-tech-code text-body-sm text-primary">{remaining.toFixed(1)}m left</span>
      </div>
      <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
        <div
          className={`h-full ${pct >= 100 ? "bg-error" : "bg-primary"} transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-body-sm text-on-surface-variant italic mt-3">
        Target resolution time: &lt; {targetMinutes} minutes per triage.
      </p>
    </div>
  );
}

export function CaseStatusTracker({ status }) {
  const activeIndex = STEPS.findIndex((s) => s.key === status);

  return (
    <div className="mt-8 bg-white border border-outline-variant rounded-xl p-6 shadow-sm">
      <div className="flex flex-col md:flex-row items-center justify-between gap-8 px-4">
        {STEPS.map((step, i) => {
          const isActive = i === activeIndex;
          const isDone = i < activeIndex;
          return (
            <div
              key={step.key}
              className={`flex flex-col items-center gap-3 relative flex-1 ${!isActive && !isDone ? "opacity-50" : ""
                }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center z-10 border ${isActive || isDone
                    ? "bg-primary text-white shadow-md border-transparent"
                    : "bg-surface-container text-on-surface-variant border-outline-variant"
                  }`}
              >
                <span className="material-symbols-outlined">{step.icon}</span>
              </div>
              <span className={`text-body-sm ${isActive ? "font-bold text-primary" : "font-medium text-on-surface-variant"}`}>
                {step.label}
              </span>
              {i < STEPS.length - 1 && (
                <div className="absolute left-1/2 top-5 w-full h-[2px] bg-primary/20 hidden md:block" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ==========================================


export function EvidencePanel({ caseData, region, onRegionChange, onRegionCommit }) {
  if (!caseData) return null;

  return (
    <div className="lg:col-span-8 bg-white border border-outline-variant rounded-xl shadow-sm p-card-padding flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="font-headline-sm text-headline-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">analytics</span>
          Evidence Analysis
        </h2>
        <span className="font-tech-code text-on-surface-variant text-body-sm bg-surface-container-low px-2 py-1 rounded">
          IMAGE_HASH: {caseData.imageHash}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Golden Reference */}
        <div className="flex flex-col gap-3">
          <span className="font-label-caps text-on-surface-variant uppercase">Golden Reference (OEM Standard)</span>
          <div className="relative aspect-square bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden group">
            <img
              className="w-full h-full object-cover grayscale opacity-80"
              alt="Golden reference part"
              src={caseData.goldenImageUrl}
            />
            <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
            <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold border border-outline-variant tracking-wider uppercase">
              Source: Master_DB
            </div>
          </div>
        </div>

        {/* Defective / Uploaded */}
        <div className="flex flex-col gap-3">
          <span className="font-label-caps text-on-surface-variant uppercase">
            Defective / Uploaded (Review Required)
          </span>
          <div className="relative aspect-square bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden select-none">
            <img
              className="w-full h-full object-cover absolute inset-0"
              alt="Uploaded part under review"
              src={caseData.uploadedImageUrl}
            />
            <ROIEditor region={region} onChange={onRegionChange} onCommit={onRegionCommit} />
          </div>
        </div>
      </div>

      <div className="bg-surface-container-low p-4 rounded-lg flex gap-3 items-start border-l-4 border-primary">
        <span className="material-symbols-outlined text-primary mt-0.5">info</span>
        <p className="text-body-sm text-on-surface-variant leading-relaxed">
          Drag or resize the box if the AI's highlighted region is off. Your correction is saved as a training
          example for the <span className="font-tech-code text-primary">{caseData.neuralModel}</span> neural model.
        </p>
      </div>
    </div>
  );
}

// ==========================================

const DECISIONS = [
  {
    key: "approved",
    label: "Approve Case",
    icon: "check_circle",
    className: "bg-[#10b981] hover:bg-[#059669] text-white",
  },
  {
    key: "rejected",
    label: "Reject Case",
    icon: "cancel",
    className: "bg-error hover:bg-[#991b1b] text-white",
  },
  {
    key: "needs_more_evidence",
    label: "Needs More Evidence",
    icon: "hourglass_empty",
    className: "bg-tertiary-fixed text-on-tertiary-fixed hover:bg-[#e8c8f5] border border-[#d1a8e8]",
  },
];

export function ReviewDecision({ onDecide, pending, lastResult }) {
  return (
    <div className="flex flex-col gap-3 pt-2">
      {DECISIONS.map((d) => {
        const isPending = pending === d.key;
        const justConfirmed = !pending && lastResult?.decision === d.key;
        return (
          <button
            key={d.key}
            disabled={Boolean(pending)}
            onClick={() => onDecide(d.key)}
            className={`w-full py-3 rounded-lg flex items-center justify-center gap-2 font-bold transition-all active:scale-[0.98] shadow-sm disabled:opacity-60 disabled:cursor-not-allowed ${d.className}`}
          >
            {isPending ? (
              <>
                <span className="material-symbols-outlined animate-spin">sync</span>
                Processing...
              </>
            ) : justConfirmed ? (
              <>
                <span className="material-symbols-outlined">done</span>
                Confirmed
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">{d.icon}</span>
                {d.label}
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ==========================================

export function ReviewerComment({ value, onChange }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="font-label-caps text-on-surface-variant uppercase">Decision Rationale &amp; Notes</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-40 rounded-lg border border-outline-variant focus:ring-2 focus:ring-primary/20 focus:border-primary text-body-md p-4 transition-all resize-none bg-surface-container-lowest"
        placeholder="Add your review notes here..."
      />
    </div>
  );
}

// ==========================================


/**
 * Draggable + resizable "AI prediction region" box, rendered over an image.
 * Region is stored/reported in percentages of the container so it stays
 * correct at any image size (the static Stitch export used raw pixels,
 * which breaks on resize — this version is layout-safe).
 *
 * Props:
 *  - region: { x, y, w, h } in % (0-100)
 *  - onChange(region): called continuously while dragging/resizing
 *  - onCommit(region): called once on mouse/touch up (good place to hit the API)
 *  - label: badge text, defaults to "AI_PREDICTION_REGION"
 */
export function ROIEditor({ region, onChange, onCommit, label = "AI_PREDICTION_REGION" }) {
  const containerRef = useRef(null);
  const dragState = useRef(null);
  const [active, setActive] = useState(false);

  const clamp = (val, min, max) => Math.max(min, Math.min(val, max));

  const getPoint = (e) => {
    if (e.touches && e.touches[0]) return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
    return { clientX: e.clientX, clientY: e.clientY };
  };

  const startDrag = useCallback(
    (e) => {
      if (e.target.dataset?.resizer) return;
      const { clientX, clientY } = getPoint(e);
      dragState.current = { mode: "move", startX: clientX, startY: clientY, startRegion: region };
      setActive(true);
    },
    [region]
  );

  const startResize = useCallback(
    (e) => {
      e.stopPropagation();
      const { clientX, clientY } = getPoint(e);
      dragState.current = { mode: "resize", startX: clientX, startY: clientY, startRegion: region };
      setActive(true);
    },
    [region]
  );

  const onMove = useCallback(
    (e) => {
      if (!dragState.current || !containerRef.current) return;
      const { clientX, clientY } = getPoint(e);
      const rect = containerRef.current.getBoundingClientRect();
      const dxPct = ((clientX - dragState.current.startX) / rect.width) * 100;
      const dyPct = ((clientY - dragState.current.startY) / rect.height) * 100;
      const start = dragState.current.startRegion;

      if (dragState.current.mode === "move") {
        const x = clamp(start.x + dxPct, 0, 100 - start.w);
        const y = clamp(start.y + dyPct, 0, 100 - start.h);
        onChange({ ...start, x, y });
      } else {
        const w = clamp(start.w + dxPct, 5, 100 - start.x);
        const h = clamp(start.h + dyPct, 5, 100 - start.y);
        onChange({ ...start, w, h });
      }
    },
    [onChange]
  );

  const endDrag = useCallback(() => {
    if (!dragState.current) return;
    dragState.current = null;
    setActive(false);
    onCommit?.(region);
  }, [onCommit, region]);

  if (!region) return null;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full select-none"
      onMouseMove={onMove}
      onMouseUp={endDrag}
      onMouseLeave={endDrag}
      onTouchMove={onMove}
      onTouchEnd={endDrag}
    >
      <div
        className={`absolute border-2 border-dashed border-primary bg-primary/10 shadow-lg z-10 cursor-move ${active ? "ring-2 ring-primary" : ""
          }`}
        style={{
          left: `${region.x}%`,
          top: `${region.y}%`,
          width: `${region.w}%`,
          height: `${region.h}%`,
        }}
        onMouseDown={startDrag}
        onTouchStart={startDrag}
      >
        <div className="absolute -top-6 left-0 bg-primary text-white text-[10px] px-2 py-0.5 rounded-sm font-bold whitespace-nowrap">
          {label}
        </div>
        <div
          data-resizer="true"
          onMouseDown={startResize}
          onTouchStart={startResize}
          className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-primary rounded-full border-2 border-white cursor-se-resize"
        />
      </div>
    </div>
  );
}
