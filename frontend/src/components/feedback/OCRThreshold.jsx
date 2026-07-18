export default function OCRThreshold({ value, onChange }) {
  const isStrict = Number(value) === 100;

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <label className="font-body-md font-semibold text-on-surface">OCR Character Fuzzy Match</label>
        <span
          className={`font-tech-code px-2 py-0.5 rounded ${
            isStrict ? "text-error bg-error-container" : "text-primary bg-primary-fixed"
          }`}
        >
          {isStrict ? "Strict (100%)" : `Fuzzy (${value}%)`}
        </span>
      </div>
      <input
        type="range"
        className="w-full"
        min={80}
        max={100}
        step={5}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
      />
      <p className="font-body-sm text-on-surface-variant italic">
        Strict match level — defines the tolerance for character substitution in serial number extraction.
      </p>
    </div>
  );
}
