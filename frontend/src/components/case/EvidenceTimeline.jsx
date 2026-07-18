// EvidenceTimeline.jsx — Chronological log of events for a case (status changes, comments, decisions)
import { formatDateTime } from "../../utils/formatDate.js";

const EVENT_CONFIG = {
  created:          { icon: "add_circle",       color: "text-primary",        bg: "bg-primary/10" },
  retake_requested: { icon: "history",           color: "text-amber-600",      bg: "bg-amber-50" },
  resubmitted:      { icon: "publish",           color: "text-blue-600",       bg: "bg-blue-50" },
  reviewed:         { icon: "rate_review",       color: "text-primary",        bg: "bg-primary/10" },
  approved:         { icon: "check_circle",      color: "text-green-600",      bg: "bg-green-50" },
  rejected:         { icon: "cancel",            color: "text-red-600",        bg: "bg-red-50" },
  needs_evidence:   { icon: "radio_button_checked", color: "text-amber-600",   bg: "bg-amber-50" },
  final_decision:   { icon: "fact_check",        color: "text-green-700",      bg: "bg-green-50" },
  comment:          { icon: "chat",              color: "text-on-surface-variant", bg: "bg-surface-container" },
};

function getConfig(type) {
  return EVENT_CONFIG[type] ?? { icon: "circle", color: "text-on-surface-variant", bg: "bg-surface-container" };
}

/**
 * Props:
 *  events {Array<{id, type, label, description, user, timestamp}>}
 */
export default function EvidenceTimeline({ events = [] }) {
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