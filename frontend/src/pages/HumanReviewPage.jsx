import { Layout } from "../components/layout.jsx";
import { EvidencePanel, ConfidenceBadge, CaseVelocity, CaseStatusTracker, ReviewerComment, ReviewDecision } from "../components/review.jsx";
import { useReview } from "../hooks/useReview.js";

export default function HumanReviewPage() {
  const { caseData, loading, notes, setNotes, region, handleRegionChange, decisionState, submitDecision } =
    useReview("F-2026-02");

  if (loading || !caseData) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64 text-on-surface-variant">Loading case…</div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Page Title & Confidence Chip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">
            Reviewing Case #{caseData.id} · <span className="font-tech-code text-primary">{caseData.partCode}</span>
          </h1>
          <p className="text-on-surface-variant mt-1 font-body-md">{caseData.title}</p>
        </div>
        <ConfidenceBadge confidencePct={caseData.confidencePct} />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        <EvidencePanel
          caseData={caseData}
          region={region}
          onRegionChange={handleRegionChange}
          onRegionCommit={handleRegionChange}
        />

        <div className="lg:col-span-4 flex flex-col gap-gutter">
          <div className="bg-white border border-outline-variant rounded-xl shadow-sm p-card-padding flex flex-col gap-6">
            <h2 className="font-headline-sm text-headline-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">gavel</span>
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

      <p className="text-center text-on-surface-variant text-body-sm italic mt-10">
        "Every case has a defined next step until it reaches a final, frozen decision."
      </p>
    </Layout>
  );
}
