import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}) {
  const start =
    totalItems === 0
      ? 0
      : (currentPage - 1) * pageSize + 1;

  const end = Math.min(
    currentPage * pageSize,
    totalItems
  );

  return (
    <div className="flex flex-col md:flex-row justify-between items-center gap-4 px-6 py-4 border-t bg-white">

      {/* Left */}

      <p className="text-sm text-gray-500">

        Showing

        <span className="font-semibold text-gray-700 mx-1">
          {start}-{end}
        </span>

        of

        <span className="font-semibold text-gray-700 mx-1">
          {totalItems}
        </span>

        cases

      </p>

      {/* Right */}

      <div className="flex items-center gap-2">

        <button
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="
            flex
            items-center
            justify-center
            w-9
            h-9
            rounded-lg
            border
            hover:bg-gray-100
            disabled:opacity-40
            disabled:cursor-not-allowed
          "
        >
          <ChevronLeft size={18} />
        </button>

        {Array.from(
          { length: totalPages },
          (_, index) => (
            <button
              key={index}
              onClick={() =>
                onPageChange(index + 1)
              }
              className={`
                w-9
                h-9
                rounded-lg
                text-sm
                font-medium
                transition

                ${
                  currentPage === index + 1
                    ? "bg-blue-600 text-white"
                    : "border hover:bg-gray-100"
                }
              `}
            >
              {index + 1}
            </button>
          )
        )}

        <button
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="
            flex
            items-center
            justify-center
            w-9
            h-9
            rounded-lg
            border
            hover:bg-gray-100
            disabled:opacity-40
            disabled:cursor-not-allowed
          "
        >
          <ChevronRight size={18} />
        </button>

      </div>

    </div>
  );
}