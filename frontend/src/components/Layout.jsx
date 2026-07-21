import { Link, NavLink, Navigate, useLocation } from "react-router-dom";
import { Fingerprint, LogOut, Menu, Search, UploadCloud, BarChart3, LayoutDashboard, FileText, ShieldCheck, Settings, Sliders, Activity, Sun, Moon } from "lucide-react";
import { ROUTES } from "../utils/constants.js";
import { useAuth } from "../hooks/useAuth.js";
import { Loader } from "./Common.jsx";
import { useState, useEffect, useRef } from "react";
import UploadInspectionModal from "./UploadInspectionModal.jsx";

const NAV_ITEMS = [
  { to: ROUTES.TRIAGE, icon: LayoutDashboard, label: "Inspection", desc: "Live monitoring" },
  { to: ROUTES.CASE_DETAIL, icon: FileText, label: "Reports", desc: "Case history" },
  { to: ROUTES.HUMAN_REVIEW, icon: ShieldCheck, label: "Review", desc: "QA approvals" },
  { to: ROUTES.ANALYTICS, icon: Activity, label: "Analytics", desc: "Fraud insights" },
];

function BrandMark({ compact = false }) {
  return (
    <Link to={ROUTES.TRIAGE} className="flex items-center gap-3 group min-w-0">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/30 to-purple-600/30 rounded-lg blur-sm group-hover:blur-md transition-all" />
        <div className="relative h-10 w-10 flex items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 text-white shadow-lg">
          <Fingerprint size={21} />
        </div>
      </div>
      {!compact && (
        <div className="min-w-0">
          <p className="text-sm font-extrabold tracking-[0.15em] text-white truncate">VERIVISION</p>
          <p className="text-[10px] font-medium text-slate-500 truncate -mt-0.5">Fraud inspection</p>
        </div>
      )}
    </Link>
  );
}

function NavItem({ item, isActive }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      className="relative group"
    >
      {isActive && (
        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
      )}
      <div className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 ${isActive
          ? "bg-gradient-to-r from-cyan-500/10 to-blue-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.08)]"
          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent"
        }`}>
        <div className={`h-7 w-7 rounded-lg flex items-center justify-center transition-all ${isActive
            ? "bg-cyan-500/15 text-cyan-400"
            : "bg-slate-800/50 text-slate-500 group-hover:bg-slate-700/50 group-hover:text-slate-300"
          }`}>
          <Icon size={15} />
        </div>
        <div className="text-left leading-tight">
          <p className="text-[11px] font-extrabold tracking-wider">{item.label}</p>
          <p className="text-[8px] font-medium text-slate-500 tracking-normal uppercase opacity-70">{item.desc}</p>
        </div>
      </div>
    </NavLink>
  );
}

function UserAvatar({ user }) {
  return (
    <div className="relative group/avatar">
      <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 to-purple-600/20 rounded-full blur opacity-0 group-hover/avatar:opacity-100 transition-opacity" />
      <div className="relative flex items-center gap-2.5 rounded-full bg-slate-900/80 border border-slate-800/80 py-1.5 pl-1.5 pr-4 hover:border-slate-700/60 transition-all cursor-pointer">
        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-[11px] font-bold text-white shadow-sm">
          {user.name?.charAt(0)?.toUpperCase() || "U"}
        </div>
        <div className="leading-tight hidden sm:block">
          <p className="text-xs font-bold text-slate-200 truncate max-w-[100px]">{user.name}</p>
          <p className="text-[9px] font-medium text-slate-500 uppercase tracking-wider">{user.role}</p>
        </div>
      </div>
    </div>
  );
}

function IconButton({ icon: Icon, onClick, label, badge }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative h-9 w-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent hover:border-slate-700/50 transition-all"
      aria-label={label}
    >
      <Icon size={17} />
      {badge && (
        <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 border-2 border-[#090d16] flex items-center justify-center text-[8px] font-bold text-white">
          {badge}
        </span>
      )}
    </button>
  );
}

export function Header() {
  const { user, logout } = useAuth();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");

  useEffect(() => {
    if (theme === "light") {
      document.body.classList.add("light-theme");
      document.documentElement.classList.add("theme-light");
    } else {
      document.body.classList.remove("light-theme");
      document.documentElement.classList.remove("theme-light");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const handleLogout = () => {
    setMobileMenuOpen(false);
    logout();
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#070b14]/90 backdrop-blur-xl shadow-[0_1px_0_rgba(255,255,255,0.02)]">
      {/* Animated gradient line at very top */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/25 to-transparent" />

      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-2 px-4 sm:px-6">
        {/* Left: Brand + Desktop Nav */}
        <div className="flex items-center gap-8">
          <BrandMark />
          <nav className="hidden lg:flex items-center gap-1.5">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className="relative group"
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-5 h-[2px] bg-cyan-400 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.4)]" />
                    )}
                    <div className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all duration-200 ${isActive
                        ? "bg-gradient-to-r from-cyan-500/8 to-blue-500/8 text-cyan-400 border border-cyan-500/15"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/30 border border-transparent"
                      }`}>
                      <item.icon size={15} />
                      {item.label}
                    </div>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5">
          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden h-9 w-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent hover:border-slate-700/50 transition-all"
          >
            <Menu size={18} />
          </button>

          {/* Upload + Theme */}
          <button
            type="button"
            onClick={() => setIsUploadOpen(true)}
            className="hidden md:flex items-center gap-2 h-9 px-3.5 rounded-lg border border-cyan-500/25 bg-cyan-500/8 text-cyan-400 hover:bg-cyan-500/15 hover:border-cyan-400/40 text-[10px] font-extrabold uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(6,182,212,0.06)]"
          >
            <UploadCloud size={15} />
            <span className="hidden sm:inline">Inspect</span>
          </button>

          {user?.role === "admin" && (
            <Link
              to={ROUTES.CATALOG}
              className="hidden md:flex items-center gap-1.5 h-9 px-3 rounded-lg border border-slate-800/80 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/25 text-[10px] font-extrabold uppercase tracking-wider transition-all bg-slate-900/30"
            >
              <Settings size={14} />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          )}

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="h-9 w-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:bg-slate-800/60 border border-slate-800/80 transition-all"
            aria-label="Toggle Theme"
            title={theme === "dark" ? "Switch to Light Theme" : "Switch to Dark Theme"}
          >
            {theme === "dark" ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} className="text-cyan-400" />}
          </button>

          {user && <UserAvatar user={user} />}

          <button
            type="button"
            onClick={handleLogout}
            className="h-9 w-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-red-950/20 border border-transparent hover:border-red-500/20 transition-all"
            aria-label="Sign out"
          >
            <LogOut size={17} />
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-800/60 bg-[#070b14]/98 backdrop-blur-xl">
          <nav className="px-4 py-3 space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${isActive
                      ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/15"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/30 border border-transparent"
                    }`
                  }
                >
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${item.to === location.pathname ? "bg-cyan-500/15" : "bg-slate-800/50"
                    }`}>
                    <Icon size={16} />
                  </div>
                  <div className="text-left leading-tight">
                    <p className="font-extrabold">{item.label}</p>
                    <p className="text-[9px] font-medium text-slate-500 tracking-normal uppercase opacity-70">{item.desc}</p>
                  </div>
                </NavLink>
              );
            })}
          </nav>
        </div>
      )}

      <UploadInspectionModal open={isUploadOpen} onClose={() => setIsUploadOpen(false)} />
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
    return <Loader fullPage label="Checking VeriVision session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  return children;
}

export function Sidebar({ collapsed = false, onToggle }) {
  const { user, logout } = useAuth();

  return (
    <aside className={`${collapsed ? "w-16" : "w-60"} flex h-screen flex-shrink-0 flex-col border-r border-slate-800/60 bg-[#090d16] transition-all`}>
      <div className="border-b border-slate-800/60 p-4">
        <BrandMark compact={collapsed} />
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold transition ${isActive ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 border border-transparent"
                }`
              }
            >
              <Icon size={18} />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>
      <div className="border-t border-slate-800/60 p-3">
        {user && !collapsed && (
          <div className="mb-2 rounded-lg bg-slate-800/30 p-3 border border-slate-800/60">
            <p className="truncate text-sm font-bold text-slate-200">{user.name}</p>
            <p className="truncate text-[10px] text-slate-500 uppercase tracking-wider">{user.role}</p>
          </div>
        )}
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-slate-500 transition hover:bg-red-950/20 border border-red-500/15 hover:text-red-400"
        >
          <LogOut size={16} />
          {!collapsed && "Sign out"}
        </button>
        {onToggle && (
          <button type="button" onClick={onToggle} className="mt-2 grid h-9 w-full place-items-center rounded-lg text-slate-500 hover:bg-slate-800/40 border border-slate-800/60">
            <Menu size={17} />
          </button>
        )}
      </div>
    </aside>
  );
}

export function TopNavigation({ title, subtitle, actions }) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-slate-800/60 bg-[#090d16] px-5 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-white">{title || "VERIVISION-AI"}</p>
        {subtitle && <p className="truncate text-[10px] text-slate-500">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        {actions}
        <button type="button" className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-800/40 border border-slate-800/60">
          <Search size={16} />
        </button>
      </div>
    </header>
  );
}