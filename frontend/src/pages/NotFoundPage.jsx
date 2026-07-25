import { useNavigate } from "react-router-dom";
import { ROUTES } from "../utils/constants.js";
import { Button } from "../components/Common.jsx";
import { ArrowLeft, Home, SearchX } from "lucide-react";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6 text-center"
      style={{ background: "var(--surface)", fontFamily: "var(--font-body)" }}
    >
      <div className="space-y-5 max-w-sm">
        {/* Icon */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
          style={{
            background: "var(--primary-glow-sm)",
            border: "1px solid rgba(0,125,184,0.25)",
            color: "var(--primary)",
          }}
        >
          <SearchX size={28} />
        </div>

        {/* 404 Number */}
        <p
          className="text-6xl font-light"
          style={{ fontFamily: "var(--font-headline)", color: "var(--on-surface)", letterSpacing: "-0.04em" }}
        >
          404
        </p>

        <div>
          <h1
            className="text-lg font-medium"
            style={{ fontFamily: "var(--font-headline)", color: "var(--on-surface)" }}
          >
            Page Not Found
          </h1>
          <p
            className="text-[12px] mt-2 leading-relaxed"
            style={{ fontFamily: "var(--font-body)", color: "var(--on-surface-muted)" }}
          >
            The route you are looking for does not exist in the VeriVision audit application.
          </p>
        </div>

        <div className="flex justify-center gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)} icon={<ArrowLeft size={13} />}>
            Go Back
          </Button>
          <Button variant="primary" size="sm" onClick={() => navigate(ROUTES.TRIAGE)} icon={<Home size={13} />}>
            Inspection Triage
          </Button>
        </div>
      </div>
    </div>
  );
}