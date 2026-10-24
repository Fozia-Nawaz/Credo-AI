import { Globe, CalendarDays, Banknote } from "lucide-react";
import clsx from "clsx";
import TrustBadge from "./TrustBadge";

const BAR_COLOR = {
  VERIFIED: "bg-trust",
  CONFLICTING_DATES: "bg-warning",
  SCAM_REJECTED: "bg-scam",
};

export default function OpportunityCard({ item, onOpen }) {
  const fee = Number(item.application_fee) || 0;

  return (
    <button
      type="button"
      onClick={() => onOpen?.(item)}
      className="w-full rounded-xl border border-white/10 bg-navy-800 p-5 text-left transition hover:border-electric/60"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold text-white">{item.title}</h3>
        <TrustBadge badge={item.badge} />
      </div>

      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-300">
        <span className="inline-flex items-center gap-1.5">
          <Globe size={14} /> {item.domain}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays size={14} /> {item.deadline === "N/A" ? "No deadline listed" : item.deadline}
        </span>
        <span className={clsx("inline-flex items-center gap-1.5", fee > 0 && "text-scam")}>
          <Banknote size={14} /> {fee > 0 ? `Fee requested: $${fee}` : "No fee"}
        </span>
      </div>

      <div className="mt-4">
        <div className="mb-1 flex justify-between text-xs text-slate-400">
          <span>Trust score</span>
          <span>{item.trust_score}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-navy-900">
          <div
            className={clsx("h-2 rounded-full", BAR_COLOR[item.badge] || "bg-slate-400")}
            style={{ width: `${Math.max(0, Math.min(100, item.trust_score))}%` }}
          />
        </div>
      </div>

      <p className="mt-3 text-sm text-slate-400">{item.audit_proof}</p>
    </button>
  );
}