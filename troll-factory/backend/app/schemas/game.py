from pydantic import BaseModel
from datetime import datetime


class GameCreate(BaseModel):
    title: str
    description: str | None = None
    module_type: str
    params_json: str = "{}"
    skin_id: int | None = None
    is_public: bool = True
    punishment_type: str = "text"
    punishment_config: str = "{}"


class GameUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    params_json: str | None = None
    skin_id: int | None = None
    is_public: bool | None = None
    punishment_type: str | None = None
    punishment_config: str | None = None


class GameResponse(BaseModel):
    id: int
    user_id: int
    title: str
    description: str | None = None
    module_type: str
    params_json: str
    skin_id: int | None = None
    share_code: str
    is_published: bool
    is_public: bool
    thumbnail_url: str | None = None
    punishment_type: str
    punishment_config: str
    play_count: int
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}


class GameListItem(BaseModel):
    id: int
    user_id: int
    title: str
    description: str | None = None
    module_type: str
    share_code: str
    is_published: bool
    is_public: bool
    play_count: int
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


class SkinResponse(BaseModel):
    id: int
    name: str
    slug: str
    description: str | None = None
    thumbnail_url: str | None = None
    css_class: str

    model_config = {"from_attributes": True}


class PlayRecordResponse(BaseModel):
    id: int
    game_id: int
    player_name: str
    score: int
    result: str
    duration_seconds: int
    played_at: datetime | None = None

    model_config = {"from_attributes": True}


class PlayRecordCreate(BaseModel):
    player_name: str = "匿名玩家"
    score: int = 0
    result: str = "lose"
    duration_seconds: int = 0
