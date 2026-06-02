from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.game import GameSkin
from app.schemas.game import SkinResponse

router = APIRouter(prefix="/api/skins", tags=["skins"])


@router.get("", response_model=list[SkinResponse])
async def list_skins(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(GameSkin).order_by(GameSkin.id))
    return result.scalars().all()
