/**
 * Human Review service layer.
 * Connects to backend /api/triage/cases/:id/review and /api/reviews endpoints.
 */
import { api } from "./api.js";

export async function fetchCaseForReview(caseId) {
  try {
    const data = await api.get(`/triage/cases/${caseId}/review`);
    return data;
  } catch {
    // Fallback if no case found
    return {
      id: caseId || "F-2026-02",
      partCode: "BRK-442",
      title: "Manual validation required for high-precision brake assembly fraud detection.",
      confidencePct: 42,
      imageHash: "0x82F...44A2",
      goldenImageUrl: "/dataset/golden_motherboard_clean_top_down.png",
      uploadedImageUrl: "/dataset/defect_burn_marks.png",
      aiRegion: { x: 25, y: 25, w: 25, h: 25 },
      neuralModel: "FraudSense v4.2",
      targetResolutionMinutes: 15,
      elapsedMinutes: 10.8,
      status: "needs_evidence",
    };
  }
}

export async function updateROIRegion(caseId, region) {
  const data = await api.post(`/triage/cases/${caseId}/roi`, { region });
  return data;
}

export async function submitReviewDecision(caseId, decision, notes) {
  if (!decision) {
    throw new Error("A decision type is required");
  }
  const data = await api.post(`/reviews/${caseId}`, {
    action: decision === "approved" ? "approve" : decision === "rejected" ? "reject" : "override",
    override_verdict: decision === "needs_more_evidence" ? "needs_more_evidence" : undefined,
    comments: notes,
  });
  return {
    caseId,
    decision,
    notes,
    decidedAt: new Date().toISOString(),
  };
}