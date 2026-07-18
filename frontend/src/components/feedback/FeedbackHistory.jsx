const PRIVACY_ITEMS = [
  { key: "storeImageHashOnly", icon: "fingerprint", label: "Store image hash only" },
  { key: "redactPersonalMarkings", icon: "visibility_off", label: "Redact personal markings" },
  { key: "verdictChangeAuditLog", icon: "history_edu", label: "Verdict change audit log" },
];

function Toggle({ checked, onChange }) {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" className="sr-only peer" checked={checked} onChange={onChange} />
      <div className="w-11 h-6 bg-outline-variant peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
    </label>
  );
}

export function PrivacySecurity({ privacy, onToggle }) {
  return (
    <div className="col-span-12 md:col-span-6 space-y-stack-gap">
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-card-padding shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <span className="material-symbols-outlined text-primary">security</span>
          <h2 className="font-headline-md text-headline-md">Privacy &amp; Security</h2>
        </div>
        <div className="space-y-4">
          {PRIVACY_ITEMS.map((item) => (
            <div key={item.key} className="flex items-center justify-between p-3 bg-surface rounded-lg">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-outline">{item.icon}</span>
                <span className="font-body-md text-on-surface">{item.label}</span>
              </div>
              <Toggle checked={privacy[item.key]} onChange={() => onToggle(item.key)} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function KnownLimitations() {
  return (
    <div className="bg-surface-container-high p-4 rounded-lg border-l-4 border-primary mb-6">
      <div className="flex gap-3">
        <span className="material-symbols-outlined text-primary text-[20px]">info</span>
        <p className="font-body-sm text-on-surface-variant">
          <span className="font-bold text-on-surface block mb-1">Current Limitation:</span>
          Cannot detect chemical, firmware, or electrical-level fraud — visual inspection only. Verification relies
          strictly on external mechanical and cosmetic indicators.
        </p>
      </div>
    </div>
  );
}

function formatWhen(iso) {
  const date = new Date(iso);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function AdjustmentHistory({ history }) {
  return (
    <div className="col-span-12 md:col-span-6 space-y-stack-gap">
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-card-padding shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <span className="material-symbols-outlined text-primary">map</span>
          <h2 className="font-headline-md text-headline-md">Known Limitations &amp; History</h2>
        </div>

        <KnownLimitations />

        <h4 className="font-label-caps text-label-caps text-outline mb-2">RECENT ADJUSTMENTS</h4>
        <ul className="space-y-2">
          {history.map((h) => (
            <li key={h.id} className="flex items-center gap-2 font-body-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
              <span className="text-on-surface-variant">
                {h.summary} <span className="text-outline">— {h.user}, {formatWhen(h.changedAt)}</span>
              </span>
            </li>
          ))}
          {history.length === 0 && <li className="text-on-surface-variant italic">No adjustments logged yet.</li>}
        </ul>
      </div>
    </div>
  );
}
