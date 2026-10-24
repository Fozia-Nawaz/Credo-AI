import { ShieldCheck } from "lucide-react";
import clsx from "clsx";

const STATUS = {
  idle: { label: "Ready", className: "bg-slate-500/20 text-slate-300" },
  running: { label: "Agents working", className: "bg-electric/20 text-electric animate-pulse" },
  done: { label: "Complete", className: "bg-trust/20 text-trust" },
  error: { label: "Error", className: "bg-scam/20 text-scam" },
};

export default function Navbar({ status }) {
  const s = STATUS[status] || STATUS.idle;
  return (
    <header className="sticky top-0 z-10 border-b border-slate-700 bg-navy-900/95 backdrop-blur">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-navy-800">
            <ShieldCheck className="text-electric" size={22} />
          </div>
          <div className="leading-tight">
            <p className="text-lg font-bold text-white">
              Credo <span className="text-electric">AI</span>
            </p>
            <p className="text-xs text-slate-400">The Explainable Trust Engine</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-slate-400 sm:block">Team Dynasty</span>
          <span className={clsx("rounded-full px-3 py-1 text-xs font-semibold", s.className)}>
            {s.label}
          </span>
        </div>
      </div>
    </header>
  );
}