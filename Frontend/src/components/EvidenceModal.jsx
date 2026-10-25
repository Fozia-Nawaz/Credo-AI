import { useEffect, useRef } from "react";
import { X, CheckCircle2, AlertTriangle, XCircle, Activity, ChevronRight } from "lucide-react";
import clsx from "clsx";
import TrustBadge from "./TrustBadge";
import { riskSignals } from "./AuditDetails";

const BANNER = {
  VERIFIED: {
    Icon: CheckCircle2,
    cls: "border-trust/40 bg-trust/10",
    iconCls: "text-trust",
    text: "Verified means the checked data matched the official provider record. It is not a guarantee that the listing is safe.",
  },
  CONFLICTING_DATES: {
    Icon: AlertTriangle,
    cls: "border-warning/40 bg-warning/10",
    iconCls: "text-warning",
    text: "Sources report different deadlines. The official provider record is treated as the authoritative reference for this comparison.",
  },
  SCAM_REJECTED: {
    Icon: XCircle,
    cls: "border-scam/40 bg-scam/10",
    iconCls: "text-scam",
    text: "A suspicious domain or a non-standard fee request was detected. This listing is excluded from recommendations.",
  },
};

function cleanMessage(text) {
  return text.replace(/^\[[A-Za-z _]+\]\s*/, "");
}

function deadlineText(d) {
  return !d || d === "N/A" ? "Not listed" : d;
}

// "15 days earlier" / "5 days later", or null if the dates can't be compared.
function dayDiff(officialDate, other) {
  const a = Date.parse(officialDate);
  const b = Date.parse(other);
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  const d = Math.round((b - a) / 86400000);
  if (d === 0) return null;
  const n = Math.abs(d);
  return `${n} day${n === 1 ? "" : "s"} ${d < 0 ? "earlier" : "later"}`;
}

function Field({ label, children, className }) {
  return (
    <div className="mt-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <div className={clsx("mt-0.5 text-sm text-slate-200", className)}>{children}</div>
    </div>
  );
}

export default function EvidenceModal({ item, official = null, events = [], onClose }) {
  const closeRef = useRef(null);

  useEffect(() => {
    if (!item) return;
    closeRef.current?.focus();
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [item, onClose]);

  if (!item) return null;

  const rec = item.official_record || {};
  const aggregators = Array.isArray(item.aggregator_matches) ? item.aggregator_matches : [];
  const scam = item.badge === "SCAM_REJECTED";
  const conflict = item.badge === "CONFLICTING_DATES";
  const banner = BANNER[item.badge];
  const fee = Number(item.application_fee) || 0;

  const officialDomain = rec.official_domain || (scam ? "" : item.domain) || "";
  const officialDeadline = rec.deadline || (scam ? "" : item.deadline) || "";
  const officialFee = rec.application_fee ?? (scam ? null : item.application_fee);

  const funding = item.funding_amount || item.funding;
  const match = typeof item.eligibility_match === "number" ? item.eligibility_match : null;

  const reasons = Array.isArray(item.conflict_details) ? item.conflict_details : [];
  const baseLines = reasons.length > 0 ? reasons : item.audit_proof ? [item.audit_proof] : [];
  const whyLines = scam ? [...baseLines, ...riskSignals(item, official)] : baseLines;

  // Real trace events that mention this listing.
  const related = events
    .filter(
      (e) =>
        e.message &&
        (e.message.includes(item.title) || (item.domain && e.message.includes(item.domain)))
    )
    .slice(-6);

  return (
    <div className="fixed inset-0 z-20 flex justify-end bg-black/50" onClick={onClose}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`Evidence for ${item.title}`}
        className="h-full w-full max-w-[720px] overflow-y-auto border-l border-slate-700 bg-navy-900 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <p className="flex flex-wrap items-center gap-1 text-xs text-slate-500">
            Opportunities <ChevronRight size={12} /> <span className="text-slate-300">{item.title}</span>{" "}
            <ChevronRight size={12} />{" "}
            <span className="text-slate-300">{scam ? "Evidence comparison" : "Verification details"}</span>
          </p>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg border border-slate-700 p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-2xl font-bold text-white">{item.title}</h2>
            {item.provider && <p className="mt-1 text-sm text-slate-400">{item.provider}</p>}
          </div>
          <TrustBadge badge={item.badge} />
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          {funding && (
            <span className="rounded-md border border-slate-700 bg-navy-800 px-2.5 py-1 text-slate-300">
              Funding: <span className="font-semibold text-white">{funding}</span>
            </span>
          )}
          {match !== null && (
            <span className="rounded-md border border-electric/30 bg-electric/10 px-2.5 py-1 text-electric">
              Eligibility match: <span className="font-semibold">{match}%</span>
            </span>
          )}
          {item.deadline && (
            <span className="rounded-md border border-slate-700 bg-navy-800 px-2.5 py-1 text-slate-300">
              Deadline: <span className="font-semibold text-white">{deadlineText(item.deadline)}</span>
            </span>
          )}
        </div>

        {banner && (
          <div className={clsx("mt-5 flex items-start gap-3 rounded-lg border p-3 text-sm text-slate-200", banner.cls)}>
            <banner.Icon size={18} className={clsx("mt-0.5 shrink-0", banner.iconCls)} />
            <p>{banner.text}</p>
          </div>
        )}

        {/* Side-by-side source comparison */}
        {!scam && (
          <section className="mt-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Source comparison (side by side)
            </h3>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-trust/40 bg-trust/5 p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">
                    Official provider record
                  </p>
                  <span className="rounded border border-trust/40 bg-trust/10 px-1.5 py-0.5 text-[10px] font-semibold text-trust">
                    Authoritative
                  </span>
                </div>
                <Field label="Source domain">
                  {officialDomain ? (
                    <a
                      href={`https://${officialDomain}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-white underline decoration-slate-600 hover:text-electric"
                    >
                      {officialDomain}
                    </a>
                  ) : (
                    "Not listed"
                  )}
                </Field>
                <Field label="Stated deadline" className="text-lg font-bold text-trust">
                  {deadlineText(officialDeadline)}
                </Field>
                <Field
                  label="Application fee"
                  className={Number(officialFee) > 0 ? "font-semibold text-scam" : undefined}
                >
                  {Number(officialFee) > 0 ? `$${officialFee}` : "No application fee listed"}
                </Field>
                {rec.min_cgpa != null && <Field label="Minimum CGPA">{rec.min_cgpa}</Field>}
                {rec.eligible_majors && <Field label="Eligible majors">{rec.eligible_majors}</Field>}
              </div>

              {aggregators.map((a, i) => {
                const differs = a.listed_deadline && officialDeadline && a.listed_deadline !== officialDeadline;
                const diff = differs ? dayDiff(officialDeadline, a.listed_deadline) : null;
                return (
                  <div key={i} className="rounded-xl border border-warning/40 bg-warning/5 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">
                        Aggregator listing
                      </p>
                      <span className="rounded border border-warning/40 bg-warning/10 px-1.5 py-0.5 text-[10px] font-semibold text-warning">
                        Secondary (unverified)
                      </span>
                    </div>
                    <Field label="Source domain" className="font-semibold text-warning">
                      {a.source_domain || a.source_portal || "Unknown"}
                    </Field>
                    <Field label="Stated deadline">
                      <span
                        className={clsx(
                          "text-lg font-bold",
                          differs ? "text-scam line-through" : "text-slate-200"
                        )}
                      >
                        {deadlineText(a.listed_deadline)}
                      </span>
                      {diff && (
                        <span className="ml-2 rounded border border-warning/40 bg-warning/10 px-1.5 py-0.5 align-middle text-[10px] font-semibold text-warning">
                          {diff}
                        </span>
                      )}
                      {differs && <p className="mt-1 text-xs text-slate-400">Deadline discrepancy in the records.</p>}
                    </Field>
                    <Field label="Application fee">No fee information in this record</Field>
                    {a.listed_min_cgpa != null && <Field label="Listed minimum CGPA">{a.listed_min_cgpa}</Field>}
                    {a.notes && <Field label="Note">{a.notes}</Field>}
                  </div>
                );
              })}
            </div>
            {aggregators.length === 0 && (
              <p className="mt-3 text-sm text-slate-400">
                {conflict
                  ? "This result is marked as conflicting dates, but the response did not include the per-source dates, so they can't be compared here."
                  : "No aggregator records were included with this result."}
              </p>
            )}
          </section>
        )}

        {/* Rejected listing: compare against the official record from the same run */}
        {scam && (
          <section className="mt-6 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Evidence comparison</h3>

            <div className="rounded-xl border border-trust/40 bg-trust/5 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">
                Official provider reference
              </p>
              {official ? (
                <>
                  <Field label="Matched official record">{official.title}</Field>
                  <Field label="Official domain">{official.domain}</Field>
                  <Field label="Application fee">
                    {Number(official.application_fee) > 0
                      ? `$${Number(official.application_fee)}`
                      : "No application fee listed"}
                  </Field>
                </>
              ) : (
                <p className="mt-2 text-sm text-slate-400">
                  No official record with the same scholarship ID was returned in this run.
                </p>
              )}
            </div>

            <div className="rounded-xl border border-scam/40 bg-scam/5 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">Suspicious listing</p>
              <Field label="Domain" className="font-semibold text-scam">
                {item.domain || "Unknown"}
              </Field>
              <Field label="Reported fee" className={fee > 0 ? "font-semibold text-scam" : undefined}>
                {fee > 0 ? `$${fee}` : "None listed"}
              </Field>
              <Field label="Deadline">{deadlineText(item.deadline)}</Field>
            </div>
          </section>
        )}

        {/* Why this status */}
        <section className="mt-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {scam ? "Why this listing was rejected" : "Why this status? (explainable trust analysis)"}
          </h3>
          <ul className="mt-2 space-y-2">
            {whyLines.length === 0 && (
              <li className="rounded-lg bg-navy-800 p-3 text-sm text-slate-400">No details were provided.</li>
            )}
            {whyLines.map((line, i) => (
              <li
                key={i}
                className="flex items-start gap-2 rounded-lg border border-slate-700 bg-navy-800 p-3 text-sm text-slate-200"
              >
                {scam ? (
                  <XCircle size={16} className="mt-0.5 shrink-0 text-scam" />
                ) : conflict ? (
                  <AlertTriangle size={16} className="mt-0.5 shrink-0 text-warning" />
                ) : (
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-trust" />
                )}
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </section>

        {related.length > 0 && (
          <section className="mt-6">
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <Activity size={14} /> Verification activity
            </h3>
            <div className="mt-2 space-y-1.5 rounded-lg border border-slate-700 bg-navy-800 p-3 font-mono text-xs">
              {related.map((e, i) => (
                <p key={i} className="text-slate-300">
                  <span className="text-electric">[{e.stage.replace(/_/g, " ")}]</span> {cleanMessage(e.message)}
                </p>
              ))}
            </div>
          </section>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-8 w-full rounded-lg bg-electric px-4 py-2.5 font-semibold text-white hover:bg-electric/90"
        >
          {scam ? "Back to audit" : "Back to opportunities"}
        </button>
      </aside>
    </div>
  );
}