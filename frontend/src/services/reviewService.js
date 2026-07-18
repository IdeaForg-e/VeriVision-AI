/**
 * Human Review service layer.
 *
 * Every function below returns a Promise and is shaped the way the real
 * backend call will look, so swapping the mock body for a `fetch`/`api.js`
 * call later doesn't change any component code.
 *
 * TODO(backend): replace mock bodies with real endpoints, e.g.
 *   GET    /api/cases/:id/review
 *   PATCH  /api/cases/:id/roi
 *   POST   /api/cases/:id/decision
 */

const MOCK_LATENCY = 500;

const MOCK_CASE = {
  id: "F-2026-02",
  partCode: "BRK-442",
  title: "Manual validation required for high-precision brake assembly fraud detection.",
  confidencePct: 42,
  imageHash: "0x82F...44A2",
  goldenImageUrl:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuB_NMJLgcP-ixUgjbIaOowp92Ovd2mTY5a4xBemYWX7ST4dSLemvdhoCgS62NFCfz9zSOBIo2zAT9NwYTtEaTJw3oQWGL0nMvwQbdyNrMH-lCwY5mlGm90OPZGC27ws5Vp9KEyWcBviMKbVdw6MDU8vBiiO2ghTpeOMs_vNJx2B0jm4YblxmQGluGjzd3vl_TLh_zSA75TnUgCC_yrvjft0Hg6hN1INfPaAwIcRz_dkaR9O_1NCANcA",
  uploadedImageUrl:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAlMZwfmfOKA7YaHBf031xmr4TE7BI2mpKyp2NJ9BZEIz-BEe_lNhgvl_Hu_voWHQ5jTkND-qbttTkFvJ5i_zXcQqBHaZG8ZSSEmsLI3vBLcarX2uBeq_joITt3cTBGfkAab7bRpGPIDLpBly8whLJTVysdOC3nFDWN2DFf2VGqxb8wnCSy3Tl6BzdsWhej-1YoqJ8wGh6GmiT7OcdmW3Wrq1hA7PTWUt4tzMMR6pRGuLaPNrjFNqQ3",
  aiRegion: { x: 25, y: 25, w: 25, h: 25 }, // percentages of the image container
  neuralModel: "FraudSense v4.2",
  targetResolutionMinutes: 15,
  elapsedMinutes: 10.8, // 4.2m left of a 15m target
  status: "needs_evidence", // needs_evidence | retake_requested | resubmitted | final_decision
};

export function fetchCaseForReview(caseId) {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ ...MOCK_CASE, id: caseId ?? MOCK_CASE.id }), MOCK_LATENCY);
  });
}

export function updateROIRegion(caseId, region) {
  // TODO(backend): PATCH /api/cases/:id/roi  { region }
  // The corrected region also gets logged as a training example for the
  // neural model, per the "Drag or resize..." note in the design.
  return new Promise((resolve) => {
    setTimeout(() => resolve({ caseId, region, savedAsTrainingExample: true }), MOCK_LATENCY / 2);
  });
}

export function submitReviewDecision(caseId, decision, notes) {
  // decision: "approved" | "rejected" | "needs_more_evidence"
  // TODO(backend): POST /api/cases/:id/decision { decision, notes }
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!decision) {
        reject(new Error("A decision type is required"));
        return;
      }
      resolve({ caseId, decision, notes, decidedAt: new Date().toISOString() });
    }, MOCK_LATENCY);
  });
}
