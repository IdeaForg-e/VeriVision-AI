import { confidenceTone, toneClasses } from "../utils/statusColor.js";
import { useCallback, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock, XCircle, Info, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "./Common.jsx";

const STEPS = [
  { key: "needs_evidence", label: "Needs Evidence" },
  { key: "retake_requested", label: "Retake Requested" },
  { key: "resubmitted", label: "Re-submitted" },
  { key: "final_decision", label: "Final Decision" },
];

export function ConfidenceBadge({ confidencePct }) {
  const tone = confidenceTone(confidencePct);
  return (
    <div className={`px-3 py-1.5 rounded-md border flex items-center gap-2 text-xs font-semibold ${toneClasses(tone)}`}>
      <AlertTriangle size={15} />
      <span className="font-mono uppercase">
        AI Confidence: {confidencePct}% — {confidencePct < 50 ? "Below Threshold (Review Required)" : "Human Verification Recommended"}
      </span>
    </div>
  );
}

export function CaseVelocity({ targetMinutes, elapsedMinutes }) {
  const remaining = Math.max(targetMinutes - elapsedMinutes, 0);
  const pct = Math.min((elapsedMinutes / targetMinutes) * 100, 100);
  return (
    <div className="lab-card p-4">
      <div className="flex justify-between items-center mb-1.5 text-xs font-mono">
        <span className="font-bold text-slate-500 uppercase">Audit SLA Velocity</span>
        <span className="text-sky-600 dark:text-sky-400 font-bold">{remaining.toFixed(1)}m remaining</span>
      </div>
      <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${pct >= 100 ? "bg-rose-500" : "bg-sky-500"} transition-all duration-300`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[10px] text-slate-500 mt-2 font-mono">
        Target SLA resolution: &lt; {targetMinutes} minutes per inspection case.
      </p>
    </div>
  );
}

export function CaseStatusTracker({ status }) {
  let activeIndex = STEPS.findIndex((s) => s.key === status);
  if (status === "completed" || status === "approved" || status === "rejected") {
    activeIndex = 3;
  }

  return (
    <div className="lab-card p-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {STEPS.map((step, i) => {
          const isActive = i === activeIndex;
          const isDone = i < activeIndex;
          return (
            <div
              key={step.key}
              className={`flex items-center gap-2 flex-1 ${!isActive && !isDone ? "opacity-40" : ""}`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono border ${
                  isActive || isDone
                    ? "bg-sky-600 text-white border-sky-500"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700"
                }`}
              >
                {i + 1}
              </div>
              <span className={`text-xs font-semibold ${isActive ? "text-sky-600 dark:text-sky-400 font-bold" : "text-slate-600 dark:text-slate-400"}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function EvidencePanel({ caseData, learningStatus }) {
  if (!caseData) return null;

  return (
    <div className="lab-card p-4 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
          <Sparkles size={14} className="text-sky-500" /> Evidence Image Comparison
        </h2>
        <span className="font-mono text-[10px] text-slate-500">HASH: {caseData.imageHash || "N/A"}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Golden Reference */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            OEM Golden Reference Standard
          </span>
          <div className="relative aspect-square bg-slate-950 rounded-lg overflow-hidden border border-slate-800 p-2 flex items-center justify-center">
            <img className="w-full h-full object-contain" alt="Golden reference" src={caseData.goldenImageUrl} />
          </div>
        </div>

        {/* Uploaded / Inspection Scan */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Target Unit Under Inspection
          </span>
          <div className="relative aspect-square bg-slate-950 rounded-lg overflow-hidden border border-slate-800 p-2 flex items-center justify-center">
            <img className="w-full h-full object-contain" alt="Uploaded target scan" src={caseData.uploadedImageUrl} />
          </div>
        </div>
      </div>

      <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
        <div className="flex gap-2 items-center text-slate-600 dark:text-slate-400">
          <Info size={15} className="text-sky-500 shrink-0" />
          <span>
            Adjust highlighted regions if AI prediction is misaligned. Neural model:{" "}
            <span className="font-mono text-sky-600 dark:text-sky-400 font-bold">{caseData.neuralModel || "ResNet-50"}</span>
          </span>
        </div>
        {learningStatus === "learning" && (
          <span className="text-sky-500 text-xs font-bold font-mono animate-pulse flex items-center gap-1">
            <RefreshCw size={13} className="animate-spin" /> Ingesting…
          </span>
        )}
      </div>
    </div>
  );
}

const DECISIONS = [
  {
    key: "approved",
    label: "Approve Inspection",
    icon: CheckCircle2,
    variant: "success",
  },
  {
    key: "rejected",
    label: "Quarantine / Reject",
    icon: XCircle,
    variant: "danger",
  },
  {
    key: "needs_more_evidence",
    label: "Request Retake Scan",
    icon: Clock,
    variant: "outline",
  },
];

export function ReviewDecision({ onDecide, pending, lastResult }) {
  return (
    <div className="flex flex-col gap-2 pt-1">
      {DECISIONS.map((d) => {
        const Icon = d.icon;
        const isPending = pending === d.key;
        const justConfirmed = !pending && lastResult?.decision === d.key;

        return (
          <Button
            key={d.key}
            variant={d.variant}
            size="md"
            disabled={Boolean(pending)}
            onClick={() => onDecide(d.key)}
            loading={isPending}
            icon={<Icon size={16} />}
            className="w-full justify-center"
          >
            {justConfirmed ? "Decision Confirmed" : d.label}
          </Button>
        );
      })}
    </div>
  );
}

export function ReviewerComment({ value, onChange }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
        Inspector Audit Notes & Justification
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-32 p-3 text-xs lab-input resize-none font-sans"
        placeholder="Enter audit rationale for decision log..."
      />
    </div>
  );
}

export function ROIEditor({ region, onChange, onCommit, learningStatus, label = "AI_DETECTION_ROI" }) {
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
        className={`absolute border-2 border-dashed shadow-md z-10 cursor-move transition-all ${
          learningStatus === "learning"
            ? "border-sky-400 bg-sky-500/20 ring-2 ring-sky-400 animate-pulse"
            : "border-sky-500 bg-sky-500/10"
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
        <div className="absolute -top-5 left-0 bg-sky-600 text-white text-[9px] px-1.5 py-0.5 rounded font-mono font-bold whitespace-nowrap">
          {label}
        </div>
        <div
          data-resizer="true"
          onMouseDown={startResize}
          onTouchStart={startResize}
          className="absolute -bottom-1 -right-1 w-3 h-3 bg-sky-600 rounded-full border border-white cursor-se-resize"
        />
      </div>
    </div>
  );
}
