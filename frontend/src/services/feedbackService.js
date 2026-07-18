/**
 * Feedback Panel (Pipeline Tuning) service layer.
 * TODO(backend): replace mock bodies with real endpoints, e.g.
 *   GET   /api/pipeline/config
 *   PUT   /api/pipeline/config
 *   GET   /api/pipeline/history
 */

const MOCK_LATENCY = 700;

const MOCK_CONFIG = {
  thresholds: {
    ssim: 0.85, // Aligned Structural Similarity — min score
    keypointDeltaPct: 15, // ORB/SIFT matching strictness — max delta %
    ocrFuzzyPct: 100, // OCR character fuzzy match — 100 = strict
  },
  routingRules: [
    {
      id: "RULE-102",
      name: "Critical Part Isolation",
      description: "If Commodity = 'Microchips / IC' → always route to Human Review, regardless of AI confidence.",
    },
    {
      id: "RULE-103",
      name: "High-Risk Automation Gate",
      description: "If Fraud Score ≥ 75 → auto-route to Quarantine and notify the supplier log.",
    },
  ],
  privacy: {
    storeImageHashOnly: true,
    redactPersonalMarkings: true,
    verdictChangeAuditLog: true,
  },
};

const MOCK_HISTORY = [
  { id: "h1", changedAt: "2026-07-16T09:12:00Z", summary: "SSIM min score raised 0.80 → 0.85", user: "Chaitanya" },
  { id: "h2", changedAt: "2026-07-12T14:40:00Z", summary: "OCR fuzzy match relaxed to 92%", user: "Jagruti" },
  { id: "h3", changedAt: "2026-07-08T11:05:00Z", summary: "Added Rule #103 — High-Risk Automation Gate", user: "Chaitanya" },
];

export function fetchPipelineConfig() {
  return new Promise((resolve) => {
    setTimeout(() => resolve(JSON.parse(JSON.stringify(MOCK_CONFIG))), MOCK_LATENCY);
  });
}

export function savePipelineConfig(config) {
  // TODO(backend): PUT /api/pipeline/config
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!config) {
        reject(new Error("No config provided"));
        return;
      }
      resolve({ savedAt: new Date().toISOString(), config });
    }, MOCK_LATENCY);
  });
}

export function fetchAdjustmentHistory() {
  return new Promise((resolve) => {
    setTimeout(() => resolve(MOCK_HISTORY), MOCK_LATENCY / 2);
  });
}
