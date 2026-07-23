import { Link } from "react-router-dom";
import {
  ArrowRight,
  Cpu,
  ScanSearch,
  Fingerprint,
  ShieldCheck,
  Activity,
  Scan,
  AlertTriangle,
} from "lucide-react";
import { ROUTES } from "../utils/constants.js";
import { Button } from "../components/Common.jsx";

const platformFeatures = [
  {
    id: 1,
    title: "Visual SSIM Diff",
    tag: "Computer Vision",
    description: "Automated homography alignment and structural deviation detection against OEM reference models.",
    icon: Cpu,
  },
  {
    id: 2,
    title: "Fuzzy OCR Verification",
    tag: "Serial Check",
    description: "Extracts degraded serial numbers and revision codes with string distance verification.",
    icon: ScanSearch,
  },
  {
    id: 3,
    title: "512-Dim Vector Search",
    tag: "Embedding Match",
    description: "Sub-10ms Cosine Similarity search across catalog references with high precision.",
    icon: Fingerprint,
  },
  {
    id: 4,
    title: "Human-in-the-Loop Audit",
    tag: "Operator Feedback",
    description: "Interactive ROI overrides and training feedback loops for automated compliance reports.",
    icon: ShieldCheck,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-slate-100 font-sans antialiased">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-[#090d16]/95 backdrop-blur-md">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 h-16 flex justify-between items-center">
          <Link to={ROUTES.LANDING} className="flex items-center gap-3 group">
            <div className="h-9 w-9 rounded-xl overflow-hidden bg-[#090d16] border border-sky-500/30 flex items-center justify-center shadow-md">
              <img src="/images/logo.png" alt="VeriVision Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-xs font-black tracking-widest text-white uppercase font-mono">
                VERIVISION <span className="text-sky-400">AI</span>
              </p>
              <p className="text-[10px] text-slate-400 font-mono">Visual Hardware Verification</p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link to={`${ROUTES.LOGIN}?role=user`}>
              <Button variant="outline" size="sm">
                Operator Sign In
              </Button>
            </Link>
            <Link to={`${ROUTES.LOGIN}?role=admin`}>
              <Button variant="primary" size="sm" icon={<ArrowRight size={14} />}>
                Admin Workspace
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Hero */}
      <main className="flex-1 max-w-[1360px] mx-auto w-full px-4 sm:px-6 py-10 flex flex-col gap-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Hero Left */}
          <div className="lg:col-span-6 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/25 text-sky-400 text-xs font-mono font-semibold">
              <Activity size={14} /> AI-Powered Hardware Inspection
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
              AI-Powered Hardware Quality &amp; Fraud Inspection
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
              Automatically scan and verify hardware parts using artificial intelligence to detect fake, damaged, or swapped components.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link to={`${ROUTES.LOGIN}?role=admin`}>
                <Button variant="primary" size="md" icon={<Scan size={16} />} className="h-11 px-5 text-sm font-bold">
                  Enter Audit Workspace
                </Button>
              </Link>
              <Link to={`${ROUTES.LOGIN}?role=user`}>
                <Button variant="outline" size="md" className="h-11 px-5 text-sm font-semibold">
                  Operator Triage Demo
                </Button>
              </Link>
            </div>
          </div>

          {/* Telemetry Mockup Preview */}
          <div className="lg:col-span-6">
            <div className="bg-[#0e1626] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
              <div className="px-5 py-3 border-b border-slate-800 bg-[#131e32] flex justify-between items-center text-xs font-mono">
                <span className="font-bold text-slate-200">INSPECTION PREVIEW</span>
                <span className="px-2.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-bold text-[10px]">
                  PIPELINE ONLINE
                </span>
              </div>

              <div className="p-4 bg-[#090d16] grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#0e1626] border border-slate-800/80 rounded-xl p-3 space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="text-slate-400 font-bold">OEM REFERENCE</span>
                    <span className="text-emerald-400 font-bold">Dell DDR5</span>
                  </div>
                  <div className="h-40 sm:h-44 bg-black rounded-lg flex items-center justify-center overflow-hidden p-2 border border-slate-900">
                    <img src="/images/ram_clean.png" alt="Clean RAM" className="h-full object-contain" />
                  </div>
                </div>

                <div className="bg-[#0e1626] border border-slate-800/80 rounded-xl p-3 space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="text-slate-400 font-bold">TARGET SCAN</span>
                    <span className="text-rose-400 font-bold flex items-center gap-1">
                      <AlertTriangle size={12} /> TAMPERED
                    </span>
                  </div>
                  <div className="h-40 sm:h-44 bg-black rounded-lg flex items-center justify-center overflow-hidden p-2 border border-slate-900">
                    <img src="/images/ram_tampered.png" alt="Tampered RAM" className="h-full object-contain" />
                  </div>
                </div>
              </div>

              <div className="px-5 py-3 border-t border-slate-800 bg-[#131e32] flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300">SSIM Alignment: <strong className="text-rose-400">34.6%</strong></span>
                <span className="font-bold text-rose-400 uppercase tracking-wider">QUARANTINE (95% RISK)</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Clean Capability Cards */}
        <div className="pt-6 border-t border-slate-800 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Core Inspection Capabilities
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Multi-agent computer vision architecture with real-time operator feedback loop.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {platformFeatures.map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.id}
                  className="bg-[#0e1626] border border-slate-800 rounded-2xl p-5 space-y-3 hover:border-sky-500/40 transition duration-200 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20">
                        <Icon size={18} />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/60">
                        {feat.tag}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-100">{feat.title}</h3>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed pt-1">{feat.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-[#090d16] py-5 px-6 mt-auto text-xs text-slate-400 flex flex-col sm:flex-row justify-between items-center gap-2">
        <span className="font-mono font-bold text-white">VERIVISION AI</span>
        <span>© 2026 Precision Technical Systems. All rights reserved.</span>
      </footer>
    </div>
  );
}
