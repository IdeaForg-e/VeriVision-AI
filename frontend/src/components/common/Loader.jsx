// Loader.jsx — Full-screen or inline spinner used while data is loading
export default function Loader({ fullPage = false, size = "md", label = "Loading…" }) {
  const sizes = {
    sm: "w-5 h-5 border-2",
    md: "w-9 h-9 border-[3px]",
    lg: "w-14 h-14 border-4",
  };

  const spinner = (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`${sizes[size] ?? sizes.md} rounded-full border-primary/20 border-t-primary animate-spin`}
      />
      {label && (
        <span className="text-body-sm text-on-surface-variant animate-pulse">{label}</span>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        {spinner}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      {spinner}
    </div>
  );
}