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

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

        <div className="px-5 py-4 border-b bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="text-red-500" size={20} />
            <h2 className="font-semibold text-gray-800">
              Recent Alerts
            </h2>
          </div>

          <span className="text-xs text-gray-500">
            {alerts.length} Alerts
          </span>
        </div>

        <div className="max-h-80 overflow-y-auto">

          {alerts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No alerts available
            </div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className="px-5 py-4 border-b last:border-0 hover:bg-red-50 transition"
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

                      <p className="font-semibold text-gray-800">
                        {alert.title}
                      </p>

                      <p className="text-sm text-gray-500 mt-1">
                        {alert.message}
                      </p>

                    </div>

                  </div>

                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {alert.time}
                  </span>

                </div>
              </div>
            ))
          )}

        </div>
      </div>

      {/* Recent Activity */}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

        <div className="px-5 py-4 border-b bg-gray-50 flex items-center justify-between">

          <div className="flex items-center gap-2">
            <Activity className="text-blue-600" size={20} />
            <h2 className="font-semibold text-gray-800">
              Recent Activity
            </h2>
          </div>

          <span className="text-xs text-gray-500">
            Live Feed
          </span>

        </div>

        <div className="max-h-80 overflow-y-auto">

          {activities.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No recent activity
            </div>
          ) : (
            activities.map((activity) => (
              <div
                key={activity.id}
                className="px-5 py-4 border-b last:border-0 hover:bg-gray-50 transition"
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

                      <p className="font-semibold text-gray-800">
                        {activity.title}
                      </p>

                      <p className="text-sm text-gray-500 mt-1">
                        {activity.description}
                      </p>

                    </div>

                  </div>

                  <span className="text-xs text-gray-400 whitespace-nowrap">
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
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">

      <div className="flex flex-col lg:flex-row gap-4 justify-between">

        {/* Search */}
        <div className="relative flex-1">
          {/* SearchBar already renders its own search icon internally — no need to double-render */}
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
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border rounded-lg py-2 pl-9 pr-8 bg-white focus:ring-2 focus:ring-blue-500 h-full"
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
            className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors"
          >
            <RefreshCw size={16} />
            Refresh
          </button>

          <button
            className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
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
        return "bg-red-100 text-red-700 border border-red-200";

      case "PENDING QA":
        return "bg-yellow-100 text-yellow-700 border border-yellow-200";

      case "AUTO-APPROVED":
        return "bg-green-100 text-green-700 border border-green-200";

      case "RETAKE REQUESTED":
        return "bg-blue-100 text-blue-700 border border-blue-200";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getRiskColor = (risk) => {
    if (risk >= 80) return "bg-red-500";
    if (risk >= 60) return "bg-orange-500";
    if (risk >= 40) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "QUARANTINE":
        return <AlertTriangle size={14} />;

      case "AUTO-APPROVED":
        return <CheckCircle2 size={14} />;

      default:
        return <Clock3 size={14} />;
    }
  };

  // Bug fix: was using item.id (numeric 1, 2, 3) instead of the real case ID string
  const handleClick = () => navigate(`${ROUTES.CASE_DETAIL}/${item.caseId}`);

  return (
    <tr
      onClick={handleClick}
      className="group cursor-pointer border-b last:border-b-0 hover:bg-blue-50 transition-all duration-200"
    >
      {/* Case ID */}

      <td className="px-6 py-4">

        <div>

          <p className="font-semibold text-gray-800">
            {item.caseId}
          </p>

          <p className="text-xs text-gray-400">
            {item.createdAt}
          </p>

        </div>

      </td>

      {/* Part */}

      <td className="px-4 py-4">

        <div>

          <p className="font-medium text-gray-700">
            {item.partNumber}
          </p>

          <p className="text-xs text-gray-400">
            {item.batch}
          </p>

        </div>

      </td>

      {/* Commodity */}

      <td className="px-4 py-4">
        {item.commodity}
      </td>

      {/* Risk */}

      <td className="px-4 py-4">

        <div className="space-y-2">

          <div className="flex justify-between text-xs">

            <span className="font-semibold">

              {item.riskScore}%

            </span>

            <span className="text-gray-400">

              Risk

            </span>

          </div>

          <div className="w-full h-2 rounded-full bg-gray-200">

            <div
              className={`h-2 rounded-full ${getRiskColor(
                item.riskScore
              )}`}
              style={{
                width: `${item.riskScore}%`,
              }}
            />

          </div>

        </div>

      </td>

      {/* Confidence */}

      <td className="px-4 py-4">

        <span className="font-semibold text-blue-600">

          {item.confidence}%

        </span>

      </td>

      {/* Reason */}

      <td className="px-4 py-4">

        <p className="text-sm text-gray-600">

          {item.reason}

        </p>

      </td>

      {/* Status */}

      <td className="px-4 py-4">

        <div
          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${getStatusStyle(
            item.status
          )}`}
        >
          {getStatusIcon(item.status)}

          {item.status}

        </div>

      </td>

      {/* Arrow */}

      <td className="px-4 py-4">

        <ChevronRight
          className="text-gray-400 group-hover:text-blue-600 transition"
          size={18}
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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">

      {/* Header */}

      <div className="flex justify-between items-center px-6 py-5 border-b bg-gray-50">

        <div>

          <h2 className="text-lg font-bold text-gray-800">
            Inspection Queue
          </h2>

          <p className="text-sm text-gray-500">
            Live inspection cases awaiting processing
          </p>

        </div>

        <div className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full font-semibold">

          {filteredCases.length} Active

        </div>

      </div>

      {/* Table */}

      <div className="overflow-x-auto">

        <table className="min-w-full">

          <thead className="bg-gray-100">

            <tr className="text-gray-700">

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
                  className="py-16 text-center text-gray-500"
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

      <div className="flex justify-between items-center px-6 py-4 border-t bg-gray-50">

        <span className="text-sm text-gray-500">

          Showing {paginatedCases.length} of {filteredCases.length} cases

        </span>

        <div className="flex items-center gap-2">

          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            className="px-4 py-2 border rounded-lg disabled:opacity-40 hover:bg-gray-100"
          >
            Previous
          </button>

          <span className="font-medium">

            {currentPage} / {totalPages || 1}

          </span>

          <button
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => setCurrentPage((p) => p + 1)}
            className="px-4 py-2 border rounded-lg disabled:opacity-40 hover:bg-gray-100"
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
      color: "text-blue-600",
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
            className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all duration-200"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase">
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
                <div className="w-full h-2 bg-gray-200 rounded-full">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${card.progress}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {card.footer && (
              <div
                className={`flex items-center gap-2 mt-4 text-xs uppercase tracking-wide ${card.trend ? "text-red-500" : "text-gray-500"
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
