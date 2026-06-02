from typing import Optional
import datetime
from pydantic import BaseModel, field_validator


class VideoGenerateRequest(BaseModel):
    model_key: str
    generation_type: str  # text_to_video, image_to_video, video_edit
    prompt: str
    source_image_id: Optional[int] = None
    source_video_id: Optional[int] = None
    resolution: str = "720p"
    duration: int = 5
    is_public: bool = False
    title: Optional[str] = None

    @field_validator("prompt")
    @classmethod
    def prompt_valid(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 1 or len(v) > 2000:
            raise ValueError("提示词长度需在1-2000个字符之间")
        return v

    @field_validator("generation_type")
    @classmethod
    def gen_type_valid(cls, v: str) -> str:
        if v not in ("text_to_video", "image_to_video", "video_edit"):
            raise ValueError("生成类型无效")
        return v


class VideoResponse(BaseModel):
    id: int
    user_id: int
    title: Optional[str] = None
    description: Optional[str] = None
    prompt: str
    model_name: str
    generation_type: str
    source_image_path: Optional[str] = None
    source_video_path: Optional[str] = None
    output_video_path: Optional[str] = None
    output_thumbnail_path: Optional[str] = None
    duration_seconds: Optional[float] = None
    resolution: Optional[str] = None
    file_size_bytes: Optional[int] = None
    status: str
    progress: int
    error_message: Optional[str] = None
    credits_cost: int
    is_public: bool
    created_at: Optional[datetime.datetime] = None
    completed_at: Optional[datetime.datetime] = None

    model_config = {"from_attributes": True}


class VideoStatusResponse(BaseModel):
    id: int
    status: str
    progress: int
    error_message: Optional[str] = None
    output_video_path: Optional[str] = None
    output_thumbnail_path: Optional[str] = None

    model_config = {"from_attributes": True}


class VideoListResponse(BaseModel):
    items: list[VideoResponse]
    total: int
    page: int
    per_page: int
    total_pages: int
