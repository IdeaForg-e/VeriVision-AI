export default function Badge({
  status,
}) {
  const styles = {
    QUARANTINE:
      "bg-red-100 text-red-700 border-red-200",

    "PENDING QA":
      "bg-yellow-100 text-yellow-700 border-yellow-200",

    "AUTO-APPROVED":
      "bg-green-100 text-green-700 border-green-200",

    "RETAKE REQUESTED":
      "bg-blue-100 text-blue-700 border-blue-200",
  };

  return (
    <span
      className={`
        inline-flex
        items-center
        px-3
        py-1
        rounded-full
        text-xs
        font-semibold
        border
        ${styles[status] || "bg-gray-100 text-gray-700 border-gray-200"}
      `}
    >
      {status}
    </span>
  );
}