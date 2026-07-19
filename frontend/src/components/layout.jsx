import { Link, NavLink, Navigate, useLocation } from "react-router-dom";
import { Bell, Fingerprint, LogOut, Menu, Search, UploadCloud } from "lucide-react";
import { ROUTES } from "../utils/constants.js";
import { useAuth } from "../hooks/useAuth.js";
import { Loader } from "./common.jsx";
import { useState, useEffect } from "react";
import UploadInspectionModal from "./UploadInspectionModal.jsx";

function getNavItems(isAdmin) {
  return [
    { to: ROUTES.TRIAGE, icon: "dashboard", label: "AI Inspection" },
    { to: ROUTES.CASE_DETAIL, icon: "folder_open", label: "Reports" },
    { to: ROUTES.HUMAN_REVIEW, icon: "rate_review", label: "Review" },
    { to: ROUTES.FEEDBACK, icon: "tune", label: "Tuning" },
  ];
}

function BrandMark({ compact = false }) {
  return (
    <Link to={ROUTES.TRIAGE} className="flex min-w-0 items-center gap-3 hover:opacity-90 transition-opacity">
      <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-lg bg-gradient-to-tr from-cyan-500 to-purple-600 text-white shadow-[0_0_12px_rgba(6,182,212,0.3)]">
        <Fingerprint size={21} />
      </div>
      {!compact && (
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold tracking-[0.18em] text-white">VERIVISION-AI</p>
          <p className="truncate text-xs font-medium text-slate-400">Parts fraud inspection</p>
        </div>
      )}
    </Link>
  );
}

export function Header() {
  const { user, logout } = useAuth();
  const [isLight, setIsLight] = useState(() => document.body.classList.contains("light-theme"));
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  
  const navItems = getNavItems(user?.role === "admin");

  const toggleTheme = () => {
    if (document.body.classList.contains("light-theme")) {
      document.body.classList.remove("light-theme");
      setIsLight(false);
      localStorage.setItem("theme", "dark");
    } else {
      document.body.classList.add("light-theme");
      setIsLight(true);
      localStorage.setItem("theme", "light");
    }
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light") {
      document.body.classList.add("light-theme");
      setIsLight(true);
    }
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-[#090d16]/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <BrandMark />
          <nav className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition border border-transparent ${
                    isActive ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.1)]" : "text-slate-400 hover:bg-slate-900/60 hover:text-slate-100"
                  }`
                }
              >
                <span className="material-symbols-outlined text-[19px]">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsUploadOpen(true)}
            className="hidden items-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-950/30 px-3 py-2 text-sm font-semibold text-cyan-400 transition hover:bg-cyan-900/50 hover:border-cyan-400/50 md:flex"
          >
            <UploadCloud size={16} />
            New Inspection
          </button>
          <button 
            type="button" 
            onClick={toggleTheme}
            className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-900 hover:text-white"
            aria-label="Toggle Theme"
          >
            <span className="material-symbols-outlined text-[20px]">
              {isLight ? "dark_mode" : "light_mode"}
            </span>
          </button>
          <button type="button" className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-900 hover:text-white">
            <Bell size={18} />
          </button>
          {user?.role === "admin" && (
            <Link
              to={ROUTES.CATALOG}
              className="flex items-center gap-1.5 rounded-lg border border-cyan-500/25 bg-cyan-500/10 px-3 py-1.5 text-xs font-extrabold text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-500/40 transition shadow-[0_0_12px_rgba(6,182,212,0.1)] mr-1"
            >
              <span className="material-symbols-outlined text-[17px]">admin_panel_settings</span>
              Admin Console
            </Link>
          )}
          {user && (
            <div className="hidden items-center gap-2 rounded-full bg-slate-900 py-1 pl-1 pr-3 border border-slate-800 sm:flex">
              <div className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-tr from-cyan-500 to-purple-600 text-xs font-bold text-white">
                {user.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <span className="max-w-[140px] truncate text-sm font-semibold text-slate-300">{user.name}</span>
            </div>
          )}
          <button
            type="button"
            onClick={logout}
            className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-red-950/40 hover:text-red-400"
            aria-label="Sign out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
      <UploadInspectionModal
        open={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
      />
    </header>
  );
}

export function Layout({ children, title, subtitle, actions }) {
  return (
    <div className="min-h-screen bg-[#070a13] text-slate-100">
      <Header />
      {(title || subtitle || actions) && (
        <section className="mx-auto flex max-w-[1440px] flex-col gap-4 px-4 pt-7 sm:px-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            {title && <h1 className="text-2xl font-extrabold tracking-normal text-slate-100">{title}</h1>}
            {subtitle && <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-400">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </section>
      )}
      <main className="mx-auto max-w-[1440px] px-4 py-7 sm:px-6">{children}</main>
    </div>
  );
}

export function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loader fullPage label="Checking VERIVISION-AI session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  return children;
}

export function Sidebar({ collapsed = false, onToggle }) {
  const { user, logout } = useAuth();
  const navItems = getNavItems(user?.role === "admin");

  return (
    <aside className={`${collapsed ? "w-16" : "w-60"} flex h-screen flex-shrink-0 flex-col border-r border-slate-200 bg-[#090d16] transition-all`}>
      <div className="border-b border-slate-200 p-4">
        <BrandMark compact={collapsed} />
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                isActive ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" : "text-slate-400 hover:bg-slate-900/60 hover:text-slate-100"
              }`
            }
          >
            <span className="material-symbols-outlined text-[21px]">{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-slate-200 p-3">
        {user && !collapsed && (
          <div className="mb-2 rounded-lg bg-slate-50 p-3">
            <p className="truncate text-sm font-bold text-slate-900">{user.name}</p>
            <p className="truncate text-xs text-slate-500">{user.role}</p>
          </div>
        )}
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-red-500/10 border border-red-500/20 hover:text-red-700"
        >
          <LogOut size={17} />
          {!collapsed && "Sign out"}
        </button>
        {onToggle && (
          <button type="button" onClick={onToggle} className="mt-2 grid h-9 w-full place-items-center rounded-lg text-slate-500 hover:bg-slate-100">
            <Menu size={18} />
          </button>
        )}
      </div>
    </aside>
  );
}

export function TopNavigation({ title, subtitle, actions }) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-slate-800 bg-[#090d16] px-5 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-slate-950">{title || "VERIVISION-AI"}</p>
        {subtitle && <p className="truncate text-xs text-slate-500">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        {actions}
        <button type="button" className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100">
          <Search size={17} />
        </button>
      </div>
    </header>
  );
}
