from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..database import get_db
from ..models.user import User
from ..models.model_config import ModelConfig
from ..schemas.model import ModelConfigResponse
from ..api.deps import get_current_user

router = APIRouter(prefix="/api/models", tags=["模型"])


@router.get("", response_model=list[ModelConfigResponse])
async def list_models(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ModelConfig).where(ModelConfig.is_enabled == True)
    )
    models = result.scalars().all()
    return [ModelConfigResponse.model_validate(m) for m in models]
