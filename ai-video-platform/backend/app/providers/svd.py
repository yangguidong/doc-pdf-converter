"""Stable Video Diffusion API provider."""
import os
import httpx
from pathlib import Path
from .base import BaseProvider


class SVDProvider(BaseProvider):
    async def generate(self, params: dict) -> str:
        api_key = os.environ.get(self.config.api_key_env, "")
        if not api_key:
            raise ValueError("Stability API key not configured")

        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                f"{self.config.api_base_url}/image-to-video",
                headers={"Authorization": f"Bearer {api_key}"},
                data={"prompt": params.get("prompt", ""), "cfg_scale": "1.8", "motion_bucket_id": "127"},
            )
            resp.raise_for_status()
            data = resp.json()
            return data["id"]

    async def poll(self, external_task_id: str) -> dict:
        api_key = os.environ.get(self.config.api_key_env, "")
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(
                f"{self.config.api_base_url}/image-to-video/result/{external_task_id}",
                headers={"Authorization": f"Bearer {api_key}"},
            )
            if resp.status_code == 202:
                return {"status": "processing", "result_url": None, "error": None}
            resp.raise_for_status()
            data = resp.json()
            return {
                "status": "completed" if data.get("video") else "processing",
                "result_url": data.get("video"),
                "error": data.get("error"),
            }

    async def download(self, result_url: str, output_path: Path) -> None:
        api_key = os.environ.get(self.config.api_key_env, "")
        async with httpx.AsyncClient(timeout=120) as client:
            resp = await client.get(
                result_url,
                headers={"Authorization": f"Bearer {api_key}"},
            )
            resp.raise_for_status()
            output_path.parent.mkdir(parents=True, exist_ok=True)
            output_path.write_bytes(resp.content)
