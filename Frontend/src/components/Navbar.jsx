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
    <header className="sticky top-0 z-10 border-b border-white/10 bg-navy-900/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="text-trust" size={24} />
          <span className="text-lg font-bold text-white">Credo AI</span>
          <span className="text-sm text-slate-400">by Team Dynasty</span>
        </div>
        <span className={clsx("rounded-full px-3 py-1 text-xs font-semibold", s.className)}>
          {s.label}
        </span>
      </div>
    </header>
  );
}