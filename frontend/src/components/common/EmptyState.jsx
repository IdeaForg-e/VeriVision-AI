// EmptyState.jsx — Displayed when a list/table has no data to show
export default function EmptyState({
  icon = "inbox",
  title = "Nothing here yet",
  description = "There are no items to display.",
  action = null,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center">
        <span className="material-symbols-outlined text-4xl text-on-surface-variant">{icon}</span>
      </div>
      <div>
        <p className="font-headline-sm text-headline-sm text-on-surface">{title}</p>
        <p className="text-body-md text-on-surface-variant mt-1 max-w-sm mx-auto">{description}</p>
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}