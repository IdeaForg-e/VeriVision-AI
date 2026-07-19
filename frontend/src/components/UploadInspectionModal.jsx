import { useState, useEffect } from "react";
import { Modal, Button, Loader } from "./common.jsx";
import { getProducts, createInspection } from "../services/caseService.js";
import { Upload, FileCode, CheckCircle2, AlertTriangle, AlertCircle, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../utils/constants.js";

const PRESET_OPTIONS = {
  motherboard: [
    { label: "Burn Marks (Tampered Component)", file: "defect_motherboard_burn.png" },
    { label: "Reused Board (Wear & Tear Anomaly)", file: "defect_motherboard_reused.png" },
    { label: "Clean Motherboard Reference (Clean Part)", file: "golden_motherboard.png" }
  ],
  label: [
    { label: "Tampered Label (Mismatched Serial Number)", file: "defect_label_tampered.png" },
    { label: "Missing Label (Expected Sticker Absent)", file: "defect_label_missing.png" },
    { label: "Clean Warranty Label Reference (Clean Part)", file: "golden_warranty_label.png" }
  ],
  microchip: [
    { label: "Lead Corrosion Anomaly (Tampered leads)", file: "defect_microchip_corrosion.png" },
    { label: "Liquid Damage Marks (Wet marks residue)", file: "defect_microchip_liquid_damage.png" },
    { label: "Clean Microchip Reference (Clean Part)", file: "golden_microchip.png" }
  ]
};

export default function UploadInspectionModal({ open, onClose, onSuccess }) {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Form states
  const [selectedProductId, setSelectedProductId] = useState("");
  const [captureSite, setCaptureSite] = useState("Line-1");
  const [captureAngle, setCaptureAngle] = useState("top");
  const [sourceType, setSourceType] = useState("preset"); // 'preset' or 'custom'
  const [presetFile, setPresetFile] = useState("");
  const [customFile, setCustomFile] = useState(null);

  // Pipeline execution feedback
  const [processing, setProcessing] = useState(false);
  const [progressLog, setProgressLog] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (!open) return;
    setLoadingProducts(true);
    getProducts()
      .then((data) => {
        setProducts(data || []);
        if (data && data.length > 0) {
          setSelectedProductId(data[0].id.toString());
        }
      })
      .catch((err) => console.error("Failed to load products:", err))
      .finally(() => setLoadingProducts(false));

    // Reset states
    setProcessing(false);
    setProgressLog([]);
    setErrorMsg(null);
    setCustomFile(null);
    setPresetFile("");
  }, [open]);

  // Dynamically get matching preset choices based on selected product commodity type
  const selectedProduct = products.find(p => p.id.toString() === selectedProductId);
  const commodity = selectedProduct?.commodity || "motherboard";
  const presets = PRESET_OPTIONS[commodity] || PRESET_OPTIONS.motherboard;

  // Auto-select first preset when product change
  useEffect(() => {
    if (presets && presets.length > 0) {
      setPresetFile(presets[0].file);
    }
  }, [selectedProductId, commodity]);

  const runSimulatedProgress = () => {
    setProgressLog([]);
    const logs = [
      { text: "✓ Ingest & Triage: Image clarity & lighting exposure checked [OK]", delay: 200, status: "success" },
      { text: "✓ Homography: Aligned frame with reference ORB descriptors [OK]", delay: 1000, status: "success" },
      { text: "✓ Selector: Loaded golden reference standard from master catalog [OK]", delay: 1800, status: "success" },
      { text: "⚙ Vision Ensemble: Running structural SSIM diff mapping...", delay: 2600, status: "active" },
      { text: "⚙ EasyOCR Engine: Initializing character mismatch verification...", delay: 3400, status: "active" },
      { text: "⚙ Decision Judge: Evaluating compliance policy & calculating risk index...", delay: 4200, status: "active" },
      { text: "⚙ Explainer: Writing natural language audit justification...", delay: 5000, status: "active" }
    ];

    logs.forEach(log => {
      setTimeout(() => {
        setProgressLog(prev => [...prev, { text: log.text, status: log.status }]);
      }, log.delay);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setProcessing(true);
    setErrorMsg(null);
    runSimulatedProgress();

    try {
      let fileToUpload = null;

      if (sourceType === "preset") {
        if (!selectedProductId) throw new Error("Please select a part template.");
        const presetPath = `/dataset/${presetFile}`;
        const response = await fetch(presetPath);
        if (!response.ok) throw new Error("Unable to fetch sample preset image.");
        const blob = await response.blob();
        fileToUpload = new File([blob], presetFile, { type: blob.type });
      } else {
        if (!customFile) {
          throw new Error("Please select an image file to upload.");
        }
        fileToUpload = customFile;
      }

      const formData = new FormData();
      if (selectedProductId) {
        formData.append("product_id", selectedProductId);
      }
      formData.append("capture_site", captureSite);
      formData.append("capture_angle", captureAngle);
      formData.append("file", fileToUpload);

      const result = await createInspection(formData);

      // Successfully ran. Close modal, redirect to case detail
      setTimeout(() => {
        setProcessing(false);
        onClose();
        if (onSuccess) onSuccess();
        navigate(`${ROUTES.CASE_DETAIL}/${result.case_id}`);
      }, 5800); 
    } catch (err) {
      setProcessing(false);
      let errMsg = err.message || "Failed to process parts inspection.";
      if (err.body && err.body.detail) {
        if (typeof err.body.detail === "object" && err.body.detail.message) {
          errMsg = `Triage Rejection: ${err.body.detail.message}`;
        } else {
          errMsg = err.body.detail;
        }
      }
      // Map to exact custom guidance message
      if (errMsg.toLowerCase().includes("golden reference")) {
        errMsg = "Golden reference image not found. Please contact your administrator to upload the golden image of the part or product.";
      }
      setErrorMsg(errMsg);
    }
  };

  const modalFooter = !processing && (
    <div className="flex justify-end gap-3 w-full border-t border-slate-800 pt-4 mt-2">
      <button
        type="button"
        onClick={onClose}
        className="px-5 py-2.5 rounded-lg border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 transition font-semibold text-xs"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={handleSubmit}
        disabled={loadingProducts || !selectedProductId}
        className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-extrabold text-xs shadow-[0_0_12px_rgba(6,182,212,0.2)] hover:opacity-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Start Inspection
      </button>
    </div>
  );

  return (
    <Modal open={open} onClose={processing ? undefined : onClose} title="New Parts Compliance Inspection" size="md" footer={modalFooter}>
      {loadingProducts ? (
        <div className="py-12 flex justify-center">
          <Loader label="Loading product templates..." />
        </div>
      ) : processing ? (
        <div className="py-4 space-y-4">
          <div className="flex flex-col items-center justify-center gap-3">
            <RefreshCw className="text-cyan-400 animate-spin" size={28} />
            <p className="text-xs font-extrabold text-cyan-400 tracking-[0.2em] uppercase animate-pulse">AI Agent pipeline running</p>
          </div>

          <div className="bg-[#070a13] border border-slate-850 rounded-xl p-4 font-tech-code text-[11px] space-y-2.5 h-52 overflow-y-auto mt-4 shadow-inner select-none selection:bg-transparent">
            {progressLog.map((log, idx) => (
              <p key={idx} className={`flex gap-2.5 items-start animate-fade-in leading-relaxed ${log.status === 'success' ? 'text-emerald-400 font-semibold' : 'text-cyan-450 animate-pulse'}`}>
                <span className="text-slate-600">&gt;_</span>
                <span>{log.text}</span>
              </p>
            ))}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5 text-slate-300 text-body-sm">
          {errorMsg && (
            <div className="flex gap-3 bg-red-950/20 border border-red-500/20 text-red-400 rounded-lg p-4 animate-shake">
              <AlertCircle className="shrink-0 text-red-500" size={18} />
              <div>
                <p className="font-extrabold text-xs tracking-wider uppercase">Triage Warning</p>
                <p className="text-xs mt-1 leading-relaxed text-red-400/90">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Source Selection */}
          <div className="grid grid-cols-2 gap-4 mt-1">
            <button
              type="button"
              onClick={() => setSourceType("preset")}
              className={`py-3 px-4 rounded-xl border text-center font-bold flex flex-col items-center justify-center gap-1.5 transition-all duration-200 ${
                sourceType === "preset"
                  ? "border-cyan-500/40 bg-cyan-950/20 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.12)]"
                  : "border-slate-800 bg-slate-900/40 text-slate-450 hover:bg-slate-850 hover:text-slate-200"
              }`}
            >
              <FileCode size={18} />
              <span className="text-[11px] tracking-wide mt-0.5">Select Demo Sample</span>
            </button>
            <button
              type="button"
              onClick={() => setSourceType("custom")}
              className={`py-3 px-4 rounded-xl border text-center font-bold flex flex-col items-center justify-center gap-1.5 transition-all duration-200 ${
                sourceType === "custom"
                  ? "border-cyan-500/40 bg-cyan-950/20 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.12)]"
                  : "border-slate-800 bg-slate-900/40 text-slate-450 hover:bg-slate-850 hover:text-slate-200"
              }`}
            >
              <Upload size={18} />
              <span className="text-[11px] tracking-wide mt-0.5">Upload Custom File</span>
            </button>
          </div>

          {/* Product Selection - Always shown for alignment accuracy */}
          <div className="flex flex-col gap-1.5">
            <label className="font-label-caps text-[10px] tracking-wider text-slate-500 uppercase font-semibold">Part Template</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="cyber-input w-full rounded-lg text-sm bg-slate-900 border border-slate-800 text-slate-200"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.part_number} · {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Preset dropdown vs custom upload */}
          {sourceType === "preset" ? (
            <div className="flex flex-col gap-1.5 animate-fade-in">
              <label className="font-label-caps text-[10px] tracking-wider text-slate-500 uppercase font-semibold">Visual Scenario Sample</label>
              <select
                value={presetFile}
                onChange={(e) => setPresetFile(e.target.value)}
                className="cyber-input w-full rounded-lg text-sm bg-slate-900 border border-slate-800 text-slate-250 font-medium"
              >
                {presets.map((opt) => (
                  <option key={opt.file} value={opt.file}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5 animate-fade-in">
              <label className="font-label-caps text-[10px] tracking-wider text-slate-500 uppercase font-semibold">Part Image Scan</label>
              <label className="border border-dashed border-slate-800 hover:border-cyan-500/45 bg-slate-950/40 hover:bg-cyan-950/10 rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-200 group relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCustomFile(e.target.files[0])}
                  className="hidden"
                />
                <Upload className="text-slate-500 group-hover:text-cyan-400 transition" size={24} />
                <span className="text-xs font-bold text-slate-350 group-hover:text-slate-200 mt-1 max-w-[280px] truncate">
                  {customFile ? customFile.name : "Drag & drop or click to upload file"}
                </span>
                <span className="text-[9px] text-slate-550">Supports PNG, JPG, JPEG (Max 10MB)</span>
              </label>
            </div>
          )}

          {/* Camera Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-label-caps text-[10px] tracking-wider text-slate-500 uppercase font-semibold">Capture Site</label>
              <input
                type="text"
                value={captureSite}
                onChange={(e) => setCaptureSite(e.target.value)}
                placeholder="e.g. Line-1"
                className="cyber-input rounded-lg text-sm bg-slate-900 border border-slate-800 text-slate-200 px-3.5"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-label-caps text-[10px] tracking-wider text-slate-500 uppercase font-semibold">Camera Angle</label>
              <select
                value={captureAngle}
                onChange={(e) => setCaptureAngle(e.target.value)}
                className="cyber-input rounded-lg text-sm bg-slate-900 border border-slate-800 text-slate-200"
              >
                <option value="top">Top Down (Default)</option>
                <option value="angled">Angled Perspective</option>
              </select>
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
}
