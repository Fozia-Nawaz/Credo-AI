import { useEffect } from "react";
import { X, Globe, CalendarDays, Banknote, FileSearch } from "lucide-react";
import TrustBadge from "./TrustBadge";

// Plain-language meaning of each status (from the design blueprint).
const MEANING = {
  VERIFIED:
    "Matched to an official provider record. This means the checked data agreed, not that the listing is guaranteed safe.",
  CONFLICTING_DATES:
    "Sources disagree on a date. The official provider record is shown as the authoritative one.",
  SCAM_REJECTED:
    "A suspicious domain or a non-standard fee request was detected. This listing is excluded from recommendations.",
};

export default function EvidenceModal({ item, onClose }) {
  // Close with the Escape key.
  useEffect(() => {
    if (!item) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [item, onClose]);

  if (!item) return null;
  const fee = Number(item.application_fee) || 0;

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Evidence for ${item.title}`}
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-700 bg-navy-800 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-white">{item.title}</h2>
            <div className="mt-2">
              <TrustBadge badge={item.badge} />
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {MEANING[item.badge] && (
          <p className="mt-4 rounded-lg bg-navy-900 p-3 text-sm text-slate-300">{MEANING[item.badge]}</p>
        )}

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
            <dd className={fee > 0 ? "font-semibold text-scam" : "text-white"}>{fee > 0 ? `$${fee} requested` : "None"}</dd>
          </div>
          <div className="flex items-center gap-3">
            <FileSearch size={16} className="text-slate-400" />
            <dt className="w-28 text-slate-400">Trust score</dt>
            <dd className="text-white">{item.trust_score}%</dd>
          </div>
        </dl>

        <div className="mt-5 rounded-lg bg-navy-900 p-4">
          <p className="mb-1 text-xs uppercase tracking-wide text-slate-400">Why this status? (audit proof)</p>
          <p className="text-sm text-slate-200">{item.audit_proof}</p>
        </div>

        {Array.isArray(item.sources) && item.sources.length > 0 && (
          <div className="mt-5">
            <p className="mb-2 text-xs uppercase tracking-wide text-slate-400">Source comparison</p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-slate-400">
                  <tr>
                    <th className="py-1 pr-3">Source</th>
                    <th className="py-1 pr-3">Deadline</th>
                    <th className="py-1">Link</th>
                  </tr>
                </thead>
                <tbody>
                  {item.sources.map((s, i) => (
                    <tr key={i} className="border-t border-slate-700">
                      <td className="py-1.5 pr-3 text-white">{s.name}</td>
                      <td className="py-1.5 pr-3 text-slate-200">{s.deadline}</td>
                      <td className="py-1.5">
                        {s.url ? (
                          <a href={s.url} target="_blank" rel="noreferrer" className="text-electric underline">open</a>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <button type="button" onClick={onClose} className="mt-6 w-full rounded-lg bg-electric px-4 py-2 font-semibold text-white hover:bg-electric/90">
          Back to opportunities
        </button>
      </div>
    </div>
  );
}