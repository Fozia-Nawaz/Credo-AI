# Credo AI Frontend

React + Vite + Tailwind interface for the Credo AI verification API (Track 02: The Agent That Can Explain Why).

## What it does
- Collects a student profile and sends it to the backend.
- Streams the agents' trace live (Planner, Zetaris, Reconciler, Trust Critic, Reporter).
- Shows each opportunity with a trust status (Verified, Conflicting dates, Scam rejected), an evidence drawer, and an audit page for rejected listings.
- Exports the results and trace as a JSON file.

## Run it
1. Start the backend (see the repository README). Set FRONTEND_ORIGIN to include http://localhost:5173.
2. In this folder: `npm install`
3. Copy `.env.example` to `.env`
4. `npm run dev`, then open http://localhost:5173

## Settings (.env)
- VITE_API_BASE_URL: backend address (default http://127.0.0.1:8000)
- VITE_USE_MOCK: `true` plays a recorded sample of the pipeline output for UI work only. Use `false` for real runs.

## Notes
- Results and trace events come from the backend. Nothing is calculated in the browser.
- Times in the trace show when each event reached the browser.
- Data in this build is generated sample data ("Demo data — illustrative only").
- Funding, eligibility match and per-source records appear only when the backend sends them.
- The sign-in screens are a simulated demo. No accounts or credentials are used.
