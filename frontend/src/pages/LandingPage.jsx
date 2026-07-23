import { Link } from "react-router-dom";
import {
  ArrowRight,
  Cpu,
  ScanSearch,
  Terminal,
  AlertTriangle,
  Fingerprint,
  Zap,
  CheckCircle2,
  ShieldAlert,
  Layers,
  Gauge
} from "lucide-react";
import { ROUTES } from "../utils/constants.js";

const platformFeatures = [
  {
    id: 1,
    title: "AI Visual Comparison & SSIM Diff",
    tag: "Structural CV",
    description: "Cross-reference incoming parts against validated OEM reference models using SSIM structural diff mapping and RANSAC homography alignment.",
    icon: Cpu,
    color: "bg-indigo-50 border-indigo-100 text-[#4b41e1]"
  },
  {
    id: 2,
    title: "Fuzzy OCR Character Verification",
    tag: "OCR Parsing",
    description: "Extracts degraded serial numbers, revision tags, and warranty codes with Levenshtein string distance checks to catch altered characters.",
    icon: ScanSearch,
    color: "bg-blue-50 border-blue-100 text-blue-600"
  },
  {
    id: 3,
    title: "512-Dim Vector Index & Auto-Match",
    tag: "Vector Index",
    description: "Sub-10ms Cosine Similarity search across catalog references using 512-dimensional visual feature vectors with 100% precision.",
    icon: Fingerprint,
    color: "bg-emerald-50 border-emerald-100 text-emerald-600"
  },
  {
    id: 4,
    title: "Parallel Multi-Angle Risk Fusion",
    tag: "Multi-Angle",
    description: "Executes parallel 5-agent pipelines across primary top-view and secondary side-view camera scans with automated risk score fusion.",
    icon: Layers,
    color: "bg-purple-50 border-purple-100 text-purple-600"
  },
  {
    id: 5,
    title: "Human-in-the-Loop & Audit Reporting",
    tag: "HITL & Audit",
    description: "Interactive ROI canvas editor for reviewer overrides, training feedback loops, and automated generation of downloadable PDF/CSV audit reports.",
    icon: ShieldAlert,
    color: "bg-amber-50 border-amber-100 text-amber-600"
  },
  {
    id: 6,
    title: "Deterministic Policy & Risk Scoring",
    tag: "Policy Judge",
    description: "Weighted decision engine evaluating structural, OCR, and visual anomalies into deterministic fraud risk scores (0–100) with quarantine triggers.",
    icon: Gauge,
    color: "bg-teal-50 border-teal-100 text-teal-600"
  }
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f7f9fb] text-[#191c1e] font-sans antialiased selection:bg-[#4b41e1] selection:text-white">
      
      {/* ── Top Navigation Bar ────────────────────────────── */}
      <header className="bg-white/90 border-b border-slate-200/90 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link to={ROUTES.LANDING} className="flex items-center gap-3 group">
            <div className="h-10 w-10 rounded-xl bg-[#131b2e] flex items-center justify-center text-white shadow-md transition-transform group-hover:scale-105">
              <Fingerprint size={22} className="text-[#6ffbbe]" />
            </div>
            <div>
              <p className="text-lg font-black tracking-tight text-[#131b2e] font-tech-code">VERIVISION-AI</p>
              <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Autonomous Vision Triage</p>
            </div>
          </Link>
          <Link
            to={`${ROUTES.LOGIN}?role=user`}
            className="inline-flex items-center gap-2 bg-[#4b41e1] hover:bg-[#3b31d1] text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-sm transition-all hover:scale-[1.02] hover:shadow-indigo-500/20"
          >
            Enter Console
            <ArrowRight size={14} />
          </Link>
        </div>
      </header>

      {/* ── Hero & Sandbox Section ────────────────────────── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-10 flex flex-col gap-14">
        
        <div className="flex flex-col lg:flex-row gap-10 items-center justify-center">
          {/* Left: Hero Text & Actions */}
          <div className="w-full lg:w-5/12 flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-[#131b2e] leading-[1.15]">
                Real-time AI <br />
                <span className="bg-gradient-to-r from-[#4b41e1] via-indigo-600 to-cyan-600 bg-clip-text text-transparent">
                  Parts Inspection
                </span>
              </h1>
              
              <p className="text-sm leading-relaxed text-[#45464d] max-w-lg">
                Deploy laboratory-grade computer vision to your repair supply chain. Verify incoming components against OEM reference models instantly with sub-millimeter accuracy and zero cognitive load.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-row gap-4">
              <Link
                to={`${ROUTES.LOGIN}?role=admin`}
                className="inline-flex items-center justify-center gap-2 bg-[#4b41e1] hover:bg-[#3b31d1] text-white font-bold text-xs px-6 py-3.5 rounded-xl shadow-md transition-all hover:scale-[1.02]"
              >
                Admin Console
                <ArrowRight size={14} />
              </Link>
              <Link
                to={`${ROUTES.LOGIN}?role=user`}
                className="inline-flex items-center justify-center gap-2 bg-white border border-slate-300/80 text-[#191c1e] font-bold text-xs px-6 py-3.5 rounded-xl hover:border-[#4b41e1] hover:text-[#4b41e1] transition-all shadow-sm"
              >
                Operator Space
              </Link>
            </div>
          </div>

          {/* Right: Clean Light Telemetry Sandbox (Ultra-Crisp RAM Comparison) */}
          <div className="w-full lg:w-7/12 relative">
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_15px_35px_rgba(15,23,42,0.06)] overflow-hidden flex flex-col relative z-10">
              
              {/* Clean Light Sandbox Header */}
              <div className="border-b border-slate-200/90 px-5 py-3.5 flex justify-between items-center bg-slate-50/80">
                <div className="flex items-center gap-2.5">
                  <Terminal size={15} className="text-[#4b41e1]" />
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-widest font-tech-code">
                    TELEMETRY SANDBOX // ACTIVE SESSION
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold font-tech-code text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                    5-AGENT ENSEMBLE: ACTIVE
                  </span>
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  </div>
                </div>
              </div>

              {/* Sandbox Content Area — Ultra-Crisp RAM Comparison Cards */}
              <div className="p-4 bg-slate-100/60 flex flex-col md:flex-row gap-4">
                
                {/* OEM Reference Panel (Clean Dell DDR5 RAM) */}
                <div className="flex-1 bg-white rounded-xl border border-slate-200/90 flex flex-col overflow-hidden shadow-sm">
                  <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-200/90 flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700 font-tech-code">OEM REFERENCE</span>
                    <span className="text-[10px] text-emerald-700 font-tech-code font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      Dell DDR5 RAM 16GB
                    </span>
                  </div>
                  <div className="relative h-[250px] bg-slate-50/50 overflow-hidden group flex items-center justify-center p-3">
                    <img
                      src="/images/ram_clean.png"
                      alt="Golden Dell DDR5 RAM Module Clean"
                      className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-[1.03]"
                    />
                    {/* Minimal Pinned Bounding Box */}
                    <div className="absolute top-[26%] left-[12%] w-[76%] h-[48%] border-2 border-[#4b41e1] border-dashed rounded-lg bg-transparent pointer-events-none">
                      <span className="absolute -top-3 left-3 bg-[#4b41e1] text-white font-black font-tech-code text-[9px] px-2 py-0.5 rounded shadow-md flex items-center gap-1">
                        ✓ OEM Tag: 'RAM-GEN-16G'
                      </span>
                    </div>
                  </div>
                </div>

                {/* Inspected Return Panel (Tampered Dell DDR5 RAM) */}
                <div className="flex-1 bg-white rounded-xl border border-slate-200/90 flex flex-col overflow-hidden shadow-sm">
                  <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-200/90 flex justify-between items-center">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-800 font-tech-code">INSPECTED RETURN (LIVE)</span>
                    <span className="bg-red-50 border border-red-200 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <AlertTriangle size={11} /> Anomaly Detected
                    </span>
                  </div>
                  <div className="relative h-[250px] bg-slate-50/50 overflow-hidden group flex items-center justify-center p-3">
                    <img
                      src="/images/ram_tampered.png"
                      alt="Tampered Dell DDR5 RAM Module Scan"
                      className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-[1.03]"
                    />
                    {/* Minimal Pinned Bounding Box (Tampered Region) */}
                    <div className="absolute top-[24%] left-[10%] w-[80%] h-[52%] border-2 border-red-500 rounded-lg bg-transparent animate-pulse pointer-events-none">
                      <span className="absolute -top-3 left-3 bg-red-600 text-white font-black font-tech-code text-[9px] px-2 py-0.5 rounded shadow-md flex items-center gap-1">
                        ⚠️ OCR Mismatch: '263 PC2...' vs 'RAM-GEN-16G'
                      </span>
                      <span className="absolute -bottom-3 right-3 bg-amber-600 text-white font-black font-tech-code text-[8px] px-2 py-0.5 rounded shadow-md flex items-center gap-1">
                        Broken Seal & Non-OEM Label
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Bottom Light Diagnostic Metrics Bar */}
              <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex flex-wrap items-center justify-between text-[11px] font-tech-code text-slate-700">
                <div className="flex items-center gap-4">
                  <span><strong className="text-slate-500">SSIM ALIGN:</strong> <span className="text-red-600 font-bold">34.6%</span></span>
                  <span><strong className="text-slate-500">OCR ACCURACY:</strong> <span className="text-red-600 font-bold">0.0%</span></span>
                  <span><strong className="text-slate-500">VECTOR MATCH:</strong> <span className="text-indigo-700 font-bold">85.0%</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
                  <span className="text-red-700 font-extrabold uppercase tracking-wider">VERDICT: TAMPERED (SCORE: 95/100)</span>
                </div>
              </div>

            </div>

            {/* Subtle Glow */}
            <div className="absolute -inset-4 bg-gradient-to-tr from-indigo-500/10 via-blue-500/5 to-slate-200/20 rounded-3xl -z-10 blur-xl pointer-events-none" />
          </div>
        </div>

        {/* ── 6 Core Platform Capabilities Section ──────────────── */}
        <div className="pt-6 border-t border-slate-200/80">
          <div className="flex flex-col gap-2 mb-8">
            <h2 className="text-2xl font-black tracking-tight text-[#131b2e]">
              6 Core Platform Capabilities
            </h2>
            <p className="text-xs text-[#45464d] max-w-2xl">
              Engineered with a multi-agent architecture combining computer vision, vector embeddings, and real-time human feedback.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {platformFeatures.map((feat) => {
              const IconComponent = feat.icon;
              return (
                <div
                  key={feat.id}
                  className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-indigo-400 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-11 h-11 rounded-xl ${feat.color} border flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <IconComponent size={22} />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                        {feat.tag}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-[#131b2e] mb-2 group-hover:text-[#4b41e1] transition-colors">
                      {feat.title}
                    </h3>
                    <p className="text-xs text-[#45464d] leading-relaxed">
                      {feat.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </main>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className="bg-white border-t border-slate-200/90 mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-lg font-black tracking-tight text-[#131b2e] font-tech-code">
            VERIVISION-AI
          </div>
          
          <nav className="flex flex-wrap gap-6 items-center justify-center text-xs font-semibold text-[#45464d]">
            <a className="hover:text-[#4b41e1] transition-colors" href="#">Privacy Policy</a>
            <a className="hover:text-[#4b41e1] transition-colors" href="#">Terms of Service</a>
            <a className="hover:text-[#4b41e1] transition-colors" href="#">Security</a>
            <a className="hover:text-[#4b41e1] transition-colors" href="#">Contact Support</a>
            <a className="hover:text-[#4b41e1] transition-colors" href="#">Documentation</a>
          </nav>
          
          <div className="text-xs text-[#45464d] text-center md:text-right">
            © 2026 VERIVISION-AI. All rights reserved. Precision Technical Systems Corp.
          </div>
        </div>
      </footer>

    </div>
  );
}
