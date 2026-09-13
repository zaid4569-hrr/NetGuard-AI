import pytest
import asyncio
import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.core.database import Base
from app.models.db_models import BlockModel
from app.blockchain.ledger import BlockchainLedger, _compute_data_hash, _compute_block_hash


@pytest.mark.asyncio
async def test_blockchain_genesis_and_chaining():
    # In-memory async sqlite database for testing
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async_session = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as db:
        # Initially empty
        chain = await BlockchainLedger.get_chain(db)
        assert len(chain) == 0

        verify = await BlockchainLedger.verify_chain(db)
        assert verify["valid"] is True
        assert verify["length"] == 0

        # Anchor Block 0 (Genesis)
        b0 = await BlockchainLedger.anchor_assessment(
            db=db,
            assessment_id="test-assessment-0",
            overall_score=85.5,
            finding_count=4,
            created_at="2026-09-13T00:00:00Z"
        )
        assert b0.index == 0
        assert b0.previous_hash == BlockchainLedger.GENESIS_PREVIOUS_HASH
        assert len(b0.block_hash) == 64
        assert len(b0.data_hash) == 64

        # Verify chain with 1 block
        verify = await BlockchainLedger.verify_chain(db)
        assert verify["valid"] is True
        assert verify["length"] == 1

        # Anchor Block 1
        b1 = await BlockchainLedger.anchor_assessment(
            db=db,
            assessment_id="test-assessment-1",
            overall_score=92.0,
            finding_count=1,
            created_at="2026-09-13T01:00:00Z"
        )
        assert b1.index == 1
        assert b1.previous_hash == b0.block_hash

        # Anchor Block 2
        b2 = await BlockchainLedger.anchor_assessment(
            db=db,
            assessment_id="test-assessment-2",
            overall_score=78.0,
            finding_count=7,
            created_at="2026-09-13T02:00:00Z"
        )
        assert b2.index == 2
        assert b2.previous_hash == b1.block_hash

        # Verify chain with 3 blocks
        verify = await BlockchainLedger.verify_chain(db)
        assert verify["valid"] is True
        assert verify["length"] == 3
        assert verify["first_invalid_index"] is None

        # Simulate tampering on block 1 (modify data_hash)
        b1_db = (await db.get(BlockModel, 1))
        b1_db.data_hash = "0" * 64
        await db.commit()

        # Chain verification should now fail at index 1
        tampered_verify = await BlockchainLedger.verify_chain(db)
        assert tampered_verify["valid"] is False
        assert tampered_verify["length"] == 3
        assert tampered_verify["first_invalid_index"] == 1

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(test_blockchain_genesis_and_chaining())
    print("Blockchain test passed successfully!")
