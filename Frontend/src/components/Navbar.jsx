import { useEffect, useRef, useState } from "react";
import { ShieldCheck, User, LogIn, LogOut, ArrowRight, ChevronRight } from "lucide-react";
import clsx from "clsx";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

const STATUS = {
  running: { label: "Agents working", className: "bg-blue-50 text-blue-700 animate-pulse" },
  done: { label: "Complete", className: "bg-emerald-50 text-emerald-700" },
  error: { label: "Error", className: "bg-red-50 text-red-700" },
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
    "rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50";

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-4 px-6">
        <button
          type="button"
          onClick={onHome}
          aria-label="Credo AI home"
          className="flex items-center gap-3 text-left"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy-900">
            <ShieldCheck className="text-electric" size={22} />
          </div>
          <div className="leading-tight">
            <p className="text-lg font-bold text-slate-900">
              Credo <span className="text-electric">AI</span>
            </p>
            <p className="text-xs text-slate-500">The Explainable Trust Engine</p>
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
          <span className="hidden items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 lg:inline-flex">
            <span className={clsx("h-1.5 w-1.5 rounded-full", USE_MOCK ? "bg-amber-500" : "bg-emerald-500")} />
            {USE_MOCK ? "Sample mode" : "Live backend"}
          </span>

          {s && (
            <span className={clsx("hidden rounded-full px-3 py-1 text-xs font-semibold sm:inline", s.className)}>
              {s.label}
            </span>
          )}

          {user ? (
            <span className="hidden text-sm text-slate-600 md:block">Demo account</span>
          ) : (
            <button
              type="button"
              onClick={onSignIn}
              disabled={busy}
              className="hidden text-sm text-slate-600 hover:text-slate-900 disabled:opacity-50 md:block"
            >
              Sign in
            </button>
          )}

          <button
            type="button"
            onClick={onStart}
            disabled={busy}
            className="rounded-lg bg-[#1D4ED8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1E40AF] disabled:opacity-50"
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
              className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-900 text-white hover:bg-navy-800"
            >
              <User size={16} />
            </button>

            {open && (
              <div
                role="menu"
                className="absolute right-0 z-30 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-2 shadow-xl"
              >
                <div className="flex items-center gap-3 px-3 py-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                    <User size={18} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{user ? "Demo account" : "Guest session"}</p>
                    <p className="text-xs text-slate-500">{user ? "Simulated session" : "Demo mode"}</p>
                  </div>
                </div>
                <div className="my-1 border-t border-slate-200" />
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
                      "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm text-slate-800 hover:bg-slate-50 disabled:opacity-50",
                      accent && "bg-slate-50"
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <Icon size={16} className={accent ? "text-electric" : "text-slate-500"} />
                      {label}
                    </span>
                    <ChevronRight size={14} className="text-slate-400" />
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