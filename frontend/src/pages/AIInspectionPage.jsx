import { useState, useEffect } from "react";
import { Layout } from "../components/layout.jsx";
import { StatsCards, QueueFilters, QueueTable, PipelineStatus } from "../components/triage.jsx";
import { getTriageQueue, getTriageStats, getPipelineStatus } from "../services/triageService.js";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from "recharts";

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

  // CSV Export for AI Inspection page
  const exportToCSV = () => {
    const filteredCases = cases.filter((item) => {
      const matchesSearch = item.caseId.toLowerCase().includes(search.toLowerCase()) ||
        item.partNumber.toLowerCase().includes(search.toLowerCase()) ||
        item.commodity.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    if (filteredCases.length === 0) {
      alert("No data available to export.");
      return;
    }

    const headers = ["Case ID", "Part Number", "Commodity", "Risk Score", "Confidence", "Reason", "Status", "Timestamp"];
    const rows = filteredCases.map(item => [
      item.caseId || "",
      item.partNumber || "",
      item.commodity || "",
      item.riskScore || 0,
      item.confidence || 0,
      item.reason || "",
      item.status || "",
      item.createdAt || ""
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `verivision_triage_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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

      {/* Real-time Risk & Confidence Telemetry Chart */}
      {cases.length > 0 && (
        <div className="mt-6 cyber-card bg-[#0f172a]/55 border-slate-800 p-5 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-200">Real-Time Risk & Confidence Telemetry</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Chronological comparison of last 15 automated vision inspections</p>
            </div>
            <div className="flex items-center gap-4 text-[10px] uppercase font-bold tracking-wide">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <span className="w-2 h-2 rounded bg-cyan-400"></span>
                Risk Score
              </span>
              <span className="flex items-center gap-1.5 text-purple-400">
                <span className="w-2 h-2 rounded bg-purple-400"></span>
                Confidence Index
              </span>
            </div>
          </div>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart 
                data={[...cases].reverse().slice(-15).map(c => ({
                  caseId: c.caseId ? c.caseId.slice(0, 8) : "N/A",
                  riskScore: c.riskScore || 0,
                  confidence: c.confidence || 0,
                }))} 
                margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorRiskDashboard" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorConfDashboard" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="caseId" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px" }}
                  labelStyle={{ color: "#94a3b8", fontSize: "10px", fontWeight: "bold" }}
                  itemStyle={{ fontSize: "11px", padding: "1px 0" }}
                />
                <Area type="monotone" dataKey="riskScore" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorRiskDashboard)" name="Risk Score (%)" />
                <Area type="monotone" dataKey="confidence" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#colorConfDashboard)" name="Confidence (%)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mt-6">
        <QueueFilters
          search={search}
          setSearch={setSearch}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          onRefresh={handleRefresh}
          onExport={exportToCSV}
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
