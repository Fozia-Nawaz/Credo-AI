import { useEffect, useRef } from "react";
import { Terminal } from "lucide-react";

const STAGE_COLORS = {
  PLANNER: "text-electric",
  RECONCILER: "text-warning",
  TRUST_CRITIC: "text-trust",
  REPORTER: "text-purple-400",
  COMPLETE: "text-trust",
};

function isRejected(text) {
  return text.toUpperCase().includes("REJECTED");
}

function messageColor(text) {
  if (isRejected(text)) return "text-scam";
  if (text.toUpperCase().includes("CONFLICT")) return "text-warning";
  return "text-slate-200";
}

export default function LiveLogTerminal({ events, running }) {
  const boxRef = useRef(null);

  // Keep the newest line in view (scrolls the box, not the page).
  useEffect(() => {
    const el = boxRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [events]);

  return (
    <div className="flex h-[32rem] flex-col rounded-xl border border-white/10 bg-navy-800">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2 text-xs text-slate-400">
        <Terminal size={14} />
        Agent reasoning trace
        {running && <span className="ml-auto animate-pulse text-trust">● live</span>}
      </div>

      <div ref={boxRef} className="flex-1 space-y-1 overflow-y-auto p-4 font-mono text-sm">
        {events.length === 0 && (
          <p className="text-slate-500">Waiting for a request...</p>
        )}

        {events.map((e, i) => {
          const rejected = e.stage === "TRUST_CRITIC" && isRejected(e.message);
          const tagColor = rejected ? "text-scam" : STAGE_COLORS[e.stage] || "text-slate-400";
          return (
            <p key={i}>
              <span className={tagColor}>[{e.stage.replace("_", " ")}]</span>{" "}
              <span className={messageColor(e.message)}>{e.message}</span>
              {e.model && <span className="ml-2 text-xs text-slate-500">({e.model})</span>}
            </p>
          );
        })}

        {running && <span className="animate-pulse text-trust">▍</span>}
      </div>
    </div>
  );
}