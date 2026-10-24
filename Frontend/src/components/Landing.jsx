import { Search, Layers, FileSearch, ArrowRight } from "lucide-react";
import TrustBadge from "./TrustBadge";

const STEPS = [
  {
    Icon: Search,
    title: "Match your profile",
    text: "Share your CGPA, field of study and degree level. Credo AI turns them into search criteria.",
  },
  {
    Icon: Layers,
    title: "Reconcile sources",
    text: "Official provider records, aggregator listings and risk lists are compared side by side.",
  },
  {
    Icon: FileSearch,
    title: "Review the evidence",
    text: "Every result shows why it was trusted, questioned or excluded.",
  },
];

const BADGES = [
  { badge: "VERIFIED", text: "Matched to an official provider record." },
  { badge: "CONFLICTING_DATES", text: "Sources disagree. The official record is shown as the reference." },
  { badge: "SCAM_REJECTED", text: "A suspicious domain or non-standard fee was detected. Excluded from recommendations." },
];

export default function Landing({ onStart }) {
  return (
    <div className="space-y-16">
      <section className="grid items-center gap-10 lg:grid-cols-2">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-electric">
            Multi-agent scholarship verification
          </p>
          <h1 className="mt-3 text-4xl font-bold leading-tight text-white md:text-5xl">
            Find opportunities you can trust.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-slate-400">
            Credo AI cross-checks scholarship listings, deadlines, and fee requests against source records, then
            shows you why each result is trusted.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={onStart}
              className="inline-flex items-center gap-2 rounded-lg bg-electric px-6 py-3 font-semibold text-white shadow-lg shadow-electric/30 hover:bg-electric/90"
            >
              Start discovery <ArrowRight size={18} />
            </button>
            <a href="#how-it-works" className="text-sm font-semibold text-slate-300 underline-offset-4 hover:underline">
              See how verification works
            </a>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-700 bg-navy-800 p-6">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">What the trust labels mean</p>
          <div className="space-y-4">
            {BADGES.map((b) => (
              <div key={b.badge} className="flex items-start gap-3">
                <div className="shrink-0">
                  <TrustBadge badge={b.badge} />
                </div>
                <p className="text-sm text-slate-300">{b.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works">
        <h2 className="text-2xl font-bold text-white">Three steps to verifiable opportunities</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {STEPS.map(({ Icon, title, text }, i) => (
            <div key={title} className="rounded-xl border border-slate-700 bg-navy-800 p-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-electric/15 text-electric">
                <Icon size={20} />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Step {i + 1}</p>
              <h3 className="mt-1 text-lg font-semibold text-white">{title}</h3>
              <p className="mt-2 text-sm text-slate-400">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <p className="text-center text-sm text-slate-500">
        Official records · Cross-source checks · Evidence you can review
      </p>
    </div>
  );
}