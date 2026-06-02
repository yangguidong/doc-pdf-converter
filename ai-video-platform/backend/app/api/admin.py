import json
import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, text
from ..database import get_db
from ..models.user import User
from ..models.video import Video
from ..models.credit import CreditTransaction, CreditPackage
from ..models.model_config import ModelConfig
from ..models.system_config import SystemConfig
from ..schemas.user import UserResponse
from ..schemas.video import VideoResponse
from ..schemas.model import ModelConfigResponse, ModelConfigUpdate
from ..api.deps import get_current_user, get_admin_user

router = APIRouter(prefix="/api/admin", tags=["管理后台"])


@router.get("/dashboard")
async def dashboard(
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    total_users_result = await db.execute(select(func.count()).select_from(User))
    total_users = total_users_result.scalar() or 0

    total_videos_result = await db.execute(select(func.count()).select_from(Video))
    total_videos = total_videos_result.scalar() or 0

    today = datetime.datetime.utcnow().date()
    today_videos_result = await db.execute(
        select(func.count()).select_from(Video).where(func.date(Video.created_at) == today)
    )
    today_videos = today_videos_result.scalar() or 0

    credits_used_result = await db.execute(
        select(func.coalesce(func.sum(CreditTransaction.amount), 0)).where(
            CreditTransaction.transaction_type == "usage"
        )
    )
    total_credits_used = abs(credits_used_result.scalar() or 0)

    active_users_result = await db.execute(
        select(func.count()).select_from(User).where(
            func.date(User.last_login_at) == today
        )
    )
    active_today = active_users_result.scalar() or 0

    return {
        "total_users": total_users,
        "total_videos": total_videos,
        "today_videos": today_videos,
        "total_credits_used": total_credits_used,
        "active_today": active_today,
    }


@router.get("/users", response_model=list[UserResponse])
async def list_users(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: str = Query(None),
    role: str = Query(None),
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(User)

    if search:
        query = query.where(
            (User.username.contains(search)) | (User.email.contains(search))
        )
    if role:
        query = query.where(User.role == role)

    query = query.order_by(desc(User.created_at))
    query = query.offset((page - 1) * per_page).limit(per_page)
    result = await db.execute(query)
    users = result.scalars().all()
    return [UserResponse.model_validate(u) for u in users]


@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    body: dict,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")

    if "role" in body:
        user.role = body["role"]
    if "credits" in body:
        user.credits = body["credits"]
    if "is_active" in body:
        user.is_active = body["is_active"]

    user.updated_at = datetime.datetime.utcnow()
    await db.flush()
    await db.refresh(user)
    return UserResponse.model_validate(user)


@router.get("/videos", response_model=list[VideoResponse])
async def list_all_videos(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status: str = Query(None),
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Video)
    if status:
        query = query.where(Video.status == status)

    query = query.order_by(desc(Video.created_at))
    query = query.offset((page - 1) * per_page).limit(per_page)
    result = await db.execute(query)
    videos = result.scalars().all()
    return [VideoResponse.model_validate(v) for v in videos]


@router.delete("/videos/{video_id}")
async def admin_delete_video(
    video_id: int,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Video).where(Video.id == video_id))
    video = result.scalar_one_or_none()
    if not video:
        raise HTTPException(status_code=404, detail="视频不存在")

    from ..core.file_storage import delete_video_files
    delete_video_files(video.output_video_path, video.output_thumbnail_path)

    await db.delete(video)
    await db.flush()
    return {"message": "视频已删除"}


@router.get("/stats/daily")
async def daily_stats(
    days: int = Query(30, ge=1, le=365),
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    stats = []
    for i in range(days):
        date = (datetime.datetime.utcnow() - datetime.timedelta(days=i)).date()
        new_users = await db.execute(
            select(func.count()).select_from(User).where(func.date(User.created_at) == date)
        )
        new_videos = await db.execute(
            select(func.count()).select_from(Video).where(func.date(Video.created_at) == date)
        )
        stats.append({
            "date": date.isoformat(),
            "new_users": new_users.scalar() or 0,
            "new_videos": new_videos.scalar() or 0,
        })
    return stats


@router.get("/models", response_model=list[ModelConfigResponse])
async def admin_list_models(
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(ModelConfig).order_by(ModelConfig.created_at))
    models = result.scalars().all()
    return [ModelConfigResponse.model_validate(m) for m in models]


@router.put("/models/{model_id}", response_model=ModelConfigResponse)
async def update_model(
    model_id: int,
    body: ModelConfigUpdate,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(ModelConfig).where(ModelConfig.id == model_id))
    model = result.scalar_one_or_none()
    if not model:
        raise HTTPException(status_code=404, detail="模型不存在")

    if body.is_enabled is not None:
        model.is_enabled = body.is_enabled
    if body.credits_per_generation is not None:
        model.credits_per_generation = body.credits_per_generation
    if body.api_base_url is not None:
        model.api_base_url = body.api_base_url
    if body.extra_config is not None:
        model.extra_config = body.extra_config

    model.updated_at = datetime.datetime.utcnow()
    await db.flush()
    await db.refresh(model)
    return ModelConfigResponse.model_validate(model)
