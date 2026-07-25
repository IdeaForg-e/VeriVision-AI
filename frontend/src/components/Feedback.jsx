import { useState, useEffect } from "react";
import {
  Shield, EyeOff, FileClock, Sliders, Plus, ArrowRight,
  Settings, AlertCircle, History, LockKeyhole, UploadCloud,
  Sparkles, CheckCircle2, X, RefreshCw,
} from "lucide-react";
import { createProduct, uploadGoldenReference } from "../services/productService.js";
import { Button } from "./Common.jsx";

const PRIVACY_ITEMS = [
  { key: "storeImageHashOnly", icon: Shield, label: "Store image hash only", desc: "Prevents writing raw images to permanent database logs" },
  { key: "redactPersonalMarkings", icon: EyeOff, label: "Redact personal markings", desc: "Filters visual operator IDs and metadata fields" },
  { key: "verdictChangeAuditLog", icon: FileClock, label: "Verdict change audit log", desc: "Enforces signature constraints on decisions overrides" },
];

const cardStyle = {
  background: "var(--glass-bg)",
  backdropFilter: "var(--glass-blur)",
  WebkitBackdropFilter: "var(--glass-blur)",
  border: "1px solid var(--border-hairline)",
  borderTopColor: "var(--border-light-top)",
  borderRadius: "var(--radius-lg)",
  boxShadow: "var(--glass-shadow-sm), var(--glass-inset)",
};

/* ── Toggle Switch Component ────────────────────────────────────────────── */
function Toggle({ checked, onChange }) {
  return (
    <label className="relative inline-flex items-center cursor-pointer select-none shrink-0">
      <input type="checkbox" className="sr-only peer" checked={checked} onChange={onChange} />
      <div
        className="w-9 h-5 rounded-full transition-all duration-200 border peer"
        style={{
          background: checked ? "var(--primary-container)" : "rgba(0,0,0,0.25)",
          borderColor: checked ? "rgba(0,125,184,0.30)" : "var(--border-default)",
          boxShadow: checked ? "0 0 10px var(--primary-glow-sm)" : "none",
        }}
      >
        <div
          className="w-4 h-4 rounded-full bg-white transition-all duration-200"
          style={{
            transform: checked ? "translateX(16px)" : "translateX(2px)",
            marginTop: "1.5px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
          }}
        />
      </div>
    </label>
  );
}

/* ── Privacy & Security Controls ────────────────────────────────────────── */
export function PrivacySecurity({ privacy, onToggle }) {
  return (
    <div className="col-span-12 md:col-span-6 space-y-4">
      <div className="p-5 space-y-4" style={cardStyle}>
        <div
          className="flex items-center gap-2.5 pb-3"
          style={{ borderBottom: "1px solid var(--border-hairline)" }}
        >
          <LockKeyhole size={14} style={{ color: "var(--primary)" }} />
          <h2
            className="text-[12px] font-semibold"
            style={{ fontFamily: "var(--font-headline)", color: "var(--on-surface)" }}
          >
            Privacy &amp; Security Controls
          </h2>
        </div>
        <div className="space-y-2.5">
          {PRIVACY_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.key}
                className="flex items-center justify-between p-3 rounded-xl transition-all duration-150"
                style={{
                  background: "rgba(0,0,0,0.15)",
                  border: "1px solid var(--border-default)",
                }}
              >
                <div className="flex items-center gap-3 pr-2 min-w-0">
                  <Icon size={14} style={{ color: "var(--on-surface-muted)" }} className="shrink-0" />
                  <div className="min-w-0">
                    <span className="block text-[11px] font-bold truncate"
                          style={{ fontFamily: "var(--font-body)", color: "var(--on-surface)" }}>
                      {item.label}
                    </span>
                    <span className="block text-[9px] mt-0.5 truncate"
                          style={{ fontFamily: "var(--font-body)", color: "var(--on-surface-muted)" }}>
                      {item.desc}
                    </span>
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

/* ── Known Limitations ─────────────────────────────────────────────────── */
export function KnownLimitations() {
  return (
    <div
      className="p-3.5 rounded-xl text-xs space-y-1.5"
      style={{
        background: "var(--primary-glow-sm)",
        border: "1px solid rgba(0,125,184,0.25)",
      }}
    >
      <p className="font-bold uppercase text-[9px] tracking-widest flex items-center gap-1.5"
         style={{ color: "var(--primary)", fontFamily: "var(--font-body)" }}>
        <AlertCircle size={12} /> Optical Triage Scope Limitation
      </p>
      <p className="text-[10px] leading-relaxed"
         style={{ fontFamily: "var(--font-body)", color: "var(--on-surface-variant)" }}>
        Inspection validation relies strictly on optical visual matching. Firmware integrity or internal silicon micro-defects are outside visual audit scope.
      </p>
    </div>
  );
}

function formatWhen(iso) {
  const date = new Date(iso);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/* ── Calibration Audit Logs ────────────────────────────────────────────── */
export function AdjustmentHistory({ history }) {
  return (
    <div className="col-span-12 md:col-span-6 space-y-4">
      <div className="p-5 space-y-4" style={cardStyle}>
        <div
          className="flex items-center gap-2.5 pb-3"
          style={{ borderBottom: "1px solid var(--border-hairline)" }}
        >
          <History size={14} style={{ color: "var(--primary)" }} />
          <h2
            className="text-[12px] font-semibold"
            style={{ fontFamily: "var(--font-headline)", color: "var(--on-surface)" }}
          >
            Calibration Audit Logs
          </h2>
        </div>

        <KnownLimitations />

        <div className="space-y-2">
          <p className="text-[9px] font-bold uppercase tracking-widest"
             style={{ fontFamily: "var(--font-body)", color: "var(--on-surface-muted)" }}>
            Recent Calibration Entries
          </p>
          <ul className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {history.map((h) => (
              <li
                key={h.id}
                className="flex items-start gap-2.5 p-2.5 rounded-xl text-xs"
                style={{
                  background: "rgba(0,0,0,0.15)",
                  border: "1px solid var(--border-default)",
                }}
              >
                <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5"
                     style={{ background: "var(--primary)", boxShadow: "0 0 6px var(--primary)" }} />
                <div className="min-w-0">
                  <p className="font-semibold leading-normal"
                     style={{ fontFamily: "var(--font-body)", color: "var(--on-surface)" }}>
                    {h.summary}
                  </p>
                  <p className="text-[9px] font-mono mt-1"
                     style={{ color: "var(--on-surface-muted)" }}>
                    By {h.user} on {formatWhen(h.changedAt)}
                  </p>
                </div>
              </li>
            ))}
            {history.length === 0 && (
              <li className="italic text-center py-4"
                  style={{ fontFamily: "var(--font-body)", color: "var(--on-surface-muted)" }}>
                No calibration adjustments recorded.
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ── Threshold Slider Component ─────────────────────────────────────────── */
export function ThresholdSlider({ label, value, min, max, step, formatValue, description, onChange }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-xs">
        <label className="font-bold uppercase text-[9px] tracking-widest"
               style={{ fontFamily: "var(--font-body)", color: "var(--on-surface-variant)" }}>
          {label}
        </label>
        <span
          className="font-bold px-2 py-0.5 rounded-full text-[10px]"
          style={{
            fontFamily: "var(--font-mono)",
            background: "var(--primary-glow-sm)",
            border: "1px solid rgba(0,125,184,0.20)",
            color: "var(--primary)",
          }}
        >
          {formatValue(value)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full"
      />
      <p className="text-[10px] leading-normal"
         style={{ fontFamily: "var(--font-body)", color: "var(--on-surface-muted)" }}>
        {description}
      </p>
    </div>
  );
}

/* ── Perception Engine Threshold Calibration ────────────────────────────── */
export function PerceptionThresholds({ thresholds, onChange }) {
  return (
    <div className="col-span-12 lg:col-span-7">
      <div className="p-5 space-y-5 h-full" style={cardStyle}>
        <div
          className="flex items-center gap-2.5 pb-3"
          style={{ borderBottom: "1px solid var(--border-hairline)" }}
        >
          <Sliders size={14} style={{ color: "var(--primary)" }} />
          <h2
            className="text-[12px] font-semibold"
            style={{ fontFamily: "var(--font-headline)", color: "var(--on-surface)" }}
          >
            Perception Engine Threshold Calibration
          </h2>
        </div>
        <div className="space-y-5">
          <ThresholdSlider
            label="Aligned Structural SSIM Minimum Coefficient"
            value={thresholds.ssim}
            min={0}
            max={1}
            step={0.01}
            formatValue={(v) => `Min SSIM: ${v}`}
            description="Structural difference below this coefficient generates a visual anomaly hotspot."
            onChange={(v) => onChange("ssim", v)}
          />
          <ThresholdSlider
            label="ORB Descriptor Keypoint Strictness"
            value={thresholds.keypointDeltaPct}
            min={0}
            max={50}
            step={1}
            formatValue={(v) => `Max Delta: ${v}%`}
            description="Spatial keypoint deviation above this threshold triggers homography alignment warning."
            onChange={(v) => onChange("keypointDeltaPct", v)}
          />
          <ThresholdSlider
            label="OCR Character Matching Strictness"
            value={thresholds.ocrFuzzyPct}
            min={80}
            max={100}
            step={5}
            formatValue={(v) => `${v}% Match`}
            description="Defines OCR character string matching strictness for component serial labels."
            onChange={(v) => onChange("ocrFuzzyPct", v)}
          />
        </div>
      </div>
    </div>
  );
}

/* ── Business Policy Routing Rules ──────────────────────────────────────── */
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
    <div className="col-span-12 lg:col-span-5">
      <div className="p-5 space-y-4 h-full" style={cardStyle}>
        <div
          className="flex items-center gap-2.5 pb-3"
          style={{ borderBottom: "1px solid var(--border-hairline)" }}
        >
          <Settings size={14} style={{ color: "var(--primary)" }} />
          <h2
            className="text-[12px] font-semibold"
            style={{ fontFamily: "var(--font-headline)", color: "var(--on-surface)" }}
          >
            Business Policy Routing Rules
          </h2>
        </div>

        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="p-3 rounded-xl space-y-1.5 transition-all duration-150 hover:border-[rgba(0,125,184,0.30)] cursor-default"
              style={{
                background: "rgba(0,0,0,0.15)",
                border: "1px solid var(--border-default)",
              }}
            >
              <div className="flex justify-between items-center">
                <span
                  className="px-1.5 py-0.5 rounded text-[9px] font-bold font-mono"
                  style={{
                    background: "var(--primary-glow-sm)",
                    border: "1px solid rgba(0,125,184,0.20)",
                    color: "var(--primary)",
                  }}
                >
                  {rule.id}
                </span>
                <ArrowRight size={12} style={{ color: "var(--on-surface-muted)" }} />
              </div>
              <h3 className="text-[11px] font-bold" style={{ fontFamily: "var(--font-body)", color: "var(--on-surface)" }}>
                {rule.name}
              </h3>
              <p className="text-[10px] leading-normal"
                 style={{ fontFamily: "var(--font-body)", color: "var(--on-surface-muted)" }}>
                {rule.description}
              </p>
            </div>
          ))}

          {adding ? (
            <div
              className="p-3 rounded-xl space-y-3"
              style={{
                background: "rgba(0,0,0,0.20)",
                border: "1px solid var(--border-default)",
              }}
            >
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Rule Title"
                className="w-full h-8 px-2.5 text-xs aura-input"
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Routing condition..."
                className="w-full h-16 p-2 text-xs aura-input resize-none"
              />
              <div className="flex justify-end gap-1.5">
                <Button variant="ghost" size="sm" onClick={() => setAdding(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" onClick={handleAdd}>
                  Add Rule
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAdding(true)}
              icon={<Plus size={14} />}
              className="w-full justify-center"
            >
              Add Routing Rule
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Save Pipeline Calibration Button ───────────────────────────────────── */
export function SavePipelineButton({ state, onSave }) {
  const isSaving = state === "saving";
  const isSaved = state === "saved";

  return (
    <Button
      variant={isSaved ? "success" : "primary"}
      size="sm"
      loading={isSaving}
      onClick={onSave}
      icon={<CheckCircle2 size={13} />}
    >
      {isSaved ? "Calibration Saved!" : "Save Pipeline Calibration"}
    </Button>
  );
}

/* ── Register Product Card ──────────────────────────────────────────────── */
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
    setPreview(URL.createObjectURL(selected));
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
      const product = await createProduct({
        part_number: fullPartNumber,
        name: name.trim(),
        commodity,
      });

      let roi_json = { label_roi: { x: 100, y: 100, width: 300, height: 200 } };
      const formData = new FormData();
      formData.append("file", file);
      formData.append("roi_config", JSON.stringify(roi_json));
      formData.append("angle", "top");
      if (expectedSerial.trim()) {
        formData.append("expected_serial", expectedSerial.trim());
      }

      await uploadGoldenReference(product.id, formData);

      setSuccessMsg(`Reference standard '${name}' registered under Code '${fullPartNumber}'.`);
      setPartSuffix("");
      setName("");
      setCommodity("");
      setExpectedSerial("");
      setFile(null);
      setPreview(null);

      if (onProductAdded) onProductAdded();
    } catch (err) {
      setErrorMsg(err.message || "Failed to register standard reference product.");
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div className="col-span-12">
      <div className="p-5 space-y-4" style={cardStyle}>
        <div
          className="flex items-center gap-2.5 pb-3"
          style={{ borderBottom: "1px solid var(--border-hairline)" }}
        >
          <Sparkles size={14} style={{ color: "var(--primary)" }} />
          <div>
            <h2
              className="text-[12px] font-semibold"
              style={{ fontFamily: "var(--font-headline)", color: "var(--on-surface)" }}
            >
              Register New OEM Golden Reference Catalog Standard
            </h2>
            <p className="text-[10px] mt-0.5"
               style={{ fontFamily: "var(--font-body)", color: "var(--on-surface-muted)" }}>
              Seed comparison database with high-resolution reference photos and expected part specs.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div
            className="p-3 rounded-xl text-xs flex gap-2 items-center"
            style={{
              background: "var(--urgent-surface)",
              border: "1px solid var(--urgent-border)",
              color: "var(--urgent)",
              fontFamily: "var(--font-body)",
            }}
          >
            <AlertCircle size={14} /> {errorMsg}
          </div>
        )}
        {successMsg && (
          <div
            className="p-3 rounded-xl text-xs flex gap-2 items-center"
            style={{
              background: "var(--success-surface)",
              border: "1px solid var(--success-border)",
              color: "var(--success)",
              fontFamily: "var(--font-body)",
            }}
          >
            <CheckCircle2 size={14} /> {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-3">
            <div>
              <label
                className="text-[9px] font-bold uppercase tracking-widest mb-1.5 flex items-center justify-between"
                style={{ fontFamily: "var(--font-body)", color: "var(--on-surface-muted)" }}
              >
                <span>Part Code Suffix <span style={{ color: "var(--urgent)" }}>*</span></span>
                <span className="text-[9px] font-mono">GOLD-XXXX</span>
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-xs font-mono font-bold"
                      style={{ color: "var(--primary)" }}>GOLD-</span>
                <input
                  type="text"
                  value={partSuffix}
                  onChange={(e) => setPartSuffix(e.target.value.replace(/[^a-zA-Z0-9_-]/g, "").toUpperCase())}
                  placeholder="RAM-DELL-8G"
                  className="w-full h-9 pl-16 pr-3 text-xs aura-input font-mono font-bold"
                  disabled={registering}
                  required
                />
              </div>
            </div>
            <div>
              <label
                className="text-[9px] font-bold uppercase tracking-widest mb-1.5 block"
                style={{ fontFamily: "var(--font-body)", color: "var(--on-surface-muted)" }}
              >
                Part Title / Name <span style={{ color: "var(--urgent)" }}>*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Dell DDR4 8GB RAM Module"
                className="w-full h-9 px-3 text-xs aura-input"
                disabled={registering}
                required
              />
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label
                className="text-[9px] font-bold uppercase tracking-widest mb-1.5 flex items-center justify-between"
                style={{ fontFamily: "var(--font-body)", color: "var(--on-surface-muted)" }}
              >
                <span>Commodity Category</span>
                <span className="lowercase font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={commodity}
                onChange={(e) => setCommodity(e.target.value.toLowerCase())}
                placeholder="e.g. ram, motherboard, chip"
                className="w-full h-9 px-3 text-xs aura-input"
                disabled={registering}
              />
            </div>
            <div>
              <label
                className="text-[9px] font-bold uppercase tracking-widest mb-1.5 flex items-center justify-between"
                style={{ fontFamily: "var(--font-body)", color: "var(--on-surface-muted)" }}
              >
                <span>Expected Serial ID</span>
                <span className="lowercase font-normal">(optional — auto-reads)</span>
              </label>
              <input
                type="text"
                value={expectedSerial}
                onChange={(e) => setExpectedSerial(e.target.value)}
                placeholder="e.g. DELL-RAM-DDR4-001"
                className="w-full h-9 px-3 text-xs aura-input font-mono"
                disabled={registering}
              />
            </div>
          </div>

          <div className="flex flex-col justify-between space-y-3 md:space-y-0">
            <div>
              <label
                className="text-[9px] font-bold uppercase tracking-widest mb-1.5 block"
                style={{ fontFamily: "var(--font-body)", color: "var(--on-surface-muted)" }}
              >
                Golden Reference Image <span style={{ color: "var(--urgent)" }}>*</span>
              </label>
              {preview ? (
                <div
                  className="flex items-center justify-between p-2 rounded-xl h-9"
                  style={{
                    background: "rgba(0,0,0,0.25)",
                    border: "1px solid var(--border-default)",
                  }}
                >
                  <img
                    src={preview}
                    className="h-6 w-6 object-contain rounded border border-slate-700"
                    alt="Preview"
                  />
                  <span className="text-[11px] font-mono truncate px-2"
                        style={{ color: "var(--on-surface-variant)" }}>{file?.name}</span>
                  <button
                    type="button"
                    onClick={() => { setFile(null); setPreview(null); }}
                    className="transition-colors duration-150"
                    style={{ color: "var(--on-surface-muted)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "var(--urgent)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--on-surface-muted)")}
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <label
                  className="flex items-center justify-center h-9 px-3 rounded-xl border border-dashed cursor-pointer transition-all duration-150"
                  style={{
                    background: "rgba(0,0,0,0.15)",
                    borderColor: "var(--border-default)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(0,0,0,0.25)";
                    e.currentTarget.style.borderColor = "var(--border-strong)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(0,0,0,0.15)";
                    e.currentTarget.style.borderColor = "var(--border-default)";
                  }}
                >
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  <UploadCloud size={14} style={{ color: "var(--primary)" }} className="mr-2" />
                  <span className="text-[11px] font-semibold"
                        style={{ fontFamily: "var(--font-body)", color: "var(--on-surface-variant)" }}>
                    Select Image File
                  </span>
                </label>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={registering}
              disabled={registering || !partSuffix || !name || !file}
              icon={<Plus size={14} />}
              className="h-9 w-full justify-center text-xs font-bold"
            >
              Register Golden Standard
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
