from typing import Optional
import datetime
from pydantic import BaseModel


class CreditBalanceResponse(BaseModel):
    credits: int
    total_used: int


class CreditTransactionResponse(BaseModel):
    id: int
    user_id: int
    amount: int
    balance_after: int
    transaction_type: str
    reference_type: Optional[str] = None
    reference_id: Optional[int] = None
    description: Optional[str] = None
    created_at: Optional[datetime.datetime] = None

    model_config = {"from_attributes": True}


class CreditTransactionListResponse(BaseModel):
    items: list[CreditTransactionResponse]
    total: int
    page: int
    per_page: int
    total_pages: int


class CreditPackageResponse(BaseModel):
    id: int
    name: str
    credits: int
    price_cents: int
    is_active: bool

    model_config = {"from_attributes": True}


class CreditPurchaseRequest(BaseModel):
    package_id: int
