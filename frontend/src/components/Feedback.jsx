// Consolidated components for pipeline feedback tuning
import { useState, useEffect } from "react";
import { 
  Shield, 
  Key, 
  EyeOff, 
  FileClock, 
  AlertTriangle, 
  CheckCircle2, 
  Sliders, 
  Plus, 
  X, 
  ArrowRight, 
  Settings,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Activity,
  History,
  Lock,
  LockKeyhole,
  UploadCloud,
  Sparkles,
  Image as ImageIcon,
  ChevronDown
} from "lucide-react";
import { createProduct, uploadGoldenReference } from "../services/productService.js";


const PRIVACY_ITEMS = [
  { key: "storeImageHashOnly", icon: Shield, label: "Store image hash only", desc: "Prevents writing raw images to permanent database logs" },
  { key: "redactPersonalMarkings", icon: EyeOff, label: "Redact personal markings", desc: "Filters visual operator IDs and metadata fields" },
  { key: "verdictChangeAuditLog", icon: FileClock, label: "Verdict change audit log", desc: "Enforces signature constraints on decisions overrides" },
];

function Toggle({ checked, onChange }) {
  return (
    <label className="relative inline-flex items-center cursor-pointer select-none">
      <input type="checkbox" className="sr-only peer" checked={checked} onChange={onChange} />
      <div className="w-10 h-5 bg-slate-900 border border-slate-800 rounded-full peer peer-focus:ring-1 peer-focus:ring-cyan-500/20 peer-checked:after:translate-x-full peer-checked:after:border-cyan-400 after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-slate-555 after:border-slate-900 after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-cyan-950/40 peer-checked:border-cyan-500/40 peer-checked:after:bg-cyan-400" />
    </label>
  );
}

export function PrivacySecurity({ privacy, onToggle }) {
  return (
    <div className="col-span-12 md:col-span-6 space-y-4">
      <div className="cyber-card bg-[#0f172a]/55 border border-slate-800/80 p-6 shadow-lg relative overflow-hidden group">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500/25 to-transparent"></div>
        <div className="flex items-center gap-3 mb-6">
          <div className="h-8 w-8 rounded-lg bg-cyan-950/20 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <LockKeyhole size={16} />
          </div>
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-200">Privacy &amp; Security Controls</h2>
        </div>
        <div className="space-y-4">
          {PRIVACY_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.key} className="flex items-center justify-between p-4 bg-[#080e1a]/80 border border-slate-850 rounded-xl hover:border-slate-800 transition duration-200">
                <div className="flex items-center gap-3.5 flex-1 pr-4">
                  <div className="text-slate-500 mt-0.5 shrink-0">
                    <Icon size={18} />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-slate-250 leading-snug">{item.label}</span>
                    <span className="block text-[10px] text-slate-500 mt-0.5 font-semibold leading-normal">{item.desc}</span>
                  </div>
                </div>
                <Toggle checked={privacy[item.key]} onChange={() => onToggle(item.key)} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function KnownLimitations() {
  return (
    <div className="bg-cyan-950/10 p-4 border border-cyan-500/20 border-l-4 border-l-cyan-500 rounded-xl mb-6 relative overflow-hidden">
      <div className="flex gap-3">
        <AlertCircle className="text-cyan-400 shrink-0 mt-0.5" size={16} />
        <div className="text-[11px] leading-relaxed text-slate-400">
          <span className="font-extrabold text-slate-200 block mb-0.5 uppercase tracking-wider text-[10px]">Current Scope Limitation</span>
          Inspection validation relies strictly on optical visual matching. Deep chemical material checks or internal chip firmware authenticity verification are not supported in visual triage logs.
        </div>
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
    <div className="col-span-12 md:col-span-6 space-y-4">
      <div className="cyber-card bg-[#0f172a]/55 border border-slate-800/80 p-6 shadow-lg relative overflow-hidden group">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent"></div>
        <div className="flex items-center gap-3 mb-5">
          <div className="h-8 w-8 rounded-lg bg-cyan-950/20 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <History size={16} />
          </div>
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-200">Limitations &amp; Audit Logs</h2>
        </div>

        <KnownLimitations />

        <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-wider mb-3">RECENT ADJUSTMENTS LOG</h4>
        <ul className="space-y-3 max-h-48 overflow-y-auto pr-1">
          {history.map((h) => (
            <li key={h.id} className="flex gap-2.5 items-start p-2.5 rounded-lg bg-slate-900/40 border border-slate-850/60 hover:border-slate-800 transition">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 shrink-0 mt-1.5" />
              <div className="flex-1 min-w-0">
                <span className="block text-[11px] font-semibold text-slate-350 leading-relaxed">{h.summary}</span>
                <span className="block text-[9px] text-slate-550 font-medium mt-0.5">Changed by {h.user} on {formatWhen(h.changedAt)}</span>
              </div>
            </li>
          ))}
          {history.length === 0 && <li className="text-slate-555 italic text-[11px] py-4 text-center">No calibration logs registered yet.</li>}
        </ul>
      </div>
    </div>
  );
}

export function OCRThreshold({ value, onChange }) {
  const isStrict = Number(value) === 100;
  const percent = ((value - 80) / 20) * 100;

  return (
    <div className="space-y-3.5">
      <div className="flex justify-between items-center">
        <label className="text-xs font-extrabold uppercase tracking-wider text-slate-350">OCR Character Fuzzy Match</label>
        <span
          className={`font-tech-code px-2.5 py-0.5 rounded text-[10px] font-black uppercase border ${
            isStrict 
              ? "text-red-400 bg-red-950/20 border-red-500/20" 
              : "text-cyan-400 bg-cyan-950/20 border-cyan-500/20"
          }`}
        >
          {isStrict ? "Strict (100%)" : `Fuzzy (${value}%)`}
        </span>
      </div>
      <div className="relative flex items-center w-full">
        <input
          type="range"
          className="w-full cursor-pointer bg-transparent focus:outline-none"
          min={80}
          max={100}
          step={5}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value, 10))}
        />
      </div>
      <p className="text-[10px] text-slate-555 leading-relaxed italic">
        Strict match level — defines the tolerance for character substitution in serial number extraction.
      </p>
    </div>
  );
}

export function ThresholdSlider({ label, value, min, max, step, formatValue, description, onChange }) {
  return (
    <div className="space-y-3.5">
      <div className="flex justify-between items-center">
        <label className="text-xs font-extrabold uppercase tracking-wider text-slate-350">{label}</label>
        <span className="font-tech-code text-cyan-400 bg-cyan-950/25 border border-cyan-500/20 px-2.5 py-0.5 rounded text-[10px] font-black uppercase">
          {formatValue(value)}
        </span>
      </div>
      <div className="relative flex items-center w-full">
        <input
          type="range"
          className="w-full cursor-pointer bg-transparent focus:outline-none"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
        />
      </div>
      <p className="text-[10px] text-slate-555 leading-relaxed italic">{description}</p>
    </div>
  );
}

export function PerceptionThresholds({ thresholds, onChange }) {
  return (
    <div className="col-span-12 lg:col-span-7 space-y-4">
      <div className="cyber-card bg-[#0f172a]/55 border border-slate-800/80 p-6 shadow-lg h-full relative overflow-hidden group">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500/25 to-transparent"></div>
        <div className="flex items-center gap-3 mb-6">
          <div className="h-8 w-8 rounded-lg bg-cyan-950/20 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Sliders size={16} />
          </div>
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-200">Perception Engine Thresholds</h2>
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
    <div className="col-span-12 lg:col-span-5 space-y-4">
      <div className="cyber-card bg-[#0f172a]/55 border border-slate-800/80 p-6 shadow-lg h-full relative overflow-hidden group">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500/25 to-transparent"></div>
        <div className="flex items-center gap-3 mb-6">
          <div className="h-8 w-8 rounded-lg bg-cyan-950/20 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Settings size={16} />
          </div>
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-200">Business Policy Routing</h2>
        </div>
        <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="border border-slate-850/80 bg-slate-900/40 rounded-xl p-4.5 hover:border-cyan-500/30 transition-colors group relative overflow-hidden"
            >
              <div className="flex justify-between items-center mb-2.5">
                <span className="font-tech-code text-cyan-455 text-[10px] font-extrabold px-2 py-0.5 bg-cyan-950/25 border border-cyan-500/10 rounded">{rule.id}</span>
                <ArrowRight size={13} className="text-slate-650 group-hover:text-cyan-400 transition" />
              </div>
              <h3 className="text-xs font-bold text-slate-200 mb-1 leading-snug">{rule.name}</h3>
              <p className="text-[10px] text-slate-400 leading-relaxed font-medium">{rule.description}</p>
            </div>
          ))}

          {adding ? (
            <div className="border border-cyan-500/35 rounded-xl p-4 bg-cyan-950/10 space-y-3.5 animate-fade-in">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Rule name (e.g. High-Risk Gate)"
                className="w-full text-xs rounded-lg border border-slate-800 px-3 py-2 bg-slate-955 text-slate-200 focus:border-cyan-500/40 outline-none"
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Rule routing logic: If [condition] → [routing action]"
                className="w-full text-xs rounded-lg border border-slate-800 px-3 py-2 bg-slate-955 text-slate-200 focus:border-cyan-500/40 outline-none resize-none"
                rows={2}
              />
              <div className="flex gap-2.5 justify-end text-[10px] font-bold uppercase tracking-wider">
                <button onClick={() => setAdding(false)} className="text-slate-400 hover:text-slate-200 px-3.5 py-1.5 transition">
                  Cancel
                </button>
                <button onClick={handleAdd} className="text-slate-950 bg-cyan-400 hover:bg-cyan-300 px-4 py-1.5 rounded-md transition font-black">
                  Add Rule
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="w-full py-3.5 border-2 border-dashed border-slate-850 hover:border-cyan-500/30 rounded-xl text-slate-400 font-bold hover:text-cyan-400 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider bg-slate-900/10"
            >
              <Plus size={14} />
              Define New Routing Rule
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function SavePipelineButton({ state, onSave }) {
  const isSaving = state === "saving";
  const isSaved = state === "saved";
  const isError = state === "error";

  const colorStyle = isSaved
    ? "bg-emerald-600 hover:bg-emerald-500 text-white"
    : isError
    ? "bg-red-600 hover:bg-red-500 text-white"
    : "bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-extrabold transition shadow-[0_0_15px_rgba(6,182,212,0.2)] hover:opacity-95";

  return (
    <button
      onClick={onSave}
      disabled={isSaving}
      className={`px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider active:scale-95 transition-all flex items-center gap-2 shadow-sm disabled:cursor-wait ${colorStyle}`}
    >
      <CheckCircle2 size={14} className={isSaved ? "animate-bounce" : isSaving ? "animate-spin" : ""} />
      {isSaving ? "Saving Adjustments..." : isSaved ? "Calibration Saved!" : isError ? "Save Failed — Retry" : "Save Adjustments"}
    </button>
  );
}

export function RegisterProductCard({ onProductAdded }) {
  const [partSuffix, setPartSuffix] = useState("");
  const [name, setName] = useState("");
  const [commodity, setCommodity] = useState("");
  const [expectedSerial, setExpectedSerial] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [registering, setRegistering] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    setFile(selected);
    const url = URL.createObjectURL(selected);
    setPreview(url);
  };

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!partSuffix.trim()) {
      setErrorMsg("Part code suffix is required.");
      return;
    }
    if (!name.trim()) {
      setErrorMsg("Product name is required.");
      return;
    }
    if (!commodity.trim()) {
      setErrorMsg("Commodity category is required.");
      return;
    }
    if (!file) {
      setErrorMsg("OEM Golden reference image is required.");
      return;
    }

    const fullPartNumber = `GOLD-${partSuffix.trim().toUpperCase()}`;

    setRegistering(true);
    try {
      // 1. Create the product record
      const product = await createProduct({
        part_number: fullPartNumber,
        name: name.trim(),
        commodity,
      });

      // 2. Determine default ROI based on commodity type
      let roi_json = { "label_roi": { "x": 100, "y": 100, "width": 300, "height": 200 } };
      if (commodity === "label") {
        roi_json = { "label_roi": { "x": 420, "y": 50, "width": 420, "height": 220 } };
      } else if (commodity === "motherboard") {
        roi_json = { "label_roi": { "x": 200, "y": 620, "width": 150, "height": 80 } };
      } else if (commodity === "microchip") {
        roi_json = { "label_roi": { "x": 250, "y": 250, "width": 200, "height": 100 } };
      }

      // 3. Upload the golden image reference
      const formData = new FormData();
      formData.append("file", file);
      formData.append("roi_config", JSON.stringify(roi_json));
      formData.append("angle", "top");
      if (expectedSerial.trim()) {
        formData.append("expected_serial", expectedSerial.trim());
      }

      await uploadGoldenReference(product.id, formData);

      setSuccessMsg(`Reference standard '${name}' registered successfully under Code '${fullPartNumber}'.`);
      setPartSuffix("");
      setName("");
      setCommodity("");
      setExpectedSerial("");
      setFile(null);
      setPreview(null);

      if (onProductAdded) {
        onProductAdded();
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Failed to register standard reference product.");
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div className="col-span-12">
      <div className="cyber-card bg-[#0f172a]/55 border border-slate-800/80 p-6 shadow-lg relative overflow-hidden group">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500/25 to-transparent"></div>
        
        <div className="flex items-center gap-3 mb-6">
          <div className="h-8 w-8 rounded-lg bg-cyan-950/20 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Sparkles size={16} />
          </div>
          <div>
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-200">Register New Parts Reference standard (Golden Image)</h2>
            <p className="text-[10px] text-slate-500 font-semibold leading-normal mt-0.5">
              Add a new part code specification and upload its golden standard picture to seed comparison database.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="flex gap-2.5 bg-red-950/30 border border-red-500/20 rounded-xl p-3.5 mb-5 animate-fade-in text-[11px] leading-relaxed text-red-300">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex gap-2.5 bg-emerald-950/30 border border-emerald-500/20 rounded-xl p-3.5 mb-5 animate-fade-in text-[11px] leading-relaxed text-emerald-300">
            <CheckCircle2 size={15} className="shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-12 gap-5">
          <div className="col-span-12 md:col-span-4 space-y-4">
            <div>
              <label className="text-[9px] font-bold tracking-wider text-slate-500 uppercase mb-1.5 block">Part Number Code</label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-xs text-slate-500 font-black tracking-wider uppercase">GOLD-</span>
                <input
                  type="text"
                  value={partSuffix}
                  onChange={(e) => setPartSuffix(e.target.value.replace(/[^a-zA-Z0-9_-]/g, "").toUpperCase())}
                  placeholder="RAM-DELL-8G"
                  className="w-full h-11 pl-16 pr-3.5 rounded-xl bg-slate-900/80 border border-slate-700/60 text-slate-200 text-xs placeholder:text-slate-700 focus:border-cyan-500/40 focus:shadow-[0_0_15px_rgba(6,182,212,0.1)] transition-all outline-none uppercase font-bold"
                  disabled={registering}
                />
              </div>
            </div>

            <div>
              <label className="text-[9px] font-bold tracking-wider text-slate-500 uppercase mb-1.5 block">Product Name / Title</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Dell DDR4 8GB RAM Module"
                className="w-full h-11 px-3.5 rounded-xl bg-slate-900/80 border border-slate-700/60 text-slate-200 text-xs placeholder:text-slate-700 focus:border-cyan-500/40 focus:shadow-[0_0_15px_rgba(6,182,212,0.1)] transition-all outline-none font-bold"
                disabled={registering}
              />
            </div>
          </div>

          <div className="col-span-12 md:col-span-4 space-y-4">
            <div>
              <label className="text-[9px] font-bold tracking-wider text-slate-500 uppercase mb-1.5 block">Commodity Category</label>
              <input
                type="text"
                value={commodity}
                onChange={(e) => setCommodity(e.target.value.toLowerCase())}
                placeholder="e.g. ram, motherboard, storage..."
                className="w-full h-11 px-3.5 rounded-xl bg-slate-900/80 border border-slate-700/60 text-slate-200 text-xs placeholder:text-slate-700 focus:border-cyan-500/40 focus:shadow-[0_0_15px_rgba(6,182,212,0.1)] transition-all outline-none font-bold"
                disabled={registering}
              />
            </div>

            <div>
              <label className="text-[9px] font-bold tracking-wider text-slate-500 uppercase mb-1.5 block">Expected Serial format/ID (Optional)</label>
              <input
                type="text"
                value={expectedSerial}
                onChange={(e) => setExpectedSerial(e.target.value)}
                placeholder="e.g. DELL-RAM-DDR4-001"
                className="w-full h-11 px-3.5 rounded-xl bg-slate-900/80 border border-slate-700/60 text-slate-200 text-xs placeholder:text-slate-700 focus:border-cyan-500/40 focus:shadow-[0_0_15px_rgba(6,182,212,0.1)] transition-all outline-none font-bold"
                disabled={registering}
              />
            </div>
          </div>

          <div className="col-span-12 md:col-span-4 flex flex-col justify-end">
            <label className="text-[9px] font-bold tracking-wider text-slate-500 uppercase mb-1.5 block">OEM Golden Standard Image</label>
            {preview ? (
              <div className="relative rounded-xl border border-slate-700/60 bg-slate-900/40 overflow-hidden h-[6.5rem] flex items-center p-2 justify-between">
                <div className="h-full w-24 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                  <img src={preview} className="w-full h-full object-contain" alt="Golden standard preview" />
                </div>
                <div className="min-w-0 flex-1 px-3">
                  <p className="text-[10px] font-bold text-slate-250 truncate leading-snug">{file?.name}</p>
                  <p className="text-[9px] text-slate-500 font-semibold mt-0.5">{(file?.size / 1024).toFixed(0)} KB</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setFile(null); setPreview(null); }}
                  className="h-7 w-7 rounded-lg flex items-center justify-center border border-slate-800 bg-slate-900 text-slate-500 hover:text-red-400 hover:border-red-500/30 transition-all shrink-0 active:scale-95"
                  disabled={registering}
                >
                  <X size={13} />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-1.5 h-[6.5rem] rounded-xl border-2 border-dashed border-slate-700/50 bg-slate-900/40 hover:bg-cyan-950/5 hover:border-cyan-500/50 cursor-pointer transition-all">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={registering}
                />
                <UploadCloud size={18} className="text-slate-500 hover:text-cyan-400 transition" />
                <span className="text-[10px] font-bold text-slate-350 hover:text-cyan-400 transition">Select Image standard</span>
              </label>
            )}
          </div>

          <div className="col-span-12 flex justify-end pt-2 border-t border-slate-850/60 mt-1">
            <button
              type="submit"
              disabled={registering || !partSuffix || !name || !file}
              className="group relative inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white font-extrabold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(6,182,212,0.2)] hover:shadow-[0_0_25px_rgba(6,182,212,0.35)] hover:scale-[1.01] active:scale-95 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
            >
              {registering ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  <span>Registering...</span>
                </>
              ) : (
                <>
                  <Plus size={13} />
                  <span>Register Golden Standard</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

