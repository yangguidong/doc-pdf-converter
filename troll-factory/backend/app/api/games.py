import secrets
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.user import User
from app.models.game import Game, GameSkin, PlayRecord
from app.schemas.game import (
    GameCreate, GameUpdate, GameResponse, GameListItem,
    SkinResponse, PlayRecordResponse, PlayRecordCreate,
)
from app.api.deps import get_current_user

router = APIRouter(prefix="/api/games", tags=["games"])


def _generate_share_code() -> str:
    return secrets.token_urlsafe(6)[:8]


@router.get("", response_model=list[GameListItem])
async def list_my_games(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Game).where(Game.user_id == current_user.id).order_by(Game.created_at.desc())
    )
    return result.scalars().all()


@router.get("/public", response_model=list[GameListItem])
async def list_public_games(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Game)
        .where(Game.is_public == True, Game.is_published == True)
        .order_by(Game.play_count.desc())
        .limit(50)
    )
    return result.scalars().all()


@router.post("", response_model=GameResponse, status_code=201)
async def create_game(
    body: GameCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if body.skin_id:
        skin = await db.get(GameSkin, body.skin_id)
        if not skin:
            raise HTTPException(status_code=404, detail="Skin not found")

    game = Game(
        user_id=current_user.id,
        title=body.title,
        description=body.description,
        module_type=body.module_type,
        params_json=body.params_json,
        skin_id=body.skin_id,
        share_code=_generate_share_code(),
        is_public=body.is_public,
        punishment_type=body.punishment_type,
        punishment_config=body.punishment_config,
    )
    db.add(game)
    await db.flush()
    await db.refresh(game)
    return game


@router.get("/{game_id}", response_model=GameResponse)
async def get_game(
    game_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Game).where(Game.id == game_id))
    game = result.scalar_one_or_none()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    if not game.is_public and game.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    return game


@router.put("/{game_id}", response_model=GameResponse)
async def update_game(
    game_id: int,
    body: GameUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Game).where(Game.id == game_id))
    game = result.scalar_one_or_none()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    if game.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your game")

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(game, key, value)

    await db.flush()
    await db.refresh(game)
    return game


@router.delete("/{game_id}", status_code=204)
async def delete_game(
    game_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Game).where(Game.id == game_id))
    game = result.scalar_one_or_none()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    if game.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your game")
    await db.delete(game)


@router.post("/{game_id}/publish", response_model=GameResponse)
async def publish_game(
    game_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Game).where(Game.id == game_id))
    game = result.scalar_one_or_none()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    if game.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your game")

    game.is_published = True
    # Trigger HTML generation
    from app.core.game_renderer import render_game_html
    render_game_html(game)

    await db.flush()
    await db.refresh(game)
    return game
