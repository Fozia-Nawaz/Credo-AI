import { useState } from "react";
import { Search } from "lucide-react";
import clsx from "clsx";

const inputClass =
  "mt-1.5 w-full rounded-lg border border-slate-700 bg-navy-900 px-3 py-2.5 text-white placeholder-slate-500 focus:border-electric focus:outline-none";
const labelClass = "block text-sm font-medium text-slate-200";
const helpClass = "mt-1 block text-xs text-slate-500";

export default function StudentForm({ onSubmit, disabled }) {
  const [cgpa, setCgpa] = useState("");
  const [major, setMajor] = useState("");
  const [domicile, setDomicile] = useState("");
  const [degree, setDegree] = useState("Masters");
  const [need, setNeed] = useState("Yes");
  const [errors, setErrors] = useState({});

  // The exact request that is sent to the backend.
  function buildPayload() {
    const payload = {
      major: major.trim(),
      cgpa: cgpa === "" ? null : Number(cgpa),
      target_degree: degree,
      financial_need: need === "Yes" ? 1 : 0,
    };
    if (domicile.trim()) payload.domicile = domicile.trim();
    return payload;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const next = {};
    const cgpaNumber = Number(cgpa);
    if (major.trim().length < 2) next.major = "Enter your field of study.";
    if (cgpa === "" || Number.isNaN(cgpaNumber) || cgpaNumber < 0 || cgpaNumber > 4) {
      next.cgpa = "Enter a CGPA between 0.00 and 4.00.";
    }
    if (domicile.trim() && domicile.trim().length < 2) {
      next.domicile = "Enter at least 2 characters.";
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    onSubmit(buildPayload());
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-700 bg-navy-800 p-6 md:p-8">
      <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
        <label className={labelClass}>
          Current CGPA
          <input
            className={inputClass}
            value={cgpa}
            onChange={(e) => setCgpa(e.target.value)}
            placeholder="e.g. 3.60"
            inputMode="decimal"
          />
          <span className={helpClass}>Use a 0.00–4.00 scale.</span>
          {errors.cgpa && <span className="mt-1 block text-xs text-scam">{errors.cgpa}</span>}
        </label>

        <label className={labelClass}>
          Target degree
          <select className={inputClass} value={degree} onChange={(e) => setDegree(e.target.value)}>
            <option>Bachelors</option>
            <option>Masters</option>
            <option>PhD</option>
          </select>
          <span className={helpClass}>The level you plan to study.</span>
        </label>

        <label className={labelClass}>
          Major / field of interest
          <input
            className={inputClass}
            value={major}
            onChange={(e) => setMajor(e.target.value)}
            placeholder="e.g. Computer Science"
          />
          {errors.major && <span className="mt-1 block text-xs text-scam">{errors.major}</span>}
        </label>

        <label className={labelClass}>
          Domicile (optional)
          <input
            className={inputClass}
            value={domicile}
            onChange={(e) => setDomicile(e.target.value)}
            placeholder="e.g. Islamabad"
          />
          {errors.domicile && <span className="mt-1 block text-xs text-scam">{errors.domicile}</span>}
        </label>

        <div className="md:col-span-2">
          <span className={labelClass}>Financial need</span>
          <div className="mt-1.5 grid grid-cols-2 gap-1 rounded-lg border border-slate-700 bg-navy-900 p-1">
            {["Yes", "No"].map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={need === option}
                onClick={() => setNeed(option)}
                className={clsx(
                  "rounded-md px-3 py-2 text-sm font-semibold transition",
                  need === option ? "bg-electric text-white" : "text-slate-300 hover:bg-navy-800"
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>

      <details className="mt-6 rounded-lg border border-slate-700 bg-navy-900 p-3 text-sm">
        <summary className="cursor-pointer text-slate-400">Request preview (what will be sent)</summary>
        <pre className="mt-3 overflow-x-auto font-mono text-xs text-slate-300">
          {JSON.stringify(buildPayload(), null, 2)}
        </pre>
      </details>

      <button
        type="submit"
        disabled={disabled}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-electric px-5 py-3 font-semibold text-white shadow-lg shadow-electric/30 transition hover:bg-electric/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Search size={18} />
        {disabled ? "Agents working..." : "Search opportunities"}
      </button>
    </form>
  );
}