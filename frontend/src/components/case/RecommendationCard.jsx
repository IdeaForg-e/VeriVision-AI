// RecommendationCard.jsx — AI-generated next-step recommendation for a case
import { REVIEW_DECISION } from "../../utils/constants.js";

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
export default function RecommendationCard({
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