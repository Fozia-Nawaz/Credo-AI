import { useEffect, useMemo, useRef, useState } from "react";
import { Pencil, RefreshCw, Search } from "lucide-react";
import clsx from "clsx";
import { runVerification } from "./services/api";
import Navbar from "./components/Navbar";
import Landing from "./components/Landing";
import StudentForm from "./components/StudentForm";
import OpportunityCard from "./components/OpportunityCard";
import LiveLogTerminal from "./components/LiveLogTerminal";
import PipelineProgress from "./components/PipelineProgress";
import EvidenceModal from "./components/EvidenceModal";

const STATUS_OPTIONS = [
  { value: "ALL", label: "All statuses" },
  { value: "VERIFIED", label: "Verified" },
  { value: "CONFLICTING_DATES", label: "Conflicting dates" },
  { value: "SCAM_REJECTED", label: "Scam rejected" },
];

const controlClass =
  "rounded-lg border border-slate-700 bg-navy-800 px-3 py-2 text-sm text-white focus:border-electric focus:outline-none";

function deadlineTime(value) {
  const t = Date.parse(value);
  return Number.isNaN(t) ? Number.POSITIVE_INFINITY : t;
}

function Stat({ label, value, tone }) {
  const tones = { default: "text-white", warning: "text-warning", scam: "text-scam", trust: "text-trust" };
  return (
    <div className="min-w-[8.5rem] rounded-lg border border-slate-700 bg-navy-800 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <p className={clsx("mt-1 text-2xl font-bold", tones[tone] || tones.default)}>{value}</p>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState("landing"); // landing | form | dashboard
  const [status, setStatus] = useState("idle"); // idle | running | done | error
  const [events, setEvents] = useState([]);
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [profile, setProfile] = useState(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("trust");
  const stopRef = useRef(() => {});

  // Stop any open stream when the page closes.
  useEffect(() => () => stopRef.current(), []);

  function handleSubmit(p) {
    stopRef.current(); // stop a previous run, if any
    setProfile(p);
    setView("dashboard");
    setEvents([]);
    setResults([]);
    setError("");
    setSelected(null);
    setQuery("");
    setStatusFilter("ALL");
    setStatus("running");

    stopRef.current = runVerification(
      p,
      (event) => {
        setEvents((prev) => [...prev, { ...event, receivedAt: Date.now() }]);
        if (event.stage === "COMPLETE") {
          setResults(event.final_data?.results ?? []);
          setStatus("done");
        }
      },
      (err) => {
        stopRef.current();
        setError(err.message);
        setStatus("error");
      }
    );
  }

  function handleRetry() {
    if (profile) handleSubmit(profile);
  }

  function goHome() {
    if (status === "running") return; // don't interrupt a running search
    setView("landing");
  }

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = results.filter(
      (r) =>
        (statusFilter === "ALL" || r.badge === statusFilter) &&
        (!q || r.title.toLowerCase().includes(q) || (r.domain || "").toLowerCase().includes(q))
    );
    return [...list].sort((a, b) =>
      sortBy === "deadline"
        ? deadlineTime(a.deadline) - deadlineTime(b.deadline)
        : b.trust_score - a.trust_score
    );
  }, [results, query, statusFilter, sortBy]);

  const running = status === "running";
  const done = status === "done";
  const verified = results.filter((r) => r.badge === "VERIFIED").length;
  const conflicts = results.filter((r) => r.badge === "CONFLICTING_DATES").length;
  const rejected = results.filter((r) => r.badge === "SCAM_REJECTED").length;
  const trusted = visible.filter((item) => item.badge !== "SCAM_REJECTED");
  const excluded = visible.filter((item) => item.badge === "SCAM_REJECTED");
  const runId = events.find((e) => e.run_id)?.run_id;

  const headline = running
    ? "Finding and checking opportunities"
    : done
    ? "Verification complete"
    : status === "error"
    ? "Verification stopped"
    : "Your verified opportunities";

  const subline = running
    ? "Agents are finding scholarships, comparing sources and auditing fees. Every step appears in the trace."
    : done
    ? "Review each opportunity, its trust status and the evidence behind it."
    : "Matches checked against official records, with the evidence behind every trust status.";

  return (
    <div className="min-h-screen bg-navy-900 text-slate-200">
      <Navbar status={status} onHome={goHome} />

      <main className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        {view === "landing" && <Landing onStart={() => setView("form")} />}

        {view === "form" && (
          <div className="mx-auto max-w-2xl space-y-6">
            <div className="text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-electric/30 bg-electric/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-electric">
                Step 01 of discovery · Profile normalization
              </span>
              <h1 className="mt-4 text-3xl font-bold text-white">Build your student profile</h1>
              <p className="mx-auto mt-2 max-w-md text-slate-400">
                Tell us about your academic background and funding needs to find relevant opportunities.
              </p>
            </div>
            <StudentForm onSubmit={handleSubmit} disabled={status === "running"} />
          </div>
        )}

        {view === "dashboard" && (
          <>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  {profile && (
                    <span className="rounded-full border border-slate-700 bg-navy-800 px-3 py-1 text-xs text-slate-300">
                      Profile: {profile.target_degree} · {profile.major} · CGPA {profile.cgpa}
                    </span>
                  )}
                  {runId && (
                    <span className="rounded-full border border-slate-700 bg-navy-800 px-3 py-1 font-mono text-xs text-electric">
                      Run {runId.slice(0, 8)}
                    </span>
                  )}
                </div>
                <h1 className="mt-3 text-3xl font-bold text-white">{headline}</h1>
                <p className="mt-1 max-w-xl text-slate-400">{subline}</p>
                <span
                  className={clsx(
                    "mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
                    running && "border-electric/40 bg-electric/10 text-electric",
                    done && "border-trust/40 bg-trust/10 text-trust",
                    status === "error" && "border-scam/40 bg-scam/10 text-scam"
                  )}
                >
                  <span className={clsx("h-1.5 w-1.5 rounded-full bg-current", running && "animate-pulse")} />
                  {running ? "Verification in progress" : done ? "All agent phases complete" : "Stopped"}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Stat label="Candidates found" value={done ? results.length : "–"} />
                <Stat label="Discrepancy" value={done ? conflicts : "–"} tone="warning" />
                <Stat label="Scam quarantine" value={done ? rejected : "–"} tone="scam" />
                <button
                  type="button"
                  onClick={() => setView("form")}
                  disabled={running}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800 disabled:opacity-50"
                >
                  <Pencil size={16} />
                  Update profile
                </button>
              </div>
            </div>

            {status === "error" && (
              <div
                role="alert"
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-scam/40 bg-scam/10 p-4"
              >
                <p className="text-scam">{error}</p>
                <button
                  type="button"
                  onClick={handleRetry}
                  className="inline-flex items-center gap-2 rounded-lg bg-scam/20 px-4 py-2 text-sm font-semibold text-scam hover:bg-scam/30"
                >
                  <RefreshCw size={16} />
                  Try again
                </button>
              </div>
            )}

            {done && (
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative min-w-[16rem] flex-1">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search scholarships or providers"
                    className={clsx(controlClass, "w-full pl-9")}
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={controlClass}
                  aria-label="Filter by status"
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className={controlClass}
                  aria-label="Sort results"
                >
                  <option value="trust">Rank: Trust score</option>
                  <option value="deadline">Rank: Deadline</option>
                </select>
                {(query || statusFilter !== "ALL") && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      setStatusFilter("ALL");
                    }}
                    className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-navy-800"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <section className="space-y-4 lg:col-span-7">
                <PipelineProgress events={events} status={status} />

                <div className="flex items-baseline justify-between pt-2">
                  <h2 className="text-lg font-semibold text-white">Opportunity matches</h2>
                  {done && <span className="text-sm text-slate-400">{visible.length} shown</span>}
                </div>

                {running &&
                  results.length === 0 &&
                  [1, 2, 3].map((n) => (
                    <div key={n} className="animate-pulse space-y-3 rounded-xl border border-slate-700 bg-navy-800 p-5">
                      <div className="h-3 w-24 rounded bg-navy-900" />
                      <div className="h-5 w-2/3 rounded bg-navy-900" />
                      <div className="h-16 rounded-lg bg-navy-900" />
                    </div>
                  ))}

                {done && results.length === 0 && (
                  <p className="text-slate-400">No matching opportunities were found for this profile.</p>
                )}

                {done && results.length > 0 && visible.length === 0 && (
                  <p className="text-slate-400">No results match your search or filter.</p>
                )}

                {done && results.length > 0 && !results.some((r) => r.badge !== "SCAM_REJECTED") && (
                  <div className="rounded-lg border border-warning/40 bg-warning/10 p-4 text-warning">
                    No trusted opportunities matched this profile. The listings below were excluded because they
                    showed scam signals.
                  </div>
                )}

                {trusted.map((item, i) => (
                  <OpportunityCard key={item.domain + item.title} item={item} index={i} onOpen={setSelected} />
                ))}

                {excluded.length > 0 && (
                  <h3 className="pt-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
                    Excluded from recommendations
                  </h3>
                )}

                {excluded.map((item, i) => (
                  <OpportunityCard
                    key={item.domain + item.title}
                    item={item}
                    index={trusted.length + i}
                    onOpen={setSelected}
                  />
                ))}
              </section>

              <aside className="space-y-4 lg:col-span-5">
                <LiveLogTerminal events={events} status={status} />

                {done && (
                  <div className="rounded-xl border border-slate-700 bg-navy-800 p-5">
                    <h2 className="text-base font-semibold text-white">Verification audit summary</h2>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <Stat label="Records found" value={results.length} />
                      <Stat label="Verified" value={verified} tone="trust" />
                      <Stat label="Conflicting dates" value={conflicts} tone="warning" />
                      <Stat label="Scam rejected" value={rejected} tone="scam" />
                    </div>
                  </div>
                )}
              </aside>
            </div>
          </>
        )}
      </main>

      <footer className="border-t border-slate-700 py-4 text-center text-xs text-slate-500">
        Demo data — illustrative only · Credo AI by Team Dynasty
      </footer>

      <EvidenceModal item={selected} events={events} onClose={() => setSelected(null)} />
    </div>
  );
}