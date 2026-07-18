import {
  ClipboardCheck,
  Clock3,
  ShieldAlert,
  BrainCircuit,
  TrendingUp,
} from "lucide-react";

/**
 * Props:
 *  cases {Array} — the raw cases array from DailyTriagePage state.
 *                  We derive the stats from it so the component is self-contained
 *                  and doesn't require the parent to compute them separately.
 *
 * Previously this component expected a `stats` object prop but was called with
 * a `cases` array, causing all values to render as 0/undefined.
 */
export default function StatsCards({ cases = [] }) {
  // Derive stats from the cases array
  const totalInspected = cases.length;
  const pendingQA = cases.filter((c) => c.status === "PENDING QA").length;
  const quarantined = cases.filter((c) => c.status === "QUARANTINE").length;
  const autoApproved = cases.filter((c) => c.status === "AUTO-APPROVED").length;
  const quarantineRate = totalInspected > 0 ? Math.round((quarantined / totalInspected) * 100) : 0;
  const autopilotIndex = totalInspected > 0 ? Math.round((autoApproved / totalInspected) * 100) : 0;

  const cards = [
    {
      title: "TOTAL INSPECTED",
      value: totalInspected,
      icon: ClipboardCheck,
      color: "text-blue-600",
      progress: Math.min(totalInspected * 2, 100), // illustrative bar
      footer: null,
    },
    {
      title: "PENDING QA",
      value: pendingQA,
      icon: Clock3,
      color: "text-green-600",
      progress: null,
      footer: pendingQA > 0 ? `${pendingQA} awaiting review` : "All clear",
    },
    {
      title: "QUARANTINE RATE",
      value: `${quarantineRate}%`,
      icon: ShieldAlert,
      color: "text-red-500",
      progress: null,
      footer: "+0.8% from yesterday",
      trend: quarantineRate > 0,
    },
    {
      title: "AUTOPILOT INDEX",
      value: `${autopilotIndex}%`,
      icon: BrainCircuit,
      color: "text-yellow-500",
      progress: null,
      footer: "LLM-VISION CONFIDENCE",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
      {cards.map((card, index) => {
        const Icon = card.icon;

        return (
          <div
            key={index}
            className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all duration-200"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase">
                  {card.title}
                </p>

                <h2 className={`text-4xl font-bold mt-2 ${card.color}`}>
                  {card.value}
                </h2>
              </div>

              <Icon className={`${card.color}`} size={26} />
            </div>

            {card.progress !== null && (
              <div className="mt-5">
                <div className="w-full h-2 bg-gray-200 rounded-full">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${card.progress}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {card.footer && (
              <div
                className={`flex items-center gap-2 mt-4 text-xs uppercase tracking-wide ${
                  card.trend ? "text-red-500" : "text-gray-500"
                }`}
              >
                {card.trend && <TrendingUp size={14} />}

                <span>{card.footer}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}