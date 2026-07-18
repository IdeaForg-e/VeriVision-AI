// Consolidated components for feedback
import { useState } from "react";

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

// ==========================================

export function OCRThreshold({ value, onChange }) {
  const isStrict = Number(value) === 100;

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <label className="font-body-md font-semibold text-on-surface">OCR Character Fuzzy Match</label>
        <span
          className={`font-tech-code px-2 py-0.5 rounded ${
            isStrict ? "text-error bg-error-container" : "text-primary bg-primary-fixed"
          }`}
        >
          {isStrict ? "Strict (100%)" : `Fuzzy (${value}%)`}
        </span>
      </div>
      <input
        type="range"
        className="w-full"
        min={80}
        max={100}
        step={5}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
      />
      <p className="font-body-sm text-on-surface-variant italic">
        Strict match level — defines the tolerance for character substitution in serial number extraction.
      </p>
    </div>
  );
}

// ==========================================


export function PerceptionThresholds({ thresholds, onChange }) {
  return (
    <div className="col-span-12 lg:col-span-7 space-y-stack-gap">
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-card-padding shadow-sm h-full">
        <div className="flex items-center gap-3 mb-6">
          <span className="material-symbols-outlined text-primary">analytics</span>
          <h2 className="font-headline-md text-headline-md">Perception Engine Thresholds</h2>
        </div>
        <div className="space-y-8">
          <ThresholdSlider
            label="Aligned Structural Similarity (SSIM)"
            value={thresholds.ssim}
            min={0}
            max={1}
            step={0.01}
            formatValue={(v) => `Min Score: ${v}`}
            description="Flags a hotspot if structural similarity drops below this normalized coefficient."
            onChange={(v) => onChange("ssim", v)}
          />
          <ThresholdSlider
            label="Keypoint (ORB/SIFT) Matching Strictness"
            value={thresholds.keypointDeltaPct}
            min={0}
            max={50}
            step={1}
            formatValue={(v) => `Max Delta: ${v}%`}
            description="Geometric deviation above this percentage triggers a transformation mismatch alert."
            onChange={(v) => onChange("keypointDeltaPct", v)}
          />
          <OCRThreshold value={thresholds.ocrFuzzyPct} onChange={(v) => onChange("ocrFuzzyPct", v)} />
        </div>
      </div>
    </div>
  );
}

export function BusinessPolicyRouting({ rules, onAddRule }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleAdd = () => {
    if (!name.trim() || !description.trim()) return;
    onAddRule({ id: `RULE-${Math.floor(Math.random() * 900 + 100)}`, name, description });
    setName("");
    setDescription("");
    setAdding(false);
  };

  return (
    <div className="col-span-12 lg:col-span-5 space-y-stack-gap">
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-card-padding shadow-sm h-full">
        <div className="flex items-center gap-3 mb-6">
          <span className="material-symbols-outlined text-primary">rule</span>
          <h2 className="font-headline-md text-headline-md">Business Policy Routing</h2>
        </div>
        <div className="space-y-4">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="border border-outline-variant rounded-lg p-4 hover:border-primary transition-colors group"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="font-tech-code text-primary text-body-md font-bold">{rule.id}</span>
                <span className="material-symbols-outlined text-outline group-hover:text-primary">arrow_forward</span>
              </div>
              <h3 className="font-body-md font-bold text-on-surface mb-1">{rule.name}</h3>
              <p className="font-body-sm text-on-surface-variant">{rule.description}</p>
            </div>
          ))}

          {adding ? (
            <div className="border border-primary rounded-lg p-4 space-y-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Rule name"
                className="w-full rounded border border-outline-variant px-3 py-2 text-body-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="If [condition] → [routing action]"
                className="w-full rounded border border-outline-variant px-3 py-2 text-body-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                rows={2}
              />
              <div className="flex gap-2 justify-end">
                <button onClick={() => setAdding(false)} className="text-body-sm text-on-surface-variant px-3 py-1">
                  Cancel
                </button>
                <button onClick={handleAdd} className="text-body-sm text-white bg-primary px-3 py-1 rounded">
                  Add Rule
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="w-full py-3 border-2 border-dashed border-outline-variant rounded-lg text-on-surface-variant font-body-md hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">add_circle</span>
              Define New Routing Rule
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ==========================================

export function SavePipelineButton({ state, onSave }) {
  const isSaving = state === "saving";
  const isSaved = state === "saved";
  const isError = state === "error";

  const className = isSaved
    ? "bg-green-600 text-white"
    : isError
    ? "bg-error text-white"
    : "bg-primary-container text-on-primary-container hover:opacity-90";

  return (
    <button
      onClick={onSave}
      disabled={isSaving}
      className={`px-6 py-3 rounded-lg font-headline-sm text-[16px] active:scale-95 transition-all flex items-center gap-2 shadow-sm disabled:cursor-wait ${className}`}
    >
      <span className="material-symbols-outlined">
        {isSaving ? "sync" : isSaved ? "check_circle" : isError ? "error" : "save"}
      </span>
      {isSaving ? "Saving..." : isSaved ? "Settings Applied" : isError ? "Save Failed — Retry" : "Save Adjustments"}
    </button>
  );
}

// ==========================================

/**
 * Reusable labeled slider. Handles any numeric threshold: pass min/max/step
 * and a formatValue() to control the badge text (e.g. "Min Score: 0.85" or
 * "Max Delta: 15%").
 */
export function ThresholdSlider({ label, value, min, max, step, formatValue, description, onChange }) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <label className="font-body-md font-semibold text-on-surface">{label}</label>
        <span className="font-tech-code text-primary bg-primary-fixed px-2 py-0.5 rounded">
          {formatValue(value)}
        </span>
      </div>
      <input
        type="range"
        className="w-full"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
      <p className="font-body-sm text-on-surface-variant italic">{description}</p>
    </div>
  );
}
