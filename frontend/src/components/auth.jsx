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
    <span className="grid h-5 w-5 place-items-center rounded-full border border-slate-200 bg-white text-[12px] font-black text-blue-700">
      G
    </span>
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

  const from = location.state?.from?.pathname ?? ROUTES.TRIAGE;
  const isSignup = mode === "signup";

  useEffect(() => {
    if (isSignup) return;
    setEmail(preset.email);
    setPassword(preset.password);
  }, [isSignup, preset.email, preset.password]);

  const roleOptions = useMemo(() => [
    { key: "admin", label: "Admin", icon: ShieldCheck },
    { key: "user", label: "User", icon: Fingerprint },
  ], []);

  const switchMode = (nextMode) => {
    setError(null);
    setMessage(null);
    setMode(nextMode);
    const next = new URLSearchParams(searchParams);
    if (nextMode === "signup") {
      next.set("mode", "signup");
      setEmail("");
      setPassword("");
    } else {
      next.delete("mode");
      setEmail(preset.email);
      setPassword(preset.password);
    }
    setSearchParams(next, { replace: true });
  };

  const switchRole = (nextRole) => {
    const next = new URLSearchParams(searchParams);
    next.set("role", nextRole);
    setSearchParams(next, { replace: true });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (isSignup) {
        await register({ name, email, password, role: "user" });
        setMessage("Account created. Sign in with your new credentials.");
        setMode("login");
        const next = new URLSearchParams(searchParams);
        next.delete("mode");
        next.set("role", "user");
        setSearchParams(next, { replace: true });
        return;
      }

      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message ?? "Authentication failed. Please try again.");
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
          navigate(from, { replace: true });
        } catch (err) {
          setError(err.message ?? "Google sign-in failed.");
        } finally {
          setGoogleLoading(false);
        }
      },
    });
    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        setGoogleLoading(false);
      }
    });
  };

  return (
    <div className="grid min-h-screen grid-cols-1 bg-[#f6f8fc] lg:grid-cols-[0.95fr_1.05fr]">
      <aside className="hidden border-r border-slate-200 bg-slate-950 px-10 py-10 text-white lg:flex lg:flex-col">
        <Link to={ROUTES.LANDING} className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-white text-slate-950">
            <Fingerprint size={23} />
          </div>
          <div>
            <p className="text-sm font-extrabold tracking-[0.2em]">VERIVISION-AI</p>
            <p className="text-xs text-slate-400">Inspection command center</p>
          </div>
        </Link>

        <div className="mt-auto max-w-xl">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-300">Secure visual verification</p>
          <h1 className="mt-4 text-5xl font-extrabold leading-tight tracking-normal">
            Review parts with evidence, not guesswork.
          </h1>
          <p className="mt-5 text-base leading-8 text-slate-300">
            Sign in to compare golden references, inspect anomaly overlays, and close every case with a clean audit trail.
          </p>

          <div className="mt-8 grid grid-cols-3 gap-3">
            {["SSIM", "OCR", "ROI"].map((item) => (
              <div key={item} className="rounded-lg border border-white/10 bg-white/5 p-4">
                <p className="text-xl font-extrabold">{item}</p>
                <p className="mt-1 text-xs text-slate-400">Detector layer</p>
              </div>
            ))}
          </div>
        </div>
      </aside>

      <section className="flex items-center justify-center px-5 py-8 sm:px-8">
        <div className="w-full max-w-[500px]">
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <Link to={ROUTES.LANDING} className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-slate-950 text-white">
                <Fingerprint size={21} />
              </div>
              <div>
                <p className="text-sm font-extrabold tracking-[0.18em] text-slate-950">VERIVISION-AI</p>
                <p className="text-xs text-slate-500">Inspection workspace</p>
              </div>
            </Link>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/8 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
                  {isSignup ? "Create access" : preset.label}
                </p>
                <h2 className="mt-2 text-2xl font-extrabold text-slate-950">
                  {isSignup ? "Create your VERIVISION-AI account" : "Sign in to VERIVISION-AI"}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {isSignup ? "New operators can create a standard user account." : preset.helper}
                </p>
              </div>
              <div className="grid h-11 w-11 place-items-center rounded-lg bg-blue-50 text-blue-700">
                {isSignup ? <UserPlus size={22} /> : <KeyRound size={22} />}
              </div>
            </div>

            {!isSignup && (
              <div className="mt-6 grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
                {roleOptions.map((item) => {
                  const Icon = item.icon;
                  const selected = role === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => switchRole(item.key)}
                      className={`flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-bold transition ${
                        selected ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <Icon size={16} />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            )}

            {error && (
              <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )}
            {message && (
              <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {isSignup && (
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-700">Full name</span>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                    autoComplete="name"
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                    placeholder="Anil Kumar"
                  />
                </label>
              )}

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">Email</span>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    type="email"
                    autoComplete="email"
                    className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                    placeholder="you@company.com"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">Password</span>
                <div className="relative">
                  <LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    minLength={isSignup ? 6 : undefined}
                    type={showPassword ? "text" : "password"}
                    autoComplete={isSignup ? "new-password" : "current-password"}
                    className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-11 pr-12 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-slate-950/10 transition hover:bg-slate-800 disabled:cursor-wait disabled:opacity-60"
              >
                {loading ? "Working..." : isSignup ? "Create account" : "Enter workspace"}
                {!loading && <ArrowRight size={17} />}
              </button>
            </form>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">or</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
            >
              <GoogleGlyph />
              {googleLoading ? "Opening Google..." : "Continue with Google"}
            </button>

            <div className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-slate-200 pt-5 text-sm text-slate-600 sm:flex-row">
              <button
                type="button"
                onClick={() => switchMode(isSignup ? "login" : "signup")}
                className="font-semibold text-blue-700 hover:text-blue-900"
              >
                {isSignup ? "Already have access? Sign in" : "New user? Create account"}
              </button>
              <Link to={ROUTES.LANDING} className="font-semibold text-slate-500 hover:text-slate-900">
                Back to overview
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
