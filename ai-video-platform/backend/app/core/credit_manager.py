from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from ..models.user import User
from ..models.credit import CreditTransaction


class InsufficientCreditsError(Exception):
    def __init__(self, required: int, current: int):
        self.required = required
        self.current = current
        super().__init__(f"积分不足: 需要{required}, 当前{current}")


async def deduct_credits(
    db: AsyncSession,
    user: User,
    amount: int,
    reference_type: str = "video_generation",
    reference_id: Optional[int] = None,
    description: Optional[str] = None,
) -> CreditTransaction:
    if user.credits < amount:
        raise InsufficientCreditsError(required=amount, current=user.credits)

    user.credits -= amount
    user.total_credits_used += amount
    balance_after = user.credits

    txn = CreditTransaction(
        user_id=user.id,
        amount=-amount,
        balance_after=balance_after,
        transaction_type="usage",
        reference_type=reference_type,
        reference_id=reference_id,
        description=description or f"视频生成消耗 {amount} 积分",
    )
    db.add(txn)
    await db.flush()
    return txn


async def refund_credits(
    db: AsyncSession,
    user: User,
    amount: int,
    reference_type: str = "video_generation",
    reference_id: Optional[int] = None,
    description: Optional[str] = None,
) -> CreditTransaction:
    user.credits += amount
    balance_after = user.credits

    txn = CreditTransaction(
        user_id=user.id,
        amount=amount,
        balance_after=balance_after,
        transaction_type="refund",
        reference_type=reference_type,
        reference_id=reference_id,
        description=description or f"视频生成失败，退还 {amount} 积分",
    )
    db.add(txn)
    await db.flush()
    return txn


async def grant_credits(
    db: AsyncSession,
    user: User,
    amount: int,
    reference_type: str = "purchase",
    reference_id: Optional[int] = None,
    description: Optional[str] = None,
) -> CreditTransaction:
    user.credits += amount
    balance_after = user.credits

    txn = CreditTransaction(
        user_id=user.id,
        amount=amount,
        balance_after=balance_after,
        transaction_type=reference_type,
        reference_type=reference_type,
        reference_id=reference_id,
        description=description or f"获得 {amount} 积分",
    )
    db.add(txn)
    await db.flush()
    return txn
