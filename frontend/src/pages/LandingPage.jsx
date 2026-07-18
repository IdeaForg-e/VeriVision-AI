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
} from "lucide-react";
import { ROUTES } from "../utils/constants.js";

const workflow = [
  { label: "Ingest", value: "Quality gate", icon: ScanSearch },
  { label: "Compare", value: "Golden reference", icon: FileSearch },
  { label: "Decide", value: "Fraud score", icon: Gauge },
  { label: "Report", value: "Audit-ready", icon: ClipboardCheck },
];

const metrics = [
  { label: "Visual detectors", value: "5" },
  { label: "Review actions", value: "3" },
  { label: "Pipeline mode", value: "Agentic" },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#f6f8fc] text-slate-950">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <Link to={ROUTES.LANDING} className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-slate-950 text-white shadow-sm">
            <Fingerprint size={22} />
          </div>
          <div>
            <p className="text-sm font-extrabold tracking-[0.18em] text-slate-950">VERIVISION-AI</p>
            <p className="text-xs font-medium text-slate-500">Parts fraud inspection workspace</p>
          </div>
        </Link>
        <Link
          to={`${ROUTES.LOGIN}?role=user`}
          className="hidden items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 sm:inline-flex"
        >
          Open workspace
          <ArrowRight size={16} />
        </Link>
      </header>

      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-5 pb-16 pt-8 sm:px-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:pb-24 lg:pt-14">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm">
            <ShieldCheck size={15} className="text-blue-700" />
            Computer vision + human review for repair supply chains
          </div>

          <h1 className="max-w-4xl text-4xl font-extrabold leading-[1.04] tracking-normal text-slate-950 sm:text-5xl lg:text-6xl">
            VERIVISION-AI
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
            A focused inspection console for comparing returned parts against golden references,
            scoring fraud risk, and producing reviewer-ready evidence.
          </p>

          <div className="mt-8 grid gap-3 sm:max-w-xl sm:grid-cols-2">
            <Link
              to={`${ROUTES.LOGIN}?role=admin`}
              className="group flex min-h-[68px] items-center justify-between rounded-lg bg-slate-950 px-5 py-4 text-white shadow-lg shadow-slate-950/10 transition hover:bg-slate-800"
            >
              <span>
                <span className="block text-sm font-bold">Login as Admin</span>
                <span className="mt-1 block text-xs text-slate-300">Full triage and tuning access</span>
              </span>
              <ArrowRight size={19} className="transition group-hover:translate-x-0.5" />
            </Link>
            <Link
              to={`${ROUTES.LOGIN}?role=user`}
              className="group flex min-h-[68px] items-center justify-between rounded-lg border border-slate-300 bg-white px-5 py-4 text-slate-900 shadow-sm transition hover:border-blue-300 hover:bg-blue-50/50"
            >
              <span>
                <span className="block text-sm font-bold">Login as User</span>
                <span className="mt-1 block text-xs text-slate-500">Operator review workspace</span>
              </span>
              <ArrowRight size={19} className="text-blue-700 transition group-hover:translate-x-0.5" />
            </Link>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-slate-600">
            <span>New to the workspace?</span>
            <Link to={`${ROUTES.LOGIN}?mode=signup`} className="font-semibold text-blue-700 hover:text-blue-900">
              Create an operator account
            </Link>
          </div>
        </div>

        <div className="relative">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-900/10">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Live case</p>
                <p className="mt-1 text-lg font-bold text-slate-950">XPS-LABEL-03 inspection</p>
              </div>
              <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700">92 risk</span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="aspect-[4/3] rounded-lg border border-slate-200 bg-[linear-gradient(135deg,#e7edf7,#ffffff)] p-3">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Golden</span>
                  <BadgeCheck size={16} className="text-emerald-600" />
                </div>
                <div className="h-8 rounded bg-slate-950" />
                <div className="mt-3 h-3 w-3/4 rounded bg-slate-300" />
                <div className="mt-2 h-3 w-1/2 rounded bg-slate-200" />
                <div className="mt-6 h-10 rounded border border-dashed border-slate-300 bg-white" />
              </div>
              <div className="aspect-[4/3] rounded-lg border border-red-200 bg-[linear-gradient(135deg,#fff1f2,#ffffff)] p-3">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Uploaded</span>
                  <ScanSearch size={16} className="text-red-600" />
                </div>
                <div className="h-8 rounded bg-slate-950" />
                <div className="mt-3 h-3 w-2/3 rounded bg-slate-300" />
                <div className="mt-2 h-3 w-1/3 rounded bg-slate-200" />
                <div className="mt-6 h-10 rounded border-2 border-red-500 bg-red-100/60" />
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-4">
              {workflow.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <Icon size={18} className="text-blue-700" />
                    <p className="mt-3 text-sm font-bold text-slate-900">{item.label}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.value}</p>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3 border-t border-slate-200 pt-4">
              {metrics.map((item) => (
                <div key={item.label}>
                  <p className="text-xl font-extrabold text-slate-950">{item.value}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <BrainCircuit size={20} className="text-blue-700" />
              <p className="mt-3 text-sm font-bold">Explainable decisions</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">SSIM, OCR, template, keypoint, and color cues stay visible to reviewers.</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <LockKeyhole size={20} className="text-blue-700" />
              <p className="mt-3 text-sm font-bold">Audit trail first</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">Every override and final decision is shaped for compliance review.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
