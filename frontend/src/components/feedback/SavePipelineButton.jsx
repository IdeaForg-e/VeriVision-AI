export default function SavePipelineButton({ state, onSave }) {
  const isSaving = state === "saving";
  const isSaved = state === "saved";
  const isError = state === "error";

  const className = isSaved
    ? "bg-green-600 text-white"
    : isError
    ? "bg-error text-white"
    : "bg-primary-container text-on-primary-container hover:opacity-90";

  return (
    <button
      onClick={onSave}
      disabled={isSaving}
      className={`px-6 py-3 rounded-lg font-headline-sm text-[16px] active:scale-95 transition-all flex items-center gap-2 shadow-sm disabled:cursor-wait ${className}`}
    >
      <span className="material-symbols-outlined">
        {isSaving ? "sync" : isSaved ? "check_circle" : isError ? "error" : "save"}
      </span>
      {isSaving ? "Saving..." : isSaved ? "Settings Applied" : isError ? "Save Failed — Retry" : "Save Adjustments"}
    </button>
  );
}
