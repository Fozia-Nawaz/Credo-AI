from __future__ import annotations

from copy import deepcopy
import time
import uuid
from threading import Condition, RLock
from typing import Any


class RunManager:
    RETENTION_SECONDS = 24 * 60 * 60

    def __init__(self) -> None:
        self._condition = Condition(RLock())
        self._runs: dict[str, dict[str, Any]] = {}

    def _cleanup_expired_runs(self, now: float) -> None:
        expired = [
            run_id
            for run_id, run in self._runs.items()
            if run["status"] in {"completed", "failed"}
            and now - run["updated_at"] >= self.RETENTION_SECONDS
        ]
        for run_id in expired:
            del self._runs[run_id]

    def create_run(self) -> str:
        run_id = str(uuid.uuid4())
        now = time.time()
        with self._condition:
            self._cleanup_expired_runs(now)
            self._runs[run_id] = {
                "run_id": run_id,
                "status": "pending",
                "events": [],
                "result": None,
                "error": None,
                "created_at": now,
                "updated_at": now,
            }
            self._condition.notify_all()
        return run_id

    def _get_mutable_run(self, run_id: str) -> dict[str, Any]:
        run = self._runs.get(run_id)
        if run is None:
            raise KeyError(f"Unknown run_id: {run_id}")
        return run

    def mark_running(self, run_id: str) -> None:
        with self._condition:
            run = self._get_mutable_run(run_id)
            if run["status"] != "pending":
                raise RuntimeError(f"Cannot start run in {run['status']} state.")
            run["status"] = "running"
            run["updated_at"] = time.time()
            self._condition.notify_all()

    def record_event(self, run_id: str, event: dict[str, Any]) -> None:
        with self._condition:
            run = self._get_mutable_run(run_id)
            if run["status"] not in {"pending", "running"}:
                raise RuntimeError(f"Cannot record an event in {run['status']} state.")
            if run["status"] == "pending":
                run["status"] = "running"
            recorded_event = deepcopy(event)
            recorded_event["run_id"] = run_id
            run["events"].append(recorded_event)
            run["updated_at"] = time.time()
            self._condition.notify_all()

    def complete_run(self, run_id: str, result: dict[str, Any]) -> None:
        with self._condition:
            run = self._get_mutable_run(run_id)
            if run["status"] != "running":
                raise RuntimeError(f"Cannot complete run in {run['status']} state.")
            run["status"] = "completed"
            run["result"] = deepcopy(result)
            run["updated_at"] = time.time()
            self._condition.notify_all()

    def fail_run(self, run_id: str, safe_error: str) -> None:
        with self._condition:
            run = self._get_mutable_run(run_id)
            if run["status"] not in {"pending", "running"}:
                raise RuntimeError(f"Cannot fail run in {run['status']} state.")
            run["status"] = "failed"
            run["error"] = safe_error
            failure_event = {
                "stage": "FAILED",
                "status": "failed",
                "message": safe_error,
                "run_id": run_id,
            }
            run["events"].append(failure_event)
            run["updated_at"] = time.time()
            self._condition.notify_all()

    def get_run(self, run_id: str) -> dict[str, Any] | None:
        with self._condition:
            self._cleanup_expired_runs(time.time())
            run = self._runs.get(run_id)
            return deepcopy(run) if run is not None else None

    def wait_for_updates(
        self, run_id: str, after_event_id: int, timeout: float
    ) -> tuple[list[tuple[int, dict[str, Any]]], str]:
        with self._condition:
            run = self._get_mutable_run(run_id)
            self._condition.wait_for(
                lambda: len(run["events"]) > after_event_id
                or run["status"] in {"completed", "failed"},
                timeout=timeout,
            )
            updates = [
                (index, deepcopy(event))
                for index, event in enumerate(run["events"], start=1)
                if index > after_event_id
            ]
            return updates, run["status"]
