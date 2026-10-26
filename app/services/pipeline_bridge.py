from __future__ import annotations

import json
from typing import Any

from src.pipeline import MultiAgentPipeline

from app.schemas import ApplicantProfile
from app.services.run_manager import RunManager


class PipelineExecutionError(RuntimeError):
    """Raised when the AI pipeline fails or returns malformed output."""


class PipelineBridge:
    def __init__(self, pipeline: MultiAgentPipeline | None = None) -> None:
        self.pipeline = pipeline or MultiAgentPipeline()

    def build_pipeline_input(self, profile: ApplicantProfile) -> str:
        # Dictionary ke bajaye JSON/Text String bhejen taake pipeline.py aur agents sahi parse karen
        payload = profile.model_dump(exclude_none=True)
        payload["major"] = str(payload.get("major", "CS")).strip().upper() or "CS"
        payload["cgpa"] = float(payload["cgpa"])
        payload["target_country"] = payload.get("target_country") or "Any"
        return json.dumps(payload)

    def normalize_final_result(self, final_data: Any) -> dict[str, Any]:
        if not isinstance(final_data, dict):
            raise PipelineExecutionError("Pipeline returned a malformed final result.")

        normalized = dict(final_data)
        if "status" not in normalized:
            normalized["status"] = "success"
        if "results" not in normalized:
            normalized["results"] = []
        if "agent_reasoning_trace" not in normalized:
            normalized["agent_reasoning_trace"] = []
            
        # Ensure total opportunities match all 3 categories (Verified, Discrepancy, Scam)
        results_list = normalized.get("results", [])
        normalized["total_opportunities_found"] = len(results_list)
        
        return normalized

    def run(self, profile: ApplicantProfile, run_id: str, run_manager: RunManager | None = None) -> dict[str, Any]:
        pipeline_input = self.build_pipeline_input(profile)
        final_data = None

        try:
            for event in self.pipeline.run_pipeline_stream(pipeline_input):
                if run_manager is not None:
                    run_manager.record_event(run_id, event)
                if event.get("stage") == "COMPLETE":
                    final_data = event.get("final_data") or event.get("payload")
                    break
        except Exception as exc:
            raise PipelineExecutionError("Pipeline execution failed.") from exc

        if final_data is None:
            raise PipelineExecutionError("Pipeline did not produce a final COMPLETE event.")

        normalized = self.normalize_final_result(final_data)
        if run_manager is not None:
            run_manager.complete_run(run_id, normalized)
        return normalized