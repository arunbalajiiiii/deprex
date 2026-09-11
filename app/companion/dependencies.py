from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database import get_db
from app.intelligence import IntelligenceProvider, get_intelligence
from app.wellbeing import WellbeingService, get_wellbeing_service
from app.companion.service import CompanionService


def get_companion_service(
    db: AsyncSession = Depends(get_db),
    intelligence: IntelligenceProvider = Depends(get_intelligence),
    wellbeing: WellbeingService = Depends(get_wellbeing_service),
) -> CompanionService:
    """FastAPI dependency providing the CompanionService instance."""
    return CompanionService(db=db, intelligence=intelligence, wellbeing=wellbeing)
