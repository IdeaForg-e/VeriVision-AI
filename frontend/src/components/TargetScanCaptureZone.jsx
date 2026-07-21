import { useState, useEffect, useRef, useCallback } from "react";
import { Upload, Camera, RefreshCw, X, Cpu, ZapOff, Circle } from "lucide-react";

export default function TargetScanCaptureZone({
  customFile,
  setCustomFile,
  targetPreview,
  setTargetPreview,
  disabled
}) {
  const [targetMode, setTargetMode] = useState("upload"); // "upload" | "webcam"
  const [webcamStream, setWebcamStream] = useState(null);
  const [webcamError, setWebcamError] = useState(null);
  const [webcamReady, setWebcamReady] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [webcamScanResult, setWebcamScanResult] = useState(null); // null | { status, checks }

  const stopWebcam = useCallback(() => {
    setWebcamStream(prev => {
      if (prev) {
        prev.getTracks().forEach(t => t.stop());
      }
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

  useEffect(() => {
    if (videoRef.current && webcamStream) {
      videoRef.current.srcObject = webcamStream;
      videoRef.current.play().catch(() => { });
    }
  }, [webcamStream]);

  // Clean up webcam on unmount
  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, [stopWebcam]);

  const runWebcamIntegrityScan = useCallback((file, width, height) => {
    const checks = [];
    let overallOk = true;

    checks.push({ label: "File Integrity", ok: true, detail: `JPEG blob — ${(file.size / 1024).toFixed(0)} KB` });

    const minRes = width >= 150 && height >= 150;
    if (!minRes) overallOk = false;
    checks.push({
      label: "Minimum Resolution",
      ok: minRes,
      detail: minRes
        ? `${width}×${height} px — Sufficient`
        : `${width}×${height} px — Below 150×150 minimum`,
    });

    const ar = width / height;
    const arLabel = ar > 1.2 ? "Landscape" : ar < 0.8 ? "Portrait" : "Square";
    checks.push({ label: "Aspect Ratio", ok: true, detail: `${ar.toFixed(2)} — ${arLabel}` });

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
      stopWebcam();
      runWebcamIntegrityScan(file, w, h);
    }, "image/jpeg", 0.92);
  }, [targetPreview, stopWebcam, runWebcamIntegrityScan, setCustomFile, setTargetPreview]);

  const handleRetake = useCallback(() => {
    if (targetPreview) URL.revokeObjectURL(targetPreview);
    setCustomFile(null);
    setTargetPreview(null);
    setWebcamScanResult(null);
    startWebcam();
  }, [targetPreview, startWebcam, setCustomFile, setTargetPreview]);

  const handleTabSwitch = useCallback((mode) => {
    if (mode === targetMode) return;
    if (mode === "webcam") {
      startWebcam();
    } else {
      stopWebcam();
    }
    if (targetPreview) URL.revokeObjectURL(targetPreview);
    setCustomFile(null);
    setTargetPreview(null);
    setTargetMode(mode);
  }, [targetMode, targetPreview, startWebcam, stopWebcam, setCustomFile, setTargetPreview]);

  const handleTargetChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (targetPreview) URL.revokeObjectURL(targetPreview);
    setCustomFile(file);
    setTargetPreview(URL.createObjectURL(file));
  };

  return (
    <div className="flex flex-col gap-2.5 h-full">
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
            disabled={disabled}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all ${targetMode === "upload"
              ? "bg-gradient-to-r from-blue-600/80 to-indigo-700/80 text-white shadow-[0_0_10px_rgba(99,102,241,0.3)]"
              : "text-slate-500 hover:text-slate-350"
              }`}
          >
            <Upload size={9} /> Upload
          </button>
          <button
            type="button"
            onClick={() => handleTabSwitch("webcam")}
            disabled={disabled}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all ${targetMode === "webcam"
              ? "bg-gradient-to-r from-cyan-600/80 to-blue-700/80 text-white shadow-[0_0_10px_rgba(6,182,212,0.3)]"
              : "text-slate-500 hover:text-slate-350"
              }`}
          >
            <Camera size={9} /> Camera
          </button>
        </div>
      </div>

      {/* ── UPLOAD MODE ── */}
      {targetMode === "upload" && (
        <div className="relative flex-1 flex flex-col">
          <div className="absolute -inset-0.5 bg-gradient-to-br from-blue-500/10 to-indigo-600/10 rounded-xl blur opacity-0 hover:opacity-100 pointer-events-none transition duration-500" />
          {targetPreview ? (
            <div className="relative bg-slate-900/80 border border-slate-700/80 rounded-xl overflow-hidden hover:border-blue-500/40 transition-all">
              <div className="relative h-64 bg-slate-950/80 flex items-center justify-center overflow-hidden">
                <img src={targetPreview} className="w-full h-full object-contain" alt="Target" />
              </div>
              <div className="px-3 py-2.5 flex items-center justify-between border-t border-slate-800/60">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-200 truncate">{customFile?.name}</p>
                  <p className="text-[8px] text-slate-500">{customFile ? (customFile.size / 1024).toFixed(0) + " KB" : ""}</p>
                </div>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => { setCustomFile(null); setTargetPreview(null); }}
                  className="h-6 w-6 rounded flex items-center justify-center border border-slate-700/60 text-slate-500 hover:text-red-400 hover:border-red-500/30 transition-all"
                >
                  <X size={11} />
                </button>
              </div>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center gap-2.5 min-h-[18rem] flex-1 rounded-xl border-2 border-dashed border-slate-700/50 bg-slate-900/40 hover:bg-blue-950/10 hover:border-blue-500/50 cursor-pointer transition-all z-10">
              <input type="file" accept="image/*" onChange={handleTargetChange} className="hidden" disabled={disabled} />
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
          {targetPreview ? (
            <div className="flex flex-col gap-1.5">
              <div className="relative bg-slate-900/80 border border-cyan-500/30 rounded-xl overflow-hidden shadow-[0_0_20px_rgba(6,182,212,0.1)]">
                <div className="relative h-64 bg-slate-950/80 flex items-center justify-center overflow-hidden">
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
                    disabled={disabled}
                    onClick={handleRetake}
                    className="flex items-center gap-1 h-6 px-2 rounded border border-cyan-700/50 text-cyan-400 hover:bg-cyan-900/30 text-[9px] font-bold uppercase tracking-wider transition-all"
                  >
                    <RefreshCw size={9} /> Retake
                  </button>
                </div>
              </div>

              {/* Agent 1 Scan Result Panel */}
              {webcamScanResult && (
                <div className={`rounded-xl border px-3 py-2.5 ${webcamScanResult.status === "pass"
                  ? "bg-emerald-950/30 border-emerald-500/20"
                  : "bg-red-950/30 border-red-500/20"
                  }`}>
                  <p className={`text-[9px] font-black tracking-[0.15em] uppercase mb-1.5 flex items-center gap-1 ${webcamScanResult.status === "pass" ? "text-emerald-400" : "text-red-400"
                    }`}>
                    <Cpu size={9} />
                    Agent 1 — Image Integrity Scan
                    <span className={`ml-auto px-1.5 py-0.5 rounded text-[7px] font-extrabold tracking-widest border ${webcamScanResult.status === "pass"
                      ? "bg-emerald-900/50 border-emerald-500/30 text-emerald-300"
                      : "bg-red-900/50 border-red-500/30 text-red-300"
                      }`}>
                      {webcamScanResult.status === "pass" ? "PASS" : "FAIL"}
                    </span>
                  </p>
                  <div className="space-y-1">
                    {webcamScanResult.checks.map((chk, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className={`shrink-0 text-[8px] font-black ${chk.ok ? "text-emerald-400" : "text-red-400"
                          }`}>{chk.ok ? "✓" : "✗"}</span>
                        <span className="text-[9px] text-slate-400 font-semibold shrink-0 w-28">{chk.label}:</span>
                        <span className={`text-[9px] truncate ${chk.ok ? "text-slate-300" : "text-red-300 font-semibold"
                          }`}>{chk.detail}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="relative rounded-xl overflow-hidden border border-cyan-500/25 bg-slate-950 shadow-[0_0_25px_rgba(6,182,212,0.08)]">
              {webcamError ? (
                <div className="h-64 flex flex-col items-center justify-center gap-2 px-4">
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
                <div className="relative">
                  <div className="absolute inset-0 rounded-xl pointer-events-none z-10">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-400/70 rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-400/70 rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-400/70 rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-400/70 rounded-br-lg" />
                  </div>
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
                    className="w-full h-64 object-cover bg-slate-950"
                  />
                  <canvas ref={canvasRef} className="hidden" />
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

          {!targetPreview && !webcamError && (
            <button
              type="button"
              onClick={captureFrame}
              disabled={!webcamReady || disabled}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-gradient-to-r from-cyan-600/80 to-blue-700/80 border border-cyan-500/30 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-[0_0_15px_rgba(6,182,212,0.2)] hover:shadow-[0_0_25px_rgba(6,182,212,0.35)] hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <Camera size={12} />
              Capture Frame
            </button>
          )}
        </div>
      )}
    </div>
  );
}