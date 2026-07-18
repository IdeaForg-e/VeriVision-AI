// Layout components: Header, Layout shell, ProtectedRoute, Sidebar, TopNavigation
import { NavLink, useLocation, Navigate, Link } from "react-router-dom";
import { ROUTES } from "../utils/constants.js";
import { useAuth } from "../hooks/useAuth.js";
import { Loader } from "./common.jsx";

const NAV_LINKS = [
  { to: ROUTES.LOGIN, label: "Login" },
  { to: ROUTES.TRIAGE, label: "Daily Triage" },
  { to: ROUTES.CASE_DETAIL, label: "Case Detail" },
  { to: ROUTES.HUMAN_REVIEW, label: "Human Review" },
  { to: ROUTES.FEEDBACK, label: "Feedback Panel" },
];

export function Header() {
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Left */}
        <div className="flex items-center gap-8">
          {/* Logo */}
          <NavLink to={ROUTES.TRIAGE} className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
              FG
            </div>
            <div>
              <h1 className="font-bold text-lg">FraudGuard</h1>
              <p className="text-xs text-gray-500">AI Inspection</p>
            </div>
          </NavLink>
        </div>

        {/* Center Navigation */}
        <nav className="hidden xl:flex items-center gap-6 text-sm font-medium">
          {NAV_LINKS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                isActive
                  ? "text-blue-600"
                  : "text-gray-700 hover:text-blue-600 transition-colors"
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Right */}
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            Capture Image
          </button>
          <button className="p-2 rounded-lg hover:bg-gray-100">
            <span className="material-symbols-outlined">notifications</span>
          </button>
        </div>
      </div>
    </header>
  );
}

export function Layout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      {(title || subtitle) && (
        <div className="max-w-[1440px] mx-auto px-6 pt-6">
          {title && (
            <h1 className="font-headline-lg text-headline-lg text-on-surface">{title}</h1>
          )}
          {subtitle && (
            <p className="text-on-surface-variant text-body-md mt-1">{subtitle}</p>
          )}
        </div>
      )}
      <main className="max-w-[1440px] mx-auto px-6 py-8">{children}</main>
    </div>
  );
}

export function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loader fullPage label="Verifying session…" />;
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  return children;
}

export function Sidebar({ collapsed = false, onToggle }) {
  const { user, logout } = useAuth();

  const NAV_ITEMS = [
    { to: ROUTES.TRIAGE, icon: "dashboard", label: "Daily Triage" },
    { to: ROUTES.HUMAN_REVIEW, icon: "rate_review", label: "Human Review" },
    { to: ROUTES.FEEDBACK, icon: "tune", label: "Feedback Panel" },
    { to: ROUTES.CASE_DETAIL, icon: "folder_open", label: "Case Detail" },
  ];

  return (
    <aside
      className={`${collapsed ? "w-16" : "w-56"
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
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
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

      {/* Footer */}
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

export function TopNavigation({ title, subtitle, actions }) {
  const { pathname } = useLocation();
  const { user } = useAuth();

  const BREADCRUMB_MAP = {
    [ROUTES.TRIAGE]: "Daily Triage",
    [ROUTES.HUMAN_REVIEW]: "Human Review",
    [ROUTES.FEEDBACK]: "Feedback Panel",
    [ROUTES.CASE_DETAIL]: "Case Detail",
    [ROUTES.LOGIN]: "Login",
  };

  const pageLabel = title ?? BREADCRUMB_MAP[pathname] ?? "FraudGuard";

  return (
    <header className="bg-white border-b border-outline-variant px-6 py-3 flex items-center justify-between gap-4 sticky top-0 z-10">
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

      <div className="flex items-center gap-3 flex-shrink-0">
        {actions && <div className="flex items-center gap-2">{actions}</div>}
        <button className="p-2 rounded-lg hover:bg-surface-container transition-colors relative" aria-label="Notifications">
          <span className="material-symbols-outlined text-on-surface-variant text-[22px]">notifications</span>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full" />
        </button>
        {user && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container cursor-default select-none" title={user.email}>
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