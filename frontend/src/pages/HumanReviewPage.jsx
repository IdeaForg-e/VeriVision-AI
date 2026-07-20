import { Layout } from "../components/Layout.jsx";
import { EvidencePanel, ConfidenceBadge, CaseVelocity, CaseStatusTracker, ReviewerComment, ReviewDecision } from "../components/Review.jsx";
import { useReview } from "../hooks/useReview.js";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ROUTES } from "../utils/constants.js";

export default function HumanReviewPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const caseId = searchParams.get("caseId");

  if (!caseId) {
    return (
      <Layout
        title="Human Review Workspace"
        subtitle="Perform manual override verification on flagged components."
      >
        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
          <div className="h-16 w-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400 mb-6 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
            <span className="material-symbols-outlined text-[32px]">rate_review</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-100">No Active Case Selected</h2>
          <p className="text-sm text-slate-400 max-w-md mt-2 leading-relaxed">
            Human Review is designed to override specific AI inspection verdicts. Go to the Reports Archive page, select a scan, and click "Open in Human Review" to evaluate it.
          </p>
          <button
            onClick={() => navigate(ROUTES.CASE_DETAIL)}
            className="mt-6 flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg font-bold hover:opacity-90 transition shadow-[0_0_10px_rgba(6,182,212,0.15)] text-xs"
          >
            <span className="material-symbols-outlined text-[16px]">folder_open</span>
            Go to Reports Archive
          </button>
        </div>
      </Layout>
    );
  }

  const { caseData, loading, notes, setNotes, region, handleRegionChange, handleRegionCommit, decisionState, submitDecision } =
    useReview(caseId);

  if (loading || !caseData) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64 text-slate-450">Loading case…</div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Page Title & Confidence Chip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-slate-200">
            Reviewing Case #{caseData.id} · <span className="font-tech-code text-cyan-400">{caseData.partCode}</span>
          </h1>
          <p className="text-slate-450 mt-1 font-body-md">{caseData.title}</p>
        </div>
        <ConfidenceBadge confidencePct={caseData.confidencePct} />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        <EvidencePanel
          caseData={caseData}
          region={region}
          onRegionChange={handleRegionChange}
          onRegionCommit={handleRegionCommit}
        />

        <div className="lg:col-span-4 flex flex-col gap-gutter">
          <div className="cyber-card bg-[#0f172a]/55 border-slate-800 p-card-padding flex flex-col gap-6 shadow-lg">
            <h2 className="font-headline-sm text-headline-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-cyan-400">gavel</span>
              Reviewer Decision
            </h2>
            <ReviewerComment value={notes} onChange={setNotes} />
            <ReviewDecision
              onDecide={submitDecision}
              pending={decisionState.pending}
              lastResult={decisionState.lastResult}
            />
            {decisionState.error && (
              <p className="text-error text-body-sm">{decisionState.error}</p>
            )}
          </div>

          <CaseVelocity targetMinutes={caseData.targetResolutionMinutes} elapsedMinutes={caseData.elapsedMinutes} />
        </div>
      </div>

      <CaseStatusTracker status={caseData.status} />

      <p className="text-center text-slate-450 text-body-sm italic mt-10">
        "Every case has a defined next step until it reaches a final, frozen decision."
      </p>
    </Layout>
  );
}
