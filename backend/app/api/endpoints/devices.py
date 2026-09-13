from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.db_models import DeviceModel, FindingModel, AssessmentModel, UserModel
from app.schemas.api_schemas import DeviceDetailResponse, FindingResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/devices", tags=["Devices"])

@router.get("/{device_id}", response_model=DeviceDetailResponse)
async def get_device_details(
    device_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Returns single device profile, security score, findings, and category scores.
    Scoped to devices belonging to an assessment owned by the current user.
    """
    result = await db.execute(
        select(DeviceModel)
        .join(AssessmentModel, DeviceModel.assessment_id == AssessmentModel.id)
        .options(
            selectinload(DeviceModel.findings),
            selectinload(DeviceModel.category_scores)
        )
        .where(DeviceModel.id == device_id, AssessmentModel.user_id == current_user.id)
    )
    device = result.scalar_one_or_none()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found.")
    return device

@router.get("/{device_id}/findings", response_model=List[FindingResponse])
async def get_device_findings(
    device_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Returns all compliance findings for a specific device owned by the current user.
    """
    result = await db.execute(
        select(FindingModel)
        .join(AssessmentModel, FindingModel.assessment_id == AssessmentModel.id)
        .where(FindingModel.device_id == device_id, AssessmentModel.user_id == current_user.id)
        .order_by(FindingModel.severity)
    )
    return result.scalars().all()
