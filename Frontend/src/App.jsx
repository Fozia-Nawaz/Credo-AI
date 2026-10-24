import { useEffect, useRef, useState } from "react";
import { runVerification } from "./services/api";
import Navbar from "./components/Navbar";
import StudentForm from "./components/StudentForm";
import OpportunityCard from "./components/OpportunityCard";
import LiveLogTerminal from "./components/LiveLogTerminal";
import EvidenceModal from "./components/EvidenceModal";

export default function App() {
  const [status, setStatus] = useState("idle"); // idle | running | done | error
  const [events, setEvents] = useState([]);
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const stopRef = useRef(() => {});

  // Stop any open stream when the page closes.
  useEffect(() => () => stopRef.current(), []);

  function handleSubmit(profile) {
    stopRef.current(); // stop a previous run, if any
    setEvents([]);
    setResults([]);
    setError("");
    setSelected(null);
    setStatus("running");

    stopRef.current = runVerification(
      profile,
      (event) => {
        setEvents((prev) => [...prev, event]);
        if (event.stage === "COMPLETE") {
          setResults(event.final_data?.results ?? []);
          setStatus("done");
        }
      },
      (err) => {
        setError(err.message);
        setStatus("error");
      }
    );
  }

  return (
    <div className="min-h-screen bg-navy-900 text-white">
      <Navbar status={status} />

      <main className="mx-auto max-w-7xl space-y-6 px-6 py-6">
        <StudentForm onSubmit={handleSubmit} disabled={status === "running"} />

        {error && (
          <div className="rounded-lg border border-scam/40 bg-scam/10 p-4 text-scam">
            Something went wrong: {error}. Check that the backend is running and try again.
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <section className="space-y-4 lg:col-span-7">
            {status === "idle" && (
              <p className="text-slate-400">Fill in your profile to search verified opportunities.</p>
            )}

            {status === "running" && results.length === 0 &&
              [1, 2, 3].map((n) => (
                <div key={n} className="h-36 animate-pulse rounded-xl bg-navy-800" />
              ))}

            {status === "done" && results.length === 0 && (
              <p className="text-slate-400">No matching opportunities were found for this profile.</p>
            )}

            {results.map((item) => (
              <OpportunityCard key={item.domain + item.title} item={item} onOpen={setSelected} />
            ))}
          </section>

          <aside className="lg:col-span-5">
            <LiveLogTerminal events={events} running={status === "running"} />
          </aside>
        </div>
      </main>

      <EvidenceModal item={selected} onClose={() => setSelected(null)} />
    </div>
  );
}