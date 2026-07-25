import { Link, NavLink, useLocation, useNavigate, Navigate } from "react-router-dom";
import {
  Fingerprint, LogOut, Menu, UploadCloud, FileText, ShieldCheck,
  Activity, Settings, Sun, Moon, LayoutDashboard, X, Bell,
  ChevronDown, Cpu,
} from "lucide-react";
import { ROUTES } from "../utils/constants.js";
import { useAuth } from "../hooks/useAuth.js";
import { Loader } from "./Common.jsx";
import { useState, useEffect, useRef } from "react";
import UploadInspectionModal from "./UploadInspectionModal.jsx";

const NAV_ITEMS = [
  { to: ROUTES.TRIAGE,       icon: LayoutDashboard, label: "Triage Queue",  desc: "Live monitoring" },
  { to: ROUTES.CASE_DETAIL,  icon: FileText,        label: "Reports",       desc: "Inspection detail" },
  { to: ROUTES.HUMAN_REVIEW, icon: ShieldCheck,     label: "QA Review",    desc: "Human review" },
  { to: ROUTES.ANALYTICS,    icon: Activity,        label: "Analytics",     desc: "Fraud insights" },
];

/* ── Brand Mark ─────────────────────────────────────────────────────────── */
function BrandMark({ compact = false }) {
  return (
    <Link to={ROUTES.TRIAGE} className="flex items-center gap-3 group min-w-0">
      <div
        className="h-9 w-9 flex items-center justify-center rounded-xl overflow-hidden shrink-0
                   border border-[rgba(0,125,184,0.30)] shadow-[0_0_12px_rgba(0,125,184,0.15)]
                   transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(0,125,184,0.30)]
                   group-hover:border-[rgba(0,125,184,0.50)]"
        style={{ background: "var(--surface-lowest)" }}
      >
        <img src="/images/logo.png" alt="VeriVision Logo" className="w-full h-full object-cover" />
      </div>
      {!compact && (
        <div className="min-w-0 leading-tight">
          <p className="text-[11px] font-bold tracking-[0.12em] uppercase truncate"
             style={{ fontFamily: "var(--font-body)", color: "var(--on-surface)" }}>
            VERIVISION <span style={{ color: "var(--primary)" }}>AI</span>
          </p>
          <p className="text-[9px] tracking-widest uppercase truncate"
             style={{ fontFamily: "var(--font-body)", color: "var(--on-surface-muted)" }}>
            Visual Hardware Verification
          </p>
        </div>
      )}
    </Link>
  );
}

/* ── Notification Bell ──────────────────────────────────────────────────── */
function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const notifications = [
    { id: 1, text: "Case #VV-2847 flagged for QA review", time: "2m ago", type: "warning" },
    { id: 2, text: "Pipeline completed 12 scans successfully", time: "8m ago", type: "success" },
    { id: 3, text: "Admin calibration threshold updated", time: "1h ago", type: "info" },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((p) => !p)}
        className="relative h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-200
                   hover:bg-[var(--glass-bg)] border border-transparent hover:border-[var(--border-default)]"
        style={{ color: "var(--on-surface-variant)" }}
        title="Notifications"
      >
        <Bell size={16} />
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[var(--urgent)]
                         shadow-[0_0_6px_var(--urgent)]" />
      </button>

      {open && (
        <div
          className="absolute right-0 top-11 w-80 rounded-xl border z-50 overflow-hidden animate-slide-up
                     shadow-[var(--glass-shadow)]"
          style={{
            background: "var(--glass-bg-strong)",
            backdropFilter: "var(--glass-blur)",
            WebkitBackdropFilter: "var(--glass-blur)",
            borderColor: "var(--border-default)",
          }}
        >
          <div className="px-4 py-3 border-b flex justify-between items-center"
               style={{ borderColor: "var(--border-hairline)" }}>
            <p className="text-xs font-semibold" style={{ fontFamily: "var(--font-body)", color: "var(--on-surface)" }}>
              Notifications
            </p>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                  style={{ background: "var(--primary-glow)", color: "var(--primary)" }}>
              {notifications.length} new
            </span>
          </div>
          <div className="divide-y" style={{ borderColor: "var(--border-hairline)" }}>
            {notifications.map((n) => (
              <div key={n.id} className="px-4 py-3 flex gap-3 items-start cursor-pointer
                                         hover:bg-[var(--glass-bg)] transition-colors duration-150">
                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                  n.type === "warning" ? "bg-[var(--warning)]" :
                  n.type === "success" ? "bg-[var(--success)]" : "bg-[var(--primary)]"
                }`} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs leading-snug" style={{ color: "var(--on-surface)", fontFamily: "var(--font-body)" }}>
                    {n.text}
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: "var(--on-surface-muted)", fontFamily: "var(--font-mono)" }}>
                    {n.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── User Avatar ────────────────────────────────────────────────────────── */
function UserAvatar({ user, showMenu = false, onToggle }) {
  const initial = user?.name?.charAt(0)?.toUpperCase() || "U";
  const isAdmin = user?.role === "admin";

  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-2 rounded-lg px-2 py-1 border transition-all duration-200
                 hover:bg-[var(--glass-bg)]"
      style={{ borderColor: "var(--border-default)" }}
    >
      <div
        className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
        style={{
          background: isAdmin
            ? "linear-gradient(135deg, #7c3aed, #4f46e5)"
            : "linear-gradient(135deg, var(--primary-container), #0090d3)",
          boxShadow: isAdmin
            ? "0 0 8px rgba(124,58,237,0.35)"
            : "0 0 8px var(--primary-glow)",
        }}
      >
        {initial}
      </div>
      <div className="leading-none hidden sm:block text-left">
        <p className="text-[11px] font-semibold truncate max-w-[100px]"
           style={{ fontFamily: "var(--font-body)", color: "var(--on-surface)" }}>
          {user.name}
        </p>
        <p className="text-[9px] font-semibold uppercase tracking-widest"
           style={{
             fontFamily: "var(--font-body)",
             color: isAdmin ? "#a78bfa" : "var(--primary)",
           }}>
          {user.role}
        </p>
      </div>
      <ChevronDown
        size={12}
        style={{ color: "var(--on-surface-muted)" }}
        className={`transition-transform duration-200 ${showMenu ? "rotate-180" : ""}`}
      />
    </button>
  );
}

/* ── Header ─────────────────────────────────────────────────────────────── */
export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");
  const userMenuRef = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    if (theme === "light") {
      document.documentElement.classList.add("theme-light");
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.remove("theme-light");
      document.documentElement.classList.add("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggleTheme = () => setTheme((p) => (p === "dark" ? "light" : "dark"));

  const handleLogout = async () => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
    await logout();
    navigate(ROUTES.LOGIN);
  };

  return (
    <header
      className="sticky top-0 z-40"
      style={{
        background: theme === "light"
          ? "rgba(245,246,248,0.85)"
          : "rgba(17,19,24,0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--border-hairline)",
        boxShadow: "0 1px 0 var(--border-hairline)",
      }}
    >
      <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between gap-4 px-5 sm:px-8">

        {/* Left: Brand + Navigation */}
        <div className="flex items-center gap-6">
          <BrandMark />

          <nav className="hidden lg:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-200
                     ${isActive
                       ? "text-[var(--primary)] bg-[var(--primary-glow-sm)] border border-[rgba(0,125,184,0.20)]"
                       : "text-[var(--on-surface-variant)] hover:text-[var(--on-surface)] hover:bg-[var(--glass-bg)]"
                     }`
                  }
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  <Icon size={14} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Right: Controls & User */}
        <div className="flex items-center gap-2">
          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-200
                       hover:bg-[var(--glass-bg)]"
            style={{ color: "var(--on-surface-variant)" }}
          >
            {mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
          </button>

          {/* New Scan CTA */}
          <button
            type="button"
            onClick={() => setIsUploadOpen(true)}
            className="hidden sm:flex items-center gap-1.5 h-8 px-3 rounded-lg text-[11px] font-semibold
                       text-white transition-all duration-200 hover:shadow-[0_0_16px_var(--primary-glow)]
                       hover:-translate-y-[1px] active:translate-y-0"
            style={{
              background: "var(--primary-container)",
              border: "1px solid rgba(0,125,184,0.30)",
              fontFamily: "var(--font-body)",
              boxShadow: "0 0 8px var(--primary-glow-sm)",
            }}
          >
            <UploadCloud size={14} />
            <span>New Scan</span>
          </button>

          {/* Admin Catalog Link */}
          {user?.role === "admin" && (
            <Link
              to={ROUTES.CATALOG}
              className="hidden md:flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-[11px] font-semibold
                         transition-all duration-200 hover:bg-[var(--glass-bg)]"
              style={{
                color: "var(--on-surface-variant)",
                border: "1px solid var(--border-default)",
                fontFamily: "var(--font-body)",
              }}
            >
              <Settings size={13} />
              <span>Catalog</span>
            </Link>
          )}

          {/* Notifications */}
          <NotificationBell />

          {/* Theme Switcher */}
          <button
            type="button"
            onClick={toggleTheme}
            className="h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-200
                       hover:bg-[var(--glass-bg)] border border-transparent hover:border-[var(--border-default)]"
            style={{ color: "var(--on-surface-variant)" }}
            title="Toggle theme"
          >
            {theme === "dark"
              ? <Sun size={15} className="transition-transform hover:rotate-12" />
              : <Moon size={15} className="transition-transform hover:-rotate-12" />
            }
          </button>

          {/* User Avatar + Dropdown */}
          {user && (
            <div className="relative" ref={userMenuRef}>
              <UserAvatar
                user={user}
                showMenu={userMenuOpen}
                onToggle={() => setUserMenuOpen((p) => !p)}
              />

              {userMenuOpen && (
                <div
                  className="absolute right-0 top-11 w-56 rounded-xl border z-50 overflow-hidden animate-slide-up
                             shadow-[var(--glass-shadow)]"
                  style={{
                    background: "var(--glass-bg-strong)",
                    backdropFilter: "var(--glass-blur)",
                    WebkitBackdropFilter: "var(--glass-blur)",
                    borderColor: "var(--border-default)",
                  }}
                >
                  <div className="px-4 py-3 border-b" style={{ borderColor: "var(--border-hairline)" }}>
                    <p className="text-xs font-semibold" style={{ color: "var(--on-surface)", fontFamily: "var(--font-body)" }}>
                      {user.name}
                    </p>
                    <p className="text-[10px] mt-0.5 uppercase tracking-widest font-semibold"
                       style={{ color: user.role === "admin" ? "#a78bfa" : "var(--primary)", fontFamily: "var(--font-body)" }}>
                      {user.role === "admin" ? "🔐 Admin Supervisor" : "👷 Operator Inspector"}
                    </p>
                    <p className="text-[10px] mt-1" style={{ color: "var(--on-surface-muted)", fontFamily: "var(--font-mono)" }}>
                      {user.email}
                    </p>
                  </div>
                  <div className="p-1.5">
                    {user.role === "admin" && (
                      <Link
                        to={ROUTES.CATALOG}
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors duration-150
                                   hover:bg-[var(--glass-bg)]"
                        style={{ color: "var(--on-surface-variant)", fontFamily: "var(--font-body)" }}
                      >
                        <Settings size={13} />
                        Admin Calibration Console
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors duration-150
                                 hover:bg-[rgba(233,69,96,0.08)]"
                      style={{ color: "var(--urgent)", fontFamily: "var(--font-body)" }}
                    >
                      <LogOut size={13} />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden border-t px-4 py-3 space-y-1.5 animate-slide-up"
          style={{
            borderColor: "var(--border-hairline)",
            background: theme === "light" ? "rgba(245,246,248,0.95)" : "rgba(17,19,24,0.95)",
          }}
        >
          <div className="grid grid-cols-2 gap-1.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2 p-2.5 rounded-lg text-[11px] font-semibold transition-all duration-200 ${
                      isActive
                        ? "bg-[var(--primary-glow-sm)] text-[var(--primary)] border border-[rgba(0,125,184,0.20)]"
                        : "text-[var(--on-surface-variant)] hover:bg-[var(--glass-bg)]"
                    }`
                  }
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  <Icon size={14} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>

          {user?.role === "admin" && (
            <Link
              to={ROUTES.CATALOG}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 p-2.5 rounded-lg text-[11px] font-semibold transition-all duration-200
                         hover:bg-[var(--glass-bg)]"
              style={{ color: "var(--on-surface-variant)", fontFamily: "var(--font-body)" }}
            >
              <Settings size={14} />
              Admin Calibration Catalog
            </Link>
          )}

          <div className="pt-2 border-t flex justify-between items-center"
               style={{ borderColor: "var(--border-hairline)" }}>
            <button
              type="button"
              onClick={() => { setMobileMenuOpen(false); setIsUploadOpen(true); }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-white"
              style={{
                background: "var(--primary-container)",
                fontFamily: "var(--font-body)",
              }}
            >
              <UploadCloud size={14} />
              New Hardware Scan
            </button>

            {user && (
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-[11px] font-semibold"
                style={{ color: "var(--urgent)", fontFamily: "var(--font-body)" }}
              >
                <LogOut size={14} />
                Sign Out
              </button>
            )}
          </div>
        </div>
      )}

      <UploadInspectionModal open={isUploadOpen} onClose={() => setIsUploadOpen(false)} />
    </header>
  );
}

/* ── Main Layout ─────────────────────────────────────────────────────────── */
export function Layout({ title, subtitle, actions, children }) {
  return (
    <div className="min-h-screen flex flex-col antialiased" style={{ background: "var(--surface)" }}>
      <Header />
      {(title || subtitle || actions) && (
        <section
          className="mx-auto w-full max-w-[1440px] px-5 pt-7 sm:px-8 flex flex-col md:flex-row md:items-end justify-between gap-4"
        >
          <div>
            {title && (
              <h1
                className="text-2xl font-light tracking-tight"
                style={{ fontFamily: "var(--font-headline)", color: "var(--on-surface)" }}
              >
                {title}
              </h1>
            )}
            {subtitle && (
              <p
                className="text-[11px] mt-1 uppercase tracking-widest font-semibold"
                style={{ fontFamily: "var(--font-body)", color: "var(--on-surface-muted)" }}
              >
                {subtitle}
              </p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </section>
      )}
      <main className="mx-auto w-full max-w-[1440px] px-5 py-6 sm:px-8 flex-1">
        {children}
      </main>
    </div>
  );
}

/* ── Protected Route ─────────────────────────────────────────────────────── */
export function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loader fullPage label="Authenticating VeriVision session…" />;
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  return children;
}

/* ── Sidebar ─────────────────────────────────────────────────────────────── */
export function Sidebar({ collapsed = false }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN);
  };

  return (
    <aside
      className={`${collapsed ? "w-16" : "w-60"} flex h-screen flex-shrink-0 flex-col transition-all duration-300`}
      style={{
        background: "var(--surface-base)",
        borderRight: "1px solid var(--border-hairline)",
      }}
    >
      <div className="border-b p-3.5" style={{ borderColor: "var(--border-hairline)" }}>
        <BrandMark compact={collapsed} />
      </div>
      <nav className="flex-1 space-y-0.5 p-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[11px] font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-[var(--primary-glow-sm)] text-[var(--primary)] border border-[rgba(0,125,184,0.20)]"
                    : "text-[var(--on-surface-variant)] hover:text-[var(--on-surface)] hover:bg-[var(--glass-bg)]"
                }`
              }
              style={{ fontFamily: "var(--font-body)" }}
            >
              <Icon size={15} />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>
      <div className="border-t p-3 space-y-2" style={{ borderColor: "var(--border-hairline)" }}>
        {user && !collapsed && (
          <div className="rounded-lg p-2.5 text-xs" style={{ background: "var(--glass-bg)", border: "1px solid var(--border-hairline)" }}>
            <p className="font-semibold truncate" style={{ color: "var(--on-surface)", fontFamily: "var(--font-body)" }}>
              {user.name}
            </p>
            <p className="text-[9px] font-bold uppercase tracking-widest mt-0.5"
               style={{ color: "var(--primary)", fontFamily: "var(--font-body)" }}>
              {user.role}
            </p>
          </div>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-semibold transition-all duration-200
                     hover:bg-[rgba(233,69,96,0.08)]"
          style={{ color: "var(--urgent)", fontFamily: "var(--font-body)" }}
        >
          <LogOut size={14} />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  );
}

/* ── Top Navigation (sub-header) ─────────────────────────────────────────── */
export function TopNavigation({ title, subtitle, actions }) {
  return (
    <header
      className="sticky top-14 z-20 flex items-center justify-between gap-4 px-5 py-3"
      style={{
        background: "var(--surface-base)",
        borderBottom: "1px solid var(--border-hairline)",
      }}
    >
      <div className="min-w-0">
        <p className="truncate text-[10px] font-bold uppercase tracking-[0.12em]"
           style={{ color: "var(--on-surface)", fontFamily: "var(--font-body)" }}>
          {title || "VERIVISION AI"}
        </p>
        {subtitle && (
          <p className="truncate text-[10px] mt-0.5"
             style={{ color: "var(--on-surface-muted)", fontFamily: "var(--font-mono)" }}>
            {subtitle}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">{actions}</div>
    </header>
  );
}