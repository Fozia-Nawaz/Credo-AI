# Credo-AI
Credo AI by Team Dynasty AI — The Explainable Trust Engine (International GenAI Hackathon Track 02)

## Backend foundation and verification API

This repository contains the existing AI/data layer under `src/` plus a new FastAPI backend that adapts incoming applicant profiles to the current `MultiAgentPipeline` contract.

### Architecture

- `src/agents/planner.py`: parses applicant criteria and builds `search_params`.
- `src/agents/reconciler.py`: calls `ZetarisClient.query_scholarships()` and merges official, aggregator, and scam records.
- `src/agents/trust_critic.py`: evaluates trust badges, score, and scam rejection logic.
- `src/agents/reporter.py`: produces the final result payload.
- `src/pipeline.py`: orchestrates the 4-agent flow and yields real-time events, ending with a `COMPLETE` event whose `final_data` is the Reporter output.
- `src/zetaris_client.py`: uses the local CSV fallback when `SAMPLE_MODE=true`.
- `app/`: new backend adapter, schemas, run manager, and route handlers.

### Environment variables

Copy the repository `.env.example` and set values as needed:

- `SAMPLE_MODE=true` keeps live sample CSV fallback enabled.
- `FRONTEND_ORIGIN=http://localhost:3000` configures CORS for the frontend.
- `ZETARIS_CLOUD_URL` and `ZETARIS_API_KEY` are supported for future live Zetaris usage.
- `PORT=8000` sets the server port.

### Windows PowerShell setup

```powershell
cd C:\Users\mahak\Desktop\Credo-AI
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

If the system Python on this machine is not compatible with the installed packages, use the project-supported interpreter that matches the repo environment (for example Python 3.12).

### Start the API

```powershell
cd C:\Users\mahak\Desktop\Credo-AI
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### Health check

```powershell
curl.exe http://127.0.0.1:8000/health
```

Expected response:

```json
{"status": "ok", "app": "Credo AI Verification API", "sample_mode": true}
```

### Verification request example

```powershell
curl.exe -X POST http://127.0.0.1:8000/api/v1/verify `
  -H "Content-Type: application/json" `
  -d '{
    "major": "Computer Science",
    "cgpa": 3.8,
    "domicile": "Islamabad",
    "target_degree": "Master",
    "financial_need": 0.6,
    "target_country": "Pakistan / Global"
  }'
```

### Request schema

The API accepts an applicant profile with these fields:

- `major` (required): scholarship subject area, e.g. `Computer Science`
- `cgpa` (required): numeric value from 0.0 to 5.0
- `domicile` (optional): applicant’s location
- `target_degree` (optional): `Master`, `PhD`, etc.
- `financial_need` (optional): normalized float from 0.0 to 1.0
- `target_country` (optional): destination region or country

The backend converts this into the exact profile format expected by `MultiAgentPipeline.run_pipeline_stream(profile)`, including the uppercase `major` and the `target_country` default used by the original pipeline.

### Response schema

The verification endpoint responds with:

```json
{
  "run_id": "uuid-string",
  "status": "success",
  "message": "Verification completed.",
  "result": {
    "status": "success",
    "search_summary": {"major": "COMPUTER SCIENCE", "min_cgpa": 3.8, "target_country": "Pakistan / Global", "filter_scams": true},
    "total_opportunities_found": 5,
    "results": [
      {
        "title": "Chevening UK Scholarship",
        "scholarship_id": "SCH_003",
        "domain": "chevening.org",
        "badge": "VERIFIED",
        "trust_score": 100,
        "deadline": "2026-11-05",
        "application_fee": 0,
        "audit_proof": "Domain chevening.org verified against official database. Fee verified as $0."
      }
    ],
    "agent_reasoning_trace": ["[PLANNER] ..."]
  }
}
```

`run_id` is a unique identifier for the completed synchronous verification run.

## Managed verification runs and SSE progress

The streaming API runs the same `MultiAgentPipeline.run_pipeline_stream(profile)` generator in a background thread. The existing `POST /api/v1/verify` endpoint remains synchronous and compatible.

### Start a managed run

Send the same applicant profile as for `/api/v1/verify` to `POST /api/v1/verify/runs`. The endpoint returns HTTP `202 Accepted` promptly with a run ID and URLs:

```powershell
curl.exe -X POST http://127.0.0.1:8000/api/v1/verify/runs `
  -H "Content-Type: application/json" `
  -d '{"major":"Computer Science","cgpa":3.8,"target_country":"Pakistan / Global"}'
```

```json
{
  "run_id": "uuid-string",
  "status": "pending",
  "stream_url": "/api/v1/stream-logs?run_id=uuid-string",
  "status_url": "/api/v1/verify/runs/uuid-string"
}
```

`status` reports the initial accepted state; the background worker can advance before this response reaches the client. The run lifecycle is `pending` → `running` → `completed` or `failed`. Poll `GET /api/v1/verify/runs/{run_id}` for its current state, final Reporter payload (`result`) or safe error message (`error`). Unknown IDs return HTTP `404`.

### Subscribe to progress

Connect to the returned `stream_url` with an SSE client. A new subscriber receives all retained events from the start; reconnecting clients can send `Last-Event-ID` to resume after that event. The endpoint returns `text/event-stream`, emits each event with an incrementing SSE `id`, the pipeline stage as `event`, JSON event data, and a blank line separator. `COMPLETE.final_data` is the actual Reporter output from the pipeline.

```powershell
curl.exe -N "http://127.0.0.1:8000/api/v1/stream-logs?run_id=<run-id>"
```

The real pipeline emits stage names including `PLANNER`, `RECONCILER`, `TRUST_CRITIC`, and `REPORTER`. For example:

```text
id: 1
event: PLANNER
data: {"stage":"PLANNER","message":"Parsing student profile criteria...","run_id":"uuid-string"}

id: 2
event: PLANNER
data: {"stage":"PLANNER","message":"[PLANNER] Parsed profile criteria -> Major: COMPUTER SCIENCE, CGPA: 3.8","run_id":"uuid-string"}
```

The terminal success event includes all fields supplied by the existing Reporter (`status`, `search_summary`, `total_opportunities_found`, `results`, and `agent_reasoning_trace`):

This example frame uses illustrative values and an illustrative event ID; `results` and trace contents come from the actual run.

```text
id: 9
event: COMPLETE
data: {"stage":"COMPLETE","message":"Pipeline execution complete.","final_data":{"status":"success","search_summary":{"major":"COMPUTER SCIENCE","min_cgpa":3.8,"target_country":"Pakistan / Global","filter_scams":true},"total_opportunities_found":1,"results":[{"title":"Example scholarship","scholarship_id":"SCH_001","domain":"example.org","badge":"VERIFIED","trust_score":100,"deadline":"2026-11-05","application_fee":0,"audit_proof":"..."}],"agent_reasoning_trace":["[PLANNER] ..."]},"run_id":"uuid-string"}
```

If pipeline execution fails, the stream ends with a backend failure event; exception details and configuration are not exposed:

```text
id: 3
event: FAILED
data: {"stage":"FAILED","status":"failed","message":"Verification pipeline failed.","run_id":"uuid-string"}
```

`Last-Event-ID` must be a non-negative integer; invalid values return HTTP `400`. Unknown runs return HTTP `404`. The SSE generator also emits comment heartbeats while the pipeline is quiet.

### Local sample-mode behavior

The backend respects the existing `src/zetaris_client.py` logic. When `SAMPLE_MODE=true`, the Zetaris client reads the three committed CSV files under `data/` and does not require a live cloud API call. This allows local testing without modifying the teammate’s dataset files or regenerating them.

The cloud branch in `src/zetaris_client.py` is still a placeholder; these endpoints do not claim live Zetaris cloud querying is implemented.

### Local setup and stream testing

For Python 3.12 on Windows, create and activate the virtual environment, install dependencies, then start the app:

```powershell
py -3.12 -m venv .venv312
.\.venv312\Scripts\Activate.ps1
python -m pip install -r requirements.txt
$env:SAMPLE_MODE = "true"
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

In another PowerShell window, start a managed run, copy its `run_id`, then use `curl.exe -N` with that ID as shown above. The client may also connect to `stream_url` directly. When using browser `EventSource`, first POST the profile with `fetch`, then construct `new EventSource(response.stream_url)`.

The run manager is in-memory and process-local: active runs and retained events are lost on server restart, and multiple server worker processes do not share run state. Completed and failed runs (including their event history) are retained for up to 24 hours, after which expired records are cleaned during run-manager access. Keep a single Uvicorn worker for this implementation.

### Testing

```powershell
cd C:\Users\mahak\Desktop\Credo-AI
.\.venv312\Scripts\python.exe -m pytest -q
```

The suite covers startup, health, validation, synchronous API compatibility, managed run lifecycle, in-progress and replayed SSE events, Reporter payloads, failure handling, and error responses.
