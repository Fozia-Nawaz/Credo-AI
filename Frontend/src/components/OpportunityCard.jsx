import { Globe, CalendarDays, Banknote, ChevronRight } from "lucide-react";
import clsx from "clsx";
import TrustBadge from "./TrustBadge";

const BAR_COLOR = {
  VERIFIED: "bg-trust",
  CONFLICTING_DATES: "bg-warning",
  SCAM_REJECTED: "bg-scam",
};

export default function OpportunityCard({ item, onOpen }) {
  const fee = Number(item.application_fee) || 0;
  const excluded = item.badge === "SCAM_REJECTED";
  const score = Math.max(0, Math.min(100, Number(item.trust_score) || 0));

  return (
    <button
      type="button"
      onClick={() => onOpen?.(item)}
      className={clsx(
        "w-full rounded-xl border bg-navy-800 p-5 text-left transition hover:border-electric/60",
        excluded ? "border-scam/30" : "border-slate-700"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white">{item.title}</h3>
          {/* These show only if the backend sends them. */}
          {item.provider && <p className="text-sm text-slate-400">{item.provider}</p>}
        </div>
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
        {item.funding_amount && <span>Funding: {item.funding_amount}</span>}
      </div>

      <div className="mt-4">
        <div className="mb-1 flex justify-between text-xs text-slate-400">
          <span>Trust score</span>
          <span>{score}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-navy-900">
          <div className={clsx("h-2 rounded-full", BAR_COLOR[item.badge] || "bg-slate-400")} style={{ width: `${score}%` }} />
        </div>
      </div>

      <p className="mt-3 text-sm text-slate-400">{item.audit_proof}</p>

      <div className="mt-3 flex items-center justify-between">
        {excluded ? (
          <span className="text-xs font-semibold uppercase tracking-wide text-scam">Excluded from recommendations</span>
        ) : (
          <span />
        )}
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-electric">
          View evidence <ChevronRight size={16} />
        </span>
      </div>
    </button>
  );
}