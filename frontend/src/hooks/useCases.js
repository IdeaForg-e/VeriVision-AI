import { useCallback, useEffect, useState } from "react";
import { getCases } from "../services/caseService.js";

/** Fetches the case list once and exposes a refetch, for the Daily Triage queue. */
export function useCases() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(() => {
    setLoading(true);
    setError(null);
    return getCases()
      .then((data) => setCases(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { cases, loading, error, refetch };
}
