import { useCallback, useEffect, useState } from "react";
import { fetchCaseForReview, submitReviewDecision, updateROIRegion } from "../services/reviewService.js";

export function useReview(caseId) {
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [region, setRegion] = useState(null);
  const [decisionState, setDecisionState] = useState({ pending: null, lastResult: null, error: null });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchCaseForReview(caseId).then((data) => {
      if (cancelled) return;
      setCaseData(data);
      setRegion(data.aiRegion);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [caseId]);

  const handleRegionChange = useCallback(
    (nextRegion) => {
      setRegion(nextRegion);
      if (caseData) updateROIRegion(caseData.id, nextRegion);
    },
    [caseData]
  );

  const submitDecision = useCallback(
    async (decision) => {
      if (!caseData) return;
      setDecisionState({ pending: decision, lastResult: null, error: null });
      try {
        const result = await submitReviewDecision(caseData.id, decision, notes);
        setDecisionState({ pending: null, lastResult: result, error: null });
      } catch (err) {
        setDecisionState({ pending: null, lastResult: null, error: err.message });
      }
    },
    [caseData, notes]
  );

  return {
    caseData,
    loading,
    notes,
    setNotes,
    region,
    handleRegionChange,
    decisionState,
    submitDecision,
  };
}
