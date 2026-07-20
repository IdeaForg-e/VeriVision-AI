/**
 * Case service — connects to backend /api/triage/cases endpoints.
 */
import { api } from "./api.js";

export async function getCases() {
  try {
    const data = await api.get("/triage/cases");
    return data;
  } catch {
    // Return empty array on error
    return [];
  }
}

export async function getCaseById(caseId) {
  const data = await api.get(`/triage/cases/${caseId}/detail`);
  return {
    id: data.metadata.id,
    partCode: data.metadata.partCode,
    commodity: data.metadata.commodity,
    confidencePct: data.metadata.confidencePct,
    fraudScore: data.metadata.fraudScore,
    status: data.metadata.status,
    updatedAt: data.metadata.updatedAt,
    imageHash: data.metadata.imageHash,
    neuralModel: data.metadata.neuralModel,
    heatmapUrl: data.metadata.heatmapUrl,
    title: `Case detail for ${data.metadata.partCode}`,
    ocrResults: data.ocrResults,
    metrics: data.metrics,
    timeline: data.timeline,
    recommendation: data.recommendation,
  };
}

export async function updateCaseStatus(caseId, status) {
  const data = await api.post(`/triage/cases/${caseId}/status`, { status });
  return data;
}

export async function getProducts() {
  return await api.get("/products");
}

export async function createInspection(formData) {
  return await api.post("/inspections", formData);
}

export async function getCatalog() {
  return await api.get("/inspections/catalog");
}

export async function deleteCase(caseId) {
  return await api.delete(`/inspections/${caseId}`);
}