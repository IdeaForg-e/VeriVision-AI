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

export default function ReviewDecision({ onDecide, pending, lastResult }) {
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
