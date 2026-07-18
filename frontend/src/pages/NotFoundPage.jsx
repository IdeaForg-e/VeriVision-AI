// NotFoundPage.jsx — 404 page shown for unmatched routes
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../utils/constants.js";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 px-4 text-center">
      {/* Large 404 */}
      <div className="relative select-none">
        <span
          className="text-[160px] font-black leading-none"
          style={{
            background: "linear-gradient(135deg, #004ac6 0%, #7c3aed 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          404
        </span>
        <span className="material-symbols-outlined text-6xl text-primary/30 absolute -bottom-4 -right-4 rotate-12">
          search_off
        </span>
      </div>

      {/* Message */}
      <div>
        <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">
          Page Not Found
        </h1>
        <p className="text-body-md text-on-surface-variant max-w-sm mx-auto">
          The route you're looking for doesn't exist or has been moved. Check the URL or navigate back to safety.
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-5 py-2.5 border border-outline-variant rounded-xl text-on-surface hover:bg-surface-container transition-colors text-body-sm font-medium"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Go Back
        </button>
        <button
          onClick={() => navigate(ROUTES.TRIAGE)}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 shadow-md transition-all text-body-sm font-medium"
        >
          <span className="material-symbols-outlined text-[18px]">home</span>
          Daily Triage
        </button>
      </div>

      {/* Decorative grid */}
      <div
        className="fixed inset-0 -z-10 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,74,198,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,74,198,1) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
    </div>
  );
}