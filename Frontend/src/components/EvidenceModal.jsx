import { useEffect, useRef } from "react";
import {
  X,
  Globe,
  CalendarDays,
  Banknote,
  FileSearch,
  Activity,
  ShieldCheck,
  ListFilter,
  XCircle,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import clsx from "clsx";
import TrustBadge from "./TrustBadge";

const MEANING = {
  VERIFIED:
    "Matched to an official provider record. This means the checked data agreed, not that the listing is guaranteed safe.",
  CONFLICTING_DATES:
    "Sources disagree on a date. The official provider record is shown as the authoritative one.",
  SCAM_REJECTED:
    "A suspicious domain or a non-standard fee request was detected. This listing is excluded from recommendations.",
};

function cleanMessage(text) {
  return text.replace(/^\[[A-Za-z _]+\]\s*/, "");
}

function Row({ label, children, className }) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-sm">
      <span className="text-slate-400">{label}</span>
      <span className={clsx("text-right text-white", className)}>{children}</span>
    </div>
  );
}

export default function EvidenceModal({ item, events = [], onClose }) {
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
  const fee = Number(item.application_fee) || 0;

  const officialDomain = rec.official_domain || (scam ? "" : item.domain) || "";
  const officialDeadline = rec.deadline || (scam ? "" : item.deadline) || "";
  const officialFee = rec.application_fee ?? (scam ? null : item.application_fee);
  const deadlineText = (d) => (!d || d === "N/A" ? "Not listed" : d);

  const reasons = Array.isArray(item.conflict_details) ? item.conflict_details : [];
  const whyLines = reasons.length > 0 ? reasons : item.audit_proof ? [item.audit_proof] : [];

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
        className="h-full w-full max-w-[640px] overflow-y-auto border-l border-slate-700 bg-navy-900 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-1 text-xs text-slate-500">
              Opportunities <ChevronRight size={12} />
              <span className="max-w-[16rem] truncate">{item.title}</span> <ChevronRight size={12} />
              <span className="text-slate-300">Evidence comparison</span>
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white">{item.title}</h2>
            {item.provider && <p className="text-sm text-slate-400">{item.provider}</p>}
            <div className="mt-3">
              <TrustBadge badge={item.badge} />
            </div>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg border border-slate-700 p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <section className="mt-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Trust summary</h3>
          <p
            className={clsx(
              "mt-2 rounded-lg border p-3 text-sm",
              scam
                ? "border-scam/30 bg-scam/10 text-slate-200"
                : conflict
                ? "border-warning/30 bg-warning/10 text-slate-200"
                : "border-slate-700 bg-navy-800 text-slate-300"
            )}
          >
            {MEANING[item.badge] || "No summary available."}
          </p>
        </section>

        <p className="mt-5 text-sm text-slate-400">
          Compare the official provider record with the other sources the agents checked for this listing.
        </p>

        {/* Official provider reference */}
        {!scam && (
          <section className="mt-4 rounded-xl border border-trust/30 bg-navy-800 p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
              <ShieldCheck size={16} className="text-trust" /> Official provider reference
            </h3>
            <div className="mt-3 space-y-2">
              <Row label="Domain">
                {officialDomain ? (
                  <a
                    href={`https://${officialDomain}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-electric underline"
                  >
                    {officialDomain}
                  </a>
                ) : (
                  "Not listed"
                )}
              </Row>
              <Row label="Deadline">{deadlineText(officialDeadline)}</Row>
              <Row label="Application fee" className={Number(officialFee) > 0 ? "font-semibold text-scam" : undefined}>
                {Number(officialFee) > 0 ? `$${officialFee}` : "None listed"}
              </Row>
              {rec.min_cgpa != null && <Row label="Minimum CGPA">{rec.min_cgpa}</Row>}
              {rec.eligible_majors && <Row label="Eligible majors">{rec.eligible_majors}</Row>}
            </div>
          </section>
        )}

        {/* Aggregator listings */}
        {aggregators.map((a, i) => {
          const differs = officialDeadline && a.listed_deadline && a.listed_deadline !== officialDeadline;
          return (
            <section key={i} className="mt-4 rounded-xl border border-warning/30 bg-navy-800 p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
                <ListFilter size={16} className="text-warning" /> Aggregator listing
              </h3>
              <div className="mt-3 space-y-2">
                <Row label="Portal">{a.source_portal || "Unknown"}</Row>
                <Row label="Domain">{a.source_domain || "Unknown"}</Row>
                <Row label="Listed deadline" className={differs ? "font-semibold text-warning" : undefined}>
                  {deadlineText(a.listed_deadline)}
                </Row>
                {a.listed_min_cgpa != null && <Row label="Listed minimum CGPA">{a.listed_min_cgpa}</Row>}
              </div>
              {a.notes && <p className="mt-3 text-xs text-slate-400">{a.notes}</p>}
            </section>
          );
        })}

        {/* Suspicious listing (shows only when the backend sends scam items) */}
        {scam && (
          <section className="mt-4 rounded-xl border border-scam/30 bg-navy-800 p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
              <AlertTriangle size={16} className="text-scam" /> Suspicious listing
            </h3>
            <div className="mt-3 space-y-2">
              <Row label="Domain">{item.domain || "Unknown"}</Row>
              <Row label="Reported fee" className={fee > 0 ? "font-semibold text-scam" : undefined}>
                {fee > 0 ? `$${fee}` : "None listed"}
              </Row>
              <Row label="Deadline">{deadlineText(item.deadline)}</Row>
            </div>
          </section>
        )}

        {/* Why this status */}
        <section className="mt-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {scam ? "Why this listing was rejected" : "Why this status?"}
          </h3>
          <ul className="mt-2 space-y-2">
            {whyLines.length === 0 && (
              <li className="rounded-lg bg-navy-800 p-3 text-sm text-slate-400">No details were provided.</li>
            )}
            {whyLines.map((line, i) => (
              <li key={i} className="flex items-start gap-2 rounded-lg bg-navy-800 p-3 text-sm text-slate-200">
                {scam ? (
                  <XCircle size={16} className="mt-0.5 shrink-0 text-scam" />
                ) : conflict ? (
                  <AlertTriangle size={16} className="mt-0.5 shrink-0 text-warning" />
                ) : (
                  <ShieldCheck size={16} className="mt-0.5 shrink-0 text-trust" />
                )}
                <span>{line}</span>
              </li>
            ))}
          </ul>
          {scam && (
            <p className="mt-3 rounded-lg border border-scam/30 bg-scam/10 p-3 text-sm text-slate-200">
              Domain or fee checks were triggered. This listing is excluded from recommendations.
            </p>
          )}
        </section>

        {/* Source comparison table */}
        {(officialDeadline || aggregators.length > 0) && !scam && (
          <section className="mt-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Source comparison</h3>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-slate-400">
                  <tr>
                    <th className="py-1 pr-3">Source</th>
                    <th className="py-1 pr-3">Deadline</th>
                    <th className="py-1">Link</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-slate-700">
                    <td className="py-1.5 pr-3 text-white">Official portal</td>
                    <td className="py-1.5 pr-3 text-slate-200">{deadlineText(officialDeadline)}</td>
                    <td className="py-1.5">
                      {officialDomain ? (
                        <a
                          href={`https://${officialDomain}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-electric underline"
                        >
                          {officialDomain}
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                  {aggregators.map((a, i) => (
                    <tr key={i} className="border-t border-slate-700">
                      <td className="py-1.5 pr-3 text-white">{a.source_portal || "Aggregator"}</td>
                      <td
                        className={clsx(
                          "py-1.5 pr-3",
                          a.listed_deadline && a.listed_deadline !== officialDeadline
                            ? "font-semibold text-warning"
                            : "text-slate-200"
                        )}
                      >
                        {deadlineText(a.listed_deadline)}
                      </td>
                      <td className="py-1.5 text-slate-400">{a.source_domain || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <dl className="mt-6 space-y-3 text-sm">
          <div className="flex items-center gap-3">
            <Globe size={16} className="text-slate-400" />
            <dt className="w-28 text-slate-400">Domain</dt>
            <dd className="text-white">{item.domain}</dd>
          </div>
          <div className="flex items-center gap-3">
            <CalendarDays size={16} className="text-slate-400" />
            <dt className="w-28 text-slate-400">Deadline</dt>
            <dd className="text-white">{deadlineText(item.deadline)}</dd>
          </div>
          <div className="flex items-center gap-3">
            <Banknote size={16} className="text-slate-400" />
            <dt className="w-28 text-slate-400">Application fee</dt>
            <dd className={fee > 0 ? "font-semibold text-scam" : "text-white"}>
              {fee > 0 ? `$${fee} requested` : "None"}
            </dd>
          </div>
          <div className="flex items-center gap-3">
            <FileSearch size={16} className="text-slate-400" />
            <dt className="w-28 text-slate-400">Trust score</dt>
            <dd className="text-white">{item.trust_score}%</dd>
          </div>
        </dl>

        {related.length > 0 && (
          <section className="mt-6">
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <Activity size={14} /> Verification activity
            </h3>
            <div className="mt-2 space-y-1.5 rounded-lg bg-navy-800 p-3 font-mono text-xs">
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
          Back to opportunities
        </button>
      </aside>
    </div>
  );
}