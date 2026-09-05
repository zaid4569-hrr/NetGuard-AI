from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.db_models import DeviceModel, FindingModel, UserModel, AssessmentModel
from app.security.auth import require_user
from app.schemas.api_schemas import DeviceDetailResponse, FindingResponse

router = APIRouter(prefix="/devices", tags=["Devices"])

@router.get("/{device_id}", response_model=DeviceDetailResponse)
async def get_device_details(device_id: str, db: AsyncSession = Depends(get_db), user: UserModel = Depends(require_user)):
    """
    Returns single device profile, security score, findings, and category scores.
    """
    result = await db.execute(
        select(DeviceModel)
        .options(
            selectinload(DeviceModel.findings),
            selectinload(DeviceModel.category_scores)
        )
        .join(AssessmentModel).where(DeviceModel.id == device_id, AssessmentModel.owner_id == user.id)
    )
    device = result.scalar_one_or_none()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found.")
    return device

@router.get("/{device_id}/findings", response_model=List[FindingResponse])
async def get_device_findings(device_id: str, db: AsyncSession = Depends(get_db), user: UserModel = Depends(require_user)):
    """
    Returns all compliance findings for a specific device.
    """
    result = await db.execute(
        select(FindingModel)
        .join(AssessmentModel).where(FindingModel.device_id == device_id, AssessmentModel.owner_id == user.id)
        .order_by(FindingModel.severity)
    )
    return result.scalars().all()
