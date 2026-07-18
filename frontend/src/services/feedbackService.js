/**
 * Feedback Panel (Pipeline Tuning) service layer.
 * Connects to backend /api/triage/pipeline endpoints.
 */
import { api } from "./api.js";

export async function fetchPipelineConfig() {
  try {
    return await api.get("/triage/pipeline/config");
  } catch {
    // Fallback default config
    return {
      thresholds: { ssim: 0.85, keypointDeltaPct: 15, ocrFuzzyPct: 100 },
      routingRules: [],
      privacy: { storeImageHashOnly: true, redactPersonalMarkings: true, verdictChangeAuditLog: true },
    };
  }
}

export async function savePipelineConfig(config) {
  if (!config) {
    throw new Error("No config provided");
  }
  const data = await api.put("/triage/pipeline/config", config);
  return data;
}

export async function fetchAdjustmentHistory() {
  try {
    return await api.get("/triage/pipeline/history");
  } catch {
    return [];
  }
}