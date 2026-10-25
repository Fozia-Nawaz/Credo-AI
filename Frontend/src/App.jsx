import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Pencil, RefreshCw, Search } from "lucide-react";
import clsx from "clsx";
import { runVerification } from "./services/api";
import Navbar from "./components/Navbar";
import Landing from "./components/Landing";
import StudentForm from "./components/StudentForm";
import AuthScreen from "./components/AuthScreen";
import OpportunityCard from "./components/OpportunityCard";
import AuditDetails from "./components/AuditDetails";
import LiveLogTerminal from "./components/LiveLogTerminal";
import PipelineProgress from "./components/PipelineProgress";
import EvidenceModal from "./components/EvidenceModal";

const STATUS_OPTIONS = [
  { value: "ALL", label: "All statuses" },
  { value: "VERIFIED", label: "Verified" },
  { value: "CONFLICTING_DATES", label: "Conflicting dates" },
  { value: "SCAM_REJECTED", label: "Scam rejected" },
];

const AGENTS = [
  { n: 1, name: "Planner", text: "Parses the student profile into search criteria." },
  { n: 2, name: "Reconciler", text: "Queries the data layer and compares official and aggregator records." },
  { n: 3, name: "Trust Critic", text: "Checks domains, fees and deadline conflicts, then assigns a trust badge." },
  { n: 4, name: "Reporter", text: "Compiles the ranked results and the audit proof." },
];

const controlClass =
  "rounded-lg border border-slate-700 bg-navy-800 px-3 py-2 text-sm text-white focus:border-electric focus:outline-none";

function deadlineTime(value) {
  const t = Date.parse(value);
  return Number.isNaN(t) ? Number.POSITIVE_INFINITY : t;
}

function Stat({ label, value, sub, tone }) {
  const tones = { default: "text-white", warning: "text-warning", scam: "text-scam", trust: "text-trust" };
  return (
    <div className="min-w-[8.5rem] rounded-lg border border-slate-700 bg-navy-800 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 flex items-baseline gap-1.5">
        <span className={clsx("text-2xl font-bold", tones[tone] || tones.default)}>{value}</span>
        {sub && <span className="text-xs text-slate-500">{sub}</span>}
      </p>
    </div>
  );
}

function ArchitecturePanel() {
  return (
    <div className="rounded-xl border border-slate-700 bg-navy-800 p-5">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
        Multi-agent architecture (Track 02 pipeline)
      </h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {AGENTS.map((a) => (
          <div key={a.n} className="rounded-lg border border-slate-700 bg-navy-900 p-3">
            <p className="flex items-center gap-2 text-sm font-semibold text-white">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-electric/15 text-[11px] text-electric">
                {a.n}
              </span>
              {a.name}
            </p>
            <p className="mt-1 text-xs text-slate-400">{a.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState("landing"); // landing | form | dashboard | audit | signin | account
  const [user, setUser] = useState(null); // simulated demo account only
  const [status, setStatus] = useState("idle"); // idle | running | done | error
  const [events, setEvents] = useState([]);
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [auditItem, setAuditItem] = useState(null);
  const [profile, setProfile] = useState(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("trust");
  const stopRef = useRef(() => {});

  // Stop any open stream when the page closes.
  useEffect(() => () => stopRef.current(), []);

  const running = status === "running";

  function go(next) {
    if (running) return; // don't interrupt a running search
    setView(next);
    window.scrollTo({ top: 0 });
  }

  function goHow() {
    if (running) return;
    setView("landing");
    setTimeout(() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" }), 60);
  }

  function handleSubmit(p) {
    stopRef.current(); // stop a previous run, if any
    setProfile(p);
    setView("dashboard");
    setEvents([]);
    setResults([]);
    setError("");
    setSelected(null);
    setAuditItem(null);
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

  // Rejected listings open the audit page; everything else opens the evidence drawer.
  function openItem(item) {
    if (item.badge === "SCAM_REJECTED") {
      setAuditItem(item);
      setView("audit");
      window.scrollTo({ top: 0 });
    } else {
      setSelected(item);
    }
  }

  // The official (non-rejected) result with the same scholarship ID, from this run.
  function officialFor(item) {
    if (!item || !item.scholarship_id) return null;
    return (
      results.find((r) => r.badge !== "SCAM_REJECTED" && r.scholarship_id === item.scholarship_id) || null
    );
  }

  function exportAudit() {
    const payload = {
      exported_at: new Date().toISOString(),
      run_id: runId || null,
      profile,
      results,
      trace: events.map((e) => ({
        time: e.receivedAt ? new Date(e.receivedAt).toISOString() : null,
        stage: e.stage,
        message: e.message,
      })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `credo-audit-${(runId || "run").slice(0, 8)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const hasMatch = results.some((r) => typeof r.eligibility_match === "number");
  const effectiveSort = sortBy === "match" && !hasMatch ? "trust" : sortBy;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = results.filter(
      (r) =>
        (statusFilter === "ALL" || r.badge === statusFilter) &&
        (!q || r.title.toLowerCase().includes(q) || (r.domain || "").toLowerCase().includes(q))
    );
    return [...list].sort((a, b) => {
      if (effectiveSort === "deadline") return deadlineTime(a.deadline) - deadlineTime(b.deadline);
      if (effectiveSort === "match") return (b.eligibility_match ?? 0) - (a.eligibility_match ?? 0);
      return b.trust_score - a.trust_score;
    });
  }, [results, query, statusFilter, effectiveSort]);

  const done = status === "done";
  const verified = results.filter((r) => r.badge === "VERIFIED").length;
  const conflicts = results.filter((r) => r.badge === "CONFLICTING_DATES").length;
  const rejected = results.filter((r) => r.badge === "SCAM_REJECTED").length;
  const trusted = visible.filter((item) => item.badge !== "SCAM_REJECTED");
  const excluded = visible.filter((item) => item.badge === "SCAM_REJECTED");
  const officialDomains = results.filter((r) => r.badge !== "SCAM_REJECTED").map((r) => r.domain);
  const runId = events.find((e) => e.run_id)?.run_id;

  // Reads the real data-layer mode from the backend's Zetaris event, e.g. "Local CSV Engine".
  const zetarisMsg = events.find((e) => e.stage === "ZETARIS_FETCH")?.message || "";
  const zetarisMode = zetarisMsg.match(/\(([^)]+)\)/)?.[1];

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
      <Navbar
        status={status}
        user={user}
        busy={running}
        onHome={() => go("landing")}
        onDiscover={() => go("form")}
        onHow={goHow}
        onStart={() => go("form")}
        onSignIn={() => go("signin")}
        onSignOut={() => {
          setUser(null);
          go("landing");
        }}
        onProfile={() => go("form")}
      />

      <main className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        {view === "landing" && <Landing onStart={() => setView("form")} />}

        {view === "signin" && (
          <AuthScreen
            mode="signin"
            onSignIn={() => {
              setUser({ name: "Demo account" });
              setView("account");
            }}
            onGetStarted={() => setView("form")}
            onBack={() => setView("landing")}
          />
        )}

        {view === "account" && <AuthScreen mode="signedin" onContinue={() => setView("form")} />}

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
            <StudentForm onSubmit={handleSubmit} disabled={running} />
          </div>
        )}

        {view === "audit" && auditItem && (
          <AuditDetails
            item={auditItem}
            official={officialFor(auditItem)}
            officialDomains={officialDomains}
            events={events}
            onBack={() => {
              setView("dashboard");
              window.scrollTo({ top: 0 });
            }}
            onCompare={() => setSelected(auditItem)}
          />
        )}

        {view === "dashboard" && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-navy-800 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-300">
                <span className="h-1.5 w-1.5 rounded-full bg-electric" />
                Track 02 · The agent that can explain why
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {profile && (
                  <span className="rounded-lg border border-slate-700 bg-navy-800 px-3 py-2 text-xs text-slate-300">
                    Profile:{" "}
                    <span className="font-semibold text-white">
                      {profile.target_degree} · {profile.major} · CGPA {profile.cgpa}
                    </span>
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => go("form")}
                  disabled={running}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-navy-800 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800/70 disabled:opacity-50"
                >
                  <Pencil size={14} />
                  Update profile
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-6">
              <div>
                <h1 className="text-3xl font-bold text-white">{headline}</h1>
                <p className="mt-1 max-w-xl text-slate-400">{subline}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span
                    className={clsx(
                      "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
                      running && "border-electric/40 bg-electric/10 text-electric",
                      done && "border-trust/40 bg-trust/10 text-trust",
                      status === "error" && "border-scam/40 bg-scam/10 text-scam"
                    )}
                  >
                    <span className={clsx("h-1.5 w-1.5 rounded-full bg-current", running && "animate-pulse")} />
                    {running ? "Verification in progress" : done ? "All agent phases complete" : "Stopped"}
                  </span>
                  {runId && (
                    <span className="rounded-full border border-slate-700 bg-navy-800 px-3 py-1 font-mono text-xs text-electric">
                      Run {runId.slice(0, 8)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Stat label="Candidate feed" value={done ? results.length : "–"} sub="records" />
                <Stat label="Discrepancy" value={done ? conflicts : "–"} sub="flagged" tone="warning" />
                <Stat label="Scam quarantine" value={done ? rejected : "–"} sub="blocked" tone="scam" />
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
              <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-700 bg-navy-800/60 p-3">
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
                  value={effectiveSort}
                  onChange={(e) => setSortBy(e.target.value)}
                  className={controlClass}
                  aria-label="Sort results"
                >
                  <option value="trust">Rank: Trust score</option>
                  <option value="deadline">Rank: Deadline</option>
                  {hasMatch && <option value="match">Rank: Match score</option>}
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
                <span className="ml-auto inline-flex items-center gap-2 rounded-md border border-slate-700 bg-navy-900 px-3 py-2 text-xs text-slate-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-trust" />
                  Zetaris data layer{zetarisMode ? `: ${zetarisMode}` : ""}
                </span>
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

                {trusted.map((item) => (
                  <OpportunityCard key={item.domain + item.title} item={item} onOpen={openItem} />
                ))}

                {excluded.length > 0 && (
                  <h3 className="pt-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
                    Excluded from recommendations
                  </h3>
                )}

                {excluded.map((item) => (
                  <OpportunityCard key={item.domain + item.title} item={item} onOpen={openItem} />
                ))}
              </section>

              <aside className="space-y-4 lg:col-span-5">
                <LiveLogTerminal events={events} status={status} />

                {done && (
                  <>
                    <div className="rounded-xl border border-slate-700 bg-navy-800 p-5">
                      <h2 className="text-base font-semibold text-white">Verification audit summary</h2>
                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <Stat label="Records found" value={results.length} />
                        <Stat label="Verified" value={verified} tone="trust" />
                        <Stat label="Conflicting dates" value={conflicts} tone="warning" />
                        <Stat label="Scam rejected" value={rejected} tone="scam" />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={exportAudit}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 bg-navy-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-800/70"
                    >
                      <Download size={16} />
                      Export audit JSON
                    </button>
                  </>
                )}

                <ArchitecturePanel />

                <p className="rounded-lg border border-slate-700 bg-navy-800/60 p-3 text-xs text-slate-400">
                  Statuses come from comparing the source records returned for this run. This build uses generated
                  sample data.
                </p>
              </aside>
            </div>
          </>
        )}
      </main>

      <footer className="border-t border-slate-700 py-4 text-center text-xs text-slate-500">
        Demo data — illustrative only · Credo AI by Team Dynasty
      </footer>

      <EvidenceModal
        item={selected}
        official={selected ? officialFor(selected) : null}
        events={events}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}