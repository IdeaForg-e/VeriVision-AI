// FraudScore.jsx — Circular gauge displaying the AI fraud risk score (0-100)
import { formatFraudScore } from "../../utils/formatScore.js";

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
export default function FraudScore({ score = 0, showLabel = true, size = "md" }) {
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