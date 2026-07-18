import { useState } from "react";
import ThresholdSlider from "./ThresholdSlider.jsx";
import OCRThreshold from "./OCRThreshold.jsx";

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
