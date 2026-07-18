import { useState, useCallback, useEffect } from "react";
import { fetchCaseForReview, updateROIRegion, submitReviewDecision } from "../services/reviewService.js";

export function useReview(caseId) {
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [region, setRegion] = useState({ x: 25, y: 25, w: 25, h: 25 });
  const [decisionState, setDecisionState] = useState({
    pending: null,
    lastResult: null,
    error: null,
  });

  useEffect(() => {
    if (!caseId) return;
    setLoading(true);
    fetchCaseForReview(caseId)
      .then((data) => {
        setCaseData(data);
        if (data.aiRegion) setRegion(data.aiRegion);
      })
      .catch((err) => console.error("Failed to load case for review:", err))
      .finally(() => setLoading(false));
  }, [caseId]);

  const handleRegionChange = useCallback((newRegion) => {
    setRegion(newRegion);
  }, []);

  const submitDecision = useCallback(
    async (decision) => {
      setDecisionState({ pending: decision, lastResult: null, error: null });
      try {
        const result = await submitReviewDecision(caseId, decision, notes);
        setDecisionState({ pending: null, lastResult: result, error: null });
      } catch (err) {
        setDecisionState({ pending: null, lastResult: null, error: err.message });
      }
    },
    [caseId, notes]
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