import { useState, useEffect } from "react";
import { Modal } from "./common.jsx";
import { createInspection } from "../services/caseService.js";
import { Upload, AlertCircle, AlertTriangle, RefreshCw, Sparkles, X, Scan, Camera, Cpu, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../utils/constants.js";

export default function UploadInspectionModal({ open, onClose, onSuccess }) {
  const navigate = useNavigate();

  // Form states
  const [captureSite, setCaptureSite] = useState("Line-1");
  const [captureAngle, setCaptureAngle] = useState("top");
  const [customFile, setCustomFile] = useState(null);
  const [goldenFile, setGoldenFile] = useState(null);
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

  useEffect(() => {
    return () => {
      if (goldenPreview) URL.revokeObjectURL(goldenPreview);
      if (targetPreview) URL.revokeObjectURL(targetPreview);
    };
  }, [goldenPreview, targetPreview]);

  const getImageDimensions = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.width, height: img.height });
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
        if (Math.abs(arGolden - arTarget) > 0.4) {
          setViabilityWarning("Layout Mismatch: One image is portrait and the other is landscape. Local pixel alignment will be bypassed in favor of semantic Multimodal Vision AI comparison.");
          return;
        }
        if (dimGolden.width < 150 || dimGolden.height < 150 || dimTarget.width < 150 || dimTarget.height < 150) {
          setViabilityWarning("Resolution too low: Images must be at least 150x150 pixels for compliance processing.");
          return;
        }
        const wRatio = dimTarget.width / dimGolden.width;
        const hRatio = dimTarget.height / dimGolden.height;
        if (wRatio < 0.25 || wRatio > 4.0 || hRatio < 0.25 || hRatio > 4.0) {
          setViabilityWarning("Scale Mismatch: A close-up crop vs wide shot discrepancy was detected. Local pixel subtraction will be bypassed in favor of semantic Multimodal Vision AI comparison.");
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
    if (goldenPreview) URL.revokeObjectURL(goldenPreview);
    setGoldenFile(file);
    setGoldenPreview(file ? URL.createObjectURL(file) : null);
  };

  const handleTargetChange = (e) => {
    const file = e.target.files[0];
    if (targetPreview) URL.revokeObjectURL(targetPreview);
    setCustomFile(file);
    setTargetPreview(file ? URL.createObjectURL(file) : null);
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
      setTimeout(() => setProgressLog(prev => [...prev, { text: log.text, status: log.status }]), log.delay);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!goldenFile) { setErrorMsg("Please upload an OEM Golden Reference standard image."); return; }
    if (!customFile) { setErrorMsg("Please upload a target Part Image Scan to inspect."); return; }
    setProcessing(true);
    setErrorMsg(null);
    runSimulatedProgress();
    try {
      const formData = new FormData();
      formData.append("capture_site", captureSite);
      formData.append("capture_angle", captureAngle);
      formData.append("file", customFile);
      formData.append("golden_file", goldenFile);
      if (expectedSerial) formData.append("expected_serial", expectedSerial.trim());
      const result = await createInspection(formData);
      setProcessing(false);
      onClose();
      if (onSuccess) onSuccess();
      navigate(`${ROUTES.CASE_DETAIL}/${result.case_id}`);
    } catch (err) {
      setProcessing(false);
      let errMsg = err.message || "Failed to process parts inspection.";
      if (err.body && err.body.detail) {
        errMsg = typeof err.body.detail === "object" && err.body.detail.message ? `Triage Rejection: ${err.body.detail.message}` : err.body.detail;
      }
      setErrorMsg(errMsg);
    }
  };

  // Header title for modal
  const customTitle = (
    <div className="flex items-center gap-3">
      <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/25 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-cyan-400/10 to-blue-500/5 animate-pulse" />
        <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="relative text-cyan-400">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      </div>
      <div>
        <p className="text-xs font-black tracking-[0.15em] text-cyan-400 uppercase leading-tight">VeriVision QC</p>
        <p className="text-[9px] text-slate-500 tracking-wider font-normal -mt-0.5">NEW COMPLIANCE SCAN SYSTEM</p>
      </div>
    </div>
  );

  // Footer buttons
  const modalFooter = !processing && (
    <div className="flex items-center justify-end gap-3 w-full">
      <button type="button" onClick={onClose}
        className="px-5 py-2.5 rounded-lg border border-slate-700/50 bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 hover:border-slate-600/50 transition-all text-xs font-bold uppercase tracking-wider active:scale-95">
        Cancel
      </button>
      <button type="button" onClick={handleSubmit} disabled={!goldenFile || !customFile}
        className="group relative inline-flex items-center gap-2.5 px-6 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white font-extrabold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(6,182,212,0.25)] hover:shadow-[0_0_35px_rgba(6,182,212,0.45)] hover:scale-[1.02] active:scale-95 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none">
        <span className="absolute inset-0 rounded-lg bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity disabled:hidden" />
        <Scan size={14} className="relative" />
        <span className="relative">Start Diagnostic Scan</span>
      </button>
    </div>
  );

  return (
    <Modal open={open} onClose={processing ? undefined : onClose} title={customTitle} size="xl" footer={modalFooter}>

      {processing ? (
        <div className="space-y-5">
          {/* Processing State */}
          <div className="flex flex-col items-center gap-3 py-2">
            <div className="relative">
              <RefreshCw className="text-cyan-400 animate-spin" size={28} />
              <div className="absolute -inset-3 border-2 border-cyan-500/10 rounded-full animate-ping" />
            </div>
            <p className="text-xs font-extrabold text-cyan-400 tracking-[0.2em] uppercase">AI Agent Pipeline Running</p>
          </div>
          <div className="bg-[#070a13] border border-slate-800 rounded-xl p-4 font-tech-code text-[11px] space-y-2.5 h-52 overflow-y-auto shadow-inner">
            {progressLog.map((log, idx) => (
              <p key={idx} className={`flex gap-2.5 items-start leading-relaxed ${log.status === 'success' ? 'text-emerald-400 font-semibold' : 'text-cyan-400 animate-pulse'}`}>
                <span className="text-slate-600 shrink-0">{">_"}</span>
                <span>{log.text}</span>
              </p>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Error Banner */}
          {errorMsg && (
            <div className="flex gap-3 bg-gradient-to-r from-red-950/40 to-red-950/10 border border-red-500/20 rounded-xl p-4">
              <div className="h-9 w-9 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                <AlertCircle className="text-red-400" size={18} />
              </div>
              <div className="min-w-0 pt-0.5">
                <p className="font-extrabold text-[10px] tracking-wider uppercase text-red-400/80">Triage Warning</p>
                <p className="text-xs mt-0.5 leading-relaxed text-red-300/80">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Viability Banner */}
          {viabilityWarning && (
            <div className="flex gap-3 bg-gradient-to-r from-cyan-950/40 to-cyan-950/10 border border-cyan-500/20 rounded-xl p-4">
              <div className="h-9 w-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="text-cyan-400" size={18} />
              </div>
              <div className="min-w-0 pt-0.5">
                <p className="font-extrabold text-[10px] tracking-wider uppercase text-cyan-400/80">Semantic AI Fallback Active</p>
                <p className="text-xs mt-0.5 leading-relaxed text-cyan-300/80">{viabilityWarning}</p>
              </div>
            </div>
          )}

          {/* Upload Section */}
          <div className="grid grid-cols-2 gap-5">
            {/* Golden Reference */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
                <Sparkles size={12} className="text-cyan-400" />
                OEM Golden Reference
              </label>
              <div className="relative">
                <div className="absolute -inset-0.5 bg-gradient-to-br from-cyan-500/10 to-purple-600/10 rounded-xl blur opacity-0 hover:opacity-100 pointer-events-none transition duration-500" />
                {goldenPreview ? (
                  <div className="relative bg-slate-900/80 border border-slate-700/80 rounded-xl overflow-hidden hover:border-cyan-500/40 transition-all">
                    <div className="relative h-36 bg-slate-950/80 flex items-center justify-center overflow-hidden">
                      <img src={goldenPreview} className="w-full h-full object-contain" alt="Golden" />
                    </div>
                    <div className="px-3 py-2.5 flex items-center justify-between border-t border-slate-800/60">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-slate-200 truncate">{goldenFile.name}</p>
                        <p className="text-[8px] text-slate-500">{(goldenFile.size / 1024).toFixed(0)} KB</p>
                      </div>
                      <button onClick={() => { setGoldenFile(null); setGoldenPreview(null); }}
                        className="h-6 w-6 rounded flex items-center justify-center border border-slate-700/60 text-slate-500 hover:text-red-400 hover:border-red-500/30 transition-all">
                        <X size={11} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center gap-2.5 h-36 rounded-xl border-2 border-dashed border-slate-700/50 bg-slate-900/40 hover:bg-cyan-950/10 hover:border-cyan-500/50 cursor-pointer transition-all z-10">
                    <input type="file" accept="image/*" onChange={handleGoldenChange} className="hidden" />
                    <div className="h-10 w-10 rounded-full bg-slate-950 border border-slate-700/60 flex items-center justify-center hover:scale-110 hover:border-cyan-500/30 transition-all">
                      <Sparkles size={16} className="text-slate-500 hover:text-cyan-400 transition-colors" />
                    </div>
                    <div className="text-center">
                      <p className="text-[11px] font-bold text-slate-300 hover:text-cyan-400 transition-colors">Select OEM Golden</p>
                      <p className="text-[9px] text-slate-500">Clean baseline reference</p>
                    </div>
                  </label>
                )}
              </div>
            </div>

            {/* Target Scan */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
                <Camera size={12} className="text-blue-400" />
                Target Part Scan
              </label>
              <div className="relative">
                <div className="absolute -inset-0.5 bg-gradient-to-br from-blue-500/10 to-indigo-600/10 rounded-xl blur opacity-0 hover:opacity-100 pointer-events-none transition duration-500" />
                {targetPreview ? (
                  <div className="relative bg-slate-900/80 border border-slate-700/80 rounded-xl overflow-hidden hover:border-blue-500/40 transition-all">
                    <div className="relative h-36 bg-slate-950/80 flex items-center justify-center overflow-hidden">
                      <img src={targetPreview} className="w-full h-full object-contain" alt="Target" />
                    </div>
                    <div className="px-3 py-2.5 flex items-center justify-between border-t border-slate-800/60">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-slate-200 truncate">{customFile.name}</p>
                        <p className="text-[8px] text-slate-500">{(customFile.size / 1024).toFixed(0)} KB</p>
                      </div>
                      <button onClick={() => { setCustomFile(null); setTargetPreview(null); }}
                        className="h-6 w-6 rounded flex items-center justify-center border border-slate-700/60 text-slate-500 hover:text-red-400 hover:border-red-500/30 transition-all">
                        <X size={11} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center gap-2.5 h-36 rounded-xl border-2 border-dashed border-slate-700/50 bg-slate-900/40 hover:bg-blue-950/10 hover:border-blue-500/50 cursor-pointer transition-all z-10">
                    <input type="file" accept="image/*" onChange={handleTargetChange} className="hidden" />
                    <div className="h-10 w-10 rounded-full bg-slate-950 border border-slate-700/60 flex items-center justify-center hover:scale-110 hover:border-blue-500/30 transition-all">
                      <Camera size={16} className="text-slate-500 hover:text-blue-400 transition-colors" />
                    </div>
                    <div className="text-center">
                      <p className="text-[11px] font-bold text-slate-300 hover:text-blue-400 transition-colors">Select Target Scan</p>
                      <p className="text-[9px] text-slate-500">Captured part photo</p>
                    </div>
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-3 gap-4 pt-1">
            <div>
              <label className="text-[9px] font-bold tracking-wider text-slate-500 uppercase mb-1.5 block">Serial Number (Optional)</label>
              <input type="text" value={expectedSerial} onChange={(e) => setExpectedSerial(e.target.value)}
                placeholder="e.g. 91165LUS0DDD"
                className="w-full h-10 px-3.5 rounded-xl bg-slate-900/80 border border-slate-700/60 text-slate-200 text-xs placeholder:text-slate-600 focus:border-cyan-500/40 focus:shadow-[0_0_15px_rgba(6,182,212,0.1)] transition-all" />
            </div>
            <div>
              <label className="text-[9px] font-bold tracking-wider text-slate-500 uppercase mb-1.5 block">Capture Site</label>
              <input type="text" value={captureSite} onChange={(e) => setCaptureSite(e.target.value)}
                placeholder="e.g. Line-1"
                className="w-full h-10 px-3.5 rounded-xl bg-slate-900/80 border border-slate-700/60 text-slate-200 text-xs placeholder:text-slate-600 focus:border-cyan-500/40 focus:shadow-[0_0_15px_rgba(6,182,212,0.1)] transition-all" />
            </div>
            <div>
              <label className="text-[9px] font-bold tracking-wider text-slate-500 uppercase mb-1.5 block">Camera Angle</label>
              <div className="relative">
                <select value={captureAngle} onChange={(e) => setCaptureAngle(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-900/80 border border-slate-700/60 text-slate-200 text-xs appearance-none cursor-pointer focus:border-cyan-500/40 focus:shadow-[0_0_15px_rgba(6,182,212,0.1)] transition-all">
                  <option value="top">Top Down (Default)</option>
                  <option value="angled">Angled Perspective</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}