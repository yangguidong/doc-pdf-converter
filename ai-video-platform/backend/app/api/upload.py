from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from ..database import get_db
from ..models.user import User
from ..api.deps import get_current_user
from ..core.file_storage import save_upload

router = APIRouter(prefix="/api/upload", tags=["上传"])

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
ALLOWED_VIDEO_TYPES = {"video/mp4", "video/webm", "video/quicktime"}
MAX_SIZE = 500 * 1024 * 1024  # 500MB


@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="不支持的图片格式，支持: JPEG, PNG, WebP, GIF")
    if file.size and file.size > MAX_SIZE:
        raise HTTPException(status_code=400, detail="文件大小不能超过500MB")

    rel_path = await save_upload(current_user.id, file, "images")
    return {
        "file_id": rel_path,
        "url_path": f"/files/uploads/{rel_path}",
        "filename": file.filename,
    }


@router.post("/video")
async def upload_video(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    if file.content_type not in ALLOWED_VIDEO_TYPES:
        raise HTTPException(status_code=400, detail="不支持的视频格式，支持: MP4, WebM, MOV")
    if file.size and file.size > MAX_SIZE:
        raise HTTPException(status_code=400, detail="文件大小不能超过500MB")

    rel_path = await save_upload(current_user.id, file, "videos")
    return {
        "file_id": rel_path,
        "url_path": f"/files/uploads/{rel_path}",
        "filename": file.filename,
    }
