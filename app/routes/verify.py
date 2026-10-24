import asyncio
import json
from collections.abc import AsyncIterator

from fastapi import APIRouter
from fastapi import Header, HTTPException, Request, Response
from fastapi.encoders import jsonable_encoder
from fastapi.responses import StreamingResponse

from app.config import settings
from app.schemas import (
    ApplicantProfile,
    HealthResponse,
    VerificationResponse,
    VerificationRunStartResponse,
    VerificationRunStatusResponse,
)
from app.services.verification_service import VerificationService

router = APIRouter()
verification_service = VerificationService()
SSE_HEARTBEAT_SECONDS = 15.0


@router.get("/health", response_model=HealthResponse)
def health() -> dict:
    return {"status": "ok", "app": settings.app_name, "sample_mode": settings.sample_mode}


@router.post("/api/v1/verify", response_model=VerificationResponse)
def verify_profile(profile: ApplicantProfile) -> dict:
    return verification_service.verify(profile)


@router.post(
    "/api/v1/verify/runs",
    response_model=VerificationRunStartResponse,
    status_code=202,
)
def start_verification(profile: ApplicantProfile) -> dict:
    run_id = verification_service.start(profile)
    return {
        "run_id": run_id,
        "status": "pending",
        "stream_url": f"/api/v1/stream-logs?run_id={run_id}",
        "status_url": f"/api/v1/verify/runs/{run_id}",
    }


@router.get(
    "/api/v1/verify/runs/{run_id}",
    response_model=VerificationRunStatusResponse,
)
def get_verification_run(run_id: str) -> dict:
    run = verification_service.run_manager.get_run(run_id)
    if run is None:
        raise HTTPException(status_code=404, detail="Unknown run_id.")
    return {
        "run_id": run["run_id"],
        "status": run["status"],
        "result": run["result"],
        "error": run["error"],
    }


async def stream_run_events(
    request: Request,
    run_id: str,
    after_event_id: int,
) -> AsyncIterator[str]:
    manager = verification_service.run_manager
    cursor = after_event_id
    while True:
        if await request.is_disconnected():
            return

        updates, status = await asyncio.to_thread(
            manager.wait_for_updates,
            run_id,
            cursor,
            SSE_HEARTBEAT_SECONDS,
        )
        for event_id, event in updates:
            stage = event.get("stage", "progress")
            payload = json.dumps(
                jsonable_encoder(event),
                ensure_ascii=False,
                separators=(",", ":"),
            )
            yield f"id: {event_id}\nevent: {stage}\ndata: {payload}\n\n"
            cursor = event_id

        if status in {"completed", "failed"} and not updates:
            return
        if not updates and status not in {"completed", "failed"}:
            yield ": keep-alive\n\n"


@router.get("/api/v1/stream-logs")
async def stream_verification(
    request: Request,
    run_id: str,
    last_event_id: str | None = Header(default=None, alias="Last-Event-ID"),
) -> Response:
    run = verification_service.run_manager.get_run(run_id)
    if run is None:
        raise HTTPException(status_code=404, detail="Unknown run_id.")

    try:
        after_event_id = int(last_event_id) if last_event_id is not None else 0
        if after_event_id < 0:
            raise ValueError
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail="Last-Event-ID must be a non-negative integer.",
        ) from exc

    return StreamingResponse(
        stream_run_events(request, run_id, after_event_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )
