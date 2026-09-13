"""
Blockchain Audit Ledger API endpoints.

Provides three REST endpoints:
  GET  /api/blockchain/chain        — Return the full audit chain
  GET  /api/blockchain/verify       — Verify chain integrity
  POST /api/blockchain/anchor/{id}  — Manually anchor a specific assessment

Auto-anchoring on assessment upload is handled in assessment.py.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from pydantic import BaseModel

from app.core.database import get_db
from app.blockchain.ledger import BlockchainLedger
from app.models.db_models import AssessmentModel, BlockModel, UserModel
from app.api.deps import get_current_user

router = APIRouter(prefix="/blockchain", tags=["Blockchain Ledger"])


# ── Pydantic response schemas ─────────────────────────────────────────────────

class BlockResponse(BaseModel):
    index: int
    previous_hash: str
    timestamp: str
    assessment_id: str
    data_hash: str
    block_hash: str

    class Config:
        from_attributes = True


class ChainResponse(BaseModel):
    length: int
    blocks: List[BlockResponse]


class VerifyResponse(BaseModel):
    valid: bool
    length: int
    first_invalid_index: Optional[int] = None
    message: str


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/chain", response_model=ChainResponse)
async def get_chain(
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    """Returns the full blockchain audit ledger, ordered genesis → tip."""
    blocks = await BlockchainLedger.get_chain(db)
    return ChainResponse(length=len(blocks), blocks=blocks)


@router.get("/verify", response_model=VerifyResponse)
async def verify_chain(
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    """
    Recomputes every block hash from scratch and verifies linkage.
    Returns { valid, length, first_invalid_index }.
    """
    result = await BlockchainLedger.verify_chain(db)
    message = (
        "✅ Chain integrity verified — all blocks are cryptographically valid."
        if result["valid"]
        else f"❌ Chain tampered — first invalid block at index {result['first_invalid_index']}."
    )
    return VerifyResponse(**result, message=message)


@router.post("/anchor/{assessment_id}", response_model=BlockResponse, status_code=status.HTTP_201_CREATED)
async def anchor_assessment(
    assessment_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    """
    Manually anchor an assessment to the blockchain ledger.
    The assessment must belong to the requesting user.
    Auto-anchoring at upload time is preferred; this endpoint enables
    re-anchoring edge cases (e.g. offline uploads synced later).
    """
    # Ensure the assessment exists and belongs to this user
    result = await db.execute(
        select(AssessmentModel).where(
            AssessmentModel.id == assessment_id,
            AssessmentModel.user_id == current_user.id,
        )
    )
    assessment = result.scalar_one_or_none()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found.")

    # Check it hasn't already been anchored
    existing = await db.execute(
        select(BlockModel).where(BlockModel.assessment_id == assessment_id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This assessment is already anchored in the ledger.",
        )

    finding_count = (
        (assessment.critical_count or 0)
        + (assessment.high_count or 0)
        + (assessment.medium_count or 0)
        + (assessment.low_count or 0)
        + (assessment.info_count or 0)
    )

    block = await BlockchainLedger.anchor_assessment(
        db=db,
        assessment_id=assessment_id,
        overall_score=assessment.overall_score,
        finding_count=finding_count,
        created_at=str(assessment.created_at),
    )
    return block
