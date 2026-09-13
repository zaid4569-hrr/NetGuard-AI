"""
NetGuard AI — Blockchain Audit Ledger

A lightweight, pure-Python SHA-256 in-process blockchain stored in SQLite.
Each assessment result is cryptographically chained to the previous block,
providing a tamper-evident audit trail that satisfies:
  - NIST SP 800-53 AU-10 (Non-Repudiation)
  - ISO/IEC 27001 A.12.4  (Audit Log Protection)

No external blockchain nodes, no Ethereum — fully offline, fully local.

Block structure:
    {
        "index":         int,         # Block position in chain (0 = genesis)
        "previous_hash": str,         # SHA-256 hex of previous block (genesis = "0"*64)
        "timestamp":     str,         # ISO-8601 UTC timestamp of anchoring
        "assessment_id": str,         # UUID of the anchored assessment
        "data_hash":     str,         # SHA-256 of assessment payload (score+counts+id)
        "block_hash":    str,         # SHA-256 of the entire block JSON (computed last)
    }
"""
import hashlib
import json
from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.db_models import BlockModel


def _sha256(data: str) -> str:
    """Return the lowercase hex SHA-256 digest of a UTF-8 encoded string."""
    return hashlib.sha256(data.encode("utf-8")).digest().hex()


def _compute_data_hash(assessment_id: str, overall_score: float, finding_count: int, created_at: str) -> str:
    """
    Deterministic SHA-256 fingerprint of the assessment's key metrics.
    Changing any of these values after anchoring will change the data_hash,
    revealing tampering when the chain is re-verified.
    """
    payload = f"{assessment_id}|{overall_score:.4f}|{finding_count}|{created_at}"
    return _sha256(payload)


def _compute_block_hash(index: int, previous_hash: str, timestamp: str,
                         assessment_id: str, data_hash: str) -> str:
    """
    SHA-256 over the canonical JSON representation of a block (excluding
    block_hash itself, which depends on this value).
    """
    canonical = json.dumps({
        "index": index,
        "previous_hash": previous_hash,
        "timestamp": timestamp,
        "assessment_id": assessment_id,
        "data_hash": data_hash,
    }, sort_keys=True)
    return _sha256(canonical)


class BlockchainLedger:
    """
    Manages the append-only blockchain stored in SQLite via BlockModel.
    All methods are async and accept an AsyncSession to stay compatible
    with the existing FastAPI dependency-injection pattern.
    """

    GENESIS_PREVIOUS_HASH = "0" * 64

    @staticmethod
    async def get_latest_block(db: AsyncSession) -> Optional[BlockModel]:
        """Returns the most recently anchored block, or None if the chain is empty."""
        result = await db.execute(
            select(BlockModel).order_by(BlockModel.index.desc()).limit(1)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_chain(db: AsyncSession) -> List[BlockModel]:
        """Returns all blocks ordered from genesis to tip."""
        result = await db.execute(select(BlockModel).order_by(BlockModel.index.asc()))
        return list(result.scalars().all())

    @staticmethod
    async def anchor_assessment(
        db: AsyncSession,
        assessment_id: str,
        overall_score: float,
        finding_count: int,
        created_at: str,
    ) -> BlockModel:
        """
        Creates a new block anchoring the given assessment to the chain.
        The new block's previous_hash equals the last block's block_hash
        (or the genesis sentinel if the chain is empty).
        """
        latest = await BlockchainLedger.get_latest_block(db)
        index = (latest.index + 1) if latest else 0
        previous_hash = latest.block_hash if latest else BlockchainLedger.GENESIS_PREVIOUS_HASH

        timestamp = datetime.now(timezone.utc).isoformat()
        data_hash = _compute_data_hash(assessment_id, overall_score, finding_count, created_at)
        block_hash = _compute_block_hash(index, previous_hash, timestamp, assessment_id, data_hash)

        block = BlockModel(
            index=index,
            previous_hash=previous_hash,
            timestamp=timestamp,
            assessment_id=assessment_id,
            data_hash=data_hash,
            block_hash=block_hash,
        )
        db.add(block)
        await db.commit()
        await db.refresh(block)
        return block

    @staticmethod
    async def verify_chain(db: AsyncSession) -> dict:
        """
        Walks the entire chain and recomputes every block_hash from scratch.
        Returns:
            { "valid": bool, "length": int, "first_invalid_index": int | None }

        A block fails verification if:
          - Its recomputed block_hash differs from the stored block_hash, OR
          - Its previous_hash doesn't match the preceding block's block_hash
            (genesis block's previous_hash must equal GENESIS_PREVIOUS_HASH).
        """
        chain = await BlockchainLedger.get_chain(db)
        if not chain:
            return {"valid": True, "length": 0, "first_invalid_index": None}

        for i, block in enumerate(chain):
            # 1. Verify this block's own hash
            expected_hash = _compute_block_hash(
                block.index,
                block.previous_hash,
                block.timestamp,
                block.assessment_id,
                block.data_hash,
            )
            if expected_hash != block.block_hash:
                return {"valid": False, "length": len(chain), "first_invalid_index": block.index}

            # 2. Verify linkage (except genesis)
            if i == 0:
                if block.previous_hash != BlockchainLedger.GENESIS_PREVIOUS_HASH:
                    return {"valid": False, "length": len(chain), "first_invalid_index": block.index}
            else:
                if block.previous_hash != chain[i - 1].block_hash:
                    return {"valid": False, "length": len(chain), "first_invalid_index": block.index}

        return {"valid": True, "length": len(chain), "first_invalid_index": None}
