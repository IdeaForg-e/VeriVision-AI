// TopNavigation.jsx — Top bar used alongside Sidebar for breadcrumbs + actions
import { useLocation, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";
import { ROUTES } from "../../utils/constants.js";

const BREADCRUMB_MAP = {
  [ROUTES.TRIAGE]: "Daily Triage",
  [ROUTES.HUMAN_REVIEW]: "Human Review",
  [ROUTES.FEEDBACK]: "Feedback Panel",
  [ROUTES.CASE_DETAIL]: "Case Detail",
  [ROUTES.LOGIN]: "Login",
};

export default function TopNavigation({ title, subtitle, actions }) {
  const { pathname } = useLocation();
  // user may be null while the AuthContext is still resolving — handled via optional chaining below
  const { user } = useAuth();

  const pageLabel = title ?? BREADCRUMB_MAP[pathname] ?? "FraudGuard";

  return (
    <header className="bg-white border-b border-outline-variant px-6 py-3 flex items-center justify-between gap-4 sticky top-0 z-10">
      {/* Left: breadcrumb / title */}
      <div className="flex items-center gap-2 min-w-0">
        <Link
          to={ROUTES.TRIAGE}
          className="text-on-surface-variant hover:text-primary transition-colors flex-shrink-0"
          aria-label="Home"
        >
          <span className="material-symbols-outlined text-[20px]">home</span>
        </Link>
        <span className="text-on-surface-variant text-body-sm flex-shrink-0">/</span>
        <div className="min-w-0">
          <span className="text-on-surface font-medium text-body-md truncate block">{pageLabel}</span>
          {subtitle && (
            <span className="text-on-surface-variant text-[11px] truncate block">{subtitle}</span>
          )}
        </div>
      </div>

      {/* Right: custom actions + user chip */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {actions && <div className="flex items-center gap-2">{actions}</div>}

        {/* Notification bell */}
        <button
          className="p-2 rounded-lg hover:bg-surface-container transition-colors relative"
          aria-label="Notifications"
        >
          <span className="material-symbols-outlined text-on-surface-variant text-[22px]">notifications</span>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full" />
        </button>

        {/* User avatar — only renders when user is available (not null while loading) */}
        {user && (
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container cursor-default select-none"
            title={user.email}
          >
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
              {user.name?.charAt(0)?.toUpperCase() ?? "U"}
            </div>
            <span className="text-body-sm font-medium text-on-surface hidden sm:block">{user.name}</span>
          </div>
        )}
      </div>
    </header>
  );
}