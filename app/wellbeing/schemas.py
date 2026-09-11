from pydantic import BaseModel, Field
from typing import Literal, Optional

SeverityBand = Literal["Minimal", "Mild", "Moderate", "Moderately Severe", "Severe"]


class PHQ9Evaluation(BaseModel):
    score: int = Field(..., ge=0, le=27, description="Total PHQ-9 score from 0 to 27")
    risk: float = Field(..., ge=0.0, le=1.0, description="Normalized risk score from 0.0 to 1.0")
    severity: SeverityBand = Field(..., description="Standardized clinical severity band")
    has_suicidal_ideation: bool = Field(False, description="Flagged if Question 9 response is greater than 0")
    coping_insight: Optional[str] = Field(None, description="Optional empathetic coping step or reflection")


class PatientWellbeingSummary(BaseModel):
    latest_score: Optional[int] = None
    latest_risk: Optional[float] = None
    latest_severity: Optional[str] = None
    has_active_risk_flag: bool = False
    assessment_count: int = 0
    journal_count_30d: int = 0
    sentiment_avg_30d: Optional[float] = None
    trend: Literal["improving", "stable", "declining", "insufficient_data"] = "insufficient_data"
    suggested_companion_posture: str = "compassionate-grounding"


class AssessmentSubmission(BaseModel):
    answers: Optional[list[int]] = None
    score: Optional[int] = None
    risk: Optional[float] = None


class AssessmentResponse(BaseModel):
    id: int
    score: int
    risk: float
    severity: str
    has_suicidal_ideation: bool = False
    coping_insight: Optional[str] = None
    createdAt: str
