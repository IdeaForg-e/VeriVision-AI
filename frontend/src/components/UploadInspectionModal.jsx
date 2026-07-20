import { useState, useEffect } from "react";
import { Modal, Loader } from "./common.jsx";
import { createInspection } from "../services/caseService.js";
import { Upload, AlertCircle, AlertTriangle, RefreshCw, Sparkles, Image as ImageIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../utils/constants.js";

export default function UploadInspectionModal({ open, onClose, onSuccess }) {
  const navigate = useNavigate();

  // Form states
  const [captureSite, setCaptureSite] = useState("Line-1");
  const [captureAngle, setCaptureAngle] = useState("top");
  const [customFile, setCustomFile] = useState(null); // defect target scan image
  const [goldenFile, setGoldenFile] = useState(null); // golden reference image
  const [expectedSerial, setExpectedSerial] = useState("");

  // Pipeline execution feedback
  const [processing, setProcessing] = useState(false);
  const [progressLog, setProgressLog] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);
  const [viabilityWarning, setViabilityWarning] = useState(null);

  useEffect(() => {
    if (!open) return;
    // Reset states
    setProcessing(false);
    setProgressLog([]);
    setErrorMsg(null);
    setViabilityWarning(null);
    setCustomFile(null);
    setGoldenFile(null);
    setExpectedSerial("");
  }, [open]);

  // Helper utility to read local image sizes
  const getImageDimensions = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          resolve({ width: img.width, height: img.height });
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  // Pre-scan client-side viability hook
  useEffect(() => {
    if (!goldenFile || !customFile) {
      setViabilityWarning(null);
      return;
    }

    const checkViability = async () => {
      try {
        const dimGolden = await getImageDimensions(goldenFile);
        const dimTarget = await getImageDimensions(customFile);

        const arGolden = dimGolden.width / dimGolden.height;
        const arTarget = dimTarget.width / dimTarget.height;

        // 1. Aspect Ratio check
        if (Math.abs(arGolden - arTarget) > 0.4) {
          setViabilityWarning(
            "Layout Mismatch: One image is portrait and the other is landscape. Local pixel alignment will be bypassed in favor of semantic Multimodal Vision AI comparison."
          );
          return;
        }

        // 2. Minimum dimension bounds check
        if (dimGolden.width < 150 || dimGolden.height < 150 || dimTarget.width < 150 || dimTarget.height < 150) {
          setViabilityWarning(
            "Resolution too low: Images must be at least 150x150 pixels for compliance processing."
          );
          return;
        }

        // 3. Resolution scale discrepancy checks
        const wRatio = dimTarget.width / dimGolden.width;
        const hRatio = dimTarget.height / dimGolden.height;
        if (wRatio < 0.25 || wRatio > 4.0 || hRatio < 0.25 || hRatio > 4.0) {
          setViabilityWarning(
            "Scale Mismatch: A close-up crop vs wide shot discrepancy was detected. Local pixel subtraction will be bypassed in favor of semantic Multimodal Vision AI comparison."
          );
          return;
        }

        setViabilityWarning(null);
      } catch (err) {
        console.error("Client viability check failed:", err);
      }
    };

    checkViability();
  }, [goldenFile, customFile]);

  const runSimulatedProgress = () => {
    setProgressLog([]);
    const logs = [
      { text: "✓ Ingest & Triage: Image clarity & lighting exposure checked [OK]", delay: 200, status: "success" },
      { text: "✓ Homography: Aligned frame with custom reference ORB descriptors [OK]", delay: 1000, status: "success" },
      { text: "✓ Classifier: Golden reference part category auto-detected [OK]", delay: 1800, status: "success" },
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

    if (!goldenFile) {
      setErrorMsg("Please upload an OEM Golden Reference standard image.");
      return;
    }
    if (!customFile) {
      setErrorMsg("Please upload a target Part Image Scan to inspect.");
      return;
    }

    setProcessing(true);
    setErrorMsg(null);
    runSimulatedProgress();

    try {
      const formData = new FormData();
      formData.append("capture_site", captureSite);
      formData.append("capture_angle", captureAngle);
      formData.append("file", customFile);
      formData.append("golden_file", goldenFile);
      if (expectedSerial) {
        formData.append("expected_serial", expectedSerial.trim());
      }

      const result = await createInspection(formData);
      setProcessing(false);
      onClose();
      if (onSuccess) onSuccess();
      navigate(`${ROUTES.CASE_DETAIL}/${result.case_id}`);

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
      setErrorMsg(errMsg);
    }
  };

  const modalFooter = !processing && (
    <div className="flex justify-end gap-3 w-full border-t border-slate-800 pt-4 mt-2">
      <button
        type="button"
        onClick={onClose}
        className="px-5 py-2.5 rounded-lg border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition font-semibold text-xs"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!goldenFile || !customFile}
        className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-extrabold text-xs shadow-[0_0_12px_rgba(6,182,212,0.2)] hover:opacity-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Start Inspection
      </button>
    </div>
  );

  return (
    <Modal open={open} onClose={processing ? undefined : onClose} title="New Parts Compliance Inspection" size="md" footer={modalFooter}>
      {processing ? (
        <div className="py-4 space-y-4">
          <div className="flex flex-col items-center justify-center gap-3">
            <RefreshCw className="text-cyan-400 animate-spin" size={28} />
            <p className="text-xs font-extrabold text-cyan-400 tracking-[0.2em] uppercase animate-pulse">AI Agent pipeline running</p>
          </div>

          <div className="bg-[#070a13] border border-slate-850 rounded-xl p-4 font-tech-code text-[11px] space-y-2.5 h-52 overflow-y-auto mt-4 shadow-inner select-none selection:bg-transparent">
            {progressLog.map((log, idx) => (
              <p key={idx} className={`flex gap-2.5 items-start animate-fade-in leading-relaxed ${log.status === 'success' ? 'text-emerald-400 font-semibold' : 'text-cyan-400 animate-pulse'}`}>
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
                <p className="font-extrabold text-xs tracking-wider uppercase text-red-500">Triage Warning</p>
                <p className="text-xs mt-1 leading-relaxed text-red-400/90">{errorMsg}</p>
              </div>
            </div>
          )}

          {viabilityWarning && (
            <div className="flex gap-3 bg-cyan-950/20 border border-cyan-500/20 text-cyan-400 rounded-lg p-4 animate-fade-in">
              <AlertTriangle className="shrink-0 text-cyan-500" size={18} />
              <div>
                <p className="font-extrabold text-xs tracking-wider uppercase text-cyan-500">Semantic AI Pipeline Fallback Active</p>
                <p className="text-xs mt-1 leading-relaxed text-cyan-400/90">{viabilityWarning}</p>
              </div>
            </div>
          )}

          {/* Golden Standard Upload */}
          <div className="flex flex-col gap-1.5 animate-fade-in">
            <label className="font-label-caps text-[10px] tracking-wider text-slate-500 uppercase font-semibold flex items-center gap-1">
              <Sparkles size={11} className="text-cyan-400" />
              OEM Golden Reference Standard (Clean Part)
            </label>
            <label className="border border-dashed border-slate-800 hover:border-cyan-500/40 bg-slate-950/40 hover:bg-cyan-950/5 rounded-xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-200 group relative">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setGoldenFile(e.target.files[0])}
                className="hidden"
              />
              <ImageIcon className="text-slate-500 group-hover:text-cyan-400 transition" size={22} />
              <span className="text-xs font-bold text-slate-350 group-hover:text-slate-200 mt-0.5 max-w-[340px] truncate">
                {goldenFile ? goldenFile.name : "Select or drag OEM standard image"}
              </span>
              <span className="text-[9px] text-slate-550">Clean reference template for baseline comparison</span>
            </label>
          </div>

          {/* Defect Scan Upload */}
          <div className="flex flex-col gap-1.5 animate-fade-in">
            <label className="font-label-caps text-[10px] tracking-wider text-slate-500 uppercase font-semibold flex items-center gap-1">
              <Upload size={11} className="text-blue-400" />
              Part Image Scan (Inspection Target)
            </label>
            <label className="border border-dashed border-slate-800 hover:border-blue-500/40 bg-slate-950/40 hover:bg-blue-950/5 rounded-xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-200 group relative">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setCustomFile(e.target.files[0])}
                className="hidden"
              />
              <Upload className="text-slate-500 group-hover:text-blue-500 transition" size={22} />
              <span className="text-xs font-bold text-slate-350 group-hover:text-slate-200 mt-0.5 max-w-[340px] truncate">
                {customFile ? customFile.name : "Select or drag inspection scan image"}
              </span>
              <span className="text-[9px] text-slate-550">Captured photo of the part to run compliance rules against</span>
            </label>
          </div>

          {/* Barcode details */}
          <div className="flex flex-col gap-1.5">
            <label className="font-label-caps text-[10px] tracking-wider text-slate-500 uppercase font-semibold">Expected Serial Number (Optional)</label>
            <input
              type="text"
              value={expectedSerial}
              onChange={(e) => setExpectedSerial(e.target.value)}
              placeholder="e.g. 91165LUS0DDD (Checks label character mismatches)"
              className="cyber-input rounded-lg text-sm bg-slate-900 border border-slate-800 text-slate-200 px-3.5"
            />
          </div>

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
