import { confidenceTone, toneClasses } from "../../utils/statusColor.js";

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
              className={`flex flex-col items-center gap-3 relative flex-1 ${
                !isActive && !isDone ? "opacity-50" : ""
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center z-10 border ${
                  isActive || isDone
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
