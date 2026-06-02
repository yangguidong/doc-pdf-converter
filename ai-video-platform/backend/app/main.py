import os
import json
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .config import settings
from .database import engine, Base
from .core.security import hash_password


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Seed default data
    from sqlalchemy.ext.asyncio import AsyncSession
    from sqlalchemy import select
    from .database import async_session
    from .models.user import User
    from .models.credit import CreditPackage
    from .models.model_config import ModelConfig
    from .models.system_config import SystemConfig

    async with async_session() as db:
        # Seed admin user
        result = await db.execute(select(User).where(User.email == "admin@ai-video.com"))
        if not result.scalar_one_or_none():
            admin = User(
                username="admin",
                email="admin@ai-video.com",
                password_hash=hash_password("admin123"),
                role="admin",
                credits=9999,
            )
            db.add(admin)

        # Seed credit packages
        result = await db.execute(select(CreditPackage).limit(1))
        if not result.scalar_one_or_none():
            packages = [
                CreditPackage(name="入门套餐 - 100积分", credits=100, price_cents=0, sort_order=1),
                CreditPackage(name="基础套餐 - 300积分", credits=300, price_cents=0, sort_order=2),
                CreditPackage(name="专业套餐 - 1000积分", credits=1000, price_cents=0, sort_order=3),
                CreditPackage(name="企业套餐 - 5000积分", credits=5000, price_cents=0, sort_order=4),
            ]
            db.add_all(packages)

        # Seed model configs
        result = await db.execute(select(ModelConfig).limit(1))
        if not result.scalar_one_or_none():
            models = [
                ModelConfig(
                    model_key="runway_gen3",
                    display_name="Runway Gen-3 Alpha",
                    provider="runway",
                    api_base_url="https://api.runwayml.com/v1",
                    api_key_env="RUNWAY_API_KEY",
                    is_enabled=True,
                    supported_types=json.dumps(["text_to_video", "image_to_video"]),
                    max_duration=10,
                    supported_resolutions=json.dumps(["720p", "1080p"]),
                    credits_per_generation=10,
                ),
                ModelConfig(
                    model_key="pika_2",
                    display_name="Pika 2.0",
                    provider="pika",
                    api_base_url="https://api.pika.art/v1",
                    api_key_env="PIKA_API_KEY",
                    is_enabled=True,
                    supported_types=json.dumps(["text_to_video", "image_to_video"]),
                    max_duration=8,
                    supported_resolutions=json.dumps(["720p", "1080p"]),
                    credits_per_generation=8,
                ),
                ModelConfig(
                    model_key="kling_v1",
                    display_name="可灵 Kling",
                    provider="kling",
                    api_base_url="https://api.kling.kuaishou.com/v1",
                    api_key_env="KLING_API_KEY",
                    is_enabled=True,
                    supported_types=json.dumps(["text_to_video", "image_to_video"]),
                    max_duration=10,
                    supported_resolutions=json.dumps(["720p", "1080p"]),
                    credits_per_generation=12,
                ),
                ModelConfig(
                    model_key="svd_xt",
                    display_name="Stable Video Diffusion",
                    provider="stability",
                    api_base_url="https://api.stability.ai/v2beta",
                    api_key_env="STABILITY_API_KEY",
                    is_enabled=True,
                    supported_types=json.dumps(["image_to_video"]),
                    max_duration=4,
                    supported_resolutions=json.dumps(["576x1024", "720p"]),
                    credits_per_generation=6,
                ),
                ModelConfig(
                    model_key="mock_demo",
                    display_name="演示模型 (Mock)",
                    provider="mock",
                    api_base_url="",
                    api_key_env="",
                    is_enabled=True,
                    supported_types=json.dumps(["text_to_video", "image_to_video", "video_edit"]),
                    max_duration=10,
                    supported_resolutions=json.dumps(["720p", "1080p"]),
                    credits_per_generation=2,
                ),
            ]
            db.add_all(models)

        # Seed system configs
        result = await db.execute(select(SystemConfig).limit(1))
        if not result.scalar_one_or_none():
            configs = [
                SystemConfig(key="registration_open", value="true", description="是否开放注册"),
                SystemConfig(key="default_signup_credits", value="50", description="新用户默认积分"),
                SystemConfig(key="max_videos_per_user_per_day", value="50", description="每用户每日最大生成数"),
                SystemConfig(key="video_retention_days", value="30", description="视频保留天数"),
            ]
            db.add_all(configs)

        await db.commit()

    # Ensure storage directories exist
    Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
    Path(settings.GENERATED_DIR).mkdir(parents=True, exist_ok=True)

    yield


app = FastAPI(
    title="AI视频生成平台",
    description="多模型AI视频生成平台 API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount generated files for serving
generated_dir = Path(settings.GENERATED_DIR).parent
generated_dir.mkdir(parents=True, exist_ok=True)
app.mount("/files", StaticFiles(directory=str(generated_dir)), name="files")

# Register routers
from .api import auth, videos, credits, models, upload, admin

app.include_router(auth.router)
app.include_router(videos.router)
app.include_router(credits.router)
app.include_router(models.router)
app.include_router(upload.router)
app.include_router(admin.router)


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "AI视频生成平台运行中"}
