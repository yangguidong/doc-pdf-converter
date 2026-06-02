from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models.game import Game, PlayRecord
from app.schemas.game import PlayRecordResponse, PlayRecordCreate

router = APIRouter(prefix="/api/share", tags=["share"])


@router.get("/{share_code}", response_model=dict)
async def get_shared_game(share_code: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Game).where(Game.share_code == share_code))
    game = result.scalar_one_or_none()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    return {
        "id": game.id,
        "title": game.title,
        "description": game.description,
        "module_type": game.module_type,
        "share_code": game.share_code,
        "play_count": game.play_count,
    }


@router.post("/{share_code}/play", response_model=PlayRecordResponse, status_code=201)
async def submit_play(
    share_code: str,
    body: PlayRecordCreate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Game).where(Game.share_code == share_code))
    game = result.scalar_one_or_none()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    record = PlayRecord(
        game_id=game.id,
        player_name=body.player_name,
        score=body.score,
        result=body.result,
        duration_seconds=body.duration_seconds,
    )
    db.add(record)
    game.play_count = (game.play_count or 0) + 1
    await db.flush()
    await db.refresh(record)
    return record


@router.get("/{share_code}/leaderboard", response_model=list[PlayRecordResponse])
async def get_leaderboard(share_code: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Game).where(Game.share_code == share_code))
    game = result.scalar_one_or_none()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    records = await db.execute(
        select(PlayRecord)
        .where(PlayRecord.game_id == game.id)
        .order_by(PlayRecord.score.desc())
        .limit(20)
    )
    return records.scalars().all()
