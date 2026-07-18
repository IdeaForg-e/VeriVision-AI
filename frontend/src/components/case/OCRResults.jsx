// OCRResults.jsx — Shows OCR-extracted text from a part label vs the expected value
/**
 * Props:
 *  results  {Array<{field, extracted, expected, match}>}
 *           field     — e.g. "Part Number", "Batch Code"
 *           extracted — what the OCR engine read
 *           expected  — golden/reference value (optional)
 *           match     — true | false | null (unknown)
 */
export default function OCRResults({ results = [] }) {
  if (!results.length) {
    return (
      <div className="bg-white border border-outline-variant rounded-xl shadow-sm p-card-padding">
        <h3 className="font-headline-sm text-headline-sm flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined text-primary">text_fields</span>
          OCR Results
        </h3>
        <p className="text-on-surface-variant text-body-sm italic">No OCR data available for this case.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-outline-variant rounded-xl shadow-sm p-card-padding">
      <h3 className="font-headline-sm text-headline-sm flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-primary">text_fields</span>
        OCR Results
      </h3>

      <div className="flex flex-col gap-3">
        {results.map((row, i) => {
          const matchIcon = row.match === true ? "check_circle" : row.match === false ? "cancel" : "help";
          const matchColor =
            row.match === true ? "text-green-600" : row.match === false ? "text-red-500" : "text-on-surface-variant";

          return (
            <div
              key={i}
              className="grid grid-cols-[1fr_1fr_auto] gap-3 items-center border-b border-outline-variant pb-3 last:border-0 last:pb-0"
            >
              {/* Field */}
              <div>
                <p className="font-label-caps text-[10px] uppercase text-on-surface-variant mb-0.5">{row.field}</p>
                <p className="font-tech-code text-body-sm text-on-surface">{row.extracted ?? "—"}</p>
              </div>
              {/* Expected */}
              <div>
                <p className="font-label-caps text-[10px] uppercase text-on-surface-variant mb-0.5">Expected</p>
                <p className="font-tech-code text-body-sm text-on-surface-variant">{row.expected ?? "—"}</p>
              </div>
              {/* Match icon */}
              <span className={`material-symbols-outlined text-[22px] ${matchColor}`}>{matchIcon}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}