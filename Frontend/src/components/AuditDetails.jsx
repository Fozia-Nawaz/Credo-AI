import { ChevronRight, ArrowLeft, ShieldAlert, Banknote, Globe, FileSearch } from "lucide-react";
import TrustBadge from "./TrustBadge";

// Risk signals that can be proven from the data in this run.
export function riskSignals(item, official) {
  const out = [];
  const fee = Number(item.application_fee) || 0;
  if (official && official.domain && item.domain && official.domain !== item.domain) {
    out.push(
      `The listing domain ${item.domain} differs from the official domain ${official.domain} for the same scholarship ID (${item.scholarship_id}).`
    );
  }
  if (fee > 0) {
    if (official && Number(official.application_fee) === 0) {
      out.push(`A $${fee} fee is requested, but the official record for ${official.title} lists no application fee.`);
    } else {
      out.push(`A $${fee} processing fee is requested on this listing.`);
    }
  }
  return out;
}

function cleanMessage(text) {
  return text.replace(/^\[[A-Za-z _]+\]\s*/, "");
}

function formatTime(ms) {
  return ms ? new Date(ms).toLocaleTimeString("en-GB") : "";
}

function Signal({ Icon, title, children }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-700 bg-navy-900 p-4">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-scam/10 text-scam">
        <Icon size={16} />
      </span>
      <div className="min-w-0">
        <p className="font-semibold text-white">{title}</p>
        <div className="mt-1 text-sm text-slate-400">{children}</div>
      </div>
    </div>
  );
}

export default function AuditDetails({ item, official, officialDomains = [], events = [], onBack, onCompare }) {
  const fee = Number(item.application_fee) || 0;
  const others = officialDomains.filter((d) => d && d !== item.domain);
  const related = events.filter(
    (e) => e.message && (e.message.includes(item.title) || (item.domain && e.message.includes(item.domain)))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex flex-wrap items-center gap-1 text-xs text-slate-500">
          Opportunities <ChevronRight size={12} /> <span className="text-slate-300">{item.title}</span>{" "}
          <ChevronRight size={12} /> <span className="text-slate-300">Audit details</span>
        </p>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft size={14} /> Return to opportunities
        </button>
      </div>

      <section className="rounded-2xl border border-slate-700 bg-navy-800 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-scam/40 bg-scam/10 text-scam">
              <ShieldAlert size={26} />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-bold text-white">Listing rejected</h1>
                <TrustBadge badge="SCAM_REJECTED" />
                <span className="rounded border border-slate-700 bg-navy-900 px-2 py-0.5 text-[11px] text-slate-400">
                  Demo data — illustrative only
                </span>
              </div>
              <p className="mt-2 max-w-2xl text-slate-400">
                “{item.title}” matched the configured domain and fee risk checks, so it is excluded from
                recommendations. This is an automated check on sample data, not a finding of real-world fraud.
              </p>
            </div>
          </div>
          <div className="rounded-lg border border-scam/30 bg-scam/10 px-4 py-3 text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Outcome</p>
            <p className="mt-1 text-sm font-semibold text-scam">Rejected &amp; excluded</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="rounded-2xl border border-slate-700 bg-navy-800 p-6 lg:col-span-7">
          <h2 className="text-xl font-bold text-white">Why it was flagged</h2>
          <p className="mt-1 text-sm text-slate-400">
            Target: <span className="text-white">{item.title}</span> ·{" "}
            <span className="font-mono">{item.domain || "unknown domain"}</span>
          </p>

          <div className="mt-4 space-y-3">
            <Signal Icon={Globe} title={`Flagged domain: ${item.domain || "Unknown"}`}>
              {others.length > 0
                ? `This domain is not one of the official provider domains returned in this run (${others.join(", ")}).`
                : "This domain is marked as suspicious in the unverified-listing records."}
            </Signal>

            {fee > 0 && (
              <Signal Icon={Banknote} title={`Processing fee requested: USD ${fee}`}>
                {official && Number(official.application_fee) === 0
                  ? `The official record for ${official.title} lists no application fee.`
                  : "A processing fee on a scholarship application is a risk signal in the configured checks."}
              </Signal>
            )}

            {official && (
              <div className="flex items-start gap-3 rounded-xl border border-electric/30 bg-electric/10 p-4">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-electric/15 text-electric">
                  <FileSearch size={16} />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-electric">
                    Official reference
                  </p>
                  <p className="mt-1 text-sm text-slate-200">
                    {official.title} ({official.domain}) · deadline {official.deadline || "not listed"} ·{" "}
                    {Number(official.application_fee) > 0
                      ? `application fee $${Number(official.application_fee)}`
                      : "no application fee listed"}
                    .
                  </p>
                </div>
              </div>
            )}

            <div className="rounded-xl border border-scam/30 bg-scam/10 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-scam">Recorded reason</p>
              <p className="mt-1 text-sm text-slate-200">{item.audit_proof || "No reason was provided."}</p>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-700 bg-navy-900 p-4 text-sm">
              <span className="text-slate-300">Outcome: rejected and excluded from recommendations.</span>
              <span className="rounded border border-scam/40 bg-scam/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-scam">
                Excluded
              </span>
            </div>
          </div>
        </section>

        <aside className="lg:col-span-5">
          <div className="overflow-hidden rounded-2xl border border-slate-700 bg-navy-900">
            <div className="flex items-center gap-3 border-b border-slate-700 bg-navy-800 px-4 py-2.5">
              <span className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-scam" />
                <span className="h-2.5 w-2.5 rounded-full bg-warning" />
                <span className="h-2.5 w-2.5 rounded-full bg-trust" />
              </span>
              <h2 className="text-xs font-semibold text-white">Verification trace</h2>
              <span className="ml-auto text-[11px] font-semibold text-scam">REJECTED</span>
            </div>
            <div className="space-y-2 p-4 font-mono text-xs">
              {related.length === 0 && <p className="text-slate-500">No trace lines mention this listing.</p>}
              {related.map((e, i) => (
                <p key={i} className="leading-5 text-slate-300">
                  <span className="text-slate-500">{formatTime(e.receivedAt)}</span>{" "}
                  <span className="text-scam">[{e.stage.replace(/_/g, " ")}]</span> {cleanMessage(e.message)}
                </p>
              ))}
            </div>
          </div>
        </aside>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg bg-electric px-5 py-2.5 font-semibold text-white hover:bg-electric/90"
        >
          Back to opportunities
        </button>
        <button
          type="button"
          onClick={onCompare}
          className="rounded-lg border border-slate-700 bg-navy-800 px-5 py-2.5 font-semibold text-white hover:bg-navy-800/70"
        >
          View evidence comparison
        </button>
      </div>
    </div>
  );
}