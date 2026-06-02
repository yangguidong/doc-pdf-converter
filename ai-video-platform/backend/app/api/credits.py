import math
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from ..database import get_db
from ..models.user import User
from ..models.credit import CreditTransaction, CreditPackage
from ..schemas.credit import (
    CreditBalanceResponse, CreditTransactionResponse,
    CreditTransactionListResponse, CreditPackageResponse, CreditPurchaseRequest,
)
from ..api.deps import get_current_user
from ..core.credit_manager import grant_credits

router = APIRouter(prefix="/api/credits", tags=["积分"])


@router.get("/balance", response_model=CreditBalanceResponse)
async def get_balance(
    current_user: User = Depends(get_current_user),
):
    return CreditBalanceResponse(credits=current_user.credits, total_used=current_user.total_credits_used)


@router.get("/transactions", response_model=CreditTransactionListResponse)
async def list_transactions(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    transaction_type: str = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(CreditTransaction).where(CreditTransaction.user_id == current_user.id)
    if transaction_type:
        query = query.where(CreditTransaction.transaction_type == transaction_type)

    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.order_by(desc(CreditTransaction.created_at))
    query = query.offset((page - 1) * per_page).limit(per_page)
    result = await db.execute(query)
    items = result.scalars().all()

    return CreditTransactionListResponse(
        items=[CreditTransactionResponse.model_validate(t) for t in items],
        total=total,
        page=page,
        per_page=per_page,
        total_pages=math.ceil(total / per_page) if total > 0 else 0,
    )


@router.get("/packages", response_model=list[CreditPackageResponse])
async def list_packages(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CreditPackage).where(CreditPackage.is_active == True).order_by(CreditPackage.sort_order)
    )
    packages = result.scalars().all()
    return [CreditPackageResponse.model_validate(p) for p in packages]


@router.post("/purchase")
async def purchase_credits(
    body: CreditPurchaseRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CreditPackage).where(CreditPackage.id == body.package_id, CreditPackage.is_active == True)
    )
    package = result.scalar_one_or_none()
    if not package:
        raise HTTPException(status_code=404, detail="积分套餐不存在")

    await grant_credits(
        db, current_user, package.credits,
        reference_type="purchase",
        reference_id=package.id,
        description=f"购买套餐: {package.name}",
    )
    await db.refresh(current_user)
    return {
        "message": f"成功获得 {package.credits} 积分",
        "credits": current_user.credits,
    }
