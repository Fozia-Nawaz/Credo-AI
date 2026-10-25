import { useState } from "react";
import { Search, Banknote, Award, Layers, CheckCircle2, SlidersHorizontal } from "lucide-react";
import clsx from "clsx";

const inputClass =
  "mt-1.5 w-full rounded-lg border border-slate-700 bg-navy-900 px-3 py-2.5 text-white placeholder-slate-500 focus:border-electric focus:outline-none";
const labelClass = "block text-sm font-medium text-slate-200";
const helpClass = "mt-1.5 block text-xs text-slate-500";

const NEEDS = [
  { value: "Need-based", Icon: Banknote, flag: 1 },
  { value: "Merit-based", Icon: Award, flag: 0 },
  { value: "Either", Icon: Layers, flag: 1 },
];

export default function StudentForm({ onSubmit, disabled }) {
  const [cgpa, setCgpa] = useState("");
  const [major, setMajor] = useState("");
  const [domicile, setDomicile] = useState("");
  const [degree, setDegree] = useState("Masters");
  const [need, setNeed] = useState("Either");
  const [errors, setErrors] = useState({});

  const cgpaNumber = Number(cgpa);
  const cgpaValid = cgpa !== "" && !Number.isNaN(cgpaNumber) && cgpaNumber >= 0 && cgpaNumber <= 4;

  // The exact request that is sent to the backend.
  function buildPayload() {
    const payload = {
      major: major.trim(),
      cgpa: cgpa === "" ? null : Number(cgpa),
      target_degree: degree,
      financial_need: NEEDS.find((n) => n.value === need)?.flag ?? 1,
    };
    if (domicile.trim()) payload.domicile = domicile.trim();
    return payload;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const next = {};
    if (major.trim().length < 2) next.major = "Enter your field of study.";
    if (!cgpaValid) next.cgpa = "Enter a CGPA between 0.00 and 4.00.";
    if (domicile.trim() && domicile.trim().length < 2) {
      next.domicile = "Enter at least 2 characters.";
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    onSubmit(buildPayload());
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-700 bg-navy-800 p-6 md:p-8">
      <div className="mb-6 flex items-center justify-between gap-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        <span className="inline-flex items-center gap-2">
          <SlidersHorizontal size={13} /> Engine config: student profile
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-navy-900 px-2 py-1 normal-case tracking-normal text-slate-400">
          <span className="h-1.5 w-1.5 rounded-full bg-trust" /> Live backend
        </span>
      </div>

      <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
        <label className={labelClass}>
          <span className="flex items-center justify-between">
            <span>
              Current CGPA <span className="text-scam">*</span>
            </span>
            {cgpaValid && (
              <span className="inline-flex items-center gap-1 text-xs font-normal text-trust">
                <CheckCircle2 size={12} /> Valid: {cgpaNumber.toFixed(2)} / 4.00
              </span>
            )}
          </span>
          <input
            className={inputClass}
            value={cgpa}
            onChange={(e) => setCgpa(e.target.value)}
            placeholder="e.g. 3.60"
            inputMode="decimal"
          />
          <span className={helpClass}>Use a standard 0.00–4.00 scale.</span>
          {errors.cgpa && <span className="mt-1 block text-xs text-scam">{errors.cgpa}</span>}
        </label>

        <label className={labelClass}>
          <span>
            Current / target degree <span className="text-scam">*</span>
          </span>
          <select className={inputClass} value={degree} onChange={(e) => setDegree(e.target.value)}>
            <option value="Bachelors">Bachelor's</option>
            <option value="Masters">Master's</option>
            <option value="PhD">PhD</option>
          </select>
          <span className={helpClass}>Calibrates eligibility tiers.</span>
        </label>

        <label className={labelClass}>
          <span>
            Major / field of interest <span className="text-scam">*</span>
          </span>
          <input
            className={inputClass}
            value={major}
            onChange={(e) => setMajor(e.target.value)}
            placeholder="e.g. Computer Science"
          />
          <span className={helpClass}>Used to match scholarships to your field.</span>
          {errors.major && <span className="mt-1 block text-xs text-scam">{errors.major}</span>}
        </label>

        <label className={labelClass}>
          <span>Domicile / country or region</span>
          <input
            className={inputClass}
            value={domicile}
            onChange={(e) => setDomicile(e.target.value)}
            placeholder="e.g. Islamabad, Pakistan"
          />
          <span className={helpClass}>Optional. Used for residency criteria.</span>
          {errors.domicile && <span className="mt-1 block text-xs text-scam">{errors.domicile}</span>}
        </label>

        <div className="md:col-span-2">
          <div className="flex items-center justify-between">
            <span className={labelClass}>Funding need category</span>
            <span className="text-xs text-slate-500">Adjusts need vs. merit thresholds</span>
          </div>
          <div className="mt-1.5 grid grid-cols-3 gap-1 rounded-lg border border-slate-700 bg-navy-900 p-1">
            {NEEDS.map(({ value, Icon }) => (
              <button
                key={value}
                type="button"
                aria-pressed={need === value}
                onClick={() => setNeed(value)}
                className={clsx(
                  "inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition",
                  need === value ? "bg-electric text-white" : "text-slate-300 hover:bg-navy-800"
                )}
              >
                <Icon size={15} />
                {value === "Either" ? "Either / Both" : value}
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