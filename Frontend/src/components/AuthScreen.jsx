import { useState } from "react";
import { Info, User, Eye, EyeOff, ArrowRight, ArrowLeft } from "lucide-react";

const fieldClass =
  "mt-1.5 w-full rounded-lg border border-slate-700 bg-navy-900 px-3 py-2.5 text-white placeholder-slate-500 focus:border-electric focus:outline-none";

export default function AuthScreen({ mode, onSignIn, onContinue, onGetStarted, onBack }) {
  const [show, setShow] = useState(false);

  if (mode === "signedin") {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-slate-700 bg-navy-800 p-8">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-navy-900 px-3 py-1 text-[11px] text-slate-300">
          <Info size={12} className="text-electric" /> Demo-only signed-in state
        </span>
        <div className="mt-5 flex h-12 w-12 items-center justify-center rounded-xl border border-slate-700 bg-navy-900 text-electric">
          <User size={22} />
        </div>
        <h1 className="mt-5 text-3xl font-bold text-white">Demo account</h1>
        <p className="mt-2 text-slate-400">
          You're viewing the demo-only signed-in state. Continue to a sample student profile to explore discovery.
        </p>
        <div className="mt-5 rounded-lg border border-slate-700 bg-navy-900 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-white">
            <Info size={14} className="text-electric" /> Simulated authentication
          </p>
          <p className="mt-1 text-sm text-slate-400">
            No credentials have been verified. No authentication backend is connected, and no real session has been
            created.
          </p>
        </div>
        <button
          type="button"
          onClick={onContinue}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-electric px-5 py-3 font-semibold text-white hover:bg-electric/90"
        >
          <ArrowRight size={16} /> Continue to discovery
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSignIn(); // simulated: the typed values are never read or stored
        }}
        autoComplete="off"
        className="rounded-2xl border border-slate-700 bg-navy-800 p-8"
      >
        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-navy-900 px-3 py-1 text-[11px] text-slate-300">
          <Info size={12} className="text-electric" /> Demo only
        </span>
        <h1 className="mt-4 text-3xl font-bold text-white">Sign in to Credo AI</h1>
        <p className="mt-2 text-slate-400">Explore evidence-backed discovery in a simulated demo account.</p>

        <div className="mt-5 flex items-start gap-2 rounded-lg border border-slate-700 bg-navy-900 p-3 text-sm text-slate-300">
          <Info size={16} className="mt-0.5 shrink-0 text-electric" />
          <p>
            Demo only: authentication is simulated. No credentials are verified and no authentication backend is
            connected.
          </p>
        </div>

        <label className="mt-5 block text-sm font-medium text-slate-200">
          Email address
          <input type="text" autoComplete="off" className={fieldClass} placeholder="name@example.com" />
        </label>

        <label className="mt-4 block text-sm font-medium text-slate-200">
          Password
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              autoComplete="off"
              className={fieldClass}
              placeholder="Enter a demo password"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-3 top-1/2 inline-flex -translate-y-1/2 items-center gap-1 text-xs text-slate-400 hover:text-white"
            >
              {show ? <EyeOff size={14} /> : <Eye size={14} />} {show ? "Hide" : "Show"}
            </button>
          </div>
        </label>
        <p className="mt-2 text-xs text-slate-500">Use sample details only. Do not enter real credentials.</p>

        <button
          type="submit"
          className="mt-5 w-full rounded-lg bg-electric px-5 py-3 font-semibold text-white hover:bg-electric/90"
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={onGetStarted}
          className="mt-3 w-full rounded-lg border border-slate-700 bg-navy-900 px-5 py-3 font-semibold text-white hover:bg-navy-900/70"
        >
          Get started
        </button>
      </form>

      <button
        type="button"
        onClick={onBack}
        className="mx-auto flex items-center gap-2 text-sm text-slate-400 hover:text-white"
      >
        <ArrowLeft size={14} /> Back to Credo AI
      </button>
    </div>
  );
}