import { useState, useCallback, useEffect } from "react";
import { fetchCaseForReview, updateROIRegion, submitReviewDecision } from "../services/reviewService.js";

export function useReview(caseId) {
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [region, setRegion] = useState({ x: 25, y: 25, w: 25, h: 25 });
  const [learningStatus, setLearningStatus] = useState("idle"); // 'idle' | 'learning' | 'success'
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

  const handleRegionCommit = useCallback((newRegion) => {
    setRegion(newRegion);
    setLearningStatus("learning");
    updateROIRegion(caseId, newRegion)
      .then((res) => {
        console.log("ROI updated successfully on backend:", res);
        // Add a small artificial delay so the user sees the "learning" state
        setTimeout(() => {
          setLearningStatus("success");
          setTimeout(() => setLearningStatus("idle"), 2000);
        }, 1200);
      })
      .catch((err) => {
        console.error("Failed to save ROI on backend:", err);
        setLearningStatus("idle");
      });
  }, [caseId]);

  const submitDecision = useCallback(
    async (decision) => {
      setDecisionState({ pending: decision, lastResult: null, error: null });
      setLearningStatus("learning");
      try {
        const result = await submitReviewDecision(caseId, decision, notes);
        setTimeout(() => {
          setLearningStatus("success");
          setDecisionState({ pending: null, lastResult: result, error: null });
          setTimeout(() => setLearningStatus("idle"), 2000);
        }, 1200);
      } catch (err) {
        setLearningStatus("idle");
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
    handleRegionCommit,
    decisionState,
    submitDecision,
    learningStatus,
  };
}
