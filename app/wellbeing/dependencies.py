from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database import get_db
from app.intelligence import IntelligenceProvider, get_intelligence
from app.wellbeing.service import WellbeingService


def get_wellbeing_service(
    db: AsyncSession = Depends(get_db),
    intelligence: IntelligenceProvider = Depends(get_intelligence),
) -> WellbeingService:
    """FastAPI dependency providing the WellbeingService instance."""
    return WellbeingService(db=db, intelligence=intelligence)
