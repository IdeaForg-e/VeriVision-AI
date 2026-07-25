import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Fingerprint,
  LockKeyhole,
  Mail,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  User,
  Cpu,
  ScanSearch,
  Zap,
  Loader2,
} from "lucide-react";
import { ROUTES } from "../utils/constants.js";
import { useAuth } from "../hooks/useAuth.js";
import { Button, Loader } from "./Common.jsx";

const ROLE_PRESETS = {
  admin: {
    label: "Admin Workspace",
    email: "admin@verivision.com",
    password: "admin123",
  },
  user: {
    label: "Operator Workspace",
    email: "user@verivision.com",
    password: "user123",
  },
};

function GoogleGlyph() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

/* Feature bullet for the left panel */
function FeatureBullet({ icon: Icon, title, desc }) {
  return (
    <div className="flex items-start gap-3">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
        style={{
          background: "rgba(0,125,184,0.12)",
          border: "1px solid rgba(0,125,184,0.25)",
          color: "var(--primary)",
        }}
      >
        <Icon size={14} />
      </div>
      <div>
        <p className="text-[12px] font-semibold" style={{ fontFamily: "var(--font-body)", color: "var(--on-surface)" }}>
          {title}
        </p>
        <p className="text-[11px] mt-0.5 leading-relaxed" style={{ fontFamily: "var(--font-body)", color: "var(--on-surface-muted)" }}>
          {desc}
        </p>
      </div>
    </div>
  );
}

/* Styled input field */
function AuthInput({ label, icon: Icon, type = "text", value, onChange, placeholder, required, rightSlot }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label
        className="block text-[10px] font-bold uppercase tracking-widest mb-1.5"
        style={{ fontFamily: "var(--font-body)", color: "var(--on-surface-muted)" }}
      >
        {label}
      </label>
      <div className="relative">
        <Icon
          className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
          size={14}
          style={{ color: focused ? "var(--primary)" : "var(--on-surface-muted)" }}
        />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          type={type}
          className="w-full h-10 pl-10 pr-10 rounded-xl text-[12px] outline-none transition-all duration-200"
          style={{
            background: "rgba(0,0,0,0.25)",
            border: `1px solid ${focused ? "var(--primary-container)" : "var(--border-default)"}`,
            color: "var(--on-surface)",
            boxShadow: focused ? "0 0 0 3px var(--primary-glow-sm)" : "none",
            fontFamily: "var(--font-body)",
          }}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {rightSlot && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightSlot}</div>
        )}
      </div>
    </div>
  );
}

export function LoginForm() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const role = searchParams.get("role") === "admin" ? "admin" : "user";
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "login";

  const [mode, setMode] = useState(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState(initialMode === "login" ? ROLE_PRESETS[role].email : "");
  const [password, setPassword] = useState(initialMode === "login" ? ROLE_PRESETS[role].password : "");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const isSignup = mode === "signup";

  const switchMode = (newMode) => {
    setError(null);
    setMessage(null);
    setMode(newMode);
    setSearchParams({ role, mode: newMode });
  };

  const switchRole = (newRole) => {
    setError(null);
    setMessage(null);
    setSearchParams({ role: newRole, mode });
    setEmail(ROLE_PRESETS[newRole].email);
    setPassword(ROLE_PRESETS[newRole].password);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      if (isSignup) {
        await register({ name, email, password, role });
        setMessage(`Account created for ${role === "admin" ? "Admin" : "Operator"} workspace! Please sign in.`);
        switchMode("login");
      } else {
        await login(email, password);
        navigate(role === "admin" ? ROUTES.TRIAGE : ROUTES.HUMAN_REVIEW);
      }
    } catch (err) {
      setError(err.message || "Authentication failed. Please verify credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setError(null);
    setMessage("Google OAuth sign-in is in UI preview mode. Please sign in with workspace credentials.");
  };

  const roleOptions = useMemo(
    () => [
      { key: "admin", label: "Admin Workspace", icon: ShieldCheck },
      { key: "user", label: "Operator Workspace", icon: Fingerprint },
    ],
    []
  );

  return (
    <div
      className="min-h-screen flex flex-col antialiased"
      style={{ background: "var(--surface)", fontFamily: "var(--font-body)" }}
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header
        className="h-16 shrink-0 flex justify-between items-center px-6"
        style={{
          background: "rgba(17,19,24,0.80)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--border-hairline)",
        }}
      >
        <Link to={ROUTES.LANDING} className="flex items-center gap-3 group">
          <div
            className="h-9 w-9 rounded-xl overflow-hidden flex items-center justify-center"
            style={{
              background: "var(--surface-lowest)",
              border: "1px solid rgba(0,125,184,0.30)",
              boxShadow: "0 0 12px rgba(0,125,184,0.12)",
            }}
          >
            <img src="/images/logo.png" alt="VeriVision Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="text-[11px] font-bold tracking-[0.12em] uppercase"
               style={{ color: "var(--on-surface)", fontFamily: "var(--font-body)" }}>
              VERIVISION <span style={{ color: "var(--primary)" }}>AI</span>
            </p>
            <p className="text-[9px] tracking-widest uppercase"
               style={{ color: "var(--on-surface-muted)", fontFamily: "var(--font-body)" }}>
              Visual Hardware Verification
            </p>
          </div>
        </Link>
        <Link
          to={ROUTES.LANDING}
          className="inline-flex items-center gap-1 text-[11px] font-semibold transition-colors duration-150"
          style={{ color: "var(--on-surface-muted)", fontFamily: "var(--font-body)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--primary)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--on-surface-muted)")}
        >
          Overview <ChevronRight size={13} />
        </Link>
      </header>

      {/* ── Main ──────────────────────────────────────────────────────── */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div
          className="max-w-4xl w-full overflow-hidden grid grid-cols-1 md:grid-cols-12 animate-slide-up"
          style={{
            background: "var(--glass-bg)",
            backdropFilter: "var(--glass-blur-heavy)",
            WebkitBackdropFilter: "var(--glass-blur-heavy)",
            border: "1px solid var(--border-default)",
            borderTopColor: "var(--border-light-top)",
            borderRadius: "var(--radius-xl)",
            boxShadow: "var(--glass-shadow), var(--glass-inset)",
          }}
        >
          {/* ── Left Info Panel ───────────────────────────────────────── */}
          <div
            className="md:col-span-5 flex flex-col justify-between p-7 border-b md:border-b-0 md:border-r"
            style={{
              background: "var(--glass-bg)",
              borderColor: "var(--border-hairline)",
            }}
          >
            <div className="space-y-6">
              {/* Eyebrow + headline */}
              <div>
                <div
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-3"
                  style={{
                    background: "var(--primary-glow-sm)",
                    border: "1px solid rgba(0,125,184,0.25)",
                    color: "var(--primary)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  <Zap size={10} /> AI Vision Platform
                </div>
                <h1
                  className="text-xl font-light leading-snug"
                  style={{ fontFamily: "var(--font-headline)", color: "var(--on-surface)" }}
                >
                  AI Hardware Verification & Fraud Detection
                </h1>
                <p
                  className="mt-2 text-[12px] leading-relaxed"
                  style={{ fontFamily: "var(--font-body)", color: "var(--on-surface-muted)" }}
                >
                  Scan hardware parts and verify quality against OEM reference standards with 5-agent AI pipeline.
                </p>
              </div>

              <div className="space-y-4">
                <FeatureBullet
                  icon={Cpu}
                  title="SSIM Visual Diff"
                  desc="Structural alignment & anomaly detection"
                />
                <FeatureBullet
                  icon={ScanSearch}
                  title="Fuzzy OCR Serial Check"
                  desc="Serial & revision tag distance matching"
                />
                <FeatureBullet
                  icon={ShieldCheck}
                  title="HITL Review Log"
                  desc="Interactive overrides & audit trail"
                />
              </div>
            </div>

            <div
              className="mt-8 pt-4 flex items-center justify-between text-[9px] font-bold uppercase tracking-widest"
              style={{
                borderTop: "1px solid var(--border-hairline)",
                fontFamily: "var(--font-body)",
                color: "var(--on-surface-muted)",
              }}
            >
              <span>AUDIT SYSTEM</span>
              <span style={{ color: "var(--primary)" }}>VERIVISION AI</span>
            </div>
          </div>

          {/* ── Right Form Panel ──────────────────────────────────────── */}
          <div className="md:col-span-7 p-7 sm:p-8 flex flex-col justify-center space-y-5">
            <div className="flex justify-between items-end">
              <div>
                <span
                  className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: "var(--primary)", fontFamily: "var(--font-body)" }}
                >
                  {isSignup ? "Create Access Account" : ROLE_PRESETS[role].label}
                </span>
                <h2
                  className="text-2xl font-light mt-0.5"
                  style={{ fontFamily: "var(--font-headline)", color: "var(--on-surface)" }}
                >
                  {isSignup ? `Register ${role === "admin" ? "Admin" : "Operator"}` : "Sign In"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => switchMode(isSignup ? "login" : "signup")}
                className="text-[11px] font-semibold transition-colors duration-150"
                style={{ color: "var(--primary)", fontFamily: "var(--font-body)" }}
              >
                {isSignup ? "Sign In Instead" : "Create Account"}
              </button>
            </div>

            {/* Role Switcher Tabs */}
            <div
              className="grid grid-cols-2 gap-1.5 p-1.5 rounded-xl"
              style={{ background: "rgba(0,0,0,0.20)", border: "1px solid var(--border-hairline)" }}
            >
              {roleOptions.map((item) => {
                const Icon = item.icon;
                const selected = role === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => switchRole(item.key)}
                    className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-[11px] font-semibold transition-all duration-200"
                    style={{
                      fontFamily: "var(--font-body)",
                      background: selected ? "var(--primary-container)" : "transparent",
                      color: selected ? "#fff" : "var(--on-surface-muted)",
                      boxShadow: selected ? "0 0 12px var(--primary-glow)" : "none",
                    }}
                  >
                    <Icon size={13} />
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* Alerts */}
            {error && (
              <div
                className="rounded-xl p-3 text-[11px] animate-slide-up"
                style={{
                  background: "var(--urgent-surface)",
                  border: "1px solid var(--urgent-border)",
                  color: "var(--urgent)",
                  fontFamily: "var(--font-body)",
                }}
              >
                {error}
              </div>
            )}
            {message && (
              <div
                className="rounded-xl p-3 text-[11px] animate-slide-up"
                style={{
                  background: "var(--success-surface)",
                  border: "1px solid var(--success-border)",
                  color: "var(--success)",
                  fontFamily: "var(--font-body)",
                }}
              >
                {message}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {isSignup && (
                <AuthInput
                  label="Full Name"
                  icon={User}
                  value={name}
                  onChange={setName}
                  placeholder="Inspector Name"
                  required
                />
              )}

              <AuthInput
                label="Email Address"
                icon={Mail}
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="user@verivision.com"
                required
              />

              <AuthInput
                label="Password"
                icon={LockKeyhole}
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={setPassword}
                placeholder="••••••••"
                required
                rightSlot={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="transition-colors duration-150"
                    style={{ color: "var(--on-surface-muted)" }}
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                }
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full h-10 mt-2 rounded-xl flex items-center justify-center gap-2 text-[12px] font-semibold
                           text-white transition-all duration-200 hover:shadow-[0_0_20px_var(--primary-glow)]
                           hover:-translate-y-[1px] active:translate-y-0 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: "var(--primary-container)",
                  border: "1px solid rgba(0,125,184,0.30)",
                  boxShadow: "0 0 8px var(--primary-glow-sm)",
                  fontFamily: "var(--font-body)",
                }}
              >
                {loading
                  ? <Loader2 size={14} className="animate-spin" />
                  : <ArrowRight size={14} />
                }
                {isSignup ? "Create Account" : "Sign In to Workspace"}
              </button>
            </form>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1" style={{ background: "var(--border-hairline)" }} />
              <span
                className="text-[9px] font-bold uppercase tracking-widest"
                style={{ fontFamily: "var(--font-body)", color: "var(--on-surface-muted)" }}
              >
                OR
              </span>
              <div className="h-px flex-1" style={{ background: "var(--border-hairline)" }} />
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full h-10 rounded-xl flex items-center justify-center gap-2 text-[12px] font-semibold
                         transition-all duration-200 hover:border-[var(--border-strong)] hover:bg-[var(--glass-bg)]"
              style={{
                background: "transparent",
                border: "1px solid var(--border-default)",
                color: "var(--on-surface-variant)",
                fontFamily: "var(--font-body)",
              }}
            >
              <GoogleGlyph />
              Continue with Google
            </button>
          </div>
        </div>
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer
        className="h-12 shrink-0 px-6 flex justify-between items-center text-[10px]"
        style={{
          borderTop: "1px solid var(--border-hairline)",
          color: "var(--on-surface-muted)",
          fontFamily: "var(--font-body)",
        }}
      >
        <span>© 2026 VERIVISION AI — Precision Hardware Audit System</span>
        <span className="font-bold" style={{ color: "var(--primary)" }}>Dell FutureMind AI Hackathon 2026</span>
      </footer>
    </div>
  );
}
