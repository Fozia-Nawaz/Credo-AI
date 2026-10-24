from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor

from app.schemas import ApplicantProfile
from app.services.pipeline_bridge import PipelineBridge, PipelineExecutionError
from app.services.run_manager import RunManager


class VerificationService:
    SAFE_FAILURE_MESSAGE = "Verification pipeline failed."

    def __init__(
        self,
        pipeline_bridge: PipelineBridge | None = None,
        run_manager: RunManager | None = None,
        executor: ThreadPoolExecutor | None = None,
    ) -> None:
        self.pipeline_bridge = pipeline_bridge or PipelineBridge()
        self.run_manager = run_manager or RunManager()
        self.executor = executor or ThreadPoolExecutor(
            max_workers=4, thread_name_prefix="verification"
        )

    def start(self, profile: ApplicantProfile) -> str:
        run_id = self.run_manager.create_run()
        try:
            self.executor.submit(self._execute_run, profile, run_id)
        except Exception:
            self.run_manager.fail_run(run_id, self.SAFE_FAILURE_MESSAGE)
            raise
        return run_id

    def _execute_run(self, profile: ApplicantProfile, run_id: str) -> None:
        try:
            self.run_manager.mark_running(run_id)
            self.pipeline_bridge.run(profile, run_id, self.run_manager)
        except Exception:
            self.run_manager.fail_run(run_id, self.SAFE_FAILURE_MESSAGE)

    def verify(self, profile: ApplicantProfile) -> dict:
        run_id = self.run_manager.create_run()
        self.run_manager.mark_running(run_id)
        try:
            result = self.pipeline_bridge.run(profile, run_id, self.run_manager)
            return {
                "run_id": run_id,
                "status": "success",
                "message": "Verification completed.",
                "result": result,
            }
        except PipelineExecutionError as exc:
            self.run_manager.fail_run(run_id, self.SAFE_FAILURE_MESSAGE)
            return {
                "run_id": run_id,
                "status": "error",
                "message": str(exc),
                "result": None,
            }
