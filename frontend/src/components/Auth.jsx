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
} from "lucide-react";
import { GOOGLE_CLIENT_ID, ROUTES } from "../utils/constants.js";
import { useAuth } from "../hooks/useAuth.js";

const ROLE_PRESETS = {
  admin: {
    label: "Admin workspace",
    email: "admin@verivision.com",
    password: "admin123",
    helper: "Full access to triage, review, audit, and threshold tuning.",
  },
  user: {
    label: "Operator workspace",
    email: "user@verivision.com",
    password: "user123",
    helper: "Review assigned cases and submit evidence decisions.",
  },
};

function GoogleGlyph() {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

export function LoginForm() {
  const { login, loginWithGoogle, register } = useAuth();
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
  const [googleLoading, setGoogleLoading] = useState(false);
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
    setMessage(null);

    if (!GOOGLE_CLIENT_ID) {
      setError("Google sign-in is ready in the UI, but VITE_GOOGLE_CLIENT_ID is not configured yet.");
      return;
    }

    if (!window.google?.accounts?.id) {
      setError("Google Identity Services did not load. Check network access and refresh the page.");
      return;
    }

    setGoogleLoading(true);
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async (response) => {
        try {
          await loginWithGoogle(response.credential);
          navigate(ROUTES.TRIAGE);
        } catch (err) {
          setError(err.message || "Google Authentication failed.");
        } finally {
          setGoogleLoading(false);
        }
      },
    });
    window.google.accounts.id.prompt();
  };

  const roleOptions = useMemo(() => [
    { key: "admin", label: "Admin", icon: ShieldCheck },
    { key: "user", label: "User", icon: Fingerprint },
  ], []);

  return (
    <div className="grid h-screen max-h-screen overflow-hidden grid-cols-1 bg-[#070a13] lg:grid-cols-[0.9fr_1.1fr]">
      <aside className="hidden border-r border-slate-850 bg-[#090d16] px-12 py-10 text-white lg:flex lg:flex-col justify-between overflow-hidden">
        <Link to={ROUTES.LANDING} className="flex items-center gap-3 self-start">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 text-white shadow-[0_0_12px_rgba(6,182,212,0.3)]">
            <Fingerprint size={22} />
          </div>
          <div>
            <p className="text-xs font-extrabold tracking-[0.25em]">VERIVISION-AI</p>
            <p className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold">Inspection command center</p>
          </div>
        </Link>

        <div className="max-w-lg my-auto space-y-5">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-400 font-tech-code">Secure visual verification</p>
          <h1 className="text-4xl font-black leading-[1.15] tracking-tight">
            Review parts with evidence, <br />not guesswork.
          </h1>
          <p className="text-sm leading-relaxed text-slate-350">
            Sign in to compare golden references, inspect anomaly overlays, and close every case with a clean audit trail.
          </p>

          <div className="pt-2 grid grid-cols-3 gap-3">
            {["SSIM", "ROI", "OCR"].map((item) => (
              <div key={item} className="rounded-xl border border-cyan-500/15 bg-cyan-950/10 p-4 hover:border-cyan-500/30 hover:bg-cyan-950/15 transition-all">
                <p className="text-xl font-black text-cyan-400">{item}</p>
                <p className="mt-0.5 text-[9px] text-slate-450 uppercase tracking-wider font-semibold">Detector</p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-[10px] text-slate-500">
          © 2026 VERIVISION-AI. Compliance inspection portal.
        </div>
      </aside>

      <section className="flex h-full items-center justify-center px-6 py-6 bg-[#070a13] overflow-hidden">
        <div className="w-full max-w-[440px]">
          <div className="mb-6 flex items-center justify-between lg:hidden">
            <Link to={ROUTES.LANDING} className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 text-white">
                <Fingerprint size={20} />
              </div>
              <div>
                <p className="text-xs font-extrabold tracking-[0.2em] text-white">VERIVISION-AI</p>
                <p className="text-[9px] text-slate-400 uppercase tracking-widest">Inspection workspace</p>
              </div>
            </Link>
          </div>

          <div className="cyber-card p-6 sm:p-8 border-slate-800 bg-[#0f172a]/55 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-0.5">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-cyan-400 font-tech-code">
                  {isSignup ? "Create access" : preset.label}
                </p>
                <h2 className="text-xl font-black text-white tracking-tight">
                  {isSignup ? "Create account" : "Welcome Back"}
                </h2>
                <p className="text-[11px] leading-relaxed text-slate-400">
                  {isSignup ? "Create an operator account." : preset.helper}
                </p>
              </div>
              <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-inner">
                {isSignup ? <UserPlus size={18} /> : <KeyRound size={18} />}
              </div>
            </div>

            <div className="mt-4 p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex justify-between items-center text-[11px]">
              <span className="text-slate-300">
                {isSignup ? "Already have access?" : "New to the workspace?"}
              </span>
              <button
                type="button"
                onClick={() => switchMode(isSignup ? "login" : "signup")}
                className="font-bold text-cyan-400 hover:text-cyan-300 transition uppercase tracking-wider text-[10px]"
              >
                {isSignup ? "Sign In" : "Create Account"}
              </button>
            </div>

            {!isSignup && (
              <div className="mt-4 grid grid-cols-2 gap-1.5 rounded-xl bg-slate-900/80 border border-slate-850 p-1">
                {roleOptions.map((item) => {
                  const Icon = item.icon;
                  const selected = role === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => switchRole(item.key)}
                      className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-bold transition border border-transparent ${
                        selected ? "bg-cyan-500/15 text-cyan-400 border-cyan-500/25 shadow-sm" : "text-slate-455 hover:text-slate-200"
                      }`}
                    >
                      <Icon size={12} />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            )}

            {error && (
              <div className="mt-4 rounded-lg border border-red-500/20 bg-red-950/30 px-3 py-2 text-[11px] font-medium text-red-400 leading-relaxed">
                {error}
              </div>
            )}
            {message && (
              <div className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-950/30 px-3 py-2 text-[11px] font-medium text-emerald-400 leading-relaxed">
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {isSignup && (
                <div>
                  <label className="block">
                    <span className="mb-1 block text-[10px] font-bold text-slate-300 uppercase tracking-wider">Sign up as:</span>
                    <div className="mt-1 grid grid-cols-2 gap-1.5 rounded-xl bg-slate-900/80 border border-slate-850 p-1">
                      {roleOptions.map((item) => {
                        const Icon = item.icon;
                        const selected = signupRole === item.key;
                        return (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => setSignupRole(item.key)}
                            className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-bold transition border border-transparent ${
                              selected ? "bg-cyan-500/15 text-cyan-400 border-cyan-500/25 shadow-sm" : "text-slate-455 hover:text-slate-200"
                            }`}
                          >
                            <Icon size={12} />
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </label>

                  <label className="block mt-3">
                    <span className="mb-1 block text-[10px] font-bold text-slate-300 uppercase tracking-wider">Full name</span>
                    <input
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      required
                      autoComplete="name"
                      className="w-full rounded-lg px-3 py-2 text-xs cyber-input"
                      placeholder="Anil Kumar"
                    />
                  </label>
                </div>
              )}

              <label className="block">
                <span className="mb-1 block text-[10px] font-bold text-slate-300 uppercase tracking-wider">Email</span>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                  <input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    type="email"
                    autoComplete="email"
                    className="w-full py-2 pl-10 pr-3 text-xs rounded-lg cyber-input"
                    placeholder="you@company.com"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-1 block text-[10px] font-bold text-slate-300 uppercase tracking-wider">Password</span>
                <div className="relative">
                  <LockKeyhole className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                  <input
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    minLength={isSignup ? 6 : undefined}
                    type={showPassword ? "text" : "password"}
                    autoComplete={isSignup ? "new-password" : "current-password"}
                    className="w-full py-2 pl-10 pr-10 text-xs rounded-lg cyber-input"
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 px-4 py-2.5 text-xs font-bold text-white shadow-[0_0_12px_rgba(6,182,212,0.12)] hover:shadow-[0_0_18px_rgba(6,182,212,0.25)] transition duration-200 disabled:cursor-wait disabled:opacity-60"
              >
                {loading ? "Working..." : isSignup ? "Create account" : "Enter workspace"}
                {!loading && <ArrowRight size={14} />}
              </button>
            </form>

            <div className="my-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-850" />
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-550">or</span>
              <div className="h-px flex-1 bg-slate-850" />
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-900 shadow-sm transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
            >
              <GoogleGlyph />
              {googleLoading ? "Opening..." : "Continue with Google"}
            </button>

            <div className="mt-5 flex justify-center border-t border-slate-800 pt-4">
              <Link to={ROUTES.LANDING} className="text-[11px] font-semibold text-slate-450 hover:text-slate-200 transition">
                Back to overview
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
