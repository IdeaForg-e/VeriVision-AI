import { useState } from "react";

import { Layout } from "../components/layout.jsx";
import { StatsCards, QueueFilters, QueueTable, PipelineStatus } from "../components/triage.jsx";

export default function DailyTriagePage() {
  // Search & Filter
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Mock Inspection Cases
  const [cases] = useState([
    {
      id: 1,
      caseId: "QC-1001",
      createdAt: "09:30 AM",
      partNumber: "PN-4582",
      batch: "Batch A",
      commodity: "Gear",
      riskScore: 85,
      confidence: 96,
      reason: "OCR Mismatch",
      status: "QUARANTINE",
    },
    {
      id: 2,
      caseId: "QC-1002",
      createdAt: "09:45 AM",
      partNumber: "PN-5621",
      batch: "Batch B",
      commodity: "Bearing",
      riskScore: 48,
      confidence: 91,
      reason: "Missing Sticker",
      status: "PENDING QA",
    },
    {
      id: 3,
      caseId: "QC-1003",
      createdAt: "10:05 AM",
      partNumber: "PN-7630",
      batch: "Batch C",
      commodity: "Valve",
      riskScore: 15,
      confidence: 99,
      reason: "Passed Inspection",
      status: "AUTO-APPROVED",
    },
  ]);

  // Mock Alerts
  const alerts = [
    {
      id: 1,
      title: "High Fraud Risk",
      message: "QC-1001 requires manual review",
      time: "2 min ago",
    },
    {
      id: 2,
      title: "OCR Failure",
      message: "Image quality below threshold",
      time: "10 min ago",
    },
  ];

  // Mock Activity
  const activities = [
    {
      id: 1,
      title: "Inspection Completed",
      description: "QC-1003 approved",
      status: "SUCCESS",
      time: "1 min ago",
    },
    {
      id: 2,
      title: "Waiting for QA",
      description: "QC-1002 pending review",
      status: "PENDING",
      time: "5 min ago",
    },
  ];

  return (
    <Layout
      title="Daily Triage Dashboard"
      subtitle="Monitor inspection cases and AI pipeline"
    >
      {/* Statistics */}
      <StatsCards cases={cases} />

      {/* Filters */}
      <div className="mt-6">
        <QueueFilters
          search={search}
          setSearch={setSearch}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          onRefresh={() => {
            setSearch("");
            setStatusFilter("ALL");
          }}
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