// Aura Modern — Triage Components
import { SearchBar, Badge, Button } from "./Common.jsx";
import { ROUTES } from "../utils/constants.js";
import {
  Filter, RefreshCw, Download, AlertTriangle, ShieldAlert,
  CheckCircle2, Clock3, Activity, ChevronRight, ClipboardCheck,
  BrainCircuit, TrendingUp, Zap,
} from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

/* ── Glass Card helper ───────────────────────────────────────────────────── */
const cardStyle = {
  background: "var(--glass-bg)",
  backdropFilter: "var(--glass-blur)",
  WebkitBackdropFilter: "var(--glass-blur)",
  border: "1px solid var(--border-hairline)",
  borderTopColor: "var(--border-light-top)",
  borderRadius: "var(--radius-lg)",
  boxShadow: "var(--glass-shadow-sm), var(--glass-inset)",
};

/* ── Pipeline Status Panel ───────────────────────────────────────────────── */
export function PipelineStatus({ alerts = [], activities = [] }) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-6">
      {/* System Alerts */}
      <div className="overflow-hidden" style={cardStyle}>
        <div
          className="px-4 py-3 flex items-center justify-between"
          style={{ borderBottom: "1px solid var(--border-hairline)", background: "var(--glass-bg)" }}
        >
          <div className="flex items-center gap-2">
            <ShieldAlert size={14} style={{ color: "var(--urgent)" }} />
            <h2
              className="text-[12px] font-semibold"
              style={{ fontFamily: "var(--font-headline)", color: "var(--on-surface)" }}
            >
              System Alerts & Notices
            </h2>
          </div>
          <span
            className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
            style={{
              background: alerts.length > 0 ? "var(--urgent-surface)" : "var(--glass-bg)",
              border: alerts.length > 0 ? "1px solid var(--urgent-border)" : "1px solid var(--border-hairline)",
              color: alerts.length > 0 ? "var(--urgent)" : "var(--on-surface-muted)",
              fontFamily: "var(--font-body)",
            }}
          >
            {alerts.length} ALERTS
          </span>
        </div>

        <div className="max-h-72 overflow-y-auto">
          {alerts.length === 0 ? (
            <div className="p-8 text-center">
              <CheckCircle2 size={20} className="mx-auto mb-2" style={{ color: "var(--success)" }} />
              <p className="text-[11px]" style={{ fontFamily: "var(--font-body)", color: "var(--on-surface-muted)" }}>
                No active alerts reported
              </p>
            </div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className="p-3.5 flex items-start justify-between gap-3 transition-colors duration-150 cursor-default"
                style={{ borderBottom: "0.5px solid var(--border-hairline)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--urgent-surface)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <div className="flex gap-2.5 items-start min-w-0">
                  <AlertTriangle size={13} className="shrink-0 mt-0.5" style={{ color: "var(--urgent)" }} />
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold truncate"
                       style={{ fontFamily: "var(--font-body)", color: "var(--on-surface)" }}>
                      {alert.title}
                    </p>
                    <p className="text-[10px] mt-0.5 leading-relaxed"
                       style={{ fontFamily: "var(--font-body)", color: "var(--on-surface-muted)" }}>
                      {alert.message}
                    </p>
                  </div>
                </div>
                <span
                  className="text-[9px] shrink-0"
                  style={{ fontFamily: "var(--font-mono)", color: "var(--on-surface-muted)" }}
                >
                  {alert.time}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Live Pipeline Activity */}
      <div className="overflow-hidden" style={cardStyle}>
        <div
          className="px-4 py-3 flex items-center justify-between"
          style={{ borderBottom: "1px solid var(--border-hairline)", background: "var(--glass-bg)" }}
        >
          <div className="flex items-center gap-2">
            <Activity size={14} style={{ color: "var(--primary)" }} />
            <h2
              className="text-[12px] font-semibold"
              style={{ fontFamily: "var(--font-headline)", color: "var(--on-surface)" }}
            >
              Live Agent Pipeline Activity
            </h2>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: "var(--success)" }}
            />
            <span
              className="text-[9px] font-bold uppercase tracking-widest"
              style={{ fontFamily: "var(--font-body)", color: "var(--success)" }}
            >
              LIVE FEED
            </span>
          </div>
        </div>

        <div className="max-h-72 overflow-y-auto">
          {activities.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-[11px]" style={{ fontFamily: "var(--font-body)", color: "var(--on-surface-muted)" }}>
                No recent activity log
              </p>
            </div>
          ) : (
            activities.map((activity) => (
              <div
                key={activity.id}
                className="p-3.5 flex items-start justify-between gap-3 transition-colors duration-150 cursor-default"
                style={{ borderBottom: "0.5px solid var(--border-hairline)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--glass-bg)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <div className="flex gap-2.5 items-start min-w-0">
                  {activity.status === "SUCCESS" ? (
                    <CheckCircle2 size={13} className="shrink-0 mt-0.5" style={{ color: "var(--success)" }} />
                  ) : (
                    <Clock3 size={13} className="shrink-0 mt-0.5" style={{ color: "var(--warning)" }} />
                  )}
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold truncate"
                       style={{ fontFamily: "var(--font-body)", color: "var(--on-surface)" }}>
                      {activity.title}
                    </p>
                    <p className="text-[10px] mt-0.5 leading-relaxed"
                       style={{ fontFamily: "var(--font-body)", color: "var(--on-surface-muted)" }}>
                      {activity.description}
                    </p>
                  </div>
                </div>
                <span
                  className="text-[9px] shrink-0"
                  style={{ fontFamily: "var(--font-mono)", color: "var(--on-surface-muted)" }}
                >
                  {activity.time}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Queue Filters Bar ───────────────────────────────────────────────────── */
export function QueueFilters({ search, setSearch, statusFilter, setStatusFilter, onRefresh, onExport }) {
  return (
    <div className="mb-4 p-3 rounded-xl" style={cardStyle}>
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
        <div className="w-full sm:w-80">
          <SearchBar value={search} onChange={setSearch} placeholder="Search by case ID or part code..." />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {/* Status Filter */}
          <div className="relative">
            <Filter
              size={12}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: "var(--on-surface-muted)" }}
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8 py-1 pl-8 pr-6 text-[11px] rounded-lg outline-none cursor-pointer transition-all duration-150"
              style={{
                background: "rgba(0,0,0,0.20)",
                border: "1px solid var(--border-default)",
                color: "var(--on-surface)",
                fontFamily: "var(--font-body)",
                fontWeight: 600,
              }}
            >
              <option value="ALL">All Statuses</option>
              <option value="QUARANTINE">Quarantine</option>
              <option value="PENDING QA">Pending QA</option>
              <option value="AUTO-APPROVED">Auto Approved</option>
              <option value="RETAKE REQUESTED">Retake Requested</option>
            </select>
          </div>

          <Button variant="outline" size="sm" onClick={onRefresh} icon={<RefreshCw size={12} />}>
            Refresh
          </Button>

          <Button variant="primary" size="sm" onClick={onExport} icon={<Download size={12} />}>
            Export CSV
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── Queue Row ───────────────────────────────────────────────────────────── */
export function QueueRow({ item }) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);

  const getRiskBarColor = (risk) => {
    if (risk >= 75) return "var(--urgent)";
    if (risk >= 50) return "var(--warning)";
    if (risk >= 25) return "#f97316";
    return "var(--success)";
  };

  const handleClick = () => navigate(`${ROUTES.CASE_DETAIL}/${item.caseId}`);

  const displayCaseId =
    item.caseId && item.caseId.length > 14
      ? `${item.caseId.slice(0, 8)}…${item.caseId.slice(-4)}`
      : item.caseId;

  return (
    <tr
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="cursor-pointer transition-all duration-150"
      style={{
        borderBottom: "0.5px solid var(--border-hairline)",
        background: hovered ? "var(--glass-bg)" : "transparent",
      }}
    >
      {/* Case ID */}
      <td className="px-4 py-3">
        <p
          className="text-[11px] font-semibold truncate transition-colors duration-150"
          style={{
            fontFamily: "var(--font-mono)",
            color: hovered ? "var(--primary)" : "var(--on-surface)",
          }}
        >
          {displayCaseId}
        </p>
        <p className="text-[9px] mt-0.5" style={{ fontFamily: "var(--font-mono)", color: "var(--on-surface-muted)" }}>
          {item.createdAt || "Just now"}
        </p>
      </td>

      {/* Part Number */}
      <td className="px-4 py-3">
        <p className="text-[11px] font-semibold" style={{ fontFamily: "var(--font-body)", color: "var(--on-surface)" }}>
          {item.partNumber}
        </p>
        <p className="text-[9px]" style={{ fontFamily: "var(--font-mono)", color: "var(--on-surface-muted)" }}>
          {item.batch || "STANDARD"}
        </p>
      </td>

      {/* Commodity */}
      <td className="px-4 py-3">
        <span
          className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider"
          style={{
            background: "var(--glass-bg)",
            border: "1px solid var(--border-default)",
            color: "var(--on-surface-variant)",
            fontFamily: "var(--font-body)",
          }}
        >
          {item.commodity}
        </span>
      </td>

      {/* Risk Score */}
      <td className="px-4 py-3">
        <div className="w-24 space-y-1.5">
          <div className="flex justify-between text-[10px]">
            <span
              className="font-bold"
              style={{ fontFamily: "var(--font-mono)", color: getRiskBarColor(item.riskScore) }}
            >
              {item.riskScore}%
            </span>
            <span style={{ fontFamily: "var(--font-mono)", color: "var(--on-surface-muted)", fontSize: "9px" }}>
              RISK
            </span>
          </div>
          <div
            className="w-full h-1 rounded-full overflow-hidden"
            style={{ background: "var(--border-default)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, Math.max(0, item.riskScore))}%`,
                background: getRiskBarColor(item.riskScore),
                boxShadow: `0 0 6px ${getRiskBarColor(item.riskScore)}`,
              }}
            />
          </div>
        </div>
      </td>

      {/* Confidence */}
      <td className="px-4 py-3">
        <span
          className="text-[11px] font-bold"
          style={{ fontFamily: "var(--font-mono)", color: "var(--on-surface)" }}
        >
          {item.confidence}%
        </span>
      </td>

      {/* Reason */}
      <td className="px-4 py-3 max-w-xs">
        <p
          className="text-[10px] truncate"
          style={{ fontFamily: "var(--font-body)", color: "var(--on-surface-muted)" }}
          title={item.reason}
        >
          {item.reason}
        </p>
      </td>

      {/* Status Badge */}
      <td className="px-4 py-3 text-center">
        <Badge status={item.status} size="sm" />
      </td>

      {/* Arrow */}
      <td className="px-4 py-3 text-right">
        <ChevronRight
          size={14}
          className="transition-transform duration-150"
          style={{
            color: hovered ? "var(--primary)" : "var(--on-surface-muted)",
            transform: hovered ? "translateX(2px)" : "none",
          }}
        />
      </td>
    </tr>
  );
}

const ROWS_PER_PAGE = 8;

/* ── Queue Table ─────────────────────────────────────────────────────────── */
export function QueueTable({ cases = [], search, statusFilter }) {
  const [currentPage, setCurrentPage] = useState(1);

  const filteredCases = useMemo(() => {
    return cases.filter((item) => {
      const matchesSearch =
        item.caseId.toLowerCase().includes(search.toLowerCase()) ||
        item.partNumber.toLowerCase().includes(search.toLowerCase()) ||
        item.commodity.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [cases, search, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const totalPages = Math.ceil(filteredCases.length / ROWS_PER_PAGE);
  const paginatedCases = filteredCases.slice(
    (currentPage - 1) * ROWS_PER_PAGE,
    currentPage * ROWS_PER_PAGE
  );

  return (
    <div className="overflow-hidden mb-4" style={cardStyle}>
      {/* Header */}
      <div
        className="flex justify-between items-center px-5 py-4"
        style={{ borderBottom: "1px solid var(--border-hairline)", background: "var(--glass-bg)" }}
      >
        <div>
          <h2
            className="text-[14px] font-medium"
            style={{ fontFamily: "var(--font-headline)", color: "var(--on-surface)" }}
          >
            Live Inspection Queue
          </h2>
          <p className="text-[10px] mt-0.5 uppercase tracking-widest font-semibold"
             style={{ fontFamily: "var(--font-body)", color: "var(--on-surface-muted)" }}>
            Hardware compliance scans in database
          </p>
        </div>
        <span
          className="px-2.5 py-0.5 rounded-full text-[10px] font-bold"
          style={{
            background: "var(--primary-glow-sm)",
            border: "1px solid rgba(0,125,184,0.25)",
            color: "var(--primary)",
            fontFamily: "var(--font-mono)",
          }}
        >
          {filteredCases.length} RECORDS
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr style={{ background: "var(--surface-high)", borderBottom: "1px solid var(--border-hairline)" }}>
              {["Case ID", "Part Number", "Commodity", "Risk Score", "AI Confidence", "Audit Rationale", "Status", "View"].map((h, i) => (
                <th
                  key={h}
                  className={`px-4 py-3 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap
                              ${i === 6 ? "text-center" : ""} ${i === 7 ? "text-right" : ""}`}
                  style={{ fontFamily: "var(--font-body)", color: "var(--on-surface-muted)" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedCases.length === 0 ? (
              <tr>
                <td colSpan="8" className="py-14 text-center">
                  <p className="text-[12px]" style={{ fontFamily: "var(--font-body)", color: "var(--on-surface-muted)" }}>
                    No inspection cases match your filter query.
                  </p>
                </td>
              </tr>
            ) : (
              paginatedCases.map((item) => <QueueRow key={item.id} item={item} />)
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div
        className="flex justify-between items-center px-5 py-3"
        style={{ borderTop: "1px solid var(--border-hairline)", background: "var(--glass-bg)" }}
      >
        <span className="text-[10px]" style={{ fontFamily: "var(--font-mono)", color: "var(--on-surface-muted)" }}>
          Showing {paginatedCases.length} of {filteredCases.length} cases
        </span>
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            Prev
          </Button>
          <span
            className="text-[11px] font-bold px-2"
            style={{ fontFamily: "var(--font-mono)", color: "var(--on-surface)" }}
          >
            {currentPage} / {totalPages || 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── Stats Cards ─────────────────────────────────────────────────────────── */
export function StatsCards({ cases = [], stats = null }) {
  const derivedTotal       = cases.length;
  const derivedPending     = cases.filter((c) => c.status === "PENDING QA").length;
  const derivedQuarantined = cases.filter((c) => c.status === "QUARANTINE").length;
  const derivedAutoApproved= cases.filter((c) => c.status === "AUTO-APPROVED").length;

  const totalInspected  = stats?.totalToday ?? derivedTotal;
  const pendingQA       = stats?.pendingReview ?? derivedPending;
  const quarantined     = derivedQuarantined;
  const autoApproved    = stats?.autoApproved ?? derivedAutoApproved;
  const quarantineRate  = totalInspected > 0 ? Math.round((quarantined / totalInspected) * 100) : 0;
  const autopilotIndex  = totalInspected > 0 ? Math.round((autoApproved / totalInspected) * 100) : 0;

  const cards = [
    {
      title: "TOTAL INSPECTED",
      value: totalInspected,
      icon: ClipboardCheck,
      accentColor: "var(--primary)",
      accentBg: "var(--primary-glow-sm)",
      accentBorder: "rgba(0,125,184,0.20)",
      footer: "Scans today",
    },
    {
      title: "PENDING QA REVIEW",
      value: pendingQA,
      icon: Clock3,
      accentColor: "var(--warning)",
      accentBg: "var(--warning-surface)",
      accentBorder: "var(--warning-border)",
      footer: pendingQA > 0 ? `${pendingQA} awaiting signoff` : "Queue clear",
    },
    {
      title: "QUARANTINE RATE",
      value: `${quarantineRate}%`,
      icon: ShieldAlert,
      accentColor: "var(--urgent)",
      accentBg: "var(--urgent-surface)",
      accentBorder: "var(--urgent-border)",
      footer: `${quarantined} quarantined parts`,
      trend: quarantineRate > 0,
    },
    {
      title: "AUTOPILOT RATE",
      value: `${autopilotIndex}%`,
      icon: BrainCircuit,
      accentColor: "var(--success)",
      accentBg: "var(--success-surface)",
      accentBorder: "var(--success-border)",
      footer: `${autoApproved} auto-approved`,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className="p-4 flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5"
            style={{
              ...cardStyle,
              borderLeftWidth: "3px",
              borderLeftColor: card.accentColor,
            }}
          >
            <div className="flex justify-between items-start">
              <div>
                <p
                  className="text-[9px] font-bold uppercase tracking-widest"
                  style={{ fontFamily: "var(--font-body)", color: "var(--on-surface-muted)" }}
                >
                  {card.title}
                </p>
                <h2
                  className="text-2xl font-light mt-1"
                  style={{ fontFamily: "var(--font-headline)", color: card.accentColor }}
                >
                  {card.value}
                </h2>
              </div>
              <div
                className="p-2.5 rounded-xl shrink-0"
                style={{
                  background: card.accentBg,
                  border: `1px solid ${card.accentBorder}`,
                  color: card.accentColor,
                  boxShadow: `0 0 10px ${card.accentBg}`,
                }}
              >
                <Icon size={18} />
              </div>
            </div>

            <div
              className="mt-3 pt-2.5 flex items-center gap-1.5 text-[10px]"
              style={{ borderTop: "1px solid var(--border-hairline)" }}
            >
              {card.trend && <TrendingUp size={11} style={{ color: "var(--urgent)" }} />}
              <span style={{ fontFamily: "var(--font-body)", color: "var(--on-surface-muted)" }}>
                {card.footer}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
