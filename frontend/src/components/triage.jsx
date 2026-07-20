// Consolidated components for triage
import { Pagination, SearchBar } from "./common.jsx";
import { ROUTES } from "../utils/constants.js";
import { Search, Filter, RefreshCw, Download, AlertTriangle, ShieldAlert, CheckCircle2, Clock3, Activity, ChevronRight, ClipboardCheck, BrainCircuit, TrendingUp } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function PipelineStatus({
  alerts = [],
  activities = [],
}) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
      {/* Recent Alerts */}

      <div className="cyber-card bg-[#0f172a]/55 border-slate-800 shadow-lg overflow-hidden">

        <div className="px-5 py-4 border-b bg-[#0d1527]/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="text-red-500" size={20} />
            <h2 className="font-semibold text-slate-200">
              Recent Alerts
            </h2>
          </div>

          <span className="text-xs text-slate-450">
            {alerts.length} Alerts
          </span>
        </div>

        <div className="max-h-80 overflow-y-auto">

          {alerts.length === 0 ? (
            <div className="p-8 text-center text-slate-450">
              No alerts available
            </div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className="px-5 py-4 border-b border-slate-850 last:border-0 hover:bg-red-950/25 transition"
              >
                <div className="flex justify-between items-start">

                  <div className="flex gap-3">

                    <div className="mt-1">
                      <AlertTriangle
                        className="text-red-500"
                        size={18}
                      />
                    </div>

                    <div>

                      <p className="font-semibold text-slate-200">
                        {alert.title}
                      </p>

                      <p className="text-sm text-slate-450 mt-1">
                        {alert.message}
                      </p>

                    </div>

                  </div>

                  <span className="text-xs text-slate-500 whitespace-nowrap">
                    {alert.time}
                  </span>

                </div>
              </div>
            ))
          )}

        </div>
      </div>

      {/* Recent Activity */}

      <div className="cyber-card bg-[#0f172a]/55 border-slate-800 shadow-lg overflow-hidden">

        <div className="px-5 py-4 border-b bg-[#0d1527]/50 flex items-center justify-between">

          <div className="flex items-center gap-2">
            <Activity className="text-cyan-400" size={20} />
            <h2 className="font-semibold text-slate-200">
              Recent Activity
            </h2>
          </div>

          <span className="text-xs text-slate-450">
            Live Feed
          </span>

        </div>

        <div className="max-h-80 overflow-y-auto">

          {activities.length === 0 ? (
            <div className="p-8 text-center text-slate-450">
              No recent activity
            </div>
          ) : (
            activities.map((activity) => (
              <div
                key={activity.id}
                className="px-5 py-4 border-b border-slate-850 last:border-0 hover:bg-[#0d1527]/50 transition"
              >
                <div className="flex justify-between">

                  <div className="flex gap-3">

                    <div className="mt-1">
                      {activity.status === "SUCCESS" ? (
                        <CheckCircle2
                          className="text-green-500"
                          size={18}
                        />
                      ) : (
                        <Clock3
                          className="text-yellow-500"
                          size={18}
                        />
                      )}
                    </div>

                    <div>

                      <p className="font-semibold text-slate-200">
                        {activity.title}
                      </p>

                      <p className="text-sm text-slate-450 mt-1">
                        {activity.description}
                      </p>

                    </div>

                  </div>

                  <span className="text-xs text-slate-500 whitespace-nowrap">
                    {activity.time}
                  </span>

                </div>
              </div>
            ))
          )}

        </div>
      </div>
    </div>
  );
}

// ==========================================


export function QueueFilters({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  onRefresh,
  onExport,
}) {
  return (
    <div className="cyber-card bg-[#0f172a]/55 border-slate-800 rounded-xl p-4 shadow-sm">

      <div className="flex flex-col lg:flex-row gap-4 justify-between">

        {/* Search */}
        <div className="relative flex-1">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search Case ID, Part Number..."
          />
        </div>

        {/* Right Buttons */}
        <div className="flex gap-3">

          {/* Status filter */}
          <div className="relative">

            <Filter
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg py-2 pl-9 pr-8 h-full cyber-input text-slate-350"
            >
              <option value="ALL">All Status</option>
              <option value="QUARANTINE">Quarantine</option>
              <option value="PENDING QA">Pending QA</option>
              <option value="AUTO-APPROVED">Auto Approved</option>
              <option value="RETAKE REQUESTED">Retake Requested</option>
            </select>

          </div>

          {/* Single Refresh button (was duplicated before) */}
          <button
            onClick={onRefresh}
            className="flex items-center gap-2 border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white px-4 py-2 rounded-lg transition-colors"
          >
            <RefreshCw size={16} />
            Refresh
          </button>

          <button
            onClick={onExport}
            className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
          >
            <Download size={16} />
            Export
          </button>

        </div>

      </div>

    </div>
  );
}
// ==========================================

export function QueueRow({ item }) {
  const navigate = useNavigate();

  const getStatusStyle = (status) => {
    switch (status) {
      case "QUARANTINE":
        return "bg-red-500/10 text-red-400 border border-red-500/25 shadow-[0_0_10px_rgba(239,68,68,0.05)]";
      case "PENDING QA":
        return "bg-amber-500/10 text-amber-400 border border-amber-500/25 shadow-[0_0_10px_rgba(245,158,11,0.05)]";
      case "AUTO-APPROVED":
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 shadow-[0_0_10px_rgba(16,185,129,0.05)]";
      case "RETAKE REQUESTED":
        return "bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 shadow-[0_0_10px_rgba(6,182,212,0.05)]";
      default:
        return "bg-slate-800/40 text-slate-400 border border-slate-750";
    }
  };

  const getRiskColor = (risk) => {
    if (risk >= 80) return "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]";
    if (risk >= 60) return "bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.4)]";
    if (risk >= 40) return "bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.4)]";
    return "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]";
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "QUARANTINE":
        return <AlertTriangle size={12} />;
      case "AUTO-APPROVED":
        return <CheckCircle2 size={12} />;
      default:
        return <Clock3 size={12} />;
    }
  };

  const handleClick = () => navigate(`${ROUTES.CASE_DETAIL}/${item.caseId}`);

  // Format creation time cleanly
  const formattedTime = (() => {
    if (!item.createdAt) return "";
    try {
      const parts = item.createdAt.split(" ");
      // If contains AM/PM
      if (parts.length >= 2) {
        return `${parts[0]} ${parts[1]}`;
      }
      return item.createdAt;
    } catch {
      return item.createdAt;
    }
  })();

  // Shorten Case ID to keep layout slim
  const displayCaseId = item.caseId && item.caseId.length > 12 
    ? `${item.caseId.slice(0, 8)}...${item.caseId.slice(-4)}`
    : item.caseId;

  return (
    <tr
      onClick={handleClick}
      className="group cursor-pointer border-b border-slate-800/40 last:border-b-0 hover:bg-cyan-500/5 transition-all duration-150"
    >
      {/* Case ID */}
      <td className="px-6 py-3.5">
        <div className="flex flex-col gap-0.5">
          <p className="font-tech-code font-bold text-slate-100 text-xs tracking-wider group-hover:text-cyan-400 transition-colors">
            {displayCaseId}
          </p>
          <span className="text-[10px] text-slate-500 font-medium">
            {formattedTime}
          </span>
        </div>
      </td>

      {/* Part */}
      <td className="px-4 py-3.5">
        <div>
          <p className="font-semibold text-slate-200 text-xs">
            {item.partNumber}
          </p>
          <p className="text-[10px] text-slate-500 font-tech-code tracking-wide">
            {item.batch || "N/A"}
          </p>
        </div>
      </td>

      {/* Commodity */}
      <td className="px-4 py-3.5">
        <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          {item.commodity}
        </span>
      </td>

      {/* Risk */}
      <td className="px-4 py-3.5">
        <div className="w-24 space-y-1">
          <div className="flex justify-between text-[10px]">
            <span className="font-bold text-slate-350">{item.riskScore}%</span>
            <span className="text-slate-500 font-semibold uppercase tracking-wider text-[8px]">Risk</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${getRiskColor(item.riskScore)}`}
              style={{ width: `${item.riskScore}%` }}
            />
          </div>
        </div>
      </td>

      {/* Confidence */}
      <td className="px-4 py-3.5">
        <span className="font-tech-code font-extrabold text-cyan-400 text-xs">
          {item.confidence}%
        </span>
      </td>

      {/* Reason */}
      <td className="px-4 py-3.5 max-w-sm">
        <p className="text-xs text-slate-400 truncate leading-relaxed group-hover:text-slate-300 transition-colors" title={item.reason}>
          {item.reason}
        </p>
      </td>

      {/* Status */}
      <td className="px-4 py-3.5 text-center">
        <div
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getStatusStyle(item.status)}`}
        >
          {getStatusIcon(item.status)}
          <span>{item.status}</span>
        </div>
      </td>

      {/* Arrow */}
      <td className="px-5 py-3.5 text-right">
        <ChevronRight
          className="text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all duration-200"
          size={16}
        />
      </td>
    </tr>
  );
}

// ==========================================


const ROWS_PER_PAGE = 8;

export function QueueTable({
  cases = [],
  search,
  statusFilter,
}) {
  const [currentPage, setCurrentPage] = useState(1);

  const filteredCases = useMemo(() => {
    return cases.filter((item) => {
      const matchesSearch =
        item.caseId.toLowerCase().includes(search.toLowerCase()) ||
        item.partNumber.toLowerCase().includes(search.toLowerCase()) ||
        item.commodity.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL" ||
        item.status === statusFilter;

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
    <div className="cyber-card bg-[#0f172a]/55 border-slate-800 shadow-lg overflow-hidden">

      {/* Header */}

      <div className="flex justify-between items-center px-6 py-5 border-b border-slate-800 bg-[#0d1527]/50">

        <div>

          <h2 className="text-lg font-bold text-slate-200">
            Inspection Queue
          </h2>

          <p className="text-sm text-slate-450">
            Live inspection cases awaiting processing
          </p>

        </div>

        <div className="bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 px-4 py-1.5 rounded-full text-xs font-semibold font-tech-code tracking-wide">

          {filteredCases.length} ACTIVE

        </div>

      </div>

      {/* Table */}

      <div className="overflow-x-auto">

        <table className="min-w-full">

          <thead className="bg-[#0a0f1d] border-b border-slate-800">

            <tr className="text-slate-400 text-xs font-semibold tracking-wider uppercase border-b border-slate-800">

              <th className="px-6 py-4 text-left">Case ID</th>

              <th className="px-4 py-4 text-left">Part Number</th>

              <th className="px-4 py-4 text-left">Commodity</th>

              <th className="px-4 py-4 text-left">Risk</th>

              <th className="px-4 py-4 text-left">Confidence</th>

              <th className="px-4 py-4 text-left">Reason</th>

              <th className="px-6 py-4 text-center">Status</th>

            </tr>

          </thead>

          <tbody>

            {paginatedCases.length === 0 ? (

              <tr>

                <td
                  colSpan="7"
                  className="py-16 text-center text-slate-450"
                >
                  No inspection cases found.
                </td>

              </tr>

            ) : (

              paginatedCases.map((item) => (
                <QueueRow
                  key={item.id}
                  item={item}
                />
              ))

            )}

          </tbody>

        </table>

      </div>

      {/* Footer */}

      <div className="flex justify-between items-center px-6 py-4 border-t bg-[#0d1527]/50">

        <span className="text-sm text-slate-450">

          Showing {paginatedCases.length} of {filteredCases.length} cases

        </span>

        <div className="flex items-center gap-2">

          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            className="px-4 py-2 border rounded-lg disabled:opacity-40 hover:bg-slate-800/50"
          >
            Previous
          </button>

          <span className="font-medium">

            {currentPage} / {totalPages || 1}

          </span>

          <button
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => setCurrentPage((p) => p + 1)}
            className="px-4 py-2 border rounded-lg disabled:opacity-40 hover:bg-slate-800/50"
          >
            Next
          </button>

        </div>

      </div>

    </div>
  );
}

// ==========================================

/**
 * Props:
 *  cases {Array} — the raw cases array from DailyTriagePage state.
 *  stats {Object} — optional aggregate values returned by the backend.
 *
 * The dashboard now prefers the backend-provided stats object, but still falls
 * back to deriving values from the cases array when needed.
 */
export function StatsCards({ cases = [], stats = null }) {
  const derivedTotal = cases.length;
  const derivedPending = cases.filter((c) => c.status === "PENDING QA").length;
  const derivedQuarantined = cases.filter((c) => c.status === "QUARANTINE").length;
  const derivedAutoApproved = cases.filter((c) => c.status === "AUTO-APPROVED").length;

  const totalInspected = stats?.totalToday ?? derivedTotal;
  const pendingQA = stats?.pendingReview ?? derivedPending;
  const quarantined = derivedQuarantined;
  const autoApproved = stats?.autoApproved ?? derivedAutoApproved;
  const quarantineRate = totalInspected > 0 ? Math.round((quarantined / totalInspected) * 100) : 0;
  const autopilotIndex = totalInspected > 0 ? Math.round((autoApproved / totalInspected) * 100) : 0;

  const cards = [
    {
      title: "TOTAL INSPECTED",
      value: totalInspected,
      icon: ClipboardCheck,
      color: "text-cyan-400",
      progress: Math.min(totalInspected * 2, 100), // illustrative bar
      footer: null,
    },
    {
      title: "PENDING QA",
      value: pendingQA,
      icon: Clock3,
      color: "text-green-600",
      progress: null,
      footer: pendingQA > 0 ? `${pendingQA} awaiting review` : "All clear",
    },
    {
      title: "QUARANTINE RATE",
      value: `${quarantineRate}%`,
      icon: ShieldAlert,
      color: "text-red-500",
      progress: null,
      footer: "+0.8% from yesterday",
      trend: quarantineRate > 0,
    },
    {
      title: "AUTOPILOT INDEX",
      value: `${autopilotIndex}%`,
      icon: BrainCircuit,
      color: "text-yellow-500",
      progress: null,
      footer: "LLM-VISION CONFIDENCE",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
      {cards.map((card, index) => {
        const Icon = card.icon;

        return (
          <div
            key={index}
            className="cyber-card bg-[#0f172a]/55 border-slate-800 p-5 shadow-sm hover:shadow-md transition-all duration-200"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold tracking-widest text-slate-450 uppercase">
                  {card.title}
                </p>

                <h2 className={`text-4xl font-bold mt-2 ${card.color}`}>
                  {card.value}
                </h2>
              </div>

              <Icon className={`${card.color}`} size={26} />
            </div>

            {card.progress !== null && (
              <div className="mt-5">
                <div className="w-full h-2 bg-slate-900 border border-slate-800 rounded-full overflow-hidden">
                  <div
                    className="bg-cyan-500 h-2 rounded-full"
                    style={{
                      width: `${card.progress}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {card.footer && (
              <div
                className={`flex items-center gap-2 mt-4 text-xs uppercase tracking-wide ${card.trend ? "text-red-500" : "text-slate-450"
                  }`}
              >
                {card.trend && <TrendingUp size={14} />}

                <span>{card.footer}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
