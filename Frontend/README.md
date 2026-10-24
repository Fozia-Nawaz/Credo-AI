# Credo AI Frontend

React + Vite + Tailwind UI for the Credo AI verification API.

## Run
1. Start the backend (see the repository README), with FRONTEND_ORIGIN allowing http://localhost:5173.
2. In this folder: `npm install`
3. Copy `.env.example` to `.env` (VITE_API_BASE_URL=http://127.0.0.1:8000, VITE_USE_MOCK=false)
4. `npm run dev`, then open http://localhost:5173

## Notes
- Results and trace events come from the backend. Nothing is computed in the browser.
- VITE_USE_MOCK=true plays a recorded sample of the pipeline output for UI work only.
- Times in the trace show when each event reached the browser.
