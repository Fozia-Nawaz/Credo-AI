import { useEffect, useRef } from "react";
import { X, Globe, CalendarDays, Banknote, FileSearch, Activity } from "lucide-react";
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
  const fee = Number(item.application_fee) || 0;

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
        className="h-full w-full max-w-[600px] overflow-y-auto border-l border-slate-700 bg-navy-900 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-white">{item.title}</h2>
            {item.provider && <p className="text-sm text-slate-400">{item.provider}</p>}
            <div className="mt-2">
              <TrustBadge badge={item.badge} />
            </div>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <section className="mt-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Trust summary</h3>
          <p className="mt-2 rounded-lg bg-navy-800 p-3 text-sm text-slate-300">
            {MEANING[item.badge] || "No summary available."}
          </p>
        </section>

        <section className="mt-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Why this status?</h3>
          <p className="mt-2 rounded-lg bg-navy-800 p-3 text-sm text-slate-200">{item.audit_proof}</p>
        </section>

        <dl className="mt-5 space-y-3 text-sm">
          <div className="flex items-center gap-3">
            <Globe size={16} className="text-slate-400" />
            <dt className="w-28 text-slate-400">Domain</dt>
            <dd className="text-white">{item.domain}</dd>
          </div>
          <div className="flex items-center gap-3">
            <CalendarDays size={16} className="text-slate-400" />
            <dt className="w-28 text-slate-400">Deadline</dt>
            <dd className="text-white">{item.deadline === "N/A" ? "No deadline listed" : item.deadline}</dd>
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

        {Array.isArray(item.sources) && item.sources.length > 0 && (
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
                 {item.sources.map((s, i) => {
                    const src = typeof s === "string" ? { name: s } : s;
                      return (
                      <tr key={i} className="border-t border-slate-700">
                         <td className="py-1.5 pr-3 text-white">{src.name}</td>
                         <td className="py-1.5 pr-3 text-slate-200">{src.deadline || "-"}</td>
                         <td className="py-1.5">
                           {src.url ? (
                             <a href={src.url} target="_blank" rel="noreferrer" className="text-electric underline">open</a>
                           ) : (
                             "-"
                           )}
                         </td>
                      </tr>
                     );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {related.length > 0 && (
          <section className="mt-6">
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <Activity size={14} /> Verification activity
            </h3>
            <div className="mt-2 space-y-1.5 rounded-lg bg-navy-800 p-3 font-mono text-xs">
              {related.map((e, i) => (
                <p key={i} className="text-slate-300">
                  <span className="text-electric">[{e.stage.replace("_", " ")}]</span> {cleanMessage(e.message)}
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