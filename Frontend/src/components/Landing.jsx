import {
  Search,
  Layers,
  FileSearch,
  ArrowRight,
  Info,
  GraduationCap,
  ArrowLeftRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
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

const FEATURES = [
  { Icon: CheckCircle2, text: "Source comparison", color: "text-trust" },
  { Icon: ArrowLeftRight, text: "Cross-source checks", color: "text-electric" },
  { Icon: ShieldCheck, text: "Suspicious fee detection", color: "text-trust" },
];

const TRACE = [
  { tag: "PLANNER", color: "text-electric", text: "Profile parsed into search criteria." },
  { tag: "RECONCILER", color: "text-warning", text: "Official and aggregator deadlines differ." },
  { tag: "TRUST CRITIC", color: "text-scam", text: "Unusual processing fee flagged on a suspicious domain." },
  { tag: "REPORTER", color: "text-trust", text: "Results ranked by trust." },
];

function PreviewPanel() {
  return (
    <div className="space-y-4">
      <p className="text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        Illustrative example, not live data
      </p>

      <div className="rounded-2xl border border-slate-700 bg-navy-800 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy-900 text-electric">
              <GraduationCap size={20} />
            </span>
            <div>
              <p className="font-semibold text-white">Global Research Access Grant</p>
              <p className="text-xs text-slate-400">Example university</p>
            </div>
          </div>
          <TrustBadge badge="VERIFIED" />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 rounded-lg border border-slate-700/60 bg-navy-900 p-4">
          <div>
            <p className="text-[11px] text-slate-400">Funding</p>
            <p className="mt-0.5 text-sm font-semibold text-white">Full funding</p>
          </div>
          <div>
            <p className="text-[11px] text-slate-400">Deadline</p>
            <p className="mt-0.5 text-sm font-semibold text-white">28 Feb 2027</p>
          </div>
        </div>
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-xs text-slate-400">
            <span>Trust score</span>
            <span>100%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-navy-900">
            <div className="h-1.5 w-full rounded-full bg-trust" />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-700 bg-navy-800 p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            <ArrowLeftRight size={13} /> Source reconciliation
          </p>
          <span className="inline-flex items-center gap-1 rounded-md border border-warning/40 bg-warning/10 px-2 py-0.5 text-[10px] font-semibold text-warning">
            <AlertTriangle size={11} /> Conflicting dates
          </span>
        </div>
        <div className="space-y-2">
          <div className="rounded-lg border border-trust/30 bg-trust/10 p-3 text-xs">
            <div className="flex justify-between">
              <span className="font-semibold text-trust">Official provider</span>
              <span className="text-[10px] font-semibold text-trust">AUTHORITATIVE</span>
            </div>
            <p className="mt-1 text-slate-300">Deadline: 10 Mar 2027 · No application fee listed</p>
          </div>
          <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs">
            <div className="flex justify-between">
              <span className="font-semibold text-warning">Aggregator listing</span>
              <span className="text-[10px] font-semibold text-warning">SECONDARY</span>
            </div>
            <p className="mt-1 text-slate-300">
              Deadline: <span className="line-through">15 Mar 2027</span>
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-700 bg-navy-900 p-5 font-mono text-xs">
        <p className="mb-3 font-sans text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Example trust trace
        </p>
        <div className="space-y-1.5">
          {TRACE.map((t) => (
            <p key={t.tag} className="leading-5 text-slate-300">
              <span className={t.color}>[{t.tag}]</span> {t.text}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Landing({ onStart }) {
  return (
    <div className="space-y-16">
      <section className="grid items-center gap-10 lg:grid-cols-2">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-navy-800 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-300">
            <span className="h-1.5 w-1.5 rounded-full bg-trust" />
            Multi-agent scholarship verification
          </p>
          <h1 className="mt-5 text-4xl font-bold leading-tight text-white md:text-5xl">
            Find opportunities you can trust.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-slate-400">
            Credo AI cross-checks scholarship listings, deadlines and fee requests against source records, then
            shows you why each result is Verified, has Conflicting dates, or is Scam rejected.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onStart}
              className="inline-flex items-center gap-2 rounded-lg bg-electric px-6 py-3 font-semibold text-white shadow-lg shadow-electric/30 hover:bg-electric/90"
            >
              Start discovery <ArrowRight size={18} />
            </button>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-navy-800 px-5 py-3 text-sm font-semibold text-slate-200 hover:bg-navy-800/70"
            >
              <Info size={16} /> How verification works
            </a>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
            {FEATURES.map(({ Icon, text, color }) => (
              <span key={text} className="inline-flex items-center gap-2 text-xs text-slate-400">
                <Icon size={14} className={color} /> {text}
              </span>
            ))}
          </div>
        </div>

        <PreviewPanel />
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

      <section className="rounded-2xl border border-slate-700 bg-navy-800 p-6">
        <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">What the trust labels mean</p>
        <div className="grid gap-4 md:grid-cols-3">
          {BADGES.map((b) => (
            <div key={b.badge} className="space-y-2">
              <TrustBadge badge={b.badge} />
              <p className="text-sm text-slate-300">{b.text}</p>
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