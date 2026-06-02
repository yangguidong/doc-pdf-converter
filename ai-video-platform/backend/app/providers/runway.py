"""Runway Gen-3 API provider."""
import os
import httpx
from pathlib import Path
from .base import BaseProvider


class RunwayProvider(BaseProvider):
    async def generate(self, params: dict) -> str:
        api_key = os.environ.get(self.config.api_key_env, "")
        if not api_key:
            raise ValueError("Runway API key not configured")

        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                f"{self.config.api_base_url}/generate",
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={
                    "prompt": params.get("prompt"),
                    "model": "gen3",
                    "duration": params.get("duration", 5),
                    "resolution": params.get("resolution", "720p"),
                },
            )
            resp.raise_for_status()
            data = resp.json()
            return data["task_id"]

    async def poll(self, external_task_id: str) -> dict:
        api_key = os.environ.get(self.config.api_key_env, "")
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(
                f"{self.config.api_base_url}/tasks/{external_task_id}",
                headers={"Authorization": f"Bearer {api_key}"},
            )
            resp.raise_for_status()
            data = resp.json()
            return {
                "status": data.get("status", "processing"),
                "result_url": data.get("output_url"),
                "error": data.get("error"),
            }

    async def download(self, result_url: str, output_path: Path) -> None:
        async with httpx.AsyncClient(timeout=120) as client:
            resp = await client.get(result_url)
            resp.raise_for_status()
            output_path.parent.mkdir(parents=True, exist_ok=True)
            output_path.write_bytes(resp.content)
