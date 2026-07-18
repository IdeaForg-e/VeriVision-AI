/**
 * Reusable labeled slider. Handles any numeric threshold: pass min/max/step
 * and a formatValue() to control the badge text (e.g. "Min Score: 0.85" or
 * "Max Delta: 15%").
 */
export default function ThresholdSlider({ label, value, min, max, step, formatValue, description, onChange }) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <label className="font-body-md font-semibold text-on-surface">{label}</label>
        <span className="font-tech-code text-primary bg-primary-fixed px-2 py-0.5 rounded">
          {formatValue(value)}
        </span>
      </div>
      <input
        type="range"
        className="w-full"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
      <p className="font-body-sm text-on-surface-variant italic">{description}</p>
    </div>
  );
}
