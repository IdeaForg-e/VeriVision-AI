import { useMemo, useState, useEffect } from "react";
import QueueRow from "./QueueRow";
import Pagination from "../common/Pagination";

const ROWS_PER_PAGE = 8;

export default function QueueTable({
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