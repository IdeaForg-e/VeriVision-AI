/**
 * Case service — shared by Daily Triage, Case Detail, and Human Review
 * (all three read/write "case" objects, just at different levels of detail).
 *
 * TODO(backend):
 *   GET   /cases                 -> list (used by Daily Triage queue)
 *   GET   /cases/:id             -> full detail (used by Case Detail + Human Review)
 *   PATCH /cases/:id/status      -> { status }
 */

const MOCK_LATENCY = 500;

const MOCK_CASES = [
  {
    id: "F-2026-02",
    partCode: "BRK-442",
    commodity: "Brake Assembly",
    confidencePct: 42,
    fraudScore: 58,
    status: "needs_evidence",
    updatedAt: "2026-07-17T10:15:00Z",
  },
  {
    id: "F-2026-01",
    partCode: "IC-118",
    commodity: "Microchips / IC",
    confidencePct: 91,
    fraudScore: 22,
    status: "final_decision",
    updatedAt: "2026-07-16T08:40:00Z",
  },
  {
    id: "F-2026-03",
    partCode: "SNS-077",
    commodity: "Sensor Housing",
    confidencePct: 30,
    fraudScore: 81,
    status: "retake_requested",
    updatedAt: "2026-07-17T13:02:00Z",
  },
];

export function getCases() {
  return new Promise((resolve) => {
    setTimeout(() => resolve(MOCK_CASES), MOCK_LATENCY);
  });
}

export function getCaseById(caseId) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const found = MOCK_CASES.find((c) => c.id === caseId);
      if (!found) {
        reject(new Error(`Case ${caseId} not found`));
        return;
      }
      resolve(found);
    }, MOCK_LATENCY);
  });
}

export function updateCaseStatus(caseId, status) {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ caseId, status, updatedAt: new Date().toISOString() }), MOCK_LATENCY / 2);
  });
}
