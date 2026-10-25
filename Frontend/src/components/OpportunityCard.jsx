import { Globe, ChevronRight, CheckCircle2, AlertTriangle, XCircle, Banknote } from "lucide-react";
import clsx from "clsx";
import TrustBadge from "./TrustBadge";

const BAR_COLOR = {
  VERIFIED: "bg-trust",
  CONFLICTING_DATES: "bg-warning",
  SCAM_REJECTED: "bg-scam",
};

const TAG = {
  VERIFIED: { text: "Official criteria match", cls: "border-trust/30 bg-trust/10 text-trust" },
  CONFLICTING_DATES: { text: "Reconciliation discrepancy found", cls: "border-warning/30 bg-warning/10 text-warning" },
  SCAM_REJECTED: { text: "Suspicious listing flagged", cls: "border-scam/30 bg-scam/10 text-scam" },
};

const ACTION = {
  VERIFIED: "View evidence proofs & source registry",
  CONFLICTING_DATES: "View side-by-side comparison",
  SCAM_REJECTED: "View audit details",
};

function Field({ label, children, className }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] text-slate-400">{label}</p>
      <div className={clsx("mt-0.5 text-sm font-semibold text-white", className)}>{children}</div>
    </div>
  );
}

export default function OpportunityCard({ item, onOpen }) {
  const fee = Number(item.application_fee) || 0;
  const excluded = item.badge === "SCAM_REJECTED";
  const conflict = item.badge === "CONFLICTING_DATES";
  const verified = item.badge === "VERIFIED";
  const score = Math.max(0, Math.min(100, Number(item.trust_score) || 0));
  const match = typeof item.eligibility_match === "number" ? Math.max(0, Math.min(100, item.eligibility_match)) : null;
  const aggDeadline = item.aggregator_matches?.[0]?.listed_deadline;
  const deadline = item.deadline === "N/A" || !item.deadline ? "Not listed" : item.deadline;
  const funding = item.funding_amount || item.funding || "Not listed";
  const tag = TAG[item.badge];
  const id = item.scholarship_id || item.official_record?.scholarship_id;
  const conflictText =
    Array.isArray(item.conflict_details) && item.conflict_details.length > 0
      ? item.conflict_details[0]
      : item.audit_proof;

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
          <p className="flex flex-wrap items-center gap-2">
            {tag && (
              <span
                className={clsx(
                  "rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                  tag.cls
                )}
              >
                {tag.text}
              </span>
            )}
            {id && <span className="font-mono text-[11px] text-slate-500">ID: {id}</span>}
          </p>
          <h3 className="mt-2 text-lg font-semibold text-white">{item.title}</h3>
          {item.provider && <p className="text-sm text-slate-400">{item.provider}</p>}
        </div>
        <TrustBadge badge={item.badge} />
      </div>

      {!excluded && (
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
      )}

      {excluded && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-scam/30 bg-scam/10 p-3">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-scam">
              <Banknote size={12} /> Processing fee
            </p>
            <p className="mt-1 text-sm font-semibold text-white">
              {fee > 0 ? `USD ${fee} requested` : "No fee recorded"}
            </p>
          </div>
          <div className="rounded-lg border border-scam/30 bg-scam/10 p-3">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-scam">
              <Globe size={12} /> Flagged domain
            </p>
            <p className="mt-1 break-all text-sm font-semibold text-white">{item.domain || "Unknown"}</p>
          </div>
        </div>
      )}

      <div className="mt-4 space-y-3">
        <div>
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

        {match !== null && (
          <div>
            <div className="mb-1 flex justify-between text-xs text-slate-400">
              <span>Eligibility match</span>
              <span className="text-electric">{match}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-navy-900">
              <div className="h-1.5 rounded-full bg-electric" style={{ width: `${match}%` }} />
            </div>
          </div>
        )}
      </div>

      {verified && item.audit_proof && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-trust/30 bg-trust/10 p-3 text-sm text-slate-200">
          <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-trust" />
          <p>
            <span className="font-semibold text-trust">Reconciliation verdict: </span>
            {item.audit_proof}
          </p>
        </div>
      )}

      {conflict && conflictText && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-slate-200">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-warning" />
          <p>
            <span className="font-semibold text-warning">Reconciler warning: source mismatch. </span>
            {conflictText}
          </p>
        </div>
      )}

      {excluded && item.audit_proof && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-scam/30 bg-scam/10 p-3 text-sm text-slate-200">
          <XCircle size={16} className="mt-0.5 shrink-0 text-scam" />
          <p>
            <span className="font-semibold text-scam">Trust Critic: automatic exclusion. </span>
            {item.audit_proof}
          </p>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between">
        {excluded ? (
          <span className="text-xs font-semibold uppercase tracking-wide text-scam">Excluded from recommendations</span>
        ) : (
          <span />
        )}
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-electric">
          {ACTION[item.badge] || "View evidence"} <ChevronRight size={16} />
        </span>
      </div>
    </button>
  );
}