// CaseDetailPage.jsx — Full case detail view: metadata, images, OCR, detectors, timeline, recommendation
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { Layout } from "../components/layout/index.jsx";
import { Loader } from "../components/common/index.jsx";
import { MetadataCard, FraudScore, ImageComparison, HeatmapViewer, OCRResults, DetectorMetrics, EvidenceTimeline, RecommendationCard } from "../components/case/index.jsx";

import { getCaseById } from "../services/caseService.js";
import { fetchCaseForReview } from "../services/reviewService.js";
import { ROUTES, REVIEW_DECISION } from "../utils/constants.js";

// ── Mock supplementary data (would come from backend in production) ──────────
const MOCK_OCR = [
  { field: "Part Number", extracted: "BRK-442", expected: "BRK-442", match: true },
  { field: "Batch Code",  extracted: "BTCH-9A",  expected: "BTCH-9B",  match: false },
  { field: "Serial No.",  extracted: "SN-0041",  expected: null,        match: null },
];

const MOCK_METRICS = [
  { name: "SSIM Score",        score: 0.62, unit: "",  icon: "image_search",  description: "Structural similarity to OEM golden image" },
  { name: "Keypoint Delta",    score: 0.28, unit: "",  icon: "hub",           description: "ORB/SIFT keypoint match delta (lower = closer)" },
  { name: "OCR Fuzzy Match",   score: 87,   unit: "%", icon: "text_fields",   description: "Character-level fuzzy match with expected label" },
  { name: "AI Confidence",     score: 42,   unit: "%", icon: "psychology",    description: "Overall detector confidence (< 50% → human review)" },
];

const MOCK_TIMELINE = [
  { id: "e1", type: "created",          label: "Case Opened",             user: "System",    timestamp: "2026-07-17T08:00:00Z", description: "Automatically created by the Perception Engine." },
  { id: "e2", type: "needs_evidence",   label: "Needs Evidence",          user: "FraudSense v4.2", timestamp: "2026-07-17T08:01:00Z", description: "AI confidence below auto-decide threshold (42%)." },
  { id: "e3", type: "retake_requested", label: "Retake Photo Requested",  user: "Chaitanya", timestamp: "2026-07-17T09:30:00Z", description: "Batch code label partially obscured." },
  { id: "e4", type: "resubmitted",      label: "Photo Resubmitted",       user: "Supplier",  timestamp: "2026-07-17T10:15:00Z", description: "New image uploaded by supplier portal." },
];

export default function CaseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [caseData, setCaseData] = useState(null);
  const [reviewData, setReviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const caseId = id ?? "F-2026-02";
    setLoading(true);
    Promise.all([getCaseById(caseId), fetchCaseForReview(caseId)])
      .then(([c, r]) => {
        setCaseData(c);
        setReviewData(r);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <Loader fullPage={false} label="Loading case details…" />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <span className="material-symbols-outlined text-5xl text-error">error_outline</span>
          <p className="font-headline-sm text-on-surface">Case not found</p>
          <p className="text-body-md text-on-surface-variant max-w-sm">{error}</p>
          <button
            onClick={() => navigate(ROUTES.TRIAGE)}
            className="mt-2 px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-body-sm font-medium"
          >
            Back to Triage
          </button>
        </div>
      </Layout>
    );
  }

  const merged = { ...caseData, ...reviewData };

  return (
    <Layout>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-on-surface-variant hover:text-primary text-body-sm mb-2 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back
          </button>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">
            Case{" "}
            <span className="font-tech-code text-primary">#{merged.id}</span>
            {merged.partCode && (
              <>
                {" "}·{" "}
                <span className="font-tech-code text-on-surface-variant">{merged.partCode}</span>
              </>
            )}
          </h1>
          {merged.title && (
            <p className="text-on-surface-variant mt-1 font-body-md">{merged.title}</p>
          )}
        </div>

        {/* Fraud Score */}
        <FraudScore score={merged.fraudScore ?? 58} size="md" />
      </div>

      {/* AI Recommendation */}
      <div className="mb-6">
        <RecommendationCard
          recommendation={REVIEW_DECISION.NEEDS_MORE_EVIDENCE}
          confidence={42}
          reasoning="AI confidence is below the auto-decide threshold (50%). Batch code mismatch detected by OCR. Manual review required before a final decision can be issued."
          flags={["OCR Mismatch", "Low SSIM (0.62)", "Batch Code Discrepancy"]}
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        {/* Left column */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <ImageComparison
            goldenUrl={merged.goldenImageUrl}
            uploadedUrl={merged.uploadedImageUrl}
            imageHash={merged.imageHash}
          />
          <HeatmapViewer
            imageUrl={merged.uploadedImageUrl}
            region={merged.aiRegion}
            label="AI-detected region of interest — drag to adjust in Human Review"
          />
          <OCRResults results={MOCK_OCR} />
        </div>

        {/* Right column */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <MetadataCard caseData={merged} />
          <DetectorMetrics metrics={MOCK_METRICS} />
        </div>
      </div>

      {/* Timeline */}
      <EvidenceTimeline events={MOCK_TIMELINE} />

      {/* CTA: Go to Human Review */}
      <div className="mt-8 flex justify-end">
        <button
          onClick={() => navigate(ROUTES.HUMAN_REVIEW)}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 shadow-md hover:shadow-lg transition-all font-medium text-body-md"
        >
          <span className="material-symbols-outlined">rate_review</span>
          Open in Human Review
        </button>
      </div>
    </Layout>
  );
}