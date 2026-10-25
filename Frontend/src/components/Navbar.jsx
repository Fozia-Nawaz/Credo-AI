import { useEffect, useRef, useState } from "react";
import { ShieldCheck, User, LogIn, LogOut, ArrowRight, ChevronRight } from "lucide-react";
import clsx from "clsx";

const STATUS = {
  running: { label: "Agents working", className: "bg-electric/20 text-electric animate-pulse" },
  done: { label: "Complete", className: "bg-trust/20 text-trust" },
  error: { label: "Error", className: "bg-scam/20 text-scam" },
};

export default function Navbar({
  status,
  user,
  busy,
  onHome,
  onDiscover,
  onHow,
  onStart,
  onSignIn,
  onSignOut,
  onProfile,
}) {
  const s = STATUS[status];
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const items = user
    ? [
        { label: "Student profile", Icon: User, fn: onProfile, accent: true },
        { label: "Sign out", Icon: LogOut, fn: onSignOut },
      ]
    : [
        { label: "Sign in", Icon: LogIn, fn: onSignIn, accent: true },
        { label: "Start discovery", Icon: ArrowRight, fn: onStart },
      ];

  const linkClass =
    "rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-navy-800 hover:text-white disabled:opacity-50";

  return (
    <header className="sticky top-0 z-10 border-b border-slate-700 bg-navy-900/95 backdrop-blur">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-4 px-6">
        <button
          type="button"
          onClick={onHome}
          aria-label="Credo AI home"
          className="flex items-center gap-3 text-left"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-navy-800">
            <ShieldCheck className="text-electric" size={22} />
          </div>
          <div className="leading-tight">
            <p className="text-lg font-bold text-white">
              Credo <span className="text-electric">AI</span>
            </p>
            <p className="text-xs text-slate-400">The Explainable Trust Engine</p>
          </div>
        </button>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          <button type="button" onClick={onDiscover} disabled={busy} className={linkClass}>
            Discover
          </button>
          <button type="button" onClick={onHow} disabled={busy} className={linkClass}>
            How verification works
          </button>
        </nav>

        <div className="flex items-center gap-3">
          {s && (
            <span className={clsx("hidden rounded-full px-3 py-1 text-xs font-semibold sm:inline", s.className)}>
              {s.label}
            </span>
          )}
          <span className="hidden text-sm text-slate-400 lg:block">{user ? "Demo account" : "Team Dynasty"}</span>
          <button
            type="button"
            onClick={onStart}
            disabled={busy}
            className="rounded-lg bg-electric px-4 py-2 text-sm font-semibold text-white hover:bg-electric/90 disabled:opacity-50"
          >
            Get started
          </button>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-haspopup="menu"
              aria-expanded={open}
              aria-label="Account menu"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-navy-800 text-slate-200 hover:border-electric/60"
            >
              <User size={16} />
            </button>

            {open && (
              <div
                role="menu"
                className="absolute right-0 z-30 mt-2 w-72 rounded-xl border border-slate-700 bg-navy-800 p-2 shadow-xl"
              >
                <div className="flex items-center gap-3 px-3 py-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-navy-900 text-slate-200">
                    <User size={18} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">{user ? "Demo account" : "Guest session"}</p>
                    <p className="text-xs text-slate-400">{user ? "Simulated session" : "Demo mode"}</p>
                  </div>
                </div>
                <div className="my-1 border-t border-slate-700" />
                {items.map(({ label, Icon, fn, accent }) => (
                  <button
                    key={label}
                    type="button"
                    role="menuitem"
                    disabled={busy}
                    onClick={() => {
                      setOpen(false);
                      fn?.();
                    }}
                    className={clsx(
                      "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm text-white hover:bg-navy-900 disabled:opacity-50",
                      accent && "bg-navy-900"
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <Icon size={16} className={accent ? "text-electric" : "text-slate-300"} />
                      {label}
                    </span>
                    <ChevronRight size={14} className="text-slate-500" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}