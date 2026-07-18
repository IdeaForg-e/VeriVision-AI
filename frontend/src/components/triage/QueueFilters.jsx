import { Search, Filter, RefreshCw, Download } from "lucide-react";
import SearchBar from "../common/SearchBar";

export default function QueueFilters({
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