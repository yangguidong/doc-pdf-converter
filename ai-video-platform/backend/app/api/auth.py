import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..database import get_db
from ..models.user import User
from ..models.refresh_token import RefreshToken
from ..schemas.user import (
    UserRegister, UserLogin, UserResponse, UserUpdate,
    PasswordChange, TokenResponse, RefreshRequest,
)
from ..core.security import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, decode_access_token,
)
from ..api.deps import get_current_user

router = APIRouter(prefix="/api/auth", tags=["认证"])


async def save_refresh_token(db: AsyncSession, user_id: int, token: str) -> RefreshToken:
    rt = RefreshToken(
        user_id=user_id,
        token=token,
        expires_at=datetime.datetime.utcnow() + datetime.timedelta(days=7),
    )
    db.add(rt)
    await db.flush()
    return rt


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(body: UserRegister, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(
        select(User).where((User.email == body.email) | (User.username == body.username))
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="用户名或邮箱已被注册")

    user = User(
        username=body.username,
        email=body.email,
        password_hash=hash_password(body.password),
        role="user",
        credits=50,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)

    access_token = create_access_token(user.id, user.role)
    refresh_token_str = create_refresh_token()
    await save_refresh_token(db, user.id, refresh_token_str)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token_str,
        user=UserResponse.model_validate(user),
    )


@router.post("/login", response_model=TokenResponse)
async def login(body: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="邮箱或密码错误")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="账号已被禁用")

    user.last_login_at = datetime.datetime.utcnow()
    access_token = create_access_token(user.id, user.role)
    refresh_token_str = create_refresh_token()
    await save_refresh_token(db, user.id, refresh_token_str)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token_str,
        user=UserResponse.model_validate(user),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(body: RefreshRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(RefreshToken).where(
            RefreshToken.token == body.refresh_token,
            RefreshToken.revoked == False,
            RefreshToken.expires_at > datetime.datetime.utcnow(),
        )
    )
    rt = result.scalar_one_or_none()
    if not rt:
        raise HTTPException(status_code=401, detail="无效的刷新令牌")

    rt.revoked = True
    await db.flush()

    result = await db.execute(select(User).where(User.id == rt.user_id))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="用户不存在或已被禁用")

    access_token = create_access_token(user.id, user.role)
    new_refresh_token_str = create_refresh_token()
    await save_refresh_token(db, user.id, new_refresh_token_str)

    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh_token_str,
        user=UserResponse.model_validate(user),
    )


@router.post("/logout")
async def logout(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return {"message": "已退出登录"}


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)


@router.put("/me", response_model=UserResponse)
async def update_me(
    body: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if body.username is not None:
        current_user.username = body.username
    if body.avatar_url is not None:
        current_user.avatar_url = body.avatar_url
    current_user.updated_at = datetime.datetime.utcnow()
    await db.flush()
    await db.refresh(current_user)
    return UserResponse.model_validate(current_user)


@router.put("/password")
async def change_password(
    body: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not verify_password(body.old_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="原密码错误")
    current_user.password_hash = hash_password(body.new_password)
    await db.flush()
    return {"message": "密码修改成功"}
