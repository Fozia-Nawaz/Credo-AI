from typing import Any, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ApplicantProfile(BaseModel):
    model_config = ConfigDict(extra="forbid")

    major: str = Field(..., min_length=2, max_length=200)
    cgpa: float = Field(..., ge=0.0, le=5.0)
    domicile: Optional[str] = Field(default=None, min_length=2, max_length=200)
    target_degree: Optional[str] = Field(default=None, min_length=2, max_length=200)
    financial_need: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    target_country: Optional[str] = Field(default=None, min_length=2, max_length=200)

    @field_validator("major")
    @classmethod
    def normalize_major(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("major cannot be empty")
        return cleaned

    @field_validator("domicile", "target_degree", "target_country")
    @classmethod
    def normalize_optional_text(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        cleaned = value.strip()
        if not cleaned:
            return None
        return cleaned


class VerificationEvent(BaseModel):
    stage: str
    message: str
    final_data: Optional[dict[str, Any]] = None


class ScholarshipEvidence(BaseModel):
    model_config = ConfigDict(extra="allow")

    official_record: Optional[dict[str, Any]] = None
    aggregator_matches: list[dict[str, Any]] = Field(default_factory=list)
    conflict_details: list[str] = Field(default_factory=list)
    provider: Optional[str] = None
    funding: Optional[str] = None
    funding_amount: Optional[str] = None


class VerificationResponse(BaseModel):
    run_id: str
    status: Literal["success", "error"]
    message: str
    result: Optional[dict[str, Any]] = None


class VerificationRunStartResponse(BaseModel):
    run_id: str
    status: Literal["pending"]
    stream_url: str
    status_url: str


class VerificationRunStatusResponse(BaseModel):
    run_id: str
    status: Literal["pending", "running", "completed", "failed"]
    result: Optional[dict[str, Any]] = None
    error: Optional[str] = None


class HealthResponse(BaseModel):
    status: Literal["ok"]
    app: str
    sample_mode: bool
