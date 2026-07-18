// Table.jsx — Generic sortable data table used in Triage queue and Case lists
export default function Table({
  columns = [],
  rows = [],
  onRowClick,
  emptyState = null,
  stickyHeader = true,
}) {
  if (!rows.length && emptyState) return emptyState;

  return (
    <div className="overflow-x-auto rounded-xl border border-outline-variant shadow-sm bg-white">
      <table className="w-full text-body-sm text-on-surface border-collapse">
        <thead>
          <tr className={`${stickyHeader ? "sticky top-0 z-10" : ""} bg-surface-container-low`}>
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 text-left font-label-caps text-on-surface-variant uppercase tracking-wider whitespace-nowrap border-b border-outline-variant"
                style={{ width: col.width }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr
              key={row.id ?? ri}
              onClick={() => onRowClick?.(row)}
              className={`border-b border-outline-variant last:border-0 transition-colors ${
                onRowClick
                  ? "cursor-pointer hover:bg-primary/5"
                  : ""
              }`}
            >
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 whitespace-nowrap">
                  {col.render ? col.render(row[col.key], row) : row[col.key] ?? "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}