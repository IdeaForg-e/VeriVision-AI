import { Link } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  BrainCircuit,
  ClipboardCheck,
  FileSearch,
  Fingerprint,
  Gauge,
  LockKeyhole,
  ScanSearch,
  ShieldCheck,
  Zap,
  Cpu,
  Layers
} from "lucide-react";
import { ROUTES } from "../utils/constants.js";

const keyFeatures = [
  {
    title: "AI Visual Comparison",
    description: "Compare returns against OEM references using ORB & SSIM descriptors.",
    icon: Cpu,
    color: "text-cyan-400"
  },
  {
    title: "Fuzzy OCR Extraction",
    description: "Parse serial numbers to match official registries.",
    icon: ScanSearch,
    color: "text-purple-400"
  }
];

export default function LandingPage() {
  return (
    <main className="h-screen max-h-screen overflow-hidden flex flex-col bg-[#070a13] text-slate-100 selection:bg-cyan-500 selection:text-slate-950">
      
      {/* Compact Header */}
      <header className="mx-auto w-full max-w-7xl flex items-center justify-between px-5 py-4 sm:px-8 border-b border-slate-900/60 bg-[#070a13]/85 backdrop-blur-md z-50">
        <Link to={ROUTES.LANDING} className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 text-white shadow-[0_0_12px_rgba(6,182,212,0.3)]">
            <Fingerprint size={21} />
          </div>
          <div>
            <p className="text-xs font-extrabold tracking-[0.25em] text-white">VERIVISION-AI</p>
            <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest">Vision-Triage System</p>
          </div>
        </Link>
        <Link
          to={`${ROUTES.LOGIN}?role=user`}
          className="hidden items-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-950/30 px-4 py-1.5 text-xs font-semibold text-cyan-400 shadow-sm transition hover:bg-cyan-900/50 hover:border-cyan-400/50 sm:inline-flex"
        >
          Enter Console
          <ArrowRight size={14} />
        </Link>
      </header>

      {/* Main Single Screen Grid Layout */}
      <section className="flex-1 mx-auto w-full max-w-7xl px-5 sm:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center overflow-hidden max-h-[calc(100vh-120px)] py-4">
        
        {/* Left Side Info Panel */}
        <div className="lg:col-span-5 flex flex-col gap-5 justify-center py-2">
          
          <div className="inline-flex self-start items-center gap-2 rounded-full border border-cyan-500/25 bg-cyan-950/20 px-3 py-1.5 text-[11px] font-semibold text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.08)]">
            <Zap size={12} className="animate-pulse" />
            <span>Dell Hackathon Finale Release</span>
          </div>
          
          <div className="space-y-3">
            <h1 className="text-4xl sm:text-5xl font-black leading-[1.1] tracking-tight text-white">
              Real-time AI <br />
              <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                Parts Inspection
              </span>
            </h1>
            <p className="text-sm leading-relaxed text-slate-400 max-w-xl">
              Automate repair supply chain verification. Compare incoming returns against golden OEM templates, compute variations, and instantly isolate tampered parts.
            </p>
          </div>

          <div className="flex flex-col gap-2.5">
            {keyFeatures.map((feat) => {
              const Icon = feat.icon;
              return (
                <div key={feat.title} className="cyber-card border-slate-850 bg-[#0f172a]/30 p-3.5 flex items-start gap-3.5">
                  <div className={`p-2 rounded-lg bg-slate-950/80 border border-slate-850 shrink-0 ${feat.color}`}>
                    <Icon size={16} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-100 text-xs">{feat.title}</h3>
                    <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5">{feat.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-3 max-w-md">
            <Link
              to={`${ROUTES.LOGIN}?role=admin`}
              className="group flex h-11 items-center justify-between rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-extrabold text-xs shadow-[0_0_12px_rgba(6,182,212,0.2)] hover:opacity-95 transition px-4 py-2"
            >
              <span>Admin Console</span>
              <ArrowRight size={15} className="text-slate-950 transition group-hover:translate-x-0.5" />
            </Link>
            <Link
              to={`${ROUTES.LOGIN}?role=user`}
              className="group flex h-11 items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-white transition text-xs font-semibold px-4 py-2"
            >
              <span>Operator Space</span>
              <ArrowRight size={15} className="text-cyan-400 transition group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

        {/* Right Side Visual Sandbox */}
        <div className="lg:col-span-7 h-full flex items-center justify-center py-2 max-h-[460px]">
          <div className="w-full cyber-card border-slate-800 bg-[#0f172a]/65 p-5 shadow-2xl relative flex flex-col justify-between h-full max-h-[440px]">
            
            {/* Mockup Header */}
            <div className="flex items-center justify-between border-b border-slate-850 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">AI Telemetry Sandbox</p>
                  <p className="text-xs font-extrabold text-white">XPS-BOARD-2026</p>
                </div>
              </div>
              <span className="rounded-full bg-red-500/10 border border-red-500/20 px-2.5 py-0.5 text-[10px] font-bold text-red-400 font-tech-code tracking-wider">
                94% TAMPER
              </span>
            </div>

            {/* In-Line Images */}
            <div className="grid grid-cols-2 gap-3.5 my-3.5 flex-1">
              <div className="rounded-lg border border-slate-850 bg-slate-950 p-2.5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-450">OEM Reference</span>
                  <BadgeCheck size={14} className="text-emerald-500 animate-pulse" />
                </div>
                <div className="h-[80px] border border-dashed border-slate-850 rounded bg-[#090d16]/70 flex flex-col justify-center items-center text-center p-1">
                  <span className="text-[9px] text-slate-500">SSIM Match: 1.00</span>
                </div>
              </div>
              <div className="rounded-lg border border-red-950/30 bg-slate-950 p-2.5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-450">Inspected Return</span>
                  <ScanSearch size={14} className="text-red-400" />
                </div>
                <div className="h-[80px] border border-red-500/20 rounded bg-red-950/15 flex flex-col justify-center items-center text-center p-1">
                  <span className="text-[9px] text-red-400 font-semibold">Mismatch Found</span>
                </div>
              </div>
            </div>

            {/* In-Line CV Log */}
            <div className="bg-slate-950/90 rounded-lg p-3 border border-slate-850 font-tech-code text-[10px] text-cyan-400 space-y-0.5">
              <p className="text-slate-500">&gt;_ cv-core: ORB/SIFT delta 42% [WARN]</p>
              <p className="text-red-400">&gt;_ fail: serial_number tag tampered [FAIL]</p>
            </div>

          </div>
        </div>

      </section>

      {/* Flat Footer */}
      <footer className="w-full py-4 text-center border-t border-slate-900 bg-slate-950/20 text-[10px] text-slate-500 tracking-wide mt-auto z-40">
        <p>© 2026 VERIVISION-AI · Platform built for repair supply chains verification.</p>
      </footer>

    </main>
  );
}
