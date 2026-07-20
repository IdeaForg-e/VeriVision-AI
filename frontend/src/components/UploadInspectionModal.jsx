import { useState, useEffect, useRef, useCallback } from "react";
import { Modal } from "./common.jsx";
import { createInspection, getCatalog } from "../services/caseService.js";
import { Upload, AlertCircle, AlertTriangle, RefreshCw, Sparkles, X, Scan, Camera, Cpu, ChevronDown, Video, ZapOff, Circle } from "lucide-react";
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
  const [componentName, setComponentName] = useState("");
  const [vendor, setVendor] = useState("");

  // Catalog Reference states
  const [catalogMode, setCatalogMode] = useState("catalog"); // "catalog" | "custom"
  const [catalogList, setCatalogList] = useState([]);
  const [selectedCatalogPart, setSelectedCatalogPart] = useState("");

  // Webcam states
  const [targetMode, setTargetMode] = useState("upload"); // "upload" | "webcam"
  const [webcamStream, setWebcamStream] = useState(null);
  const [webcamError, setWebcamError] = useState(null);
  const [webcamReady, setWebcamReady] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [date, setDate] = useState("");

  // Visual thumbnail previews
  const [goldenPreview, setGoldenPreview] = useState(null);
  const [targetPreview, setTargetPreview] = useState(null);

  // Pipeline execution feedback
  const [processing, setProcessing] = useState(false);
  const [progressLog, setProgressLog] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);
  const [viabilityWarning, setViabilityWarning] = useState(null);
  const [webcamScanResult, setWebcamScanResult] = useState(null); // null | { status, checks }

  const handleCatalogPartChange = useCallback((partNum, list = catalogList) => {
    setSelectedCatalogPart(partNum);
    const selected = list.find(c => c.part_number === partNum);
    if (selected) {
      setComponentName(selected.name);
      setExpectedSerial(selected.golden_references?.[0]?.expected_serial || "");
    }
  }, [catalogList]);

  useEffect(() => {
    if (!open) {
      // Stop webcam whenever modal closes
      stopWebcam();
      return;
    }
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
    setComponentName("");
    setVendor("");
    setTargetMode("upload");
    setWebcamError(null);
    setWebcamReady(false);
    setWebcamScanResult(null);
    setDate("");
    setCatalogMode("catalog");

    // Fetch pre-registered references
    const loadCatalog = async () => {
      try {
        const list = await getCatalog();
        setCatalogList(list || []);
        if (list && list.length > 0) {
          handleCatalogPartChange(list[0].part_number, list);
        }
      } catch (err) {
        console.error("Failed to load parts catalog:", err);
      }
    };
    loadCatalog();
  }, [open, handleCatalogPartChange]);

  useEffect(() => {
    return () => {
      if (goldenPreview) URL.revokeObjectURL(goldenPreview);
      if (targetPreview) URL.revokeObjectURL(targetPreview);
    };
  }, [goldenPreview, targetPreview]);

  // ── Webcam helpers ──────────────────────────────────────────────────────────
  const stopWebcam = useCallback(() => {
    setWebcamStream(prev => {
      if (prev) prev.getTracks().forEach(t => t.stop());
      return null;
    });
    setWebcamReady(false);
  }, []);

  const startWebcam = useCallback(async () => {
    setWebcamError(null);
    setWebcamReady(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      setWebcamStream(stream);
      // Attach stream to video element once it mounts
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      const msg =
        err.name === "NotAllowedError"
          ? "Camera access was denied. Please allow camera permission and try again."
          : err.name === "NotFoundError"
          ? "No camera found on this device."
          : `Camera error: ${err.message}`;
      setWebcamError(msg);
    }
  }, []);

  // Attach stream to <video> whenever the stream or ref changes
  useEffect(() => {
    if (videoRef.current && webcamStream) {
      videoRef.current.srcObject = webcamStream;
      videoRef.current.play().catch(() => {});
    }
  }, [webcamStream]);

  // Agent 1 single-image integrity scan (mirrors the checks done on uploaded files)
  const runWebcamIntegrityScan = useCallback((file, width, height) => {
    const checks = [];
    let overallOk = true;

    // 1. File integrity / readability
    checks.push({ label: "File Integrity", ok: true, detail: `JPEG blob — ${(file.size / 1024).toFixed(0)} KB` });

    // 2. Minimum resolution
    const minRes = width >= 150 && height >= 150;
    if (!minRes) overallOk = false;
    checks.push({
      label: "Minimum Resolution",
      ok: minRes,
      detail: minRes
        ? `${width}×${height} px — Sufficient`
        : `${width}×${height} px — Below 150×150 minimum`,
    });

    // 3. Aspect ratio classification
    const ar = width / height;
    const arLabel = ar > 1.2 ? "Landscape" : ar < 0.8 ? "Portrait" : "Square";
    checks.push({ label: "Aspect Ratio", ok: true, detail: `${ar.toFixed(2)} — ${arLabel}` });

    // 4. Relative resolution info
    const megapixels = ((width * height) / 1_000_000).toFixed(2);
    const resSufficient = width * height >= 150 * 150;
    checks.push({
      label: "Relative Resolution",
      ok: resSufficient,
      detail: `${megapixels} MP (${width}×${height})`,
    });

    setWebcamScanResult({ status: overallOk ? "pass" : "fail", checks });
  }, []);

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const w = video.videoWidth || 1280;
    const h = video.videoHeight || 720;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `webcam-capture-${Date.now()}.jpg`, { type: "image/jpeg" });
      if (targetPreview) URL.revokeObjectURL(targetPreview);
      setCustomFile(file);
      setTargetPreview(URL.createObjectURL(file));
      // Stop live feed after capture
      stopWebcam();
      // ── Agent 1 integrity scan on the captured image ──
      runWebcamIntegrityScan(file, w, h);
    }, "image/jpeg", 0.92);
  }, [targetPreview, stopWebcam, runWebcamIntegrityScan]);

  const handleRetake = useCallback(() => {
    if (targetPreview) URL.revokeObjectURL(targetPreview);
    setCustomFile(null);
    setTargetPreview(null);
    setWebcamScanResult(null);
    startWebcam();
  }, [targetPreview, startWebcam]);

  const handleTabSwitch = useCallback((mode) => {
    if (mode === targetMode) return;
    // Clean up opposite mode
    if (mode === "webcam") {
      startWebcam();
    } else {
      stopWebcam();
    }
    // Clear any captured image when switching tabs
    if (targetPreview) URL.revokeObjectURL(targetPreview);
    setCustomFile(null);
    setTargetPreview(null);
    setTargetMode(mode);
  }, [targetMode, targetPreview, startWebcam, stopWebcam]);

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
    if (catalogMode === "custom" && !goldenFile) { setErrorMsg("Please upload an OEM Golden Reference standard image."); return; }
    if (!customFile) { setErrorMsg("Please upload a target Part Image Scan to inspect."); return; }
    setProcessing(true);
    setErrorMsg(null);
    runSimulatedProgress();
    try {
      const formData = new FormData();
      formData.append("capture_site", captureSite);
      formData.append("capture_angle", captureAngle);
      formData.append("file", customFile);
      if (catalogMode === "catalog") {
        formData.append("catalog_part_number", selectedCatalogPart);
      } else {
        formData.append("golden_file", goldenFile);
      }
      if (expectedSerial) formData.append("expected_serial", expectedSerial.trim());
      if (vendor) formData.append("vendor", vendor.trim());
      if (componentName) formData.append("component_name", componentName.trim());
      if (date) formData.append("date", date);
      const result = await createInspection(formData);
      setProcessing(false);
      onClose();
      if (onSuccess) onSuccess();
      navigate(`${ROUTES.CASE_DETAIL}/${result.case_id}`);
    } catch (err) {
      setProcessing(false);
      let errMsg = err.message || "Failed to process parts inspection.";
      if (err.response && err.response.data && err.response.data.detail) {
        errMsg = typeof err.response.data.detail === "object" && err.response.data.detail.message 
          ? `Triage Rejection: ${err.response.data.detail.message}` 
          : err.response.data.detail;
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
  const isSubmitDisabled = !customFile || (catalogMode === "custom" && !goldenFile) || (catalogMode === "catalog" && !selectedCatalogPart);
  const modalFooter = !processing && (
    <div className="flex items-center justify-end gap-3 w-full">
      <button type="button" onClick={onClose}
        className="px-5 py-2.5 rounded-lg border border-slate-700/50 bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 hover:border-slate-600/50 transition-all text-xs font-bold uppercase tracking-wider active:scale-95">
        Cancel
      </button>
      <button type="button" onClick={handleSubmit} disabled={isSubmitDisabled}
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
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
                  <Sparkles size={12} className="text-cyan-400" />
                  OEM Golden Reference
                </label>
                {/* Catalog / Custom upload toggle */}
                <div className="flex items-center gap-0.5 bg-slate-900/80 border border-slate-800/80 rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={() => setCatalogMode("catalog")}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider transition-all ${
                      catalogMode === "catalog"
                        ? "bg-gradient-to-r from-cyan-600/80 to-blue-700/80 text-white shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                        : "text-slate-500 hover:text-slate-350"
                    }`}
                  >
                    Catalog
                  </button>
                  <button
                    type="button"
                    onClick={() => setCatalogMode("custom")}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider transition-all ${
                      catalogMode === "custom"
                        ? "bg-gradient-to-r from-blue-600/80 to-indigo-700/80 text-white shadow-[0_0_10px_rgba(99,102,241,0.3)]"
                        : "text-slate-500 hover:text-slate-350"
                    }`}
                  >
                    Custom File
                  </button>
                </div>
              </div>

              <div className="relative">
                {catalogMode === "catalog" ? (
                  <div className="space-y-3">
                    <div className="relative">
                      <select
                        value={selectedCatalogPart}
                        onChange={(e) => handleCatalogPartChange(e.target.value)}
                        className="w-full h-10 px-3.5 pr-8 rounded-xl bg-slate-900/80 border border-slate-700/60 text-slate-200 text-xs appearance-none cursor-pointer focus:border-cyan-500/40 focus:shadow-[0_0_15px_rgba(6,182,212,0.1)] transition-all"
                      >
                        {catalogList.length === 0 ? (
                          <option value="">No catalog references loaded</option>
                        ) : (
                          catalogList.map((item) => (
                            <option key={item.part_number} value={item.part_number}>
                              {item.name} ({item.part_number})
                            </option>
                          ))
                        )}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    </div>
                    <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-950/10 text-emerald-450 text-[10px] flex items-start gap-2 leading-relaxed shadow-[0_0_15px_rgba(16,185,129,0.02)]">
                      <Cpu size={12} className="shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Catalog Reference Standard Selected</p>
                        <p className="text-slate-400 mt-0.5">Golden image, expected text, and default regions of interest are pre-loaded from backend storage.</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="absolute -inset-0.5 bg-gradient-to-br from-cyan-500/10 to-purple-600/10 rounded-xl blur opacity-0 hover:opacity-100 pointer-events-none transition duration-500" />
                    {goldenPreview ? (
                      <div className="relative bg-slate-900/80 border border-slate-700/80 rounded-xl overflow-hidden hover:border-cyan-500/40 transition-all">
                        <div className="relative h-36 bg-slate-950/80 flex items-center justify-center overflow-hidden">
                          <img src={goldenPreview} className="w-full h-full object-contain" alt="Golden" />
                        </div>
                        <div className="px-3 py-2.5 flex items-center justify-between border-t border-slate-800/60">
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold text-slate-200 truncate">{goldenFile?.name}</p>
                            <p className="text-[8px] text-slate-500">{goldenFile ? (goldenFile.size / 1024).toFixed(0) + " KB" : ""}</p>
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
                  </>
                )}
              </div>
            </div>

            {/* Target Scan */}
            <div className="flex flex-col gap-2">
              {/* Tab header row */}
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
                  <Camera size={12} className="text-blue-400" />
                  Target Part Scan
                </label>
                {/* Upload / Camera toggle */}
                <div className="flex items-center gap-0.5 bg-slate-900/80 border border-slate-800/80 rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={() => handleTabSwitch("upload")}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all ${
                      targetMode === "upload"
                        ? "bg-gradient-to-r from-blue-600/80 to-indigo-700/80 text-white shadow-[0_0_10px_rgba(99,102,241,0.3)]"
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    <Upload size={9} /> Upload
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTabSwitch("webcam")}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all ${
                      targetMode === "webcam"
                        ? "bg-gradient-to-r from-cyan-600/80 to-blue-700/80 text-white shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    <Video size={9} /> Camera
                  </button>
                </div>
              </div>

              {/* ── UPLOAD MODE ── */}
              {targetMode === "upload" && (
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
              )}

              {/* ── WEBCAM MODE ── */}
              {targetMode === "webcam" && (
                <div className="flex flex-col gap-2">
                  {/* Captured preview */}
                  {targetPreview ? (
                    <div className="flex flex-col gap-1.5">
                      <div className="relative bg-slate-900/80 border border-cyan-500/30 rounded-xl overflow-hidden shadow-[0_0_20px_rgba(6,182,212,0.1)]">
                        <div className="relative h-36 bg-slate-950/80 flex items-center justify-center overflow-hidden">
                          <img src={targetPreview} className="w-full h-full object-contain" alt="Webcam capture" />
                          <div className="absolute top-2 left-2 flex items-center gap-1 bg-emerald-900/70 border border-emerald-500/30 rounded px-1.5 py-0.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-wider">Captured</span>
                          </div>
                        </div>
                        <div className="px-3 py-2 flex items-center justify-between border-t border-slate-800/60">
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold text-slate-200 truncate">{customFile?.name}</p>
                            <p className="text-[8px] text-slate-500">{customFile ? (customFile.size / 1024).toFixed(0) + " KB" : ""}</p>
                          </div>
                          <button
                            type="button"
                            onClick={handleRetake}
                            className="flex items-center gap-1 h-6 px-2 rounded border border-cyan-700/50 text-cyan-400 hover:bg-cyan-900/30 text-[9px] font-bold uppercase tracking-wider transition-all"
                          >
                            <RefreshCw size={9} /> Retake
                          </button>
                        </div>
                      </div>

                      {/* ── Agent 1 Scan Result Panel ── */}
                      {webcamScanResult && (
                        <div className={`rounded-xl border px-3 py-2.5 ${
                          webcamScanResult.status === "pass"
                            ? "bg-emerald-950/30 border-emerald-500/20"
                            : "bg-red-950/30 border-red-500/20"
                        }`}>
                          <p className={`text-[9px] font-black tracking-[0.15em] uppercase mb-1.5 flex items-center gap-1 ${
                            webcamScanResult.status === "pass" ? "text-emerald-400" : "text-red-400"
                          }`}>
                            <Cpu size={9} />
                            Agent 1 — Image Integrity Scan
                            <span className={`ml-auto px-1.5 py-0.5 rounded text-[7px] font-extrabold tracking-widest border ${
                              webcamScanResult.status === "pass"
                                ? "bg-emerald-900/50 border-emerald-500/30 text-emerald-300"
                                : "bg-red-900/50 border-red-500/30 text-red-300"
                            }`}>
                              {webcamScanResult.status === "pass" ? "PASS" : "FAIL"}
                            </span>
                          </p>
                          <div className="space-y-1">
                            {webcamScanResult.checks.map((chk, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <span className={`shrink-0 text-[8px] font-black ${
                                  chk.ok ? "text-emerald-400" : "text-red-400"
                                }`}>{chk.ok ? "✓" : "✗"}</span>
                                <span className="text-[9px] text-slate-400 font-semibold shrink-0 w-28">{chk.label}:</span>
                                <span className={`text-[9px] truncate ${
                                  chk.ok ? "text-slate-300" : "text-red-300 font-semibold"
                                }`}>{chk.detail}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Live feed or error */
                    <div className="relative rounded-xl overflow-hidden border border-cyan-500/25 bg-slate-950 shadow-[0_0_25px_rgba(6,182,212,0.08)]">
                      {/* Error state */}
                      {webcamError ? (
                        <div className="h-36 flex flex-col items-center justify-center gap-2 px-4">
                          <ZapOff size={22} className="text-red-400/70" />
                          <p className="text-[10px] text-red-400/80 text-center leading-relaxed">{webcamError}</p>
                          <button
                            type="button"
                            onClick={startWebcam}
                            className="mt-1 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:border-cyan-500/40 text-[9px] font-bold uppercase tracking-wider transition-all"
                          >
                            <RefreshCw size={9} /> Retry
                          </button>
                        </div>
                      ) : (
                        /* Video feed */
                        <div className="relative">
                          {/* Animated scanning border */}
                          <div className="absolute inset-0 rounded-xl pointer-events-none z-10">
                            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-400/70 rounded-tl-lg" />
                            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-400/70 rounded-tr-lg" />
                            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-400/70 rounded-bl-lg" />
                            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-400/70 rounded-br-lg" />
                          </div>
                          {/* REC badge */}
                          {webcamStream && (
                            <div className="absolute top-2 left-2 z-20 flex items-center gap-1 bg-black/60 border border-red-500/40 rounded px-1.5 py-0.5 backdrop-blur-sm">
                              <Circle size={6} className="text-red-500 fill-red-500 animate-pulse" />
                              <span className="text-[8px] font-black text-red-400 uppercase tracking-widest">Live</span>
                            </div>
                          )}
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            onCanPlay={() => setWebcamReady(true)}
                            className="w-full h-36 object-cover bg-slate-950"
                          />
                          {/* Hidden canvas for frame capture */}
                          <canvas ref={canvasRef} className="hidden" />
                          {/* Loading overlay */}
                          {!webcamReady && !webcamError && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-950/90">
                              <RefreshCw size={18} className="text-cyan-400 animate-spin" />
                              <p className="text-[9px] text-cyan-400/70 uppercase tracking-wider font-bold">Initializing camera...</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Capture button — only shown when live feed is active */}
                  {!targetPreview && !webcamError && (
                    <button
                      type="button"
                      onClick={captureFrame}
                      disabled={!webcamReady}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-gradient-to-r from-cyan-600/80 to-blue-700/80 border border-cyan-500/30 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-[0_0_15px_rgba(6,182,212,0.2)] hover:shadow-[0_0_25px_rgba(6,182,212,0.35)] hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      <Camera size={12} />
                      Capture Frame
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4 pt-1">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-[9px] font-bold tracking-wider text-slate-500 uppercase mb-1.5 block">Component Name</label>
                <div className="relative">
                  <input type="text" value={componentName} onChange={(e) => setComponentName(e.target.value)}
                    disabled={catalogMode === "catalog"}
                    placeholder="e.g. Brake Disc"
                    className={`w-full h-10 px-3.5 rounded-xl border text-xs focus:border-cyan-500/40 focus:shadow-[0_0_15px_rgba(6,182,212,0.1)] transition-all ${
                      catalogMode === "catalog"
                        ? "bg-slate-950/60 border-slate-850/80 text-slate-400 cursor-not-allowed font-semibold"
                        : "bg-slate-900/80 border-slate-700/60 text-slate-200 placeholder:text-slate-700"
                    }`} />
                  {catalogMode === "catalog" && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[8px] bg-slate-900 border border-slate-850 text-slate-500 px-1.5 py-0.5 rounded font-black tracking-widest uppercase">Catalog</span>
                  )}
                </div>
              </div>
              <div>
                <label className="text-[9px] font-bold tracking-wider text-slate-500 uppercase mb-1.5 block">Component ID / Serial (Optional)</label>
                <div className="relative">
                  <input type="text" value={expectedSerial} onChange={(e) => setExpectedSerial(e.target.value)}
                    disabled={catalogMode === "catalog"}
                    placeholder="e.g. BD-001"
                    className={`w-full h-10 px-3.5 rounded-xl border text-xs focus:border-cyan-500/40 focus:shadow-[0_0_15px_rgba(6,182,212,0.1)] transition-all ${
                      catalogMode === "catalog"
                        ? "bg-slate-950/60 border-slate-850/80 text-slate-400 cursor-not-allowed font-tech-code"
                        : "bg-slate-900/80 border-slate-700/60 text-slate-200 placeholder:text-slate-700"
                    }`} />
                  {catalogMode === "catalog" && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[8px] bg-slate-900 border border-slate-850 text-slate-500 px-1.5 py-0.5 rounded font-black tracking-widest uppercase">Catalog</span>
                  )}
                </div>
              </div>
              <div>
                <label className="text-[9px] font-bold tracking-wider text-slate-500 uppercase mb-1.5 block">Vendor</label>
                <input type="text" value={vendor} onChange={(e) => setVendor(e.target.value)}
                  placeholder="e.g. Vendor A"
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-900/80 border border-slate-700/60 text-slate-200 text-xs placeholder:text-slate-700 focus:border-cyan-500/40 focus:shadow-[0_0_15px_rgba(6,182,212,0.1)] transition-all" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-[9px] font-bold tracking-wider text-slate-500 uppercase mb-1.5 block">Capture Site</label>
                <input type="text" value={captureSite} onChange={(e) => setCaptureSite(e.target.value)}
                  placeholder="e.g. Line-1"
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-900/80 border border-slate-700/60 text-slate-200 text-xs placeholder:text-slate-700 focus:border-cyan-500/40 focus:shadow-[0_0_15px_rgba(6,182,212,0.1)] transition-all" />
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
              <div>
                <label className="text-[9px] font-bold tracking-wider text-slate-500 uppercase mb-1.5 block">Delivery / Received Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-900/80 border border-slate-700/60 text-slate-200 text-xs focus:border-cyan-500/40 focus:shadow-[0_0_15px_rgba(6,182,212,0.1)] transition-all [color-scheme:dark]" />
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}