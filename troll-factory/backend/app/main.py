import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse
from app.config import get_settings
from app.database import init_db, async_session
from app.models.game import GameSkin, Game
from app.api import auth, games, share, skins
from sqlalchemy import select

settings = get_settings()


async def seed_default_skins():
    from sqlalchemy import select
    async with async_session() as db:
        result = await db.execute(select(GameSkin).limit(1))
        if result.scalar_one_or_none():
            return

        skins = [
            GameSkin(name="默认主题", slug="default", description="简洁清爽的默认风格",
                     css_class="default", thumbnail_url="/static/skins/default.png", is_preset=True),
            GameSkin(name="答辩主题", slug="poop", description="满满都是💩的恶搞主题",
                     css_class="poop", thumbnail_url="/static/skins/poop.png", is_preset=True),
            GameSkin(name="打工人主题", slug="office", description="996办公室地狱主题",
                     css_class="office", thumbnail_url="/static/skins/office.png", is_preset=True),
            GameSkin(name="幽灵主题", slug="ghost", description="恐怖恶搞幽灵主题",
                     css_class="ghost", thumbnail_url="/static/skins/ghost.png", is_preset=True),
        ]
        db.add_all(skins)
        await db.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    await seed_default_skins()
    yield


app = FastAPI(title="整活工厂 Troll Factory", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(games.router)
app.include_router(share.router)
app.include_router(skins.router)

# Mount static files
static_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "static")
os.makedirs(static_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Serve generated game HTML files
games_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "games")
os.makedirs(games_dir, exist_ok=True)


@app.get("/p/{share_code}", response_class=HTMLResponse)
async def play_game(share_code: str):
    game_path = os.path.join(games_dir, f"{share_code}.html")
    if not os.path.exists(game_path):
        return HTMLResponse("<h1>游戏未找到</h1><p>该游戏链接可能已失效</p>", status_code=404)
    with open(game_path, "r", encoding="utf-8") as f:
        return HTMLResponse(f.read())


@app.get("/health")
async def health():
    return {"status": "ok", "app": "troll-factory"}


# In production, serve frontend build
frontend_dist = os.path.join(os.path.dirname(os.path.dirname(__file__)), "..", "frontend", "dist")
if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")
