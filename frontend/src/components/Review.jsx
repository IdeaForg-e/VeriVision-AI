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
      <span className="font-label-caps uppercase text-xs">
        Confidence: {confidencePct}% — {confidencePct < 50 ? "below auto-decide threshold" : "review recommended"}
      </span>
    </div>
  );
}

export function CaseVelocity({ targetMinutes, elapsedMinutes }) {
  const remaining = Math.max(targetMinutes - elapsedMinutes, 0);
  const pct = Math.min((elapsedMinutes / targetMinutes) * 100, 100);
  return (
    <div className="cyber-card bg-[#0f172a]/55 border-slate-800 p-6 shadow-lg">
      <div className="flex justify-between items-center mb-2">
        <span className="font-label-caps text-slate-400 uppercase">Case Velocity</span>
        <span className="font-tech-code text-body-sm text-cyan-400">{remaining.toFixed(1)}m left</span>
      </div>
      <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
        <div
          className={`h-full ${pct >= 100 ? "bg-red-500" : "bg-cyan-500"} transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-body-sm text-slate-400 italic mt-3">
        Target resolution time: &lt; {targetMinutes} minutes per triage.
      </p>
    </div>
  );
}

export function CaseStatusTracker({ status }) {
  let activeIndex = STEPS.findIndex((s) => s.key === status);
  if (status === "completed" || status === "approved" || status === "rejected") {
    activeIndex = 3; // Highlight 'Final Decision' milestone when case is complete
  }

  return (
    <div className="mt-8 cyber-card bg-[#0f172a]/55 border-slate-800 p-6 shadow-lg">
      <div className="flex flex-col md:flex-row items-center justify-between gap-8 px-4">
        {STEPS.map((step, i) => {
          const isActive = i === activeIndex;
          const isDone = i < activeIndex;
          return (
            <div
              key={step.key}
              className={`flex flex-col items-center gap-3 relative flex-1 ${!isActive && !isDone ? "opacity-40" : ""}`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center z-10 border ${isActive || isDone
                    ? "bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.3)] border-transparent"
                    : "bg-slate-900 text-slate-400 border-slate-800"
                  }`}
              >
                <span className="material-symbols-outlined text-[20px]">{step.icon}</span>
              </div>
              <span className={`text-body-sm font-semibold ${isActive ? "text-cyan-400" : "text-slate-400"}`}>
                {step.label}
              </span>
              {i < STEPS.length - 1 && (
                <div className="absolute left-1/2 top-5 w-full h-[2px] bg-slate-850 hidden md:block" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ==========================================

export function EvidencePanel({ caseData, region, onRegionChange, onRegionCommit, learningStatus }) {
  if (!caseData) return null;

  return (
    <div className="lg:col-span-8 cyber-card bg-[#0f172a]/55 border-slate-800 p-card-padding flex flex-col gap-6 shadow-lg">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <h2 className="font-headline-sm text-headline-sm flex items-center gap-2 text-slate-100">
          <span className="material-symbols-outlined text-cyan-400">analytics</span>
          Evidence Analysis
        </h2>
        <span className="font-tech-code text-cyan-400 text-body-sm bg-slate-900 px-2 py-1 rounded border border-slate-800">
          IMAGE_HASH: {caseData.imageHash}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">        {/* Golden Reference */}
        <div className="flex flex-col gap-3">
          <span className="font-label-caps text-slate-400 uppercase">Golden Reference (OEM Standard)</span>
          <div className="relative aspect-square bg-slate-950 border border-slate-850 rounded-lg overflow-hidden group p-2">
            <img
              className="w-full h-full object-contain"
              alt="Golden reference part"
              src={caseData.goldenImageUrl}
            />
            <div className="absolute inset-0 bg-cyan-500/5 pointer-events-none" />
            <div className="absolute bottom-2 left-2 bg-[#090d16]/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold border border-slate-800 text-slate-350 tracking-wider uppercase">
              Source: Master_DB
            </div>
          </div>
        </div>

        {/* Defective / Uploaded */}
        <div className="flex flex-col gap-3">
          <span className="font-label-caps text-slate-400 uppercase">
            Defective / Uploaded (Review Required)
          </span>
          <div className="relative aspect-square bg-slate-950 border border-slate-850 rounded-lg overflow-hidden select-none p-2">
            <img
              className="w-full h-full object-contain absolute inset-0 p-2"
              alt="Uploaded part under review"
              src={caseData.uploadedImageUrl}
            />
          </div>
        </div>
      </div>

      <div className={`p-4 rounded-lg flex flex-col md:flex-row items-start md:items-center justify-between border-l-4 transition-all duration-300 ${
        learningStatus === 'learning' ? 'bg-cyan-900/20 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]' :
        learningStatus === 'success' ? 'bg-emerald-900/20 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]' :
        'bg-[#090d16]/60 border-cyan-500 border border-slate-850/50'
      }`}>
        <div className="flex gap-3 items-start">
          <span className={`material-symbols-outlined mt-0.5 ${
            learningStatus === 'success' ? 'text-emerald-400' : 'text-cyan-400'
          }`}>
            {learningStatus === 'success' ? 'check_circle' : 'info'}
          </span>
          <p className="text-body-sm text-slate-400 leading-relaxed">
            Drag or resize the box if the AI's highlighted region is off. Your correction is saved as a training
            example for the <span className="font-tech-code text-cyan-400">{caseData.neuralModel}</span> neural model.
          </p>
        </div>
        {learningStatus === 'learning' && (
          <div className="flex items-center gap-2 text-cyan-400 text-sm font-bold animate-pulse whitespace-nowrap mt-3 md:mt-0 ml-0 md:ml-4">
            <span className="material-symbols-outlined animate-spin">sync</span>
            Ingesting correction...
          </div>
        )}
        {learningStatus === 'success' && (
          <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold whitespace-nowrap mt-3 md:mt-0 ml-0 md:ml-4">
            Model Updated ✨
          </div>
        )}
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
    className: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-[0_0_12px_rgba(16,185,129,0.15)]",
  },
  {
    key: "rejected",
    label: "Reject Case",
    icon: "cancel",
    className: "bg-red-600 hover:bg-red-700 text-white shadow-[0_0_12px_rgba(239,68,68,0.15)]",
  },
  {
    key: "needs_more_evidence",
    label: "Needs More Evidence",
    icon: "hourglass_empty",
    className: "bg-slate-800 text-slate-350 hover:bg-slate-700 border border-slate-750",
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
      <label className="font-label-caps text-slate-400 uppercase">Decision Rationale &amp; Notes</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-40 rounded-lg p-4 transition-all resize-none text-body-md cyber-input"
        placeholder="Add your review notes here..."
      />
    </div>
  );
}

// ==========================================

export function ROIEditor({ region, onChange, onCommit, learningStatus, label = "AI_PREDICTION_REGION" }) {
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
        className={`absolute border-2 border-dashed shadow-lg z-10 cursor-move transition-all duration-300 ${
          learningStatus === 'learning'
            ? 'border-cyan-300 bg-cyan-400/30 ring-4 ring-cyan-400 animate-pulse'
            : learningStatus === 'success'
            ? 'border-emerald-400 bg-emerald-400/20 ring-2 ring-emerald-400'
            : `border-cyan-400 bg-cyan-400/10 ${active ? "ring-2 ring-cyan-400" : ""}`
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
        <div className="absolute -top-6 left-0 bg-cyan-500 text-slate-950 text-[10px] px-2 py-0.5 rounded-sm font-bold whitespace-nowrap shadow-md">
          {label}
        </div>
        <div
          data-resizer="true"
          onMouseDown={startResize}
          onTouchStart={startResize}
          className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-cyan-500 rounded-full border-2 border-slate-950 cursor-se-resize shadow"
        />
      </div>
    </div>
  );
}
