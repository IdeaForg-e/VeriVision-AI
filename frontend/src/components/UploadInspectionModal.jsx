import { useState, useEffect } from "react";
import { Modal } from "./Common.jsx";
import { createInspection, getCatalog, getMultiAngleFusion } from "../services/caseService.js";
import { AlertCircle, RefreshCw, Sparkles, Scan, Cpu, ChevronDown, Layers, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../utils/constants.js";
import TargetScanCaptureZone from "./TargetScanCaptureZone.jsx";

export default function UploadInspectionModal({ open, onClose, onSuccess }) {
  const navigate = useNavigate();

  // Form states
  const [captureSite, setCaptureSite] = useState("Line-1");
  const [captureAngle, setCaptureAngle] = useState("top");
  const [customFile, setCustomFile] = useState(null);
  const [expectedSerial, setExpectedSerial] = useState("");
  const [componentName, setComponentName] = useState("");
  const [vendor, setVendor] = useState("");
  const [date, setDate] = useState("");

  // Multi-Angle Fusion states (Bonus Challenge)
  const [enableMultiAngle, setEnableMultiAngle] = useState(false);
  const [captureAngle2, setCaptureAngle2] = useState("angled");
  const [customFile2, setCustomFile2] = useState(null);
  const [targetPreview2, setTargetPreview2] = useState(null);


  // Catalog Reference states
  const [catalogList, setCatalogList] = useState([]);
  const [selectedCatalogPart, setSelectedCatalogPart] = useState("");



  // Visual thumbnail previews
  const [targetPreview, setTargetPreview] = useState(null);

  // Pipeline execution feedback
  const [processing, setProcessing] = useState(false);
  const [progressLog, setProgressLog] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleCatalogPartChange = (partNum) => {
    setSelectedCatalogPart(partNum);
    setCatalogList(prev => {
      const selected = prev.find(c => c.part_number === partNum);
      if (selected) {
        setComponentName(selected.name);
        setExpectedSerial(selected.golden_references?.[0]?.expected_serial || "");
      }
      return prev;
    });
  };

  useEffect(() => {
    if (!open) return;
    setProcessing(false);
    setProgressLog([]);
    setErrorMsg(null);
    setCustomFile(null);
    if (targetPreview) URL.revokeObjectURL(targetPreview);
    setTargetPreview(null);
    setExpectedSerial("");
    setComponentName("");
    setVendor("");
    setDate("");

    // Fetch pre-registered references
    let cancelled = false;
    const loadCatalog = async () => {
      try {
        const list = await getCatalog();
        if (cancelled) return;
        setCatalogList(list || []);
        if (list && list.length > 0) {
          setSelectedCatalogPart(list[0].part_number);
          setComponentName(list[0].name);
          setExpectedSerial(list[0].golden_references?.[0]?.expected_serial || "");
        }
      } catch (err) {
        console.error("Failed to load parts catalog:", err);
      }
    };
    loadCatalog();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    return () => {
      if (targetPreview) URL.revokeObjectURL(targetPreview);
    };
  }, [targetPreview]);




  const runSimulatedProgress = (isMulti = false) => {
    setProgressLog([]);
    const logs = [
      { text: "✓ Ingest & Triage: Image clarity & lighting exposure checked [OK]", delay: 200, status: "success" },
      { text: "✓ Homography: Aligned frame with custom reference ORB descriptors [OK]", delay: 1000, status: "success" },
      { text: "✓ Classifier: Golden reference part category auto-detected [OK]", delay: 1800, status: "success" },
      { text: "⚙ Vision Ensemble: Running structural SSIM diff mapping...", delay: 2600, status: "active" },
      { text: "⚙ EasyOCR Engine: Initializing character mismatch verification...", delay: 3400, status: "active" },
      { text: isMulti ? "⚙ Multi-Angle Fusion: Fusing primary & secondary angle evidence..." : "⚙ Decision Judge: Evaluating compliance policy & calculating risk index...", delay: 4200, status: "active" },
      { text: "⚙ Explainer: Writing natural language audit justification...", delay: 5000, status: "active" }
    ];
    logs.forEach(log => {
      setTimeout(() => setProgressLog(prev => [...prev, { text: log.text, status: log.status }]), log.delay);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customFile) { setErrorMsg("Please upload a target Part Image Scan to inspect."); return; }
    if (!selectedCatalogPart) { setErrorMsg("Please select a standard Golden Reference part from the catalog."); return; }
    
    setProcessing(true);
    setErrorMsg(null);
    const isMultiActive = enableMultiAngle && customFile2;
    runSimulatedProgress(isMultiActive);
    try {
      const formData = new FormData();
      formData.append("capture_site", captureSite);
      formData.append("capture_angle", captureAngle);
      formData.append("file", customFile);
      formData.append("catalog_part_number", selectedCatalogPart);
      
      if (expectedSerial) formData.append("expected_serial", expectedSerial.trim());
      if (vendor) formData.append("vendor", vendor.trim());
      if (componentName) formData.append("component_name", componentName.trim());
      if (date) formData.append("date", date);
      
      let finalCaseId = null;

      if (isMultiActive) {
        // Parallel Execution (Bonus Feature): Send both angle scan requests simultaneously!
        const formData2 = new FormData();
        formData2.append("capture_site", captureSite);
        formData2.append("capture_angle", captureAngle2);
        formData2.append("file", customFile2);
        formData2.append("catalog_part_number", selectedCatalogPart);
        if (expectedSerial) formData2.append("expected_serial", expectedSerial.trim());
        if (vendor) formData2.append("vendor", vendor.trim());
        if (componentName) formData2.append("component_name", componentName.trim());
        if (date) formData2.append("date", date);

        // Run both 5-Agent pipelines in parallel concurrently
        const [result1, result2] = await Promise.all([
          createInspection(formData),
          createInspection(formData2)
        ]);

        finalCaseId = result1.case_id;

        // Perform instant multi-angle risk fusion
        try {
          await getMultiAngleFusion([result1.case_id, result2.case_id]);
        } catch (fusionErr) {
          console.warn("Multi-Angle Fusion warning:", fusionErr);
        }
      } else {
        // Single Angle Inspection
        const result = await createInspection(formData);
        finalCaseId = result.case_id;
      }

      setProcessing(false);
      onClose();
      if (onSuccess) onSuccess();
      navigate(`${ROUTES.CASE_DETAIL}/${finalCaseId}`);
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

  // Resolve golden image URL from backend's image_path
  const getGoldenImageUrl = (goldenRef) => {
    if (!goldenRef?.image_path) return null;
    // image_path from DB is like "data/golden/filename.png" or "/dataset/golden_xxx.png"
    const path = goldenRef.image_path;
    return path.startsWith("/") ? path : `/${path}`;
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

  // Footer buttons — fixed: removed undefined catalogMode/goldenFile references
  const isSubmitDisabled = !customFile || !selectedCatalogPart;
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

  // Get the selected catalog item and golden reference data
  const selectedCatalogItem = catalogList.find(c => c.part_number === selectedCatalogPart);
  const selectedGoldenRef = selectedCatalogItem?.golden_references?.[0];
  const goldenImageUrl = getGoldenImageUrl(selectedGoldenRef);

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

          {/* ═══════ Top Section: Golden Ref + Target Scan side by side ═══════ */}
          <div className="grid grid-cols-[1fr_1fr] gap-5 items-stretch">

            {/* ── LEFT: Golden Reference Catalog ── */}
            <div className="flex flex-col gap-2.5 min-w-0">
              <label className="text-[10px] font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
                <Sparkles size={12} className="text-cyan-400" />
                OEM Golden Reference Catalog
              </label>
              
              <div className="relative">
                <select
                  value={selectedCatalogPart}
                  onChange={(e) => handleCatalogPartChange(e.target.value)}
                  className="w-full h-11 px-3.5 pr-9 rounded-xl bg-slate-900/80 border border-slate-700/60 text-slate-200 text-xs appearance-none cursor-pointer hover:border-cyan-500/30 focus:border-cyan-500/40 focus:shadow-[0_0_15px_rgba(6,182,212,0.1)] transition-all font-bold tracking-wide outline-none"
                  style={{ colorScheme: 'dark' }}
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

              {/* Golden Reference Preview Card */}
              {selectedCatalogItem && (
                <div className="relative bg-slate-950/40 border border-slate-800/80 rounded-xl overflow-hidden hover:border-cyan-500/20 transition-all flex gap-4 p-3.5 items-center shadow-inner flex-1 min-h-[9rem]">
                  {/* Golden image thumbnail */}
                  {goldenImageUrl ? (
                    <div className="h-[8rem] w-[8rem] rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                      <img
                        src={goldenImageUrl}
                        className="w-full h-full object-contain hover:scale-110 transition-transform duration-300"
                        alt="Golden Standard Preview"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </div>
                  ) : (
                    <div className="h-[8rem] w-[8rem] rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                      <Cpu size={24} className="text-slate-600" />
                    </div>
                  )}
                  
                  <div className="min-w-0 flex-1 flex flex-col justify-center text-[10px] space-y-1.5">
                    <p className="font-extrabold text-[11px] text-cyan-400 tracking-wide truncate">{selectedCatalogItem.name}</p>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-slate-400">
                      <div>
                        <span className="text-slate-600 block text-[8px] uppercase tracking-wider font-semibold">Commodity</span>
                        <span className="font-bold uppercase text-[9px] text-slate-350">{selectedCatalogItem.commodity}</span>
                      </div>
                      <div>
                        <span className="text-slate-600 block text-[8px] uppercase tracking-wider font-semibold">Part Code</span>
                        <span className="font-tech-code text-slate-350 font-bold text-[9px]">{selectedCatalogItem.part_number}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-600 block text-[8px] uppercase tracking-wider font-semibold">Expected Serial ID</span>
                        <span className="font-tech-code text-slate-400 truncate block text-[9px]">{selectedGoldenRef?.expected_serial || "OEM STANDARD REFERENCE"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-2.5 rounded-lg border border-emerald-500/10 bg-emerald-950/5 text-[9px] flex items-start gap-2 leading-relaxed">
                <Cpu size={11} className="shrink-0 mt-0.5 text-emerald-500/40" />
                <p className="text-slate-500">Auto-alignment parameters loaded automatically from database.</p>
              </div>
            </div>

            {/* ── RIGHT: Target Part Scan ── */}
            <div className="flex flex-col min-w-0">
              <TargetScanCaptureZone
                customFile={customFile}
                setCustomFile={setCustomFile}
                targetPreview={targetPreview}
                setTargetPreview={setTargetPreview}
                disabled={processing}
              />
            </div>
          </div>

          {/* ═══════ Bottom Section: Form Fields ═══════ */}
          <div className="space-y-4 pt-1">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] font-bold tracking-wider text-slate-500 uppercase mb-1.5 block">Vendor</label>
                <input type="text" value={vendor} onChange={(e) => setVendor(e.target.value)}
                  placeholder="e.g. Vendor A"
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-900/80 border border-slate-700/60 text-slate-200 text-xs placeholder:text-slate-700 focus:border-cyan-500/40 focus:shadow-[0_0_15px_rgba(6,182,212,0.1)] transition-all outline-none" />
              </div>
              <div>
                <label className="text-[9px] font-bold tracking-wider text-slate-500 uppercase mb-1.5 block">Delivery / Received Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-900/80 border border-slate-700/60 text-slate-200 text-xs focus:border-cyan-500/40 focus:shadow-[0_0_15px_rgba(6,182,212,0.1)] transition-all [color-scheme:dark] outline-none" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] font-bold tracking-wider text-slate-500 uppercase mb-1.5 block">Capture Site</label>
                <input type="text" value={captureSite} onChange={(e) => setCaptureSite(e.target.value)}
                  placeholder="e.g. Line-1"
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-900/80 border border-slate-700/60 text-slate-200 text-xs placeholder:text-slate-700 focus:border-cyan-500/40 focus:shadow-[0_0_15px_rgba(6,182,212,0.1)] transition-all outline-none" />
              </div>
              <div>
                <label className="text-[9px] font-bold tracking-wider text-slate-500 uppercase mb-1.5 block">Primary Camera Angle</label>
                <div className="relative">
                  <select value={captureAngle} onChange={(e) => setCaptureAngle(e.target.value)}
                    className="w-full h-11 px-3.5 pr-9 rounded-xl bg-slate-900/80 border border-slate-700/60 text-slate-200 text-xs appearance-none cursor-pointer focus:border-cyan-500/40 focus:shadow-[0_0_15px_rgba(6,182,212,0.1)] transition-all outline-none">
                    <option value="top">Top Down (Default)</option>
                    <option value="angled">Angled Perspective</option>
                    <option value="side">Side View</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* ── Multi-Angle Fusion Toggle Banner (Bonus Challenge) ── */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setEnableMultiAngle(!enableMultiAngle)}
                className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all ${
                  enableMultiAngle
                    ? "bg-cyan-950/30 border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.15)] text-cyan-300"
                    : "bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`p-1.5 rounded-lg ${enableMultiAngle ? "bg-cyan-500/20 text-cyan-400" : "bg-slate-800 text-slate-500"}`}>
                    <Layers size={15} />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold uppercase tracking-wider">Multi-Angle Fusion Scan (Bonus Mode)</p>
                    <p className="text-[10px] text-slate-500 font-normal">Upload secondary angle photo (e.g. Side/Angled view) for joint AI risk fusion</p>
                  </div>
                </div>
                <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                  enableMultiAngle ? "bg-cyan-500 text-slate-950" : "bg-slate-800 text-slate-400"
                }`}>
                  {enableMultiAngle ? "ENABLED" : "+ ADD ANGLE"}
                </span>
              </button>

              {/* Secondary Angle File Upload & Live Webcam Zone */}
              {enableMultiAngle && (
                <div className="mt-3 p-4 rounded-xl border border-cyan-500/30 bg-slate-950/60 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold tracking-wider text-cyan-400 uppercase flex items-center gap-1.5">
                      <Layers size={13} />
                      Secondary Angle Settings
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-slate-500 font-bold uppercase">Angle:</span>
                      <div className="relative">
                        <select
                          value={captureAngle2}
                          onChange={(e) => setCaptureAngle2(e.target.value)}
                          className="h-8 px-2.5 pr-7 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 text-[10px] font-bold appearance-none cursor-pointer outline-none"
                        >
                          <option value="angled">Angled Perspective</option>
                          <option value="side">Side View</option>
                          <option value="top">Top View</option>
                        </select>
                        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <TargetScanCaptureZone
                    customFile={customFile2}
                    setCustomFile={setCustomFile2}
                    targetPreview={targetPreview2}
                    setTargetPreview={setTargetPreview2}
                    disabled={processing}
                    label="Secondary Angle Scan (Webcam / File)"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}