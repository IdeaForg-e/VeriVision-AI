// MetadataCard.jsx — Displays structured case/part metadata in a two-column grid
import { formatDateTime } from "../../utils/formatDate.js";

/**
 * Props:
 *  caseData {object}  — the case object from caseService / reviewService
 *  extra    {Array<{label, value}>}  — optional additional rows
 */
export default function MetadataCard({ caseData = {}, extra = [] }) {
  const rows = [
    { label: "Case ID",     value: caseData.id },
    { label: "Part Code",   value: caseData.partCode },
    { label: "Commodity",   value: caseData.commodity },
    { label: "Status",      value: caseData.status?.replace(/_/g, " ") },
    { label: "Image Hash",  value: caseData.imageHash },
    { label: "Neural Model",value: caseData.neuralModel },
    { label: "Updated",     value: formatDateTime(caseData.updatedAt) },
    ...extra,
  ].filter((r) => r.value !== undefined && r.value !== null);

  return (
    <div className="bg-white border border-outline-variant rounded-xl shadow-sm p-card-padding">
      <h3 className="font-headline-sm text-headline-sm flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-primary">info</span>
        Case Metadata
      </h3>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
        {rows.map(({ label, value }) => (
          <div key={label} className="flex flex-col gap-0.5">
            <dt className="font-label-caps text-on-surface-variant uppercase text-[11px]">{label}</dt>
            <dd className="font-tech-code text-on-surface text-body-sm break-all">{value ?? "—"}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}