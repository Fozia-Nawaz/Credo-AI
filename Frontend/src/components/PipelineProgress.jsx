import { CheckCircle2, Circle, Loader2, Search } from "lucide-react";
import clsx from "clsx";

const PHASES = [
  { stage: "PLANNER", tag: "PLANNER", title: "Profile criteria normalized" },
  { stage: "ZETARIS_FETCH", tag: "ZETARIS", title: "Official records fetched" },
  { stage: "RECONCILER", tag: "RECONCILER", title: "Aggregator sources compared" },
  { stage: "CRITIC", tag: "TRUST CRITIC", title: "Domain and fee audit" },
  { stage: "REPORTER", tag: "REPORTER", title: "Final trust ranking" },
];

function formatTime(ms) {
  return ms ? new Date(ms).toLocaleTimeString("en-GB") : "";
}

export default function PipelineProgress({ events, status }) {
  const done = status === "done";
  const failed = status === "error";

  const lastEvent = (stage) => {
    for (let i = events.length - 1; i >= 0; i--) {
      if (events[i].stage === stage || (stage === "CRITIC" && events[i].stage === "TRUST_CRITIC")) {
        return events[i];
      }
    }
    return null;
  };

  let latest = -1;
  PHASES.forEach((p, i) => {
    if (lastEvent(p.stage)) latest = i;
  });

  const completed = done ? 5 : Math.max(latest, 0);
  const pct = done ? 100 : latest < 0 ? 4 : ((latest + 0.5) / 5) * 100;
  const stepText = done ? "Step 5 of 5 · Complete" : latest < 0 ? "Starting" : `Step ${latest + 1} of 5 · Active`;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-700 bg-navy-800 p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-white">
            <Search size={16} className="text-electric" />
            <h2 className="text-base font-semibold">
              {done ? "Scholarship opportunities checked" : "Checking scholarship opportunities"}
            </h2>
          </div>
          <span className="text-xs text-slate-400">{failed ? "Stopped" : stepText}</span>
        </div>
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-navy-900">
          <div
            className={clsx(
              "h-2 rounded-full transition-all duration-700",
              failed ? "bg-scam" : done ? "bg-trust" : "bg-electric"
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-700 bg-navy-800 p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-white">5-Phase Autonomous Agent Pipeline</h2>
          <span className="rounded-md border border-slate-700 px-2 py-0.5 text-xs text-slate-400">Live workflow</span>
        </div>

        <ul className="space-y-2">
          {PHASES.map((p, i) => {
            const ev = lastEvent(p.stage);
            const isComplete = done || (ev && i < latest);
            const isRunning = !done && !failed && ev && i === latest;
            const state = isComplete ? "COMPLETE" : isRunning ? "RUNNING" : failed && ev ? "STOPPED" : "PENDING";

            return (
              <li
                key={p.stage}
                className={clsx(
                  "rounded-lg border p-3",
                  isRunning ? "border-electric/50 bg-electric/10" : "border-slate-700 bg-navy-900/60",
                  state === "PENDING" && "opacity-60"
                )}
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5">
                    {isComplete ? (
                      <CheckCircle2 size={18} className="text-trust" />
                    ) : isRunning ? (
                      <Loader2 size={18} className="animate-spin text-electric" />
                    ) : (
                      <Circle size={18} className="text-slate-600" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-white">
                        <span className="mr-2 rounded bg-electric/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-electric">
                          Phase {i + 1} · {p.tag}
                        </span>
                        {p.title}
                      </p>
                      <span className="flex items-center gap-2 text-xs text-slate-500">
                        {ev && formatTime(ev.receivedAt)}
                        <span
                          className={clsx(
                            "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                            state === "COMPLETE" && "border-trust/40 bg-trust/10 text-trust",
                            state === "RUNNING" && "border-electric/40 bg-electric/15 text-electric",
                            state === "STOPPED" && "border-scam/40 bg-scam/10 text-scam",
                            state === "PENDING" && "border-slate-600 text-slate-500"
                          )}
                        >
                          {state}
                        </span>
                      </span>
                    </div>
                    {ev && <p className="mt-1 text-xs text-slate-400">{ev.message}</p>}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        <p className="sr-only">{completed} of 5 phases complete</p>
      </div>
    </div>
  );
}