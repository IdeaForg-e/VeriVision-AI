/**
 * Triage service — backs the Daily Triage dashboard (StatsCards, QueueTable,
 * PipelineStatus). Not built out on the frontend yet (that's Jagruti's page),
 * but the service lives in your part per the folder plan, so it's stubbed
 * here ready for whoever builds those components to call into.
 *
 * TODO(backend):
 *   GET /triage/queue   -> paginated case list + filters
 *   GET /triage/stats   -> { totalToday, pendingReview, avgResolutionMinutes, ... }
 *   GET /triage/pipeline-status -> { stage, health, lastRunAt }
 */

const MOCK_LATENCY = 500;

const MOCK_STATS = {
  totalToday: 47,
  pendingReview: 12,
  autoApproved: 31,
  avgResolutionMinutes: 9.4,
};

const MOCK_PIPELINE_STATUS = {
  stage: "Perception Engine v4.2",
  health: "operational", // operational | degraded | down
  lastRunAt: "2026-07-18T09:00:00Z",
};

export function getTriageQueue({ page = 1, pageSize = 20, filters = {} } = {}) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ items: [], page, pageSize, total: 0, filters });
    }, MOCK_LATENCY);
  });
}

export function getTriageStats() {
  return new Promise((resolve) => {
    setTimeout(() => resolve(MOCK_STATS), MOCK_LATENCY);
  });
}

export function getPipelineStatus() {
  return new Promise((resolve) => {
    setTimeout(() => resolve(MOCK_PIPELINE_STATUS), MOCK_LATENCY / 2);
  });
}
