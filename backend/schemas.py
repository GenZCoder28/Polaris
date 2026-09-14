from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime
from enum import Enum

class ExpeditionStatusEnum(str, Enum):
    PLANNED = "Planned"
    APPROVED = "Approved"
    ACTIVE = "Active"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"

class ExpeditionBase(BaseModel):
    expedition_id: str = Field(..., min_length=2, max_length=50, description="Unique alphanumeric expedition identifier")
    expedition_name: str = Field(..., min_length=3, max_length=255, description="Official title of the expedition")
    expedition_code: str = Field(..., min_length=2, max_length=50, description="Short unique mission code (e.g. ISEA-45)")
    expedition_year: int = Field(..., ge=1950, le=2100, description="Expedition operational year")
    description: Optional[str] = Field(None, description="Detailed scope of the expedition")
    mission_objective: Optional[str] = Field(None, description="Primary scientific and operational objectives")
    target_region: str = Field(..., min_length=2, max_length=150, description="Antarctic sector or station location")
    lead_organization: str = Field(..., min_length=2, max_length=200, description="Principal organizing body (e.g. NCPOR)")
    expedition_leader: str = Field(..., min_length=2, max_length=150, description="Name and title of expedition commander")
    start_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$", description="Commencement date (YYYY-MM-DD)")
    end_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$", description="Conclusion date (YYYY-MM-DD)")
    status: ExpeditionStatusEnum = Field(default=ExpeditionStatusEnum.PLANNED, description="Current lifecycle status")
    notes: Optional[str] = Field(None, description="Internal logistics and diplomatic directives")

    @field_validator("end_date")
    @classmethod
    def validate_date_order(cls, v: str, info):
        start = info.data.get("start_date")
        if start and v < start:
            raise ValueError("End date cannot be before start date.")
        return v

class ExpeditionCreate(ExpeditionBase):
    pass

class ExpeditionUpdate(BaseModel):
    expedition_name: Optional[str] = Field(None, min_length=3, max_length=255)
    expedition_code: Optional[str] = Field(None, min_length=2, max_length=50)
    expedition_year: Optional[int] = Field(None, ge=1950, le=2100)
    description: Optional[str] = None
    mission_objective: Optional[str] = None
    target_region: Optional[str] = Field(None, min_length=2, max_length=150)
    lead_organization: Optional[str] = Field(None, min_length=2, max_length=200)
    expedition_leader: Optional[str] = Field(None, min_length=2, max_length=150)
    start_date: Optional[str] = Field(None, pattern=r"^\d{4}-\d{2}-\d{2}$")
    end_date: Optional[str] = Field(None, pattern=r"^\d{4}-\d{2}-\d{2}$")
    status: Optional[ExpeditionStatusEnum] = None
    notes: Optional[str] = None

class ExpeditionOut(ExpeditionBase):
    id: int
    created_at: datetime
    updated_at: datetime
    created_by: Optional[str] = None
    updated_by: Optional[str] = None

    class Config:
        from_attributes = True

class FutureModuleCountsSchema(BaseModel):
    personnel_count: int = 0
    teams_count: int = 0
    locations_count: int = 0
    cargo_count: int = 0
    shipments_count: int = 0
    inventory_count: int = 0
    assets_count: int = 0

class ExpeditionAuditLogOut(BaseModel):
    id: int
    expedition_id: str
    user_email: str
    user_name: str
    user_role: str
    action: str
    previous_state: Optional[str] = None
    new_state: Optional[str] = None
    details: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True

class ExpeditionDetailResponse(BaseModel):
    expedition: ExpeditionOut
    module_connections: FutureModuleCountsSchema
    audit_logs: List[ExpeditionAuditLogOut]

class DashboardStatsSchema(BaseModel):
    total_expeditions: int
    planned_expeditions: int
    approved_expeditions: int
    active_expeditions: int
    completed_expeditions: int
    cancelled_expeditions: int
    upcoming_expeditions: int
    recent_expeditions: List[ExpeditionOut]
