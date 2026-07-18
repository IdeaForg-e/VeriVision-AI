import { useCallback, useEffect, useState } from "react";
import { fetchAdjustmentHistory, fetchPipelineConfig, savePipelineConfig } from "../services/feedbackService.js";

export function useFeedbackConfig() {
  const [config, setConfig] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState("idle"); // idle | saving | saved | error

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchPipelineConfig(), fetchAdjustmentHistory()]).then(([cfg, hist]) => {
      if (cancelled) return;
      setConfig(cfg);
      setHistory(hist);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const updateThreshold = useCallback((key, value) => {
    setConfig((prev) => ({ ...prev, thresholds: { ...prev.thresholds, [key]: value } }));
  }, []);

  const togglePrivacy = useCallback((key) => {
    setConfig((prev) => ({ ...prev, privacy: { ...prev.privacy, [key]: !prev.privacy[key] } }));
  }, []);

  const addRoutingRule = useCallback((rule) => {
    setConfig((prev) => ({ ...prev, routingRules: [...prev.routingRules, rule] }));
  }, []);

  const save = useCallback(async () => {
    setSaveState("saving");
    try {
      await savePipelineConfig(config);
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2000);
    } catch {
      setSaveState("error");
      setTimeout(() => setSaveState("idle"), 2000);
    }
  }, [config]);

  return { config, history, loading, saveState, updateThreshold, togglePrivacy, addRoutingRule, save };
}
