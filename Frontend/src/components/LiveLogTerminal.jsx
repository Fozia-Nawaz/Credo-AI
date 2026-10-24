import { useEffect, useRef } from "react";
import { Terminal } from "lucide-react";
import clsx from "clsx";

const STAGE_COLORS = {
  PLANNER: "text-electric",
  RECONCILER: "text-warning",
  TRUST_CRITIC: "text-trust",
  REPORTER: "text-purple-400",
  COMPLETE: "text-trust",
  FAILED: "text-scam",
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
    ? { text: "Active stream", cls: "bg-trust/15 text-trust animate-pulse" }
    : status === "done"
    ? { text: "Completed", cls: "bg-slate-700/60 text-slate-300" }
    : status === "error"
    ? { text: "Stopped", cls: "bg-scam/15 text-scam" }
    : null;

  return (
    <div className="flex h-[36rem] flex-col rounded-xl border border-slate-700 bg-navy-800">
      <div className="border-b border-slate-700 px-4 py-3">
        <div className="flex items-center gap-2">
          <Terminal size={16} className="text-electric" />
          <h2 className="text-sm font-semibold text-white">Live Trust Trace</h2>
          {badge && (
            <span className={clsx("ml-auto rounded-full px-2.5 py-0.5 text-xs font-semibold", badge.cls)}>
              {badge.text}
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-slate-400">Auditable activity from the verification run</p>
      </div>

      <div ref={boxRef} className="flex-1 space-y-1.5 overflow-y-auto p-4 font-mono text-[13px]">
        {events.length === 0 && <p className="text-slate-500">Waiting for a request...</p>}

        {events.map((e, i) => {
          const message = cleanMessage(e.message || "");
          const rejected = e.stage === "TRUST_CRITIC" && isRejected(message);
          const tagColor = rejected ? "text-scam" : STAGE_COLORS[e.stage] || "text-slate-400";
          return (
            <p key={i} className="leading-5">
              <span className="text-slate-500">{formatTime(e.receivedAt)}</span>{" "}
              <span className={tagColor}>[{e.stage.replace("_", " ")}]</span>{" "}
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