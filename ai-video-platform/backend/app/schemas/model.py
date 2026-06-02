from typing import Optional
import json
import datetime
from pydantic import BaseModel, field_validator


class ModelConfigResponse(BaseModel):
    id: int
    model_key: str
    display_name: str
    provider: str
    is_enabled: bool
    supported_types: list[str]
    max_duration: int
    supported_resolutions: list[str]
    credits_per_generation: int
    created_at: Optional[datetime.datetime] = None

    @field_validator("supported_types", "supported_resolutions", mode="before")
    @classmethod
    def parse_json_list(cls, v: object) -> list[str]:
        if isinstance(v, str):
            return json.loads(v)
        if isinstance(v, list):
            return v
        return []

    model_config = {"from_attributes": True}


class ModelConfigUpdate(BaseModel):
    is_enabled: Optional[bool] = None
    credits_per_generation: Optional[int] = None
    api_base_url: Optional[str] = None
    extra_config: Optional[str] = None
