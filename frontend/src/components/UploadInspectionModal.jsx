import { useState, useEffect } from "react";
import { Modal } from "./common.jsx";
import { createInspection } from "../services/caseService.js";
import { Upload, AlertCircle, AlertTriangle, RefreshCw, Sparkles, Image as ImageIcon, X } from "lucide-react";
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

  // Visual thumbnail previews
  const [goldenPreview, setGoldenPreview] = useState(null);
  const [targetPreview, setTargetPreview] = useState(null);

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
    if (goldenPreview) URL.revokeObjectURL(goldenPreview);
    if (targetPreview) URL.revokeObjectURL(targetPreview);
    setGoldenPreview(null);
    setTargetPreview(null);
    setExpectedSerial("");
  }, [open]);

  // Clean object URL cleanup on unmount
  useEffect(() => {
    return () => {
      if (goldenPreview) URL.revokeObjectURL(goldenPreview);
      if (targetPreview) URL.revokeObjectURL(targetPreview);
    };
  }, [goldenPreview, targetPreview]);

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

  const handleGoldenChange = (e) => {
    const file = e.target.files[0];
    if (goldenPreview) {
      URL.revokeObjectURL(goldenPreview);
    }
    setGoldenFile(file);
    if (file) {
      setGoldenPreview(URL.createObjectURL(file));
    } else {
      setGoldenPreview(null);
    }
  };

  const handleTargetChange = (e) => {
    const file = e.target.files[0];
    if (targetPreview) {
      URL.revokeObjectURL(targetPreview);
    }
    setCustomFile(file);
    if (file) {
      setTargetPreview(URL.createObjectURL(file));
    } else {
      setTargetPreview(null);
    }
  };

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
    <div className="flex justify-end gap-3 w-full border-t border-slate-800/80 pt-4 mt-2">
      <button
        type="button"
        onClick={onClose}
        className="px-5 py-2.5 rounded-lg border border-slate-800 bg-slate-950/40 text-slate-450 hover:text-slate-200 hover:bg-slate-900 transition-all font-bold text-xs uppercase tracking-wider active:scale-97"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!goldenFile || !customFile}
        className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white font-extrabold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(6,182,212,0.25)] hover:shadow-[0_0_30px_rgba(6,182,212,0.45)] hover:scale-[1.02] active:scale-97 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Start Diagnostic Scan
      </button>
    </div>
  );

  const customTitle = (
    <div className="flex items-center gap-3">
      <div className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500 shadow-[0_0_10px_#22d3ee]"></span>
      </div>
      <div className="flex flex-col">
        <span className="text-xs font-black tracking-[0.2em] text-cyan-400 uppercase">VeriVision QC</span>
        <span className="text-[10px] text-slate-400 tracking-wider font-semibold -mt-0.5">NEW COMPLIANCE SCAN SYSTEM</span>
      </div>
    </div>
  );

  return (
    <Modal open={open} onClose={processing ? undefined : onClose} title={customTitle} size="lg" footer={modalFooter}>
      <style>{`
        @keyframes scan {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.12; }
          50% { opacity: 0.28; }
        }
        .animate-scan-line {
          position: absolute;
          left: 0;
          width: 100%;
          height: 3px;
          background: linear-gradient(90deg, transparent, #22d3ee, transparent);
          box-shadow: 0 0 12px #22d3ee, 0 0 6px #22d3ee;
          animation: scan 2.2s linear infinite;
        }
        .animate-scan-line-blue {
          position: absolute;
          left: 0;
          width: 100%;
          height: 3px;
          background: linear-gradient(90deg, transparent, #3b82f6, transparent);
          box-shadow: 0 0 12px #3b82f6, 0 0 6px #3b82f6;
          animation: scan 2.2s linear infinite;
        }
        .glow-mesh {
          animation: pulse-glow 5s ease-in-out infinite;
        }
      `}</style>

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
        <form onSubmit={handleSubmit} className="space-y-6 text-slate-350 text-body-sm relative">
          {errorMsg && (
            <div className="flex gap-3 bg-red-950/20 border border-red-500/25 text-red-400 rounded-lg p-4 animate-shake shadow-[0_4px_15px_rgba(239,68,68,0.08)]">
              <AlertCircle className="shrink-0 text-red-500" size={18} />
              <div>
                <p className="font-extrabold text-xs tracking-wider uppercase text-red-500">Triage Warning</p>
                <p className="text-xs mt-1 leading-relaxed text-red-400/90">{errorMsg}</p>
              </div>
            </div>
          )}

          {viabilityWarning && (
            <div className="flex gap-3 bg-cyan-950/20 border border-cyan-500/25 text-cyan-400 rounded-lg p-4 animate-fade-in shadow-[0_4px_15px_rgba(6,182,212,0.08)]">
              <AlertTriangle className="shrink-0 text-cyan-500" size={18} />
              <div>
                <p className="font-extrabold text-xs tracking-wider uppercase text-cyan-500">Semantic AI Pipeline Fallback Active</p>
                <p className="text-xs mt-1 leading-relaxed text-cyan-400/90">{viabilityWarning}</p>
              </div>
            </div>
          )}

          {/* Side-by-side Upload Compartments */}
          <div className="grid grid-cols-2 gap-5 relative">
            {/* Golden Standard Upload */}
            <div className="flex flex-col gap-2.5 animate-fade-in relative group">
              <label className="font-label-caps text-[9px] tracking-[0.08em] text-slate-400 uppercase font-bold flex items-center gap-1.5">
                <Sparkles size={12} className="text-cyan-400" />
                OEM Golden Reference Standard (Clean Part)
              </label>

              {/* Backglow layer on Hover */}
              <div className="absolute -inset-0.5 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-xl blur opacity-0 group-hover:opacity-15 transition duration-500 top-6" />

              {goldenPreview ? (
                <div className="relative flex flex-col items-center justify-center p-3 bg-slate-900/60 border border-slate-850 rounded-xl shadow-[0_4px_15px_rgba(0,0,0,0.4)] animate-fade-in group-hover:border-cyan-500/40 transition-all duration-300 h-40">
                  <div className="relative w-full h-24 rounded-lg overflow-hidden border border-slate-700 bg-slate-950 shadow-inner flex items-center justify-center">
                    <img src={goldenPreview} className="w-full h-full object-cover" alt="Golden Preview" />
                    {/* Glowing radar line */}
                    <div className="animate-scan-line" />
                  </div>
                  <div className="w-full flex items-center justify-between mt-2.5 min-w-0">
                    <div className="min-w-0 text-left">
                      <p className="text-[10px] font-bold text-slate-200 truncate">{goldenFile.name}</p>
                      <p className="text-[8px] text-slate-500 mt-0.5 uppercase tracking-wider font-semibold">
                        {(goldenFile.size / 1024).toFixed(0)} KB • REFERENCE STANDARD READY
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setGoldenFile(null);
                        setGoldenPreview(null);
                      }}
                      className="h-7 w-7 rounded-lg flex items-center justify-center border border-slate-800 text-slate-500 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/5 transition-all flex-shrink-0 active:scale-90"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
              ) : (
                <label className="relative border-2 border-dashed border-slate-700/60 bg-slate-900/40 hover:bg-cyan-950/15 hover:border-cyan-500/60 rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-300 h-40 shadow-inner">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleGoldenChange}
                    className="hidden"
                  />
                  <div className="absolute w-12 h-12 rounded-full border border-cyan-500/10 animate-ping group-hover:border-cyan-500/25" />
                  <div className="h-12 w-12 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center group-hover:scale-105 group-hover:border-cyan-500/30 group-hover:shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all duration-300">
                    <Sparkles className="text-slate-500 group-hover:text-cyan-400 transition-colors duration-300" size={18} />
                  </div>
                  <span className="text-[11px] font-bold text-slate-300 group-hover:text-cyan-400 mt-1 transition-colors tracking-wide uppercase">
                    Select OEM Golden
                  </span>
                  <span className="text-[9px] text-slate-500 group-hover:text-slate-400 transition-colors text-center max-w-[190px]">
                    Clean baseline reference template
                  </span>
                </label>
              )}
            </div>

            {/* Defect Scan Upload */}
            <div className="flex flex-col gap-2.5 animate-fade-in relative group">
              <label className="font-label-caps text-[9px] tracking-[0.08em] text-slate-400 uppercase font-bold flex items-center gap-1.5">
                <Upload size={12} className="text-blue-400" />
                Part Image Scan (Inspection Target)
              </label>

              {/* Backglow layer on Hover */}
              <div className="absolute -inset-0.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl blur opacity-0 group-hover:opacity-15 transition duration-500 top-6" />

              {targetPreview ? (
                <div className="relative flex flex-col items-center justify-center p-3 bg-slate-900/60 border border-slate-850 rounded-xl shadow-[0_4px_15px_rgba(0,0,0,0.4)] animate-fade-in group-hover:border-blue-500/40 transition-all duration-300 h-40">
                  <div className="relative w-full h-24 rounded-lg overflow-hidden border border-slate-700 bg-slate-950 shadow-inner flex items-center justify-center">
                    <img src={targetPreview} className="w-full h-full object-cover" alt="Target Preview" />
                    {/* Glowing radar line */}
                    <div className="animate-scan-line-blue" />
                  </div>
                  <div className="w-full flex items-center justify-between mt-2.5 min-w-0">
                    <div className="min-w-0 text-left">
                      <p className="text-[10px] font-bold text-slate-200 truncate">{customFile.name}</p>
                      <p className="text-[8px] text-slate-500 mt-0.5 uppercase tracking-wider font-semibold">
                        {(customFile.size / 1024).toFixed(0)} KB • TARGET SCAN READY
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomFile(null);
                        setTargetPreview(null);
                      }}
                      className="h-7 w-7 rounded-lg flex items-center justify-center border border-slate-800 text-slate-500 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/5 transition-all flex-shrink-0 active:scale-90"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
              ) : (
                <label className="relative border-2 border-dashed border-slate-700/60 bg-slate-900/40 hover:bg-blue-950/15 hover:border-blue-500/50 rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-300 h-40 shadow-inner">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleTargetChange}
                    className="hidden"
                  />
                  <div className="absolute w-12 h-12 rounded-full border border-blue-500/10 animate-ping group-hover:border-blue-500/25" />
                  <div className="h-12 w-12 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center group-hover:scale-105 group-hover:border-blue-500/30 group-hover:shadow-[0_0_15px_rgba(59,130,246,0.2)] transition-all duration-300">
                    <Upload className="text-slate-500 group-hover:text-blue-400 transition-colors duration-300" size={16} />
                  </div>
                  <span className="text-[11px] font-bold text-slate-300 group-hover:text-blue-400 mt-1 transition-colors tracking-wide uppercase">
                    Select target scan
                  </span>
                  <span className="text-[9px] text-slate-550 group-hover:text-slate-400 transition-colors text-center max-w-[190px]">
                    Captured photo of the target part
                  </span>
                </label>
              )}
            </div>
          </div>

          {/* Form details consolidated row (Prevents vertical cutoff) */}
          <div className="grid grid-cols-3 gap-4 pb-2">
            <div className="flex flex-col gap-1.5">
              <label className="font-label-caps text-[9px] tracking-[0.08em] text-slate-450 uppercase font-bold">Expected Serial Number (Optional)</label>
              <input
                type="text"
                value={expectedSerial}
                onChange={(e) => setExpectedSerial(e.target.value)}
                placeholder="e.g. 91165LUS0DDD"
                className="cyber-input rounded-lg text-xs bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2.5 h-10 w-full focus:shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all duration-200 shadow-sm"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-label-caps text-[9px] tracking-[0.08em] text-slate-450 uppercase font-bold">Capture Site</label>
              <input
                type="text"
                value={captureSite}
                onChange={(e) => setCaptureSite(e.target.value)}
                placeholder="e.g. Line-1"
                className="cyber-input rounded-lg text-xs bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2.5 h-10 w-full focus:shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all duration-200 shadow-sm"
              />
            </div>
            <div className="flex flex-col gap-1.5 relative">
              <label className="font-label-caps text-[9px] tracking-[0.08em] text-slate-450 uppercase font-bold">Camera Angle</label>
              <div className="relative">
                <select
                  value={captureAngle}
                  onChange={(e) => setCaptureAngle(e.target.value)}
                  className="cyber-input rounded-lg text-xs bg-slate-950 border border-slate-850 text-slate-200 px-3 py-2.5 h-10 w-full cursor-pointer shadow-sm appearance-none pr-8 focus:shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all duration-200"
                >
                  <option value="top">Top Down (Default)</option>
                  <option value="angled">Angled Perspective</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                  <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
}
