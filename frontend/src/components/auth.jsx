import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "./common.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { ROUTES } from "../utils/constants.js";

export function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Redirect to intended page after login (preserved by ProtectedRoute)
  const from = location.state?.from?.pathname ?? ROUTES.TRIAGE;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message ?? "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[440px] bg-white rounded-xl border border-gray-200 shadow-xl p-8">

      {/* Header */}

      <div className="text-center mb-8">

        <h1 className="text-3xl font-bold text-gray-900">
          Sign in to FraudGuard
        </h1>

        <p className="mt-2 text-gray-500">
          Sign in to review inspection cases.
        </p>

      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Form */}

      <form
        onSubmit={handleSubmit}
        className="space-y-5"
      >

        {/* Email */}

        <div>

          <label htmlFor="login-email" className="block text-sm font-semibold text-gray-700 mb-2">
            Email
          </label>

          <input
            id="login-email"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="
              w-full
              rounded-lg
              border
              border-gray-300
              bg-gray-50
              px-4
              py-3
              outline-none
              transition
              focus:border-blue-600
              focus:ring-2
              focus:ring-blue-100
            "
          />

        </div>

        {/* Password */}

        <div>

          <div className="flex justify-between items-center mb-2">

            <label htmlFor="login-password" className="text-sm font-semibold text-gray-700">
              Password
            </label>

            <button
              type="button"
              className="text-xs text-blue-600 hover:underline"
            >
              Forgot password?
            </button>

          </div>

          <div className="relative">

            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="
                w-full
                rounded-lg
                border
                border-gray-300
                bg-gray-50
                pl-4
                pr-12
                py-3
                outline-none
                transition
                focus:border-blue-600
                focus:ring-2
                focus:ring-blue-100
              "
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>

          </div>

        </div>

        {/* Remember me */}

        <div className="flex items-center justify-between">

          <div className="flex items-center">

            <input
              id="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="
                w-4
                h-4
                rounded
                border-gray-300
                text-blue-600
                focus:ring-blue-500
              "
            />

            <label htmlFor="remember-me" className="ml-2 text-sm text-gray-500">
              Remember me
            </label>

          </div>

        </div>

        {/* Submit */}

        <Button
          type="submit"
          loading={loading}
          className="w-full justify-center py-3"
        >
          Sign in
        </Button>

        {/* Divider */}

        <div className="flex items-center my-6">

            <div className="flex-1 h-px bg-gray-300"></div>

            <span className="px-4 text-xs font-semibold text-gray-400 uppercase">
                OR
            </span>

            <div className="flex-1 h-px bg-gray-300"></div>

        </div>

        {/* Google Button */}

        <Button
            type="button"
            variant="secondary"
            className="w-full justify-center py-3"
        >
            Continue with Google
        </Button>

        {/* Contact */}

        <p className="text-center text-sm text-gray-500">

            Need access?

            <button
                type="button"
                className="ml-1 text-blue-600 hover:underline"
            >
                Contact administrator
            </button>

        </p>

      </form>
      {/* Footer */}

        <div className="mt-8 border-t pt-5 text-center">

            <p className="text-xs text-gray-500">
                V: 2.4.0
            </p>

            <p className="text-xs text-gray-400 mt-1">
                Protected by Enterprise Security
            </p>

            <p className="text-xs text-gray-400 mt-1">
                AES-256 Encryption
            </p>

        </div>
    </div>
  );
}
