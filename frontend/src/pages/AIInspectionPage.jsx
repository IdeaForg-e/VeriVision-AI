import { useState, useEffect } from "react";
import { Layout } from "../components/layout.jsx";
import { StatsCards, QueueFilters, QueueTable, PipelineStatus } from "../components/triage.jsx";
import { getTriageQueue, getTriageStats, getPipelineStatus } from "../services/triageService.js";

export default function AIInspectionPage() {
  // Search & Filter
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Real data from backend
  const [cases, setCases] = useState([]);
  const [stats, setStats] = useState({ totalToday: 0, pendingReview: 0, autoApproved: 0 });
  const [alerts, setAlerts] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [queueResult, statsData, pipelineData] = await Promise.all([
        getTriageQueue({ page: 1, pageSize: 50, filters: { status: statusFilter, search } }),
        getTriageStats(),
        getPipelineStatus(),
      ]);

      setCases(queueResult.items || []);

      // Derive alerts from cases with high risk
      const highRiskCases = (queueResult.items || []).filter((c) => c.riskScore >= 75);
      setAlerts(
        highRiskCases.slice(0, 5).map((c, i) => ({
          id: i + 1,
          title: "High Fraud Risk",
          message: `${c.caseId} requires manual review`,
          time: "Recent",
        }))
      );

      // Derive activities
      const recentCases = (queueResult.items || []).slice(0, 5);
      setActivities(
        recentCases.map((c, i) => ({
          id: i + 1,
          title: c.status === "AUTO-APPROVED" ? "Inspection Completed" : "Flagged for Review",
          description: `${c.caseId} ${c.status === "AUTO-APPROVED" ? "approved" : "pending review"}`,
          status: c.status === "AUTO-APPROVED" ? "SUCCESS" : "PENDING",
          time: c.createdAt || "Recent",
        }))
      );

      setStats(statsData || { totalToday: 0, pendingReview: 0, autoApproved: 0, avgResolutionMinutes: 0 });
    } catch (err) {
      console.error("Failed to fetch triage data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setSearch("");
    setStatusFilter("ALL");
    fetchData();
  };

  if (loading && cases.length === 0) {
    return (
      <Layout title="AI Inspection Dashboard" subtitle="Monitor inspection cases and AI pipeline">
        <div className="flex items-center justify-center h-64 text-on-surface-variant">
          Loading triage data...
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title="AI Inspection Dashboard"
      subtitle="Monitor inspection cases and AI pipeline"
    >
      {/* Statistics */}
      <StatsCards cases={cases} stats={stats} />

      {/* Filters */}
      <div className="mt-6">
        <QueueFilters
          search={search}
          setSearch={setSearch}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          onRefresh={handleRefresh}
        />
      </div>

      {/* Queue */}
      <div className="mt-6">
        <QueueTable
          cases={cases}
          search={search}
          statusFilter={statusFilter}
        />
      </div>

      {/* Pipeline */}
      <div className="mt-6">
        <PipelineStatus
          alerts={alerts}
          activities={activities}
        />
      </div>
    </Layout>
  );
}
