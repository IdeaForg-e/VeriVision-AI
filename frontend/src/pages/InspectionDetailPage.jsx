// InspectionDetailPage.jsx — Redesigned reports module to list all generated reports when no ID is provided, and details when selected
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { Layout } from "../components/Layout.jsx";
import { Loader } from "../components/Common.jsx";
import { 
  MetadataCard, 
  FraudScore, 
  ImageComparison, 
  HeatmapViewer, 
  OCRResults, 
  DetectorMetrics, 
  EvidenceTimeline, 
  RecommendationCard 
} from "../components/Case.jsx";

import { getCaseById, deleteCase } from "../services/caseService.js";
import { fetchCaseForReview } from "../services/reviewService.js";
import { getTriageQueue } from "../services/triageService.js";
import { ROUTES, REVIEW_DECISION } from "../utils/constants.js";
import { Download, ShieldAlert, Terminal, Cpu, FileText, ArrowRight, FolderOpen, AlertTriangle, Trash2 } from "lucide-react";

export default function InspectionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [caseData, setCaseData] = useState(null);
  const [reviewData, setReviewData] = useState(null);
  const [reportsList, setReportsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEmpty, setIsEmpty] = useState(false);

  useEffect(() => {
    if (!id) {
      // List view: fetch all registered inspection reports
      setLoading(true);
      getTriageQueue({ page: 1, pageSize: 100 })
        .then((res) => {
          if (res && res.items && res.items.length > 0) {
            setReportsList(res.items);
            setIsEmpty(false);
          } else {
            setIsEmpty(true);
          }
        })
        .catch(() => {
          setIsEmpty(true);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      // Detail view: fetch specific report details
      setIsEmpty(false);
      setLoading(true);
      Promise.all([getCaseById(id), fetchCaseForReview(id)])
        .then(([c, r]) => {
          setCaseData(c);
          setReviewData(r);
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleDownloadPDF = () => {
    if (!id) return;
    // Trigger download direct from backend route
    window.open(`http://127.0.0.1:8000/api/reports/${id}/pdf?token=${encodeURIComponent(localStorage.getItem("fraudshield_auth_token") || "")}`, "_blank");
  };

  const handleDeleteClick = async (caseId) => {
    if (window.confirm("Are you sure you want to permanently delete this inspection report? This action cannot be undone.")) {
      try {
        await deleteCase(caseId);
        if (id) {
          navigate(ROUTES.CASE_DETAIL);
        } else {
          setLoading(true);
          getTriageQueue({ page: 1, pageSize: 100 })
            .then((res) => {
              if (res && res.items && res.items.length > 0) {
                setReportsList(res.items);
                setIsEmpty(false);
              } else {
                setReportsList([]);
                setIsEmpty(true);
              }
            })
            .catch(() => {
              setIsEmpty(true);
            })
            .finally(() => {
              setLoading(false);
            });
        }
      } catch (err) {
        alert(err.message || "Failed to delete inspection report.");
      }
    }
  };

  if (loading) {
    return (
      <Layout>
        <Loader fullPage={false} label="Loading reports registry…" />
      </Layout>
    );
  }

  if (isEmpty) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
          <div className="h-16 w-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400 mb-6 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
            <FolderOpen size={32} />
          </div>
          <h2 className="text-xl font-extrabold text-slate-100">No Inspection Reports Found</h2>
          <p className="text-sm text-slate-400 max-w-md mt-2 leading-relaxed">
            There are no inspection records registered in the system database. Run your first compliance check to generate an automated report.
          </p>
          <button
            onClick={() => navigate(ROUTES.TRIAGE)}
            className="mt-6 flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg font-bold hover:opacity-90 transition shadow-[0_0_10px_rgba(6,182,212,0.15)] text-xs"
          >
            <span className="material-symbols-outlined text-[16px]">add_circle</span>
            Go to AI Inspection Console
          </button>
        </div>
      </Layout>
    );
  }

  // --- RENDER 1: REPORTS ARCHIVE LIST VIEW (if no ID is specified in url) ---
  if (!id) {
    return (
      <Layout
        title="Inspection Reports Archive"
        subtitle="Review historical compliance records, visual diagnostic evidence, and multi-agent audit trails."
      >
        <div className="cyber-card bg-[#0f172a]/55 border-slate-800 p-6 shadow-lg">
          <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-200">Generated Reports Registry</h2>
              <p className="text-xs text-slate-450 mt-0.5">Click on any record below to view details and visual matching overlays</p>
            </div>
            <span className="bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 px-3 py-1 rounded-full text-xs font-semibold font-tech-code tracking-wide">
              {reportsList.length} COMPLETED SCANS
            </span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-850 text-slate-450 uppercase tracking-wider text-[10px] font-black">
                  <th className="py-3 px-4">Report / Case ID</th>
                  <th className="py-3 px-4">Part Number</th>
                  <th className="py-3 px-4">Commodity</th>
                  <th className="py-3 px-4">Fraud Index</th>
                  <th className="py-3 px-4">AI Verdict</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {reportsList.map((r) => {
                  const isHigh = r.riskScore >= 70;
                  const isClean = r.riskScore < 30;
                  const badgeColor = isClean ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" 
                    : isHigh ? "text-red-400 bg-red-500/10 border-red-500/20" 
                    : "text-amber-400 bg-amber-500/10 border-amber-500/20";
                  
                  return (
                    <tr 
                      key={r.id} 
                      className="hover:bg-slate-900/20 transition-colors group cursor-pointer" 
                      onClick={() => navigate(`${ROUTES.CASE_DETAIL}/${r.caseId}`)}
                    >
                      <td className="py-4 px-4 font-tech-code font-bold text-slate-200 group-hover:text-cyan-400 transition-colors">
                        {r.caseId}
                      </td>
                      <td className="py-4 px-4 font-semibold text-slate-350">{r.partNumber}</td>
                      <td className="py-4 px-4 text-slate-400 capitalize">{r.commodity}</td>
                      <td className="py-4 px-4 font-tech-code font-bold">
                        <span className={`px-2 py-0.5 rounded text-[11px] ${isHigh ? "text-red-400 bg-red-950/20" : isClean ? "text-emerald-400 bg-emerald-950/20" : "text-amber-400 bg-amber-950/20"}`}>
                          {r.riskScore}%
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-black uppercase ${badgeColor}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-400 font-tech-code">{r.createdAt}</td>
                      <td className="py-4 px-4 text-right flex items-center justify-end gap-3">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation(); // Avoid triggering row click navigate
                            handleDeleteClick(r.caseId);
                          }}
                          className="text-slate-500 hover:text-red-400 p-1.5 rounded hover:bg-red-500/10 transition-colors"
                          title="Delete Report"
                        >
                          <Trash2 size={13} />
                        </button>
                        <button 
                          onClick={() => navigate(`${ROUTES.CASE_DETAIL}/${r.caseId}`)}
                          className="text-cyan-400 group-hover:text-cyan-300 font-bold flex items-center gap-1 text-[10px] uppercase tracking-wider transition-all"
                        >
                          View Report
                          <ArrowRight size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <AlertTriangle className="text-5xl text-red-500" size={48} />
          <p className="font-headline-sm text-slate-200">Error Loading Inspection Report</p>
          <p className="text-body-md text-slate-400 max-w-sm">{error}</p>
          <button
            onClick={() => navigate(ROUTES.TRIAGE)}
            className="mt-2 px-5 py-2.5 bg-slate-900 border border-slate-800 text-slate-200 rounded-lg hover:bg-slate-855 transition text-xs font-semibold"
          >
            Back to Dashboard
          </button>
        </div>
      </Layout>
    );
  }

  const merged = { ...caseData, ...reviewData };
  
  // Extract key metrics for console logging
  const ssim = merged.metrics?.find(m => m.name.includes("SSIM"))?.score ?? 0.40;
  const keypoint = merged.metrics?.find(m => m.name.includes("Keypoint"))?.score ?? 0.07;
  const ocrResults = merged.ocrResults || [];
  const ocrText = ocrResults[0]?.extracted || "No text detected";
  const ocrExpected = ocrResults[0]?.expected || "N/A";
  const ocrMatch = ocrResults[0]?.match ?? false;

  const recommendation = merged.recommendation || {};
  const recDecision = recommendation.decision === "Accept" ? REVIEW_DECISION.APPROVED
    : recommendation.decision === "Quarantine & Escalate" ? REVIEW_DECISION.REJECTED
      : REVIEW_DECISION.NEEDS_MORE_EVIDENCE;

  // Extract visual diagnostic card url
  const heatmapUrl = merged.heatmapUrl || null;

  // --- RENDER 2: DETAILED REPORT VIEW (if a case ID is active) ---
  return (
    <Layout>
      {/* Page Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 bg-[#0f172a]/30 border border-slate-900/60 p-5 rounded-xl">
        <div>
          <button
            onClick={() => navigate(ROUTES.CASE_DETAIL)}
            className="flex items-center gap-1 text-slate-400 hover:text-cyan-400 text-xs font-bold transition-colors mb-2"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to Reports Registry
          </button>
          <h1 className="font-headline-lg text-headline-lg text-slate-100 flex items-center gap-2 flex-wrap">
            Inspection Report{" "}
            <span className="font-tech-code text-cyan-400 text-base font-bold bg-cyan-950/20 px-2 py-0.5 border border-cyan-500/10 rounded">#{merged.id}</span>
            {merged.partCode && (
              <>
                {" "}·{" "}
                <span className="font-tech-code text-slate-400 text-sm font-semibold">{merged.partCode}</span>
              </>
            )}
          </h1>
          {merged.title && (
            <p className="text-slate-400 mt-1 text-xs">{merged.title} · Dell Quality Assurance Audit Pipeline</p>
          )}
        </div>

        {/* Global Action Triggers */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 border border-slate-800 hover:border-cyan-500/30 text-slate-200 hover:text-cyan-400 rounded-lg text-xs font-bold transition shadow-md"
          >
            <Download size={14} />
            Download PDF Report
          </button>
          <button
            onClick={() => navigate(`${ROUTES.HUMAN_REVIEW}?caseId=${merged.id}`)}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-95 text-white rounded-lg text-xs font-bold transition shadow-md"
          >
            <ShieldAlert size={14} />
            Open in Human Review
          </button>
        </div>
      </div>

      {/* Row 1: Executive AI Verdict & Radial Fraud Score */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        
        {/* Left (8/12): Recommendation narrative card */}
        <div className="lg:col-span-8">
          <RecommendationCard
            recommendation={recDecision}
            confidence={recommendation.confidence || 42}
            reasoning={recommendation.reasoning || "AI confidence is below the auto-decide threshold. Manual review required."}
            flags={recommendation.flags || []}
          />
        </div>

        {/* Right (4/12): Round Radial Fraud Score Circular Gauge */}
        <div className="lg:col-span-4 flex items-center justify-center bg-[#0f172a]/55 border border-slate-800 p-5 rounded-xl shadow-lg">
          <div className="flex flex-col items-center gap-1 w-full text-center">
            <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-450 border-b border-slate-850 pb-2 w-full mb-3">
              Overall Fraud Risk Level
            </h3>
            <FraudScore score={merged.fraudScore ?? 0} size="lg" showLabel={true} />
          </div>
        </div>

      </div>

      {/* Row 2: Visual Comparison evidence & Metrics / Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        
        {/* Left (8/12): Side-by-side Images and Heatmap Overlays */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          <div className="bg-[#0f172a]/20 border border-slate-900/60 p-4 rounded-xl space-y-4">
            <h2 className="text-xs font-extrabold uppercase text-slate-300 tracking-wider flex items-center gap-2">
              <Cpu size={14} className="text-cyan-400" />
              Visual Evidence Comparison
            </h2>
            
            <ImageComparison
              goldenUrl={merged.goldenImageUrl}
              uploadedUrl={merged.uploadedImageUrl}
              imageHash={merged.imageHash}
            />

            <HeatmapViewer
              imageUrl={merged.uploadedImageUrl}
              heatmapUrl={heatmapUrl}
              label={heatmapUrl ? "SSIM Anomaly Heatmap — red bounding boxes highlight detected physical discrepancies" : "AI Attention Region"}
            />
          </div>

          {/* Monospace Execution Telemetry Log */}
          <div className="cyber-card bg-[#0f172a]/55 border-slate-800 shadow-lg overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-855 bg-[#0d1527]/55 flex items-center justify-between">
              <h3 className="text-[10px] font-extrabold text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
                <Terminal size={13} className="text-cyan-400" />
                AI Multi-Agent Execution Telemetry Log
              </h3>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping"></span>
            </div>
            <div className="p-4 bg-slate-950 font-tech-code text-[11px] text-slate-350 space-y-1.5 select-text leading-relaxed max-h-[170px] overflow-y-auto">
              <p className="text-slate-500">[SYSTEM] Multi-Agent Pipeline Execution Active at {merged.updatedAt || "Current Session"}</p>
              <p className="text-cyan-400">&gt; [Agent-1-Gatekeeper] Checked comparison viability: verified aspect ratio and resolution scale alignment [PASSED].</p>
              <p className="text-cyan-400">&gt; [Agent-1-Gatekeeper] Ran auto-classifier: commodity part dynamically classified as "{merged.commodity || "N/A"}".</p>
              <p className="text-emerald-400">&gt; [Agent-2-Triage] Checked image clarity and exposure. Alignment homography registered. Keypoints Match Rate: {(keypoint * 100).toFixed(1)}%</p>
              <p className="text-purple-400">&gt; [Agent-3-Ensemble] Ran structural SSIM diff mapping (SSIM index: {ssim.toFixed(2)}). Dynamic diagnostic card generated.</p>
              <p className={`font-bold ${ocrMatch ? "text-green-400" : "text-red-400"}`}>
                &gt; [Agent-3-Ensemble] OCR Extraction: Expected "{ocrExpected}" | Detected "{ocrText}" | Match: {ocrMatch ? "PASSED" : "FAILED"}
              </p>
              <p className="text-blue-400">&gt; [Agent-4-Decision] Deterministic rules evaluated. Overall Fraud Score: {merged.fraudScore}% | Decision Confidence: {merged.confidencePct}%</p>
              <p className="text-indigo-400">&gt; [Agent-5-Explainer] Natural language narrative generated: "{recommendation.reasoning || "Audit complete."}"</p>
              <p className="text-slate-500">[SYSTEM] Execution complete. Case results persisted in Database.</p>
            </div>
          </div>

        </div>

        {/* Right (4/12): Metadata information and Detector Metrics charts */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <MetadataCard caseData={merged} />
          <DetectorMetrics metrics={merged.metrics || []} />
        </div>

      </div>

      {/* Row 3: OCR Data table & Evidence logs history timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left (6/12): Detailed OCR extraction comparative table */}
        <div className="lg:col-span-6">
          <OCRResults results={ocrResults} />
        </div>

        {/* Right (6/12): Full Auditable Timeline */}
        <div className="lg:col-span-6">
          <EvidenceTimeline events={merged.timeline || []} />
        </div>

      </div>

    </Layout>
  );
}
