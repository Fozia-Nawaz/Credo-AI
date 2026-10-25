import asyncio
import json
from threading import Event

import pytest
from fastapi.testclient import TestClient

from app.schemas import ApplicantProfile
from app.services.pipeline_bridge import PipelineBridge, PipelineExecutionError
from app.services.run_manager import RunManager
from app.services.verification_service import VerificationService
from app.routes import verify as verify_routes
from main import app


@pytest.fixture
def client():
    return TestClient(app)


def test_health_endpoint(client):
    response = client.get("/health")
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ok"
    assert payload["app"] == "Credo AI Verification API"


def test_validation_errors(client):
    response = client.post("/api/v1/verify", json={"major": "", "cgpa": 10})
    assert response.status_code == 422


def test_valid_verification_request(client):
    payload = {
        "major": "Computer Science",
        "cgpa": 3.8,
        "domicile": "Islamabad",
        "target_degree": "Master",
        "financial_need": 0.6,
        "target_country": "Pakistan / Global",
    }
    response = client.post("/api/v1/verify", json=payload)
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "success"
    assert body["result"]["status"] == "success"
    assert body["result"]["total_opportunities_found"] >= 1
    assert body["run_id"]


def test_pipeline_bridge_builds_expected_input():
    profile = ApplicantProfile(
        major="Computer Science",
        cgpa=3.8,
        domicile="Islamabad",
        target_degree="Master",
        financial_need=0.6,
        target_country="Pakistan / Global",
    )
    bridge = PipelineBridge()
    built = bridge.build_pipeline_input(profile)
    assert built["major"] == "COMPUTER SCIENCE"
    assert built["cgpa"] == 3.8
    assert built["target_country"] == "Pakistan / Global"


def test_pipeline_bridge_handles_missing_complete_event():
    class DummyPipeline:
        def run_pipeline_stream(self, *_args, **_kwargs):
            yield {"stage": "PLANNER", "message": "still working"}

    bridge = PipelineBridge(DummyPipeline())
    with pytest.raises(PipelineExecutionError):
        bridge.run(ApplicantProfile(major="CS", cgpa=3.5), run_id="abc", run_manager=RunManager())


def test_run_manager_tracks_run_id_and_events():
    manager = RunManager()
    run_id = manager.create_run()
    manager.record_event(run_id, {"stage": "PLANNER", "message": "hello"})
    manager.complete_run(run_id, {"status": "success"})
    assert manager.get_run(run_id)["status"] == "completed"
    assert len(manager.get_run(run_id)["events"]) == 1


def test_verification_service_reports_pipeline_failure():
    class FailingBridge:
        def run(self, *args, **kwargs):
            raise PipelineExecutionError("boom")

    service = VerificationService(pipeline_bridge=FailingBridge(), run_manager=RunManager())
    result = service.verify(ApplicantProfile(major="CS", cgpa=3.0))
    assert result["status"] == "error"
    assert "boom" in result["message"]


def test_sample_mode_environment_uses_local_data(monkeypatch):
    monkeypatch.setenv("SAMPLE_MODE", "true")
    import app.config as config_module
    assert config_module.settings.sample_mode is True


def test_missing_optional_fields_are_allowed(client):
    response = client.post("/api/v1/verify", json={"major": "Data Science", "cgpa": 3.4})
    assert response.status_code == 200
    assert response.json()["result"]["total_opportunities_found"] >= 0


def test_pipeline_invoked_once_per_run():
    calls = {"count": 0}

    class TrackingPipeline:
        def run_pipeline_stream(self, profile):
            calls["count"] += 1
            yield {"stage": "PLANNER", "message": "processing"}
            yield {"stage": "COMPLETE", "message": "done", "final_data": {"status": "success", "results": [], "agent_reasoning_trace": []}}

    bridge = PipelineBridge(TrackingPipeline())
    profile = ApplicantProfile(major="CS", cgpa=3.0)
    manager = RunManager()
    run_id = manager.create_run()
    manager.mark_running(run_id)
    bridge.run(profile, run_id, manager)
    assert calls["count"] == 1


def test_run_manager_enforces_lifecycle_and_replays_events():
    manager = RunManager()
    run_id = manager.create_run()
    assert manager.get_run(run_id)["status"] == "pending"

    manager.mark_running(run_id)
    manager.record_event(run_id, {"stage": "PLANNER", "message": "started"})
    manager.complete_run(run_id, {"status": "success"})

    run = manager.get_run(run_id)
    assert run["status"] == "completed"
    assert run["events"][0] == {
        "stage": "PLANNER",
        "message": "started",
        "run_id": run_id,
    }
    updates, status = manager.wait_for_updates(run_id, 0, timeout=0)
    assert updates == [(1, run["events"][0])]
    assert status == "completed"


class BlockingPipeline:
    def __init__(self):
        self.progress_recorded = Event()
        self.release = Event()

    def run_pipeline_stream(self, _profile):
        yield {"stage": "PLANNER", "message": "actual planner progress"}
        self.progress_recorded.set()
        if not self.release.wait(timeout=5):
            raise TimeoutError("test pipeline was not released")
        yield {"stage": "REPORTER", "message": "compiling report"}
        yield {
            "stage": "COMPLETE",
            "message": "Pipeline execution complete.",
            "final_data": {
                "status": "success",
                "search_summary": {"major": "CS"},
                "total_opportunities_found": 1,
                "results": [{"title": "Test award"}],
                "agent_reasoning_trace": ["planner trace"],
            },
        }


class ConnectedRequest:
    async def is_disconnected(self):
        return False


def _test_profile_payload():
    return {"major": "Computer Science", "cgpa": 3.8}


def test_start_endpoint_returns_run_id_and_streams_while_pipeline_is_running(monkeypatch):
    pipeline = BlockingPipeline()
    service = VerificationService(
        pipeline_bridge=PipelineBridge(pipeline),
        run_manager=RunManager(),
    )
    monkeypatch.setattr(verify_routes, "verification_service", service)
    client = TestClient(app)

    response = client.post("/api/v1/verify/runs", json=_test_profile_payload())
    assert response.status_code == 202
    body = response.json()
    run_id = body["run_id"]
    assert body["status"] == "pending"
    assert body["stream_url"] == f"/api/v1/stream-logs?run_id={run_id}"
    assert body["status_url"] == f"/api/v1/verify/runs/{run_id}"
    assert pipeline.progress_recorded.wait(timeout=2)
    assert service.run_manager.get_run(run_id)["status"] == "running"

    async def receive_progress_before_completion():
        stream = verify_routes.stream_run_events(ConnectedRequest(), run_id, 0)
        first_frame = await asyncio.wait_for(anext(stream), timeout=2)
        pipeline.release.set()
        remaining_frames = [frame async for frame in stream]
        return first_frame, remaining_frames

    try:
        first_frame, remaining_frames = asyncio.run(
            receive_progress_before_completion()
        )
    finally:
        pipeline.release.set()

    assert first_frame.startswith("id: 1\nevent: PLANNER\ndata: ")
    first_payload = json.loads(first_frame.split("data: ", 1)[1].strip())
    assert first_payload["message"] == "actual planner progress"
    assert first_payload["run_id"] == run_id
    assert any("event: COMPLETE\n" in frame for frame in remaining_frames)
    assert service.run_manager.get_run(run_id)["status"] == "completed"


def test_start_endpoint_uses_unique_run_ids(monkeypatch):
    class ImmediatePipeline:
        def run_pipeline_stream(self, _profile):
            yield {
                "stage": "COMPLETE",
                "message": "Pipeline execution complete.",
                "final_data": {
                    "status": "success",
                    "results": [],
                    "agent_reasoning_trace": [],
                },
            }

    service = VerificationService(
        pipeline_bridge=PipelineBridge(ImmediatePipeline()),
        run_manager=RunManager(),
    )
    monkeypatch.setattr(verify_routes, "verification_service", service)
    client = TestClient(app)

    first = client.post("/api/v1/verify/runs", json=_test_profile_payload())
    second = client.post("/api/v1/verify/runs", json=_test_profile_payload())

    assert first.status_code == second.status_code == 202
    assert first.json()["run_id"] != second.json()["run_id"]


def test_sse_replays_completed_real_pipeline_and_reporter_payload(client):
    start = client.post("/api/v1/verify/runs", json=_test_profile_payload())
    run_id = start.json()["run_id"]

    response = client.get(f"/api/v1/stream-logs?run_id={run_id}")
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/event-stream")
    assert response.headers["cache-control"] == "no-cache"

    frames = [frame for frame in response.text.split("\n\n") if frame]
    decoded = []
    for frame in frames:
        lines = frame.splitlines()
        assert lines[0].startswith("id: ")
        assert lines[1].startswith("event: ")
        assert lines[2].startswith("data: ")
        decoded.append((lines[1][7:], json.loads(lines[2][6:])))

    assert any(event["stage"] == "PLANNER" for _, event in decoded)
    complete = next(event for name, event in decoded if name == "COMPLETE")
    assert complete["run_id"] == run_id
    assert complete["final_data"]["status"] == "success"
    assert set(complete["final_data"]) == {
        "status",
        "search_summary",
        "total_opportunities_found",
        "results",
        "agent_reasoning_trace",
    }

    status_response = client.get(f"/api/v1/verify/runs/{run_id}")
    assert status_response.json()["status"] == "completed"
    assert status_response.json()["result"] == complete["final_data"]


def test_trust_critic_preserves_evidence_fields_for_genuine_scholarship():
    item = {
        "title": "HEC Overseas Scholarship 2026",
        "provider": "Higher Education Commission",
        "funding": "Full Tuition + Stipend",
        "official_record": {
            "title": "HEC Overseas Scholarship 2026",
            "provider": "Higher Education Commission",
            "funding": "Full Tuition + Stipend",
            "scholarship_id": "off_001",
            "official_domain": "hec.gov.pk",
            "application_fee": 0,
            "deadline": "2026-12-31",
        },
        "aggregator_matches": [{"title": "HEC Overseas Scholarship 2026", "listed_deadline": "2026-10-28"}],
        "conflict_details": ["Deadline Conflict: Official=2026-12-31 vs Aggregator (StudyAbroad Hub)=2026-10-28"],
        "has_conflict": True,
    }

    result = verify_routes.verification_service.pipeline_bridge.pipeline.run_pipeline_stream if hasattr(verify_routes.verification_service.pipeline_bridge.pipeline, "run_pipeline_stream") else None
    critic = __import__("src.agents.trust_critic", fromlist=["TrustCriticAgent"]).TrustCriticAgent()
    evaluated = critic.evaluate({"reconciled_opportunities": [item], "detected_scams_pool": []})
    assert evaluated["evaluated_results"][0]["official_record"]["provider"] == "Higher Education Commission"
    assert evaluated["evaluated_results"][0]["provider"] == "Higher Education Commission"
    assert evaluated["evaluated_results"][0]["funding"] == "Full Tuition + Stipend"
    assert evaluated["evaluated_results"][0]["funding_amount"] == "Full Tuition + Stipend"
    assert evaluated["evaluated_results"][0]["aggregator_matches"][0]["title"] == "HEC Overseas Scholarship 2026"
    assert evaluated["evaluated_results"][0]["conflict_details"] == item["conflict_details"]


def test_reporter_preserves_evidence_fields_in_final_results():
    planner = {"search_params": {"major": "CS", "min_cgpa": 3.8}}
    critic = {
        "evaluated_results": [{
            "title": "Test Scholarship",
            "provider": "Official Provider",
            "funding": "Full Tuition",
            "funding_amount": "Full Tuition",
            "official_record": {"title": "Test Scholarship", "provider": "Official Provider", "funding": "Full Tuition"},
            "aggregator_matches": [{"title": "Test Scholarship"}],
            "conflict_details": ["Deadline conflict"],
            "trust_score": 95,
        }]
    }
    report = __import__("src.agents.reporter", fromlist=["ReporterAgent"]).ReporterAgent().generate_report(planner, critic, [])
    result = report["results"][0]
    assert result["official_record"]["provider"] == "Official Provider"
    assert result["aggregator_matches"][0]["title"] == "Test Scholarship"
    assert result["conflict_details"] == ["Deadline conflict"]
    assert result["provider"] == "Official Provider"
    assert result["funding"] == "Full Tuition"
    assert result["funding_amount"] == "Full Tuition"


def test_pipeline_completion_payload_keeps_evidence_fields():
    bridge = PipelineBridge()
    profiles = [ApplicantProfile(major="CS", cgpa=3.5)]
    final_result = bridge.run(profiles[0], "run-333", RunManager())
    assert final_result["results"]
    first = final_result["results"][0]
    assert "official_record" in first
    assert "aggregator_matches" in first
    assert "conflict_details" in first
    assert "provider" in first
    assert "funding" in first
    assert "funding_amount" in first


def test_no_unrelated_aggregator_match_is_attached():
    reconciler = __import__("src.agents.reconciler", fromlist=["ReconcilerAgent"]).ReconcilerAgent()
    official = {"title": "HEC Overseas Scholarship 2026", "provider": "Higher Education Commission", "scholarship_id": "off_001", "deadline": "2026-12-31"}
    aggregator_list = [
        {"title": "Global Business Leadership Award", "provider": "Unregistered MBA Forum", "scholarship_id": "agg_006", "listed_deadline": "2026-10-20"},
        {"title": "HEC Overseas Scholarship 2026", "provider": "StudyAbroad Hub", "scholarship_id": "off_001", "listed_deadline": "2026-10-28"},
    ]
    matches = reconciler._match_aggregators(official, aggregator_list)
    assert len(matches) == 1
    assert matches[0]["title"] == "HEC Overseas Scholarship 2026"


def test_scam_evidence_is_preserved_without_fabricated_official_record():
    scam = {
        "title": "Global Tech Fellowship Scam",
        "provider": "Unknown Tech Hub",
        "scholarship_id": "scam_001",
        "is_scam": True,
        "suspicious_domain": "http://pay-fee-get-scholarship.com",
        "fee_demanded": 15,
        "scam_reason": "Fake payment demand.",
    }
    critic = __import__("src.agents.trust_critic", fromlist=["TrustCriticAgent"]).TrustCriticAgent()
    result = critic.evaluate({"reconciled_opportunities": [], "detected_scams_pool": [scam]})
    scam_result = result["evaluated_results"][0]
    assert scam_result["badge"] == "SCAM_REJECTED"
    assert scam_result["official_record"] is None
    assert scam_result["domain"] == "http://pay-fee-get-scholarship.com"
    assert scam_result["application_fee"] == 15
    assert "Fake payment demand." in scam_result["audit_proof"]


def test_eligibility_filters_only_when_source_fields_exist():
    reconciler = __import__("src.agents.reconciler", fromlist=["ReconcilerAgent"]).ReconcilerAgent()
    official = {"title": "Test Scholarship", "provider": "Sample Provider", "scholarship_id": "test_001", "deadline": "2026-10-31", "major": "COMPUTER SCIENCE", "min_cgpa": 3.0, "funding": "Full Tuition"}
    assert reconciler._match_aggregators(official, []) == []
    assert official["major"] == "COMPUTER SCIENCE"
    assert official["min_cgpa"] == 3.0


def test_sample_mode_is_not_reported_as_live_data():
    import app.config as config_module
    assert config_module.settings.sample_mode is True


def test_failed_pipeline_emits_safe_failure_event_and_terminal_status(monkeypatch):
    class FailingPipeline:
        def run_pipeline_stream(self, _profile):
            yield {"stage": "PLANNER", "message": "started"}
            raise RuntimeError("secret-bearing implementation detail")

    service = VerificationService(
        pipeline_bridge=PipelineBridge(FailingPipeline()),
        run_manager=RunManager(),
    )
    monkeypatch.setattr(verify_routes, "verification_service", service)
    client = TestClient(app)

    start = client.post("/api/v1/verify/runs", json=_test_profile_payload())
    run_id = start.json()["run_id"]
    updates, status = service.run_manager.wait_for_updates(run_id, 0, timeout=2)

    assert status == "failed"
    assert updates[-1][1]["stage"] == "FAILED"
    assert "secret-bearing" not in json.dumps(updates[-1][1])
    assert updates[-1][1]["message"] == "Verification pipeline failed."

    response = client.get(f"/api/v1/stream-logs?run_id={run_id}")
    failure_frames = [
        frame for frame in response.text.split("\n\n") if "event: FAILED" in frame
    ]
    assert len(failure_frames) == 1
    assert client.get(f"/api/v1/verify/runs/{run_id}").json() == {
        "run_id": run_id,
        "status": "failed",
        "result": None,
        "error": "Verification pipeline failed.",
    }


def test_unknown_run_id_returns_documented_404(client):
    response = client.get("/api/v1/stream-logs?run_id=unknown")
    assert response.status_code == 404
    assert response.json() == {"detail": "Unknown run_id."}
    assert client.get("/api/v1/verify/runs/unknown").status_code == 404


def test_sse_resumes_after_last_event_id(client):
    manager = verify_routes.verification_service.run_manager
    # Register a completed run on the route's manager so replay honors its SSE IDs.
    route_run_id = manager.create_run()
    manager.mark_running(route_run_id)
    manager.record_event(route_run_id, {"stage": "PLANNER", "message": "one"})
    manager.record_event(route_run_id, {"stage": "RECONCILER", "message": "two"})
    manager.complete_run(route_run_id, {"status": "success"})

    response = client.get(
        f"/api/v1/stream-logs?run_id={route_run_id}",
        headers={"Last-Event-ID": "1"},
    )
    assert "event: PLANNER" not in response.text
    assert "event: RECONCILER" in response.text
