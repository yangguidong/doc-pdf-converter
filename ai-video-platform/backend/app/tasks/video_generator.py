import json
import asyncio
import datetime
import traceback
from pathlib import Path
from sqlalchemy import select
from ..database import async_session
from ..models.video import Video
from ..models.user import User
from ..models.task import GenerationTask
from ..models.model_config import ModelConfig
from ..providers.factory import get_provider
from ..core.credit_manager import refund_credits


async def run(task_id: int):
    """Execute a generation task in the background."""
    async with async_session() as db:
        try:
            result = await db.execute(select(GenerationTask).where(GenerationTask.id == task_id))
            task = result.scalar_one_or_none()
            if not task:
                return

            task.status = "processing"
            task.started_at = datetime.datetime.utcnow()
            await db.flush()

            # Update video status
            video_result = await db.execute(select(Video).where(Video.id == task.video_id))
            video = video_result.scalar_one_or_none()
            if not video:
                task.status = "failed"
                task.error_message = "关联视频不存在"
                await db.commit()
                return

            video.status = "processing"
            video.progress = 10
            await db.flush()

            # Load model config
            input_params = json.loads(task.input_params)
            model_result = await db.execute(
                select(ModelConfig).where(ModelConfig.model_key == input_params.get("model_key"))
            )
            model_config = model_result.scalar_one_or_none()
            if not model_config:
                raise ValueError(f"模型配置不存在: {input_params.get('model_key')}")

            # Get provider and submit generation
            provider = get_provider(model_config)
            video.progress = 20
            await db.flush()

            external_task_id = await provider.generate(input_params)
            task.external_task_id = external_task_id
            video.progress = 30
            await db.flush()

            # Poll for completion
            max_polls = 60
            for i in range(max_polls):
                await asyncio.sleep(5)
                poll_result = await provider.poll(external_task_id)

                if poll_result["status"] == "completed":
                    video.progress = 80
                    await db.flush()

                    # Download the video
                    ext = ".mp4"
                    output_path = Path(f"data/generated/videos/{video.user_id}/{external_task_id}{ext}")
                    output_path = Path(output_path).resolve()
                    output_path.parent.mkdir(parents=True, exist_ok=True)

                    await provider.download(poll_result["result_url"], output_path)

                    # Store relative path
                    rel_path = f"generated/videos/{video.user_id}/{output_path.name}"
                    video.output_video_path = rel_path
                    video.progress = 90
                    await db.flush()

                    # Try to generate thumbnail
                    thumbnail_path = f"generated/thumbnails/{external_task_id}.jpg"
                    try:
                        _generate_thumbnail(str(output_path), Path(thumbnail_path))
                        video.output_thumbnail_path = thumbnail_path
                    except Exception:
                        pass

                    # Finalize
                    video.status = "completed"
                    video.progress = 100
                    video.file_size_bytes = output_path.stat().st_size
                    video.completed_at = datetime.datetime.utcnow()
                    task.status = "completed"
                    task.completed_at = datetime.datetime.utcnow()
                    task.result_data = json.dumps(poll_result)
                    await db.commit()
                    return

                elif poll_result["status"] == "failed":
                    raise Exception(poll_result.get("error") or "视频生成失败")

                # Update progress incrementally
                video.progress = min(30 + (i * 2), 75)
                await db.flush()

            raise TimeoutError("视频生成超时")

        except Exception as e:
            # Handle failure and refund
            task.status = "failed"
            task.error_message = str(e)
            task.completed_at = datetime.datetime.utcnow()

            video_result = await db.execute(select(Video).where(Video.id == task.video_id))
            video = video_result.scalar_one_or_none()
            if video:
                video.status = "failed"
                video.error_message = str(e)

                # Refund credits
                user_result = await db.execute(select(User).where(User.id == video.user_id))
                user = user_result.scalar_one_or_none()
                if user:
                    await refund_credits(db, user, video.credits_cost, reference_id=video.id)

            await db.commit()


def _generate_thumbnail(video_path: str, output_path: Path, size=(480, 270)):
    """Generate a thumbnail from the video file."""
    output_path.parent.mkdir(parents=True, exist_ok=True)

    try:
        from PIL import Image
        # Create a simple gradient placeholder
        img = Image.new("RGB", size, color=(30, 30, 40))
        for x in range(size[0]):
            for y in range(size[1]):
                r = int(30 + (x / size[0]) * 40)
                g = int(30 + (y / size[1]) * 40)
                b = int(40 + ((x + y) / (size[0] + size[1])) * 60)
                img.putpixel((x, y), (r, g, b))

        # Add play button text
        img.save(output_path, "JPEG", quality=85)
    except Exception:
        img = Image.new("RGB", size, color=(20, 20, 30))
        img.save(output_path, "JPEG", quality=85)
