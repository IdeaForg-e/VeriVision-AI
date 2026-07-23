import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Fingerprint,
  KeyRound,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserPlus,
  Zap,
  Cpu,
  ScanSearch,
  Layers,
  CheckCircle2,
  ChevronRight
} from "lucide-react";
import { ROUTES } from "../utils/constants.js";
import { useAuth } from "../hooks/useAuth.js";

const ROLE_PRESETS = {
  admin: {
    label: "Admin Workspace",
    email: "admin@verivision.com",
    password: "admin123",
    helper: "Full access to triage queue, review overrides, and audit logs.",
  },
  user: {
    label: "Operator Workspace",
    email: "user@verivision.com",
    password: "user123",
    helper: "Access operator review space and submit evidence decisions.",
  },
};

function GoogleGlyph() {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

export function LoginForm() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const role = searchParams.get("role") === "admin" ? "admin" : "user";
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "login";
  const preset = ROLE_PRESETS[role];

  const [mode, setMode] = useState(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState(initialMode === "login" ? preset.email : "");
  const [password, setPassword] = useState(initialMode === "login" ? preset.password : "");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [signupRole, setSignupRole] = useState(role);

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
        await register({ name, email, password, role: signupRole || "user" });
        setMessage("Account created! Please sign in using your credentials.");
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
    setMessage("Google OAuth sign-in is in UI preview mode. Please sign in with workspace credentials above.");
  };

  const roleOptions = useMemo(() => [
    { key: "admin", label: "Admin", icon: ShieldCheck },
    { key: "user", label: "Operator", icon: Fingerprint },
  ], []);

  const capabilities = [
    { title: "SSIM Structural Alignment", desc: "Homography matrix matching" },
    { title: "Fuzzy OCR Parsing", desc: "Serial & revision tag verification" },
    { title: "512-Dim Vector Search", desc: "Sub-10ms Cosine similarity" },
    { title: "Human-in-the-Loop Audit", desc: "Interactive ROI overrides & logs" },
  ];

  return (
    <div className="h-screen max-h-screen overflow-hidden flex flex-col bg-[#f7f9fb] text-[#191c1e] font-sans antialiased selection:bg-[#4b41e1] selection:text-white">
      
      {/* ── Fixed Height Top Navigation Bar ── */}
      <header className="h-14 shrink-0 bg-white border-b border-slate-200/90 px-6 flex justify-between items-center z-50">
        <Link to={ROUTES.LANDING} className="flex items-center gap-3 group">
          <div className="h-9 w-9 rounded-xl bg-[#131b2e] flex items-center justify-center text-white shadow-md transition-transform group-hover:scale-105">
            <Fingerprint size={20} className="text-[#6ffbbe]" />
          </div>
          <div>
            <p className="text-base font-black tracking-tight text-[#131b2e] font-tech-code">VERIVISION-AI</p>
            <p className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest">Autonomous Vision Triage</p>
          </div>
        </Link>
        <Link
          to={ROUTES.LANDING}
          className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-[#4b41e1] transition-colors"
        >
          Back to Overview
          <ChevronRight size={14} />
        </Link>
      </header>

      {/* ── Main Viewport-Fit Auth Container (NO SCROLL) ── */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 overflow-hidden">
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-[0_15px_40px_rgba(15,23,42,0.06)] overflow-hidden grid grid-cols-1 lg:grid-cols-12 max-w-5xl w-full max-h-[calc(100vh-100px)]">
          
          {/* Left Column: Laboratory Brand Capabilities Panel */}
          <div className="lg:col-span-5 bg-slate-50 border-b lg:border-b-0 lg:border-r border-slate-200/90 p-6 sm:p-8 flex flex-col justify-between overflow-hidden">
            <div className="space-y-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-[#131b2e] tracking-tight leading-snug">
                  Precision Visual Inspection for Repair Supply Chains
                </h1>
                <p className="mt-2 text-xs leading-relaxed text-[#45464d]">
                  Verify incoming returns against OEM golden models instantly with multi-agent computer vision.
                </p>
              </div>

              {/* Capabilities List */}
              <div className="space-y-3 pt-1">
                {capabilities.map((cap) => (
                  <div key={cap.title} className="flex items-start gap-2.5">
                    <div className="w-4 h-4 rounded-md bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 mt-0.5 text-[#4b41e1]">
                      <CheckCircle2 size={12} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#131b2e]">{cap.title}</p>
                      <p className="text-[10px] text-slate-500">{cap.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Compliance Badge */}
            <div className="mt-4 pt-4 border-t border-slate-200/90 flex items-center justify-between text-[10px] text-slate-500 font-tech-code">
              <span>SOC2 TYPE II CERTIFIED</span>
              <span className="text-indigo-600 font-bold">SUB-10MS INFERENCE</span>
            </div>
          </div>

          {/* Right Column: Compact Clean Auth Form */}
          <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-center bg-white overflow-y-auto">
            
            {/* Header & Preset Switch */}
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 font-tech-code">
                    {isSignup ? "New User Access" : preset.label}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-[#131b2e] tracking-tight">
                    {isSignup ? "Create account" : "Welcome Back"}
                  </h2>
                </div>
                
                {/* Mode Toggle Button */}
                <button
                  type="button"
                  onClick={() => switchMode(isSignup ? "login" : "signup")}
                  className="text-xs font-bold text-[#4b41e1] hover:text-[#3b31d1] transition underline underline-offset-4"
                >
                  {isSignup ? "Sign In Instead" : "Create Account"}
                </button>
              </div>

              <p className="text-xs text-[#45464d]">
                {isSignup ? "Create your credentials to access the workspace." : preset.helper}
              </p>

              {/* Role Preset Selector (Admin vs Operator) */}
              {!isSignup && (
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100/80 rounded-xl border border-slate-200/90">
                  {roleOptions.map((item) => {
                    const Icon = item.icon;
                    const selected = role === item.key;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => switchRole(item.key)}
                        className={`flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                          selected
                            ? "bg-[#4b41e1] text-white shadow-sm"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                        }`}
                      >
                        <Icon size={13} />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Notifications */}
            {error && (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs font-medium text-red-700">
                {error}
              </div>
            )}
            {message && (
              <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-2.5 text-xs font-medium text-emerald-700">
                {message}
              </div>
            )}

            {/* Auth Form */}
            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              {isSignup && (
                <div className="space-y-2">
                  <label className="block mb-2">
                    <span className="mb-1 block text-[10px] font-bold text-slate-700 uppercase tracking-wider font-tech-code">Sign up role:</span>
                    <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100/80 rounded-xl border border-slate-200/90">
                      {roleOptions.map((item) => {
                        const Icon = item.icon;
                        const selected = signupRole === item.key;
                        return (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => setSignupRole(item.key)}
                            className={`flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                              selected
                                ? "bg-[#4b41e1] text-white shadow-sm"
                                : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            <Icon size={13} />
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-[10px] font-bold text-slate-700 uppercase tracking-wider font-tech-code">Full Name</span>
                    <input
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      required
                      autoComplete="name"
                      className="w-full rounded-xl px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 text-[#191c1e] placeholder-slate-400 focus:bg-white focus:border-[#4b41e1] focus:ring-1 focus:ring-[#4b41e1] outline-none transition"
                      placeholder="Enter Your Name"
                    />
                  </label>
                </div>
              )}

              <label className="block">
                <span className="mb-1 block text-[10px] font-bold text-slate-700 uppercase tracking-wider font-tech-code">Email Address</span>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    type="email"
                    autoComplete="email"
                    className="w-full py-2 pl-9 pr-3.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-[#191c1e] placeholder-slate-400 focus:bg-white focus:border-[#4b41e1] focus:ring-1 focus:ring-[#4b41e1] outline-none transition"
                    placeholder="you@verivision.com"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-1 block text-[10px] font-bold text-slate-700 uppercase tracking-wider font-tech-code">Password</span>
                <div className="relative">
                  <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    minLength={isSignup ? 6 : undefined}
                    type={showPassword ? "text" : "password"}
                    autoComplete={isSignup ? "new-password" : "current-password"}
                    className="w-full py-2 pl-9 pr-9 text-xs rounded-xl bg-slate-50 border border-slate-200 text-[#191c1e] placeholder-slate-400 focus:bg-white focus:border-[#4b41e1] focus:ring-1 focus:ring-[#4b41e1] outline-none transition"
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-md text-slate-400 hover:text-slate-700 transition"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#4b41e1] hover:bg-[#3b31d1] text-white font-bold text-xs px-4 py-2.5 shadow-md transition-all hover:scale-[1.01] disabled:opacity-60 mt-1"
              >
                {loading ? "Authenticating..." : isSignup ? "Create Account" : "Enter Workspace"}
                {!loading && <ArrowRight size={14} />}
              </button>
            </form>

            {/* Divider */}
            <div className="my-3.5 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 font-tech-code">OR</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            {/* Google Sign-In Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300/80 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold py-2 shadow-sm transition"
            >
              <GoogleGlyph />
              Continue with Google
            </button>

          </div>

        </div>
      </main>

      {/* ── Fixed Height Footer ── */}
      <footer className="h-10 shrink-0 bg-white border-t border-slate-200/90 px-6 flex justify-between items-center text-[11px] text-[#45464d]">
        <span>© 2026 VERIVISION-AI. Precision Technical Systems Corp.</span>
      </footer>

    </div>
  );
}
