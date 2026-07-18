// Sidebar.jsx — Collapsible left navigation for the main app shell
import { NavLink } from "react-router-dom";
import { ROUTES } from "../../utils/constants.js";
import { useAuth } from "../../hooks/useAuth.js";

const NAV_ITEMS = [
  { to: ROUTES.TRIAGE, icon: "dashboard", label: "Daily Triage" },
  { to: ROUTES.HUMAN_REVIEW, icon: "rate_review", label: "Human Review" },
  { to: ROUTES.FEEDBACK, icon: "tune", label: "Feedback Panel" },
  { to: ROUTES.CASE_DETAIL, icon: "folder_open", label: "Case Detail" },
];

export default function Sidebar({ collapsed = false, onToggle }) {
  const { user, logout } = useAuth();

  return (
    <aside
      className={`${
        collapsed ? "w-16" : "w-56"
      } flex-shrink-0 h-screen sticky top-0 bg-white border-r border-outline-variant flex flex-col transition-all duration-200 z-20`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-outline-variant">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          FG
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="font-bold text-sm leading-none text-on-surface">FraudGuard</p>
            <p className="text-[11px] text-on-surface-variant leading-none mt-0.5">AI Inspection</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 flex flex-col gap-1 px-2">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
              }`
            }
          >
            <span className="material-symbols-outlined text-[22px] flex-shrink-0">{item.icon}</span>
            {!collapsed && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer: User + collapse toggle */}
      <div className="border-t border-outline-variant p-3 flex flex-col gap-2">
        {user && !collapsed && (
          <div className="flex items-center gap-2 px-2">
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-primary text-[16px]">person</span>
            </div>
            <div className="overflow-hidden">
              <p className="text-body-sm font-medium text-on-surface truncate">{user.name}</p>
              <p className="text-[11px] text-on-surface-variant truncate">{user.role}</p>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          title="Sign out"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-on-surface-variant hover:bg-error/10 hover:text-error transition-colors"
        >
          <span className="material-symbols-outlined text-[20px] flex-shrink-0">logout</span>
          {!collapsed && <span>Sign out</span>}
        </button>
        {onToggle && (
          <button
            onClick={onToggle}
            className="flex items-center justify-center p-2 rounded-lg hover:bg-surface-container transition-colors self-end"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
              {collapsed ? "chevron_right" : "chevron_left"}
            </span>
          </button>
        )}
      </div>
    </aside>
  );
}