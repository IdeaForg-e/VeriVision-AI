// DetectorMetrics.jsx — Displays per-detector scores from the AI pipeline
import { formatScore } from "../../utils/formatScore.js";

/**
 * Props:
 *  metrics  {Array<{name, score, unit, icon, description}>}
 *           score is 0-1 (SSIM, keypoint) or 0-100 (fraud score %)
 *           unit  optional — e.g. "%" or "" (defaults to showing raw score)
 */
export default function DetectorMetrics({ metrics = [] }) {
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