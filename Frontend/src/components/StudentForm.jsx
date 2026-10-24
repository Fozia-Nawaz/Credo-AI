import { useState } from "react";
import { Search } from "lucide-react";

const inputClass =
  "w-full rounded-lg border border-white/10 bg-navy-900 px-3 py-2 text-white placeholder-slate-500 focus:border-electric focus:outline-none";

export default function StudentForm({ onSubmit, disabled }) {
  const [cgpa, setCgpa] = useState("");
  const [major, setMajor] = useState("");
  const [country, setCountry] = useState("Pakistan / Global");
  const [degree, setDegree] = useState("Masters");
  const [need, setNeed] = useState("Yes");
  const [errors, setErrors] = useState({});

  function handleSubmit(e) {
    e.preventDefault();
    const next = {};
    const cgpaNumber = Number(cgpa);
    if (!major.trim()) next.major = "Enter your field of study.";
    if (cgpa === "" || Number.isNaN(cgpaNumber) || cgpaNumber < 0 || cgpaNumber > 4) {
      next.cgpa = "Enter a CGPA between 0 and 4.";
    }
    if (!country.trim()) next.country = "Enter your country or domicile.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    onSubmit({
      major: major.trim(),
      cgpa: cgpaNumber,
      target_country: country.trim(),
      degree_level: degree,
      financial_need: need,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-white/10 bg-navy-800 p-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
        <label className="text-sm text-slate-300">
          CGPA
          <input className={inputClass} value={cgpa} onChange={(e) => setCgpa(e.target.value)} placeholder="e.g. 3.6" inputMode="decimal" />
          {errors.cgpa && <span className="text-xs text-scam">{errors.cgpa}</span>}
        </label>

        <label className="text-sm text-slate-300">
          Field of study
          <input className={inputClass} value={major} onChange={(e) => setMajor(e.target.value)} placeholder="e.g. Computer Science" />
          {errors.major && <span className="text-xs text-scam">{errors.major}</span>}
        </label>

        <label className="text-sm text-slate-300">
          Country / domicile
          <input className={inputClass} value={country} onChange={(e) => setCountry(e.target.value)} />
          {errors.country && <span className="text-xs text-scam">{errors.country}</span>}
        </label>

        <label className="text-sm text-slate-300">
          Target degree
          <select className={inputClass} value={degree} onChange={(e) => setDegree(e.target.value)}>
            <option>Bachelors</option>
            <option>Masters</option>
            <option>PhD</option>
          </select>
        </label>

        <label className="text-sm text-slate-300">
          Financial need
          <select className={inputClass} value={need} onChange={(e) => setNeed(e.target.value)}>
            <option>Yes</option>
            <option>No</option>
          </select>
        </label>
      </div>

      <button
        type="submit"
        disabled={disabled}
        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-electric px-5 py-2.5 font-semibold text-white shadow-lg shadow-electric/30 transition hover:bg-electric/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Search size={18} />
        {disabled ? "Agents working..." : "Find Verified Opportunities"}
      </button>
    </form>
  );
}