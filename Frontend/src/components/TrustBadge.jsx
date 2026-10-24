import { CheckCircle2, AlertTriangle, ShieldAlert, HelpCircle } from "lucide-react";
import clsx from "clsx";

const BADGES = {
  VERIFIED: {
    label: "Verified",
    Icon: CheckCircle2,
    className: "bg-trust/15 text-trust border-trust/40",
  },
  CONFLICTING_DATES: {
    label: "Conflicting dates",
    Icon: AlertTriangle,
    className: "bg-warning/15 text-warning border-warning/40",
  },
  SCAM_REJECTED: {
    label: "Suspicious - rejected",
    Icon: ShieldAlert,
    className: "bg-scam/15 text-scam border-scam/40",
  },
};

export default function TrustBadge({ badge }) {
  const config = BADGES[badge] || {
    label: badge || "Unknown",
    Icon: HelpCircle,
    className: "bg-slate-500/15 text-slate-300 border-slate-500/40",
  };
  const { label, Icon, className } = config;

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
        className
      )}
    >
      <Icon size={14} />
      {label}
    </span>
  );
}