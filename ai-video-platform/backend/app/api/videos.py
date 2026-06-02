import json
import math
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from ..database import get_db
from ..models.user import User
from ..models.video import Video
from ..models.task import GenerationTask
from ..models.model_config import ModelConfig
from ..schemas.video import (
    VideoGenerateRequest, VideoResponse, VideoStatusResponse, VideoListResponse,
)
from ..api.deps import get_current_user
from ..core.credit_manager import deduct_credits, InsufficientCreditsError
from ..core.file_storage import get_full_path

router = APIRouter(prefix="/api/videos", tags=["视频"])


@router.post("/generate", response_model=VideoResponse, status_code=201)
async def generate_video(
    body: VideoGenerateRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Validate model
    result = await db.execute(
        select(ModelConfig).where(
            ModelConfig.model_key == body.model_key,
            ModelConfig.is_enabled == True,
        )
    )
    model_config = result.scalar_one_or_none()
    if not model_config:
        raise HTTPException(status_code=400, detail="模型不可用")

    supported_types = json.loads(model_config.supported_types)
    if body.generation_type not in supported_types:
        raise HTTPException(status_code=400, detail=f"该模型不支持此生成类型: {body.generation_type}")

    # Check credits
    try:
        txn = await deduct_credits(db, current_user, model_config.credits_per_generation, reference_type="video_generation")
    except InsufficientCreditsError as e:
        raise HTTPException(status_code=402, detail=f"积分不足: 需要{e.required}, 当前{e.current}")

    # Create video record
    video = Video(
        user_id=current_user.id,
        title=body.title or body.prompt[:50],
        prompt=body.prompt,
        model_name=model_config.display_name,
        generation_type=body.generation_type,
        resolution=body.resolution,
        duration_seconds=body.duration,
        status="pending",
        credits_cost=model_config.credits_per_generation,
        is_public=body.is_public,
    )
    db.add(video)
    await db.flush()
    await db.refresh(video)

    txn.reference_id = video.id
    await db.flush()

    # Create task
    task = GenerationTask(
        video_id=video.id,
        user_id=current_user.id,
        task_type=body.generation_type,
        model_name=model_config.display_name,
        input_params=json.dumps(body.model_dump()),
        status="queued",
    )
    db.add(task)
    await db.flush()

    # Enqueue background generation
    from ..tasks.video_generator import run
    background_tasks.add_task(run, task.id)

    return VideoResponse.model_validate(video)


@router.get("", response_model=VideoListResponse)
async def list_videos(
    page: int = Query(1, ge=1),
    per_page: int = Query(12, ge=1, le=100),
    status: str = Query(None),
    generation_type: str = Query(None),
    sort_by: str = Query("created_at"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Video).where(Video.user_id == current_user.id)

    if status:
        query = query.where(Video.status == status)
    if generation_type:
        query = query.where(Video.generation_type == generation_type)

    # Count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Sort
    sort_col = getattr(Video, sort_by, Video.created_at)
    query = query.order_by(desc(sort_col))

    # Paginate
    query = query.offset((page - 1) * per_page).limit(per_page)
    result = await db.execute(query)
    videos = result.scalars().all()

    return VideoListResponse(
        items=[VideoResponse.model_validate(v) for v in videos],
        total=total,
        page=page,
        per_page=per_page,
        total_pages=math.ceil(total / per_page) if total > 0 else 0,
    )


@router.get("/public", response_model=VideoListResponse)
async def public_gallery(
    page: int = Query(1, ge=1),
    per_page: int = Query(12, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    query = select(Video).where(
        Video.is_public == True,
        Video.status == "completed",
    )

    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.order_by(desc(Video.created_at))
    query = query.offset((page - 1) * per_page).limit(per_page)
    result = await db.execute(query)
    videos = result.scalars().all()

    return VideoListResponse(
        items=[VideoResponse.model_validate(v) for v in videos],
        total=total,
        page=page,
        per_page=per_page,
        total_pages=math.ceil(total / per_page) if total > 0 else 0,
    )


@router.get("/{video_id}", response_model=VideoResponse)
async def get_video(
    video_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Video).where(Video.id == video_id, Video.user_id == current_user.id)
    )
    video = result.scalar_one_or_none()
    if not video:
        raise HTTPException(status_code=404, detail="视频不存在")
    return VideoResponse.model_validate(video)


@router.get("/{video_id}/status", response_model=VideoStatusResponse)
async def get_video_status(
    video_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Video).where(Video.id == video_id, Video.user_id == current_user.id)
    )
    video = result.scalar_one_or_none()
    if not video:
        raise HTTPException(status_code=404, detail="视频不存在")
    return VideoStatusResponse.model_validate(video)


@router.delete("/{video_id}")
async def delete_video(
    video_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Video).where(Video.id == video_id, Video.user_id == current_user.id)
    )
    video = result.scalar_one_or_none()
    if not video:
        raise HTTPException(status_code=404, detail="视频不存在")

    # Delete files
    from ..core.file_storage import delete_video_files
    delete_video_files(video.output_video_path, video.output_thumbnail_path)

    await db.delete(video)
    await db.flush()
    return {"message": "视频已删除"}


@router.get("/{video_id}/download")
async def download_video(
    video_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Video).where(Video.id == video_id, Video.user_id == current_user.id)
    )
    video = result.scalar_one_or_none()
    if not video:
        raise HTTPException(status_code=404, detail="视频不存在")
    if not video.output_video_path:
        raise HTTPException(status_code=404, detail="视频文件尚未生成")

    file_path = get_full_path(video.output_video_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="视频文件不存在")

    filename = video.title or "video"
    return FileResponse(
        path=str(file_path),
        filename=f"{filename}.mp4",
        media_type="video/mp4",
    )
