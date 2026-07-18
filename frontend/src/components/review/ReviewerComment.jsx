export default function ReviewerComment({ value, onChange }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="font-label-caps text-on-surface-variant uppercase">Decision Rationale &amp; Notes</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-40 rounded-lg border border-outline-variant focus:ring-2 focus:ring-primary/20 focus:border-primary text-body-md p-4 transition-all resize-none bg-surface-container-lowest"
        placeholder="Add your review notes here..."
      />
    </div>
  );
}
