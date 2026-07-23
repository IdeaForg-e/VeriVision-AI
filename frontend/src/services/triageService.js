/**
 * Triage service — backs the Daily Triage dashboard.
 * Connects to backend /api/triage endpoints.
 */
import { api } from "./api.js";

export async function getTriageQueue({ page = 1, pageSize = 20, filters = {} } = {}) {
  try {
    const params = new URLSearchParams();
    params.append("page", page);
    params.append("page_size", pageSize);
    if (filters.status && filters.status !== "ALL") params.append("status_filter", filters.status);
    if (filters.search) params.append("search", filters.search);

    const items = await api.get(`/triage/queue?${params.toString()}`);
    return { items, page, pageSize, total: items.length, filters };
  } catch {
    return { items: [], page, pageSize, total: 0, filters };
  }
}

export async function getTriageStats() {
  try {
    return await api.get("/triage/stats");
  } catch {
    return { totalToday: 0, pendingReview: 0, autoApproved: 0, avgResolutionMinutes: 0 };
  }
}

export async function getPipelineStatus() {
  try {
    return await api.get("/triage/pipeline-status");
  } catch {
    return { stage: "Unknown", health: "unknown", lastRunAt: new Date().toISOString() };
  }
}