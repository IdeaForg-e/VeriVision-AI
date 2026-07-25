import { Link } from "react-router-dom";
import {
  ArrowRight, Cpu, ScanSearch, Fingerprint, ShieldCheck,
  Activity, Scan, AlertTriangle, Zap, Database, BarChart3, Eye,
} from "lucide-react";
import { ROUTES } from "../utils/constants.js";

const platformFeatures = [
  {
    id: 1,
    title: "Visual SSIM Diff",
    tag: "Computer Vision",
    description: "Automated homography alignment and structural deviation detection against OEM reference models.",
    icon: Cpu,
    accentColor: "rgba(0,125,184,0.15)",
    accentBorder: "rgba(0,125,184,0.30)",
    accentText: "var(--primary)",
  },
  {
    id: 2,
    title: "Fuzzy OCR Verification",
    tag: "Serial Check",
    description: "Extracts degraded serial numbers and revision codes with string distance verification.",
    icon: ScanSearch,
    accentColor: "rgba(76,215,246,0.10)",
    accentBorder: "rgba(76,215,246,0.25)",
    accentText: "#4cd7f6",
  },
  {
    id: 3,
    title: "512-Dim Vector Search",
    tag: "Embedding Match",
    description: "Sub-10ms Cosine Similarity search across catalog references with high precision.",
    icon: Fingerprint,
    accentColor: "rgba(124,58,237,0.10)",
    accentBorder: "rgba(124,58,237,0.25)",
    accentText: "#a78bfa",
  },
  {
    id: 4,
    title: "Human-in-the-Loop Audit",
    tag: "Operator Feedback",
    description: "Interactive ROI overrides and training feedback loops for automated compliance reports.",
    icon: ShieldCheck,
    accentColor: "rgba(16,185,129,0.10)",
    accentBorder: "rgba(16,185,129,0.25)",
    accentText: "var(--success)",
  },
];

const agentSteps = [
  { num: "01", label: "Selector", desc: "512-Dim CLIP Vector Match" },
  { num: "02", label: "Triage",   desc: "ORB Homography Alignment" },
  { num: "03", label: "Detector", desc: "6-Sub-Agent CV Ensemble" },
  { num: "04", label: "Decision", desc: "Weighted Risk Fusion" },
  { num: "05", label: "Explainer", desc: "LLM Rationale & PDF Export" },
];

export default function LandingPage() {
  return (
    <div
      className="min-h-screen flex flex-col antialiased"
      style={{ background: "var(--surface)", fontFamily: "var(--font-body)" }}
    >
      {/* ── Navigation Header ────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50"
        style={{
          background: "rgba(17,19,24,0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--border-hairline)",
        }}
      >
        <div className="max-w-[1360px] mx-auto px-5 sm:px-8 h-16 flex justify-between items-center">
          <Link to={ROUTES.LANDING} className="flex items-center gap-3 group">
            <div
              className="h-9 w-9 rounded-xl overflow-hidden flex items-center justify-center transition-all duration-300
                         group-hover:shadow-[0_0_20px_rgba(0,125,184,0.30)]"
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

          <div className="flex items-center gap-2.5">
            <Link to={`${ROUTES.LOGIN}?role=user`}>
              <button
                className="h-8 px-4 rounded-lg text-[11px] font-semibold transition-all duration-200 hover:bg-[var(--glass-bg)]"
                style={{
                  color: "var(--on-surface-variant)",
                  border: "1px solid var(--border-default)",
                  fontFamily: "var(--font-body)",
                }}
              >
                Operator Sign In
              </button>
            </Link>
            <Link to={`${ROUTES.LOGIN}?role=admin`}>
              <button
                className="h-8 px-4 rounded-lg text-[11px] font-semibold text-white transition-all duration-200
                           hover:shadow-[0_0_16px_var(--primary-glow)] hover:-translate-y-[1px]"
                style={{
                  background: "var(--primary-container)",
                  border: "1px solid rgba(0,125,184,0.30)",
                  boxShadow: "0 0 8px var(--primary-glow-sm)",
                  fontFamily: "var(--font-body)",
                }}
              >
                Admin Workspace →
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Main ─────────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-[1360px] mx-auto w-full px-5 sm:px-8 py-12 flex flex-col gap-16">

        {/* ── Hero ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Hero Left */}
          <div className="lg:col-span-6 space-y-6 animate-fade-in">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest"
              style={{
                background: "var(--primary-glow-sm)",
                border: "1px solid rgba(0,125,184,0.25)",
                color: "var(--primary)",
                fontFamily: "var(--font-body)",
              }}
            >
              <Zap size={11} /> AI-Powered Hardware Inspection
            </div>

            <h1
              className="text-4xl sm:text-5xl font-light leading-tight"
              style={{ fontFamily: "var(--font-headline)", color: "var(--on-surface)", letterSpacing: "-0.02em" }}
            >
              AI-Powered Hardware{" "}
              <span style={{ color: "var(--primary)" }}>Quality</span>{" "}
              & Fraud Inspection
            </h1>

            <p
              className="text-[14px] leading-relaxed max-w-xl"
              style={{ fontFamily: "var(--font-body)", color: "var(--on-surface-muted)" }}
            >
              Automatically scan and verify hardware parts using a 5-agent AI pipeline to detect fake, damaged,
              or swapped components with audit-ready reporting.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link to={`${ROUTES.LOGIN}?role=admin`}>
                <button
                  className="h-11 px-6 rounded-xl flex items-center gap-2 text-[13px] font-semibold text-white
                             transition-all duration-200 hover:shadow-[0_0_24px_var(--primary-glow)] hover:-translate-y-[2px]"
                  style={{
                    background: "var(--primary-container)",
                    border: "1px solid rgba(0,125,184,0.30)",
                    boxShadow: "0 0 12px var(--primary-glow-sm)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  <Scan size={16} />
                  Enter Audit Workspace
                </button>
              </Link>
              <Link to={`${ROUTES.LOGIN}?role=user`}>
                <button
                  className="h-11 px-6 rounded-xl flex items-center gap-2 text-[13px] font-semibold
                             transition-all duration-200 hover:bg-[var(--glass-bg)] hover:border-[var(--border-strong)]"
                  style={{
                    background: "transparent",
                    border: "1px solid var(--border-default)",
                    color: "var(--on-surface-variant)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  Operator Triage Demo
                  <ArrowRight size={14} />
                </button>
              </Link>
            </div>
          </div>

          {/* Inspection Preview Card */}
          <div className="lg:col-span-6 animate-slide-up">
            <div
              className="overflow-hidden"
              style={{
                background: "var(--glass-bg)",
                backdropFilter: "var(--glass-blur)",
                WebkitBackdropFilter: "var(--glass-blur)",
                border: "1px solid var(--border-default)",
                borderTopColor: "var(--border-light-top)",
                borderRadius: "var(--radius-xl)",
                boxShadow: "var(--glass-shadow), var(--glass-inset)",
              }}
            >
              {/* Card Header */}
              <div
                className="px-5 py-3 flex justify-between items-center"
                style={{ borderBottom: "1px solid var(--border-hairline)", background: "var(--glass-bg)" }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="text-[11px] font-bold uppercase tracking-widest"
                    style={{ fontFamily: "var(--font-body)", color: "var(--on-surface)" }}
                  >
                    INSPECTION PREVIEW
                  </span>
                </div>
                <span
                  className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest"
                  style={{
                    background: "var(--success-surface)",
                    border: "1px solid var(--success-border)",
                    color: "var(--success)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  ● PIPELINE ONLINE
                </span>
              </div>

              {/* Image Grid */}
              <div className="p-4 grid grid-cols-2 gap-3" style={{ background: "var(--surface-lowest)" }}>
                {/* Golden Reference */}
                <div
                  className="rounded-xl p-3 space-y-2"
                  style={{
                    background: "var(--glass-bg)",
                    border: "1px solid var(--border-hairline)",
                  }}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold uppercase tracking-widest"
                          style={{ color: "var(--on-surface-muted)", fontFamily: "var(--font-mono)" }}>
                      OEM REFERENCE
                    </span>
                    <span className="text-[9px] font-bold"
                          style={{ color: "var(--success)", fontFamily: "var(--font-mono)" }}>
                      Dell DDR5
                    </span>
                  </div>
                  <div className="h-36 sm:h-40 rounded-lg flex items-center justify-center overflow-hidden p-2"
                       style={{ background: "var(--surface-lowest)", border: "1px solid var(--border-hairline)" }}>
                    <img src="/images/ram_clean.png" alt="Clean RAM" className="h-full object-contain" />
                  </div>
                </div>

                {/* Target Scan */}
                <div
                  className="rounded-xl p-3 space-y-2"
                  style={{
                    background: "var(--glass-bg)",
                    border: "1px solid var(--urgent-border)",
                  }}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold uppercase tracking-widest"
                          style={{ color: "var(--on-surface-muted)", fontFamily: "var(--font-mono)" }}>
                      TARGET SCAN
                    </span>
                    <span className="text-[9px] font-bold flex items-center gap-1"
                          style={{ color: "var(--urgent)", fontFamily: "var(--font-mono)" }}>
                      <AlertTriangle size={10} /> TAMPERED
                    </span>
                  </div>
                  <div className="h-36 sm:h-40 rounded-lg flex items-center justify-center overflow-hidden p-2"
                       style={{ background: "var(--surface-lowest)", border: "1px solid var(--urgent-border)" }}>
                    <img src="/images/ram_tampered.png" alt="Tampered RAM" className="h-full object-contain" />
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div
                className="px-5 py-3 flex items-center justify-between"
                style={{ borderTop: "1px solid var(--border-hairline)", background: "var(--glass-bg)" }}
              >
                <span className="text-[11px]" style={{ fontFamily: "var(--font-body)", color: "var(--on-surface-variant)" }}>
                  SSIM Alignment:{" "}
                  <strong style={{ color: "var(--urgent)", fontFamily: "var(--font-mono)" }}>34.6%</strong>
                </span>
                <span
                  className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                  style={{
                    background: "var(--urgent-surface)",
                    border: "1px solid var(--urgent-border)",
                    color: "var(--urgent)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  QUARANTINE — 95% RISK
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── 5-Agent Pipeline Stepper ──────────────────────────────── */}
        <div
          className="rounded-2xl p-6"
          style={{
            background: "var(--glass-bg)",
            border: "1px solid var(--border-hairline)",
            backdropFilter: "var(--glass-blur)",
          }}
        >
          <div className="mb-5">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1"
               style={{ color: "var(--primary)", fontFamily: "var(--font-body)" }}>
              5-AGENT LANGGRAPH PIPELINE
            </p>
            <h2 className="text-xl font-light"
                style={{ fontFamily: "var(--font-headline)", color: "var(--on-surface)" }}>
              Autonomous Detection Workflow
            </h2>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            {agentSteps.map((step, i) => (
              <div key={step.num} className="flex items-center gap-2 flex-1">
                <div className="flex-1 min-w-0">
                  <div
                    className="rounded-xl p-3.5 transition-all duration-200 hover:border-[rgba(0,125,184,0.35)] cursor-default"
                    style={{
                      background: "var(--glass-bg)",
                      border: "1px solid var(--border-hairline)",
                    }}
                  >
                    <p className="text-[9px] font-bold uppercase tracking-widest"
                       style={{ color: "var(--primary)", fontFamily: "var(--font-mono)" }}>
                      Agent {step.num}
                    </p>
                    <p className="text-[13px] font-medium mt-0.5"
                       style={{ fontFamily: "var(--font-headline)", color: "var(--on-surface)" }}>
                      {step.label}
                    </p>
                    <p className="text-[10px] mt-0.5"
                       style={{ color: "var(--on-surface-muted)", fontFamily: "var(--font-body)" }}>
                      {step.desc}
                    </p>
                  </div>
                </div>
                {i < agentSteps.length - 1 && (
                  <ArrowRight
                    size={14}
                    className="shrink-0 hidden sm:block"
                    style={{ color: "var(--on-surface-muted)" }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Capability Cards ─────────────────────────────────────── */}
        <div>
          <div className="mb-6">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1"
               style={{ color: "var(--primary)", fontFamily: "var(--font-body)" }}>
              CORE CAPABILITIES
            </p>
            <h2 className="text-2xl font-light"
                style={{ fontFamily: "var(--font-headline)", color: "var(--on-surface)" }}>
              Multi-Agent Computer Vision Architecture
            </h2>
            <p className="text-[13px] mt-1.5 max-w-xl"
               style={{ fontFamily: "var(--font-body)", color: "var(--on-surface-muted)" }}>
              Real-time operator feedback loop with parallel CV ensemble and LLM audit explanations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {platformFeatures.map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.id}
                  className="rounded-xl p-5 space-y-4 flex flex-col justify-between
                             transition-all duration-250 hover:-translate-y-1 cursor-default group"
                  style={{
                    background: "var(--glass-bg)",
                    border: "1px solid var(--border-hairline)",
                    backdropFilter: "var(--glass-blur)",
                    WebkitBackdropFilter: "var(--glass-blur)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = feat.accentBorder;
                    e.currentTarget.style.boxShadow = `0 8px 24px ${feat.accentColor}`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-hairline)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: feat.accentColor, border: `1px solid ${feat.accentBorder}`, color: feat.accentText }}
                      >
                        <Icon size={18} />
                      </div>
                      <span
                        className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full"
                        style={{
                          background: feat.accentColor,
                          border: `1px solid ${feat.accentBorder}`,
                          color: feat.accentText,
                          fontFamily: "var(--font-body)",
                        }}
                      >
                        {feat.tag}
                      </span>
                    </div>
                    <h3
                      className="text-[14px] font-medium"
                      style={{ fontFamily: "var(--font-headline)", color: "var(--on-surface)" }}
                    >
                      {feat.title}
                    </h3>
                  </div>
                  <p
                    className="text-[11px] leading-relaxed"
                    style={{ fontFamily: "var(--font-body)", color: "var(--on-surface-muted)" }}
                  >
                    {feat.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Stats Row ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { value: "< 5s", label: "Pipeline Execution", icon: Zap, color: "var(--primary)" },
            { value: "6x",   label: "Detection Sub-Agents", icon: Eye, color: "#4cd7f6" },
            { value: "100%", label: "Audit Trail Coverage", icon: Database, color: "#a78bfa" },
            { value: "95%",  label: "Fraud Detection Rate", icon: BarChart3, color: "var(--success)" },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="rounded-xl p-4 text-center transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  background: "var(--glass-bg)",
                  border: "1px solid var(--border-hairline)",
                  backdropFilter: "var(--glass-blur)",
                }}
              >
                <Icon size={20} className="mx-auto mb-2" style={{ color: stat.color }} />
                <p className="text-2xl font-light" style={{ fontFamily: "var(--font-headline)", color: stat.color }}>
                  {stat.value}
                </p>
                <p className="text-[10px] mt-1 uppercase tracking-widest font-semibold"
                   style={{ fontFamily: "var(--font-body)", color: "var(--on-surface-muted)" }}>
                  {stat.label}
                </p>
              </div>
            );
          })}
        </div>
      </main>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer
        className="py-5 px-6 mt-auto flex flex-col sm:flex-row justify-between items-center gap-2 text-[10px]"
        style={{
          borderTop: "1px solid var(--border-hairline)",
          background: "var(--glass-bg)",
          fontFamily: "var(--font-body)",
          color: "var(--on-surface-muted)",
        }}
      >
        <span className="font-bold uppercase tracking-widest" style={{ color: "var(--on-surface)" }}>
          VERIVISION AI
        </span>
        <span>© 2026 Team IDEAFORG-E · Dell FutureMind AI Hackathon</span>
        <span className="font-semibold" style={{ color: "var(--primary)" }}>
          Grand Final 2026
        </span>
      </footer>
    </div>
  );
}
