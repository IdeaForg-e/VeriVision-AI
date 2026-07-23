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
  Layers
} from "lucide-react";
import { ROUTES } from "../utils/constants.js";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#080d1a] text-slate-100 font-sans antialiased selection:bg-cyan-500 selection:text-slate-950">
      
      {/* ── Top Navigation Bar ────────────────────────────── */}
      <header className="bg-[#0b1329]/90 border-b border-slate-800/80 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link to={ROUTES.LANDING} className="flex items-center gap-3 group">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-transform group-hover:scale-105">
              <Fingerprint size={22} />
            </div>
            <div>
              <p className="text-lg font-black tracking-tight text-slate-100 font-tech-code">VERIVISION-AI</p>
              <p className="text-[10px] font-bold text-cyan-400/80 uppercase tracking-widest">Autonomous Vision Triage</p>
            </div>
          </Link>
          <Link
            to={`${ROUTES.LOGIN}?role=user`}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl hover:shadow-[0_0_25px_rgba(6,182,212,0.3)] transition-all hover:scale-[1.02]"
          >
            Enter Console
            <ArrowRight size={14} />
          </Link>
        </div>
      </header>

      {/* ── Main Content ─────────────────────────────────── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-10 flex flex-col lg:flex-row gap-10 items-center justify-center">
        
        {/* Left: Hero Text & Features */}
        <div className="w-full lg:w-5/12 flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <div className="inline-flex items-center gap-2 self-start px-3 py-1.5 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 text-[11px] font-bold tracking-wider uppercase shadow-[0_0_15px_rgba(6,182,212,0.1)]">
              <Zap size={12} className="animate-pulse" />
              <span>Next-Gen Computer Vision Engine</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-[1.15]">
              Real-time AI <br />
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                Parts Inspection
              </span>
            </h1>
            
            <p className="text-sm leading-relaxed text-slate-400 max-w-lg">
              Deploy laboratory-grade computer vision to your repair supply chain. Verify incoming components against OEM reference models instantly with sub-millimeter accuracy and zero cognitive load.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-row gap-4">
            <Link
              to={`${ROUTES.LOGIN}?role=admin`}
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs px-6 py-3.5 rounded-xl hover:shadow-[0_0_25px_rgba(6,182,212,0.3)] transition-all hover:scale-[1.02]"
            >
              Admin Console
              <ArrowRight size={14} />
            </Link>
            <Link
              to={`${ROUTES.LOGIN}?role=user`}
              className="inline-flex items-center justify-center gap-2 bg-slate-900/80 border border-slate-800 text-slate-300 font-semibold text-xs px-6 py-3.5 rounded-xl hover:border-cyan-500/40 hover:text-cyan-400 transition-all hover:bg-slate-850"
            >
              Operator Space
            </Link>
          </div>

          {/* Features Bento Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            {/* Feature 1 */}
            <div className="bg-[#0e1628]/80 p-5 rounded-xl border border-slate-800/80 hover:border-cyan-500/30 transition-all group">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Cpu size={20} className="text-cyan-400" />
              </div>
              <h3 className="font-bold text-sm text-slate-100 mb-1">AI Visual Comparison</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Cross-reference incoming parts against a dynamic database of validated OEM geometries.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-[#0e1628]/80 p-5 rounded-xl border border-slate-800/80 hover:border-purple-500/30 transition-all group">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <ScanSearch size={20} className="text-purple-400" />
              </div>
              <h3 className="font-bold text-sm text-slate-100 mb-1">Fuzzy OCR Extraction</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Automatically parse degraded serial numbers and manufacturing codes from worn components.
              </p>
            </div>
          </div>
        </div>

        {/* Right: UI Preview Sandbox */}
        <div className="w-full lg:w-7/12 relative">
          <div className="bg-[#0b1329] rounded-2xl border border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col h-[580px] relative z-10">
            
            {/* Sandbox Header */}
            <div className="border-b border-slate-800/80 px-5 py-3.5 flex justify-between items-center bg-[#090f20]">
              <div className="flex items-center gap-2">
                <Terminal size={14} className="text-cyan-400" />
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest font-tech-code">
                  Telemetry Sandbox // Active Session
                </span>
              </div>
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-700"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
            </div>

            {/* Sandbox Content Area */}
            <div className="flex-1 flex flex-col md:flex-row p-4 gap-4 bg-[#070c18] overflow-hidden">
              
              {/* OEM Reference Panel */}
              <div className="flex-1 bg-[#0d1627] rounded-xl border border-slate-800/80 flex flex-col overflow-hidden">
                <div className="px-3 py-2 bg-[#0a101f] border-b border-slate-800/80 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">OEM Reference</span>
                  <span className="text-[10px] text-emerald-400 font-tech-code font-bold">Standard 1.0</span>
                </div>
                <div className="flex-1 relative bg-slate-950/80 p-3 flex items-center justify-center overflow-hidden">
                  <div 
                    className="w-full h-full bg-contain bg-no-repeat bg-center rounded opacity-90 transition-transform duration-500 hover:scale-105" 
                    style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDKT3fhZkghzYjeVFpV7EssMWUu2cPaLAgl-PSUjb7dal_SQJH_ciQrBWd5JTAEVIzHELOSP_5wYogSrjx0NEQ6R7pzvo2CGJTsBqzk7nAOHIAhJca7kqoFvAKMKy2ukjpOJYXwHlg9Q0Kh20YplcevrvAU8gUy6uizXkYpgqTThFiKEod0PlusmOXydJhdG0Gp9yQHydk8Px-ANJM-KcO0SkbvoK7VuPwI_jV5H0N6afjeFTZyFR2LF2L52l22CZXBoIFvJ8oaT88')" }}
                  />
                  {/* Simulated bounding box */}
                  <div className="absolute top-[20%] left-[30%] w-[40%] h-[30%] border border-cyan-500/60 border-dashed rounded flex items-start p-1 bg-cyan-500/5">
                    <span className="bg-cyan-950/90 text-cyan-400 font-tech-code text-[9px] px-1.5 py-0.5 rounded border border-cyan-500/30">
                      Verified Region
                    </span>
                  </div>
                </div>
              </div>

              {/* Inspected Return Panel */}
              <div className="flex-1 bg-[#0d1627] rounded-xl border border-slate-800/80 flex flex-col overflow-hidden relative">
                <div className="px-3 py-2 bg-[#0a101f] border-b border-slate-800/80 flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-200">Inspected Return (Live)</span>
                  <span className="bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <AlertTriangle size={11} /> Anomaly Detected
                  </span>
                </div>
                <div className="flex-1 relative bg-slate-950/80 p-3 flex items-center justify-center overflow-hidden">
                  <div 
                    className="w-full h-full bg-contain bg-no-repeat bg-center rounded transition-transform duration-500 hover:scale-105" 
                    style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCbwVcq_isAiJKLzSeXvt0Y4fEKWkD7iNiLi2o6pdfpqbpUfEPpwyT6q-W9APvt0zsnHajTp7Sc9Ow5J8yDX1m4Qf9o-eQcIsOXgsUbbBAN6WIK-lnT0Tlss2Vg6FTunp9APLtJtEu2N3VC9eYleoys-dsYF5dglHiCfFWJ03wrz7mIOAAxVjbnbpNTD8mVhFnAN7BasKFGdJsQhh8qbheoaAe_VSRHwuH4a9Roi6IiZc8EzbmDEkusjG0U_GaC9C81ReUaS6jHlJM')" }}
                  />
                  {/* AI Analysis Overlays */}
                  <div className="absolute top-[22%] left-[32%] w-[38%] h-[28%] border-2 border-cyan-400 rounded flex flex-col justify-end p-1 bg-cyan-500/10 group cursor-crosshair">
                    <span className="bg-cyan-500 text-slate-950 font-black font-tech-code text-[9px] px-1.5 py-0.5 rounded inline-block self-start -mt-4 mb-auto shadow-sm">
                      Geometry Match: 98%
                    </span>
                  </div>
                  <div className="absolute top-[60%] right-[20%] w-[25%] h-[20%] border-2 border-red-500 rounded flex flex-col justify-end p-1 bg-red-500/10 animate-pulse">
                    <span className="bg-red-500 text-white font-black text-[9px] px-1.5 py-0.5 rounded inline-block self-start -mt-4 mb-auto shadow-sm">
                      Micro-fracture
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* Status Log (Console) */}
            <div className="h-36 bg-[#040812] text-cyan-400 font-tech-code text-[11px] p-4 overflow-y-auto border-t border-slate-800/80 relative">
              <div className="flex flex-col gap-1.5">
                <div><span className="text-slate-500">14:02:41 //</span> INIT SCAN: Part ID XR-992-B</div>
                <div><span className="text-slate-500">14:02:42 //</span> ALIGNMENT: Searching for fiducial markers... <span className="text-emerald-400">[OK]</span></div>
                <div><span className="text-slate-500">14:02:43 //</span> OCR EXTR: SN parsed as '882-AB-99' (Confidence: 87%)</div>
                <div><span className="text-slate-500">14:02:44 //</span> STRUCTURAL CHECK: <span className="text-purple-400">Comparing mesh...</span></div>
                <div className="text-red-400 font-bold"><span className="text-slate-500 font-normal">14:02:45 //</span> ALERT: Deformation detected in Sector 4G. Delta &gt; 0.4mm.</div>
                <div className="flex items-center gap-2 pt-1">
                  <span className="w-2 h-2 bg-cyan-400 rounded-full animate-ping"></span> 
                  <span className="text-slate-200 font-bold">Awaiting operator intervention...</span>
                </div>
              </div>
            </div>

          </div>

          {/* Decorative Background Glow */}
          <div className="absolute -inset-4 bg-gradient-to-tr from-cyan-500/10 via-purple-500/10 to-blue-600/10 rounded-3xl -z-10 blur-2xl pointer-events-none" />
        </div>

      </main>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className="bg-[#070c18] border-t border-slate-800/80 mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-lg font-black tracking-tight text-slate-100 font-tech-code">
            VERIVISION-AI
          </div>
          
          <nav className="flex flex-wrap gap-6 items-center justify-center text-xs font-semibold text-slate-400">
            <a className="hover:text-cyan-400 transition-colors" href="#">Privacy Policy</a>
            <a className="hover:text-cyan-400 transition-colors" href="#">Terms of Service</a>
            <a className="hover:text-cyan-400 transition-colors" href="#">Security</a>
            <a className="hover:text-cyan-400 transition-colors" href="#">Contact Support</a>
            <a className="hover:text-cyan-400 transition-colors" href="#">Documentation</a>
          </nav>
          
          <div className="text-xs text-slate-500 text-center md:text-right">
            © 2026 VERIVISION-AI. All rights reserved. Precision Technical Systems Corp.
          </div>
        </div>
      </footer>

    </div>
  );
}
