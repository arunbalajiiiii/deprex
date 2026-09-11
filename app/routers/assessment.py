from fastapi import APIRouter, Depends
from typing import Optional

from app.models.database import User
from app.auth import get_current_user
from app.wellbeing import (
    WellbeingService,
    get_wellbeing_service,
    AssessmentSubmission,
    PatientWellbeingSummary,
)

router = APIRouter(prefix="/assessment", tags=["assessment"])


@router.post("/", status_code=201)
async def save_assessment(
    body: AssessmentSubmission,
    user: User = Depends(get_current_user),
    wellbeing: WellbeingService = Depends(get_wellbeing_service),
):
    """
    Record a PHQ-9 assessment. Clinical scores, severity bands, and audit events
    are calculated and recorded atomically on the server.
    """
    result = await wellbeing.record_assessment(user=user, submission=body)
    return result.model_dump()


@router.get("/latest")
async def get_latest(
    user: User = Depends(get_current_user),
    wellbeing: WellbeingService = Depends(get_wellbeing_service),
):
    """Retrieve the patient's most recent clinical assessment."""
    return await wellbeing.get_latest_assessment(user_id=user.id)


@router.get("/summary", response_model=PatientWellbeingSummary)
async def get_summary(
    user: User = Depends(get_current_user),
    wellbeing: WellbeingService = Depends(get_wellbeing_service),
):
    """
    Unified clinical snapshot combining recent assessment risk,
    30-day sentiment trajectory, and recommended AI posture.
    """
    return await wellbeing.get_patient_summary(user_id=user.id)
