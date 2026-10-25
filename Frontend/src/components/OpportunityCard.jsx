import { Globe, ChevronRight } from "lucide-react";
import clsx from "clsx";
import TrustBadge from "./TrustBadge";

const BAR_COLOR = {
  VERIFIED: "bg-trust",
  CONFLICTING_DATES: "bg-warning",
  SCAM_REJECTED: "bg-scam",
};

function Field({ label, children, className }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] text-slate-400">{label}</p>
      <div className={clsx("mt-0.5 text-sm font-semibold text-white", className)}>{children}</div>
    </div>
  );
}

export default function OpportunityCard({ item, index = 0, onOpen }) {
  const fee = Number(item.application_fee) || 0;
  const excluded = item.badge === "SCAM_REJECTED";
  const conflict = item.badge === "CONFLICTING_DATES";
  const score = Math.max(0, Math.min(100, Number(item.trust_score) || 0));
  const aggDeadline = item.aggregator_matches?.[0]?.listed_deadline;
  const deadline = item.deadline === "N/A" || !item.deadline ? "Not listed" : item.deadline;
  const funding = item.funding_amount || item.funding || "Not listed";

  return (
    <button
      type="button"
      onClick={() => onOpen?.(item)}
      className={clsx(
        "w-full rounded-xl border bg-navy-800 p-5 text-left transition hover:border-electric/60",
        excluded ? "border-scam/30" : conflict ? "border-warning/30" : "border-slate-700"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Candidate #{String(index + 1).padStart(2, "0")}
            {conflict && <span className="ml-2 normal-case text-warning">· Aggregator discrepancy</span>}
          </p>
          <h3 className="mt-1 text-lg font-semibold text-white">{item.title}</h3>
          {item.provider && <p className="text-sm text-slate-400">{item.provider}</p>}
        </div>
        <TrustBadge badge={item.badge} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 rounded-lg border border-slate-700/60 bg-navy-900 p-4 sm:grid-cols-4">
        <Field label="Funding">{funding}</Field>
        <Field label={conflict ? "Official deadline" : "Deadline"} className={conflict ? "text-warning" : undefined}>
          <span className="block">{deadline}</span>
          {conflict && aggDeadline && (
            <span className="block text-xs font-normal text-slate-500 line-through">{aggDeadline}</span>
          )}
        </Field>
        <Field label="Source">
          <span className="inline-flex items-center gap-1.5 break-all text-trust">
            <Globe size={13} className="shrink-0" /> {item.domain || "Unknown"}
          </span>
        </Field>
        <Field label="Application fee" className={fee > 0 ? "text-scam" : "text-trust"}>
          {fee > 0 ? `$${fee} requested` : "None listed"}
        </Field>
      </div>

      <div className="mt-4">
        <div className="mb-1 flex justify-between text-xs text-slate-400">
          <span>Trust score</span>
          <span>{score}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-navy-900">
          <div
            className={clsx("h-1.5 rounded-full", BAR_COLOR[item.badge] || "bg-slate-400")}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      <p className={clsx("mt-3 text-sm", conflict ? "text-warning" : "text-slate-400")}>{item.audit_proof}</p>

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