import { useEffect, useRef } from "react";
import clsx from "clsx";

const STAGE_COLORS = {
  PLANNER: "text-electric",
  ZETARIS_FETCH: "text-cyan-400",
  RECONCILER: "text-warning",
  CRITIC: "text-trust",
  TRUST_CRITIC: "text-trust",
  REPORTER: "text-purple-400",
  COMPLETE: "text-trust",
  FAILED: "text-scam",
};

const STAGE_LABELS = {
  ZETARIS_FETCH: "ZETARIS",
  CRITIC: "TRUST CRITIC",
};

function isRejected(text) {
  return text.toUpperCase().includes("REJECTED");
}

function messageColor(text) {
  if (isRejected(text)) return "text-scam";
  if (text.toUpperCase().includes("CONFLICT")) return "text-warning";
  return "text-slate-200";
}

// Some backend messages already start with a tag like "[PLANNER] ".
// We show our own tag, so remove the duplicate.
function cleanMessage(text) {
  return text.replace(/^\[[A-Za-z _]+\]\s*/, "");
}

function formatTime(ms) {
  return ms ? new Date(ms).toLocaleTimeString("en-GB") : "";
}

export default function LiveLogTerminal({ events, status }) {
  const boxRef = useRef(null);
  const running = status === "running";

  // Keep the newest line in view (scrolls the box, not the page).
  useEffect(() => {
    const el = boxRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [events]);

  const badge = running
    ? { text: "RUNNING", cls: "text-trust" }
    : status === "done"
    ? { text: "COMPLETE", cls: "text-trust" }
    : status === "error"
    ? { text: "STOPPED", cls: "text-scam" }
    : null;

  return (
    <div className="flex h-[32rem] flex-col overflow-hidden rounded-xl border border-slate-700 bg-navy-900">
      <div className="flex items-center gap-3 border-b border-slate-700 bg-navy-800 px-4 py-2.5">
        <span className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-scam" />
          <span className="h-2.5 w-2.5 rounded-full bg-warning" />
          <span className="h-2.5 w-2.5 rounded-full bg-trust" />
        </span>
        <h2 className="text-xs font-semibold text-white">Live Trust Trace</h2>
        {badge && (
          <span className={clsx("ml-auto flex items-center gap-1.5 text-[11px] font-semibold", badge.cls)}>
            <span className={clsx("h-1.5 w-1.5 rounded-full bg-current", running && "animate-pulse")} />
            {badge.text}
          </span>
        )}
      </div>

      <div ref={boxRef} className="flex-1 space-y-2 overflow-y-auto p-4 font-mono text-[13px]">
        {events.length === 0 && <p className="text-slate-500">Waiting for a request...</p>}

        {events.map((e, i) => {
          const message = cleanMessage(e.message || "");
          const rejected = (e.stage === "CRITIC" || e.stage === "TRUST_CRITIC") && isRejected(message);
          const tagColor = rejected ? "text-scam" : STAGE_COLORS[e.stage] || "text-slate-400";
          const label = STAGE_LABELS[e.stage] || e.stage.replace(/_/g, " ");
          return (
            <p key={i} className="leading-5">
              <span className="text-slate-500">{formatTime(e.receivedAt)}</span>{" "}
              <span className={tagColor}>[{label}]</span>{" "}
              <span className={messageColor(message)}>{message}</span>
              {e.model && <span className="ml-2 text-xs text-slate-500">({e.model})</span>}
            </p>
          );
        })}

        {running && <span className="animate-pulse text-trust">▍</span>}
      </div>

      <p className="border-t border-slate-700 px-4 py-2 text-xs text-slate-500">
        Times show when each event reached this page.
      </p>
    </div>
  );
}