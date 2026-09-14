from fastapi import APIRouter, Depends, HTTPException, Query, Header, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc
from typing import List, Optional
import json
from datetime import datetime

from backend.database import get_db
from backend.models import (
    Expedition, 
    ExpeditionAuditLog, 
    PersonnelExpedition, 
    TeamsExpedition, 
    LocationsExpedition, 
    CargoExpedition, 
    ShipmentsExpedition, 
    InventoryExpedition, 
    AssetsExpedition
)
from backend.schemas import (
    ExpeditionCreate, 
    ExpeditionUpdate, 
    ExpeditionOut, 
    ExpeditionDetailResponse, 
    ExpeditionAuditLogOut, 
    DashboardStatsSchema,
    FutureModuleCountsSchema,
    ExpeditionStatusEnum
)

router = APIRouter(prefix="/api/expeditions", tags=["Expeditions"])

VALID_TRANSITIONS = {
    ExpeditionStatusEnum.PLANNED: [ExpeditionStatusEnum.APPROVED, ExpeditionStatusEnum.CANCELLED],
    ExpeditionStatusEnum.APPROVED: [ExpeditionStatusEnum.ACTIVE, ExpeditionStatusEnum.CANCELLED],
    ExpeditionStatusEnum.ACTIVE: [ExpeditionStatusEnum.COMPLETED, ExpeditionStatusEnum.CANCELLED],
    ExpeditionStatusEnum.COMPLETED: [],
    ExpeditionStatusEnum.CANCELLED: []
}

def get_current_user_context(
    x_user_role: Optional[str] = Header("Expedition Manager"),
    x_user_email: Optional[str] = Header("manager@ncpor.gov.in"),
    x_user_name: Optional[str] = Header("Dr. Rajesh Sharma (Expedition Manager)")
):
    return {
        "role": x_user_role,
        "email": x_user_email,
        "name": x_user_name
    }

def require_expedition_manager(user: dict = Depends(get_current_user_context)):
    if user.get("role", "").upper() == "VIEWER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to perform this modification. Expedition Manager role required."
        )
    return user

@router.get("/stats/dashboard", response_model=DashboardStatsSchema)
def get_dashboard_statistics(db: Session = Depends(get_db)):
    all_exps = db.query(Expedition).all()
    today_str = datetime.utcnow().strftime("%Y-%m-%d")

    total = len(all_exps)
    planned = sum(1 for e in all_exps if e.status == ExpeditionStatusEnum.PLANNED.value)
    approved = sum(1 for e in all_exps if e.status == ExpeditionStatusEnum.APPROVED.value)
    active = sum(1 for e in all_exps if e.status == ExpeditionStatusEnum.ACTIVE.value)
    completed = sum(1 for e in all_exps if e.status == ExpeditionStatusEnum.COMPLETED.value)
    cancelled = sum(1 for e in all_exps if e.status == ExpeditionStatusEnum.CANCELLED.value)
    
    upcoming = sum(1 for e in all_exps if (e.status in [ExpeditionStatusEnum.PLANNED.value, ExpeditionStatusEnum.APPROVED.value]) and e.start_date >= today_str)
    
    recent = db.query(Expedition).order_by(desc(Expedition.created_at)).limit(6).all()

    return DashboardStatsSchema(
        total_expeditions=total,
        planned_expeditions=planned,
        approved_expeditions=approved,
        active_expeditions=active,
        completed_expeditions=completed,
        cancelled_expeditions=cancelled,
        upcoming_expeditions=upcoming,
        recent_expeditions=recent
    )

@router.get("/search", response_model=List[ExpeditionOut])
def search_expeditions(
    q: Optional[str] = Query(None, description="General search query"),
    status: Optional[str] = Query(None, description="Comma separated or single status"),
    year: Optional[int] = Query(None, description="Expedition operational year"),
    target_region: Optional[str] = Query(None, description="Region filter"),
    lead_organization: Optional[str] = Query(None, description="Lead organization filter"),
    start_date: Optional[str] = Query(None, description="Min start date"),
    end_date: Optional[str] = Query(None, description="Max end date"),
    date_from: Optional[str] = Query(None, description="Date range operational start overlap"),
    date_to: Optional[str] = Query(None, description="Date range operational end overlap"),
    db: Session = Depends(get_db)
):
    query = db.query(Expedition)

    if q and q.strip():
        term = f"%{q.strip()}%"
        query = query.filter(
            or_(
                Expedition.expedition_id.ilike(term),
                Expedition.expedition_name.ilike(term),
                Expedition.expedition_code.ilike(term),
                Expedition.target_region.ilike(term),
                Expedition.lead_organization.ilike(term),
                Expedition.expedition_leader.ilike(term),
                Expedition.description.ilike(term),
                Expedition.mission_objective.ilike(term)
            )
        )

    if status and status.upper() != "ALL":
        statuses = [s.strip() for s in status.split(",")]
        query = query.filter(Expedition.status.in_(statuses))

    if year:
        query = query.filter(Expedition.expedition_year == year)

    if target_region and target_region.upper() != "ALL":
        query = query.filter(Expedition.target_region.ilike(f"%{target_region.strip()}%"))

    if lead_organization and lead_organization.upper() != "ALL":
        query = query.filter(Expedition.lead_organization.ilike(f"%{lead_organization.strip()}%"))

    if start_date:
        query = query.filter(Expedition.start_date >= start_date)

    if end_date:
        query = query.filter(Expedition.end_date <= end_date)

    if date_from and date_to:
        if date_to < date_from:
            raise HTTPException(status_code=400, detail="End date cannot be before start date.")
        query = query.filter(and_(Expedition.start_date <= date_to, Expedition.end_date >= date_from))
    elif date_from:
        query = query.filter(Expedition.end_date >= date_from)
    elif date_to:
        query = query.filter(Expedition.start_date <= date_to)

    return query.order_by(desc(Expedition.created_at)).all()

@router.get("", response_model=List[ExpeditionOut])
def list_expeditions(
    db: Session = Depends(get_db),
    status: Optional[str] = None,
    year: Optional[int] = None
):
    query = db.query(Expedition)
    if status and status.upper() != "ALL":
        query = query.filter(Expedition.status == status)
    if year:
        query = query.filter(Expedition.expedition_year == year)
    return query.order_by(desc(Expedition.created_at)).all()

@router.get("/{id_or_code}", response_model=ExpeditionDetailResponse)
def get_expedition(id_or_code: str, db: Session = Depends(get_db)):
    if id_or_code.isdigit():
        exp = db.query(Expedition).filter(Expedition.id == int(id_or_code)).first()
    else:
        exp = db.query(Expedition).filter(
            or_(
                Expedition.expedition_id.ilike(id_or_code),
                Expedition.expedition_code.ilike(id_or_code)
            )
        ).first()

    if not exp:
        raise HTTPException(status_code=404, detail=f"Expedition '{id_or_code}' not found.")

    counts = FutureModuleCountsSchema(
        personnel_count=db.query(PersonnelExpedition).filter(PersonnelExpedition.expedition_id == exp.expedition_id).count(),
        teams_count=db.query(TeamsExpedition).filter(TeamsExpedition.expedition_id == exp.expedition_id).count(),
        locations_count=db.query(LocationsExpedition).filter(LocationsExpedition.expedition_id == exp.expedition_id).count(),
        cargo_count=db.query(CargoExpedition).filter(CargoExpedition.expedition_id == exp.expedition_id).count(),
        shipments_count=db.query(ShipmentsExpedition).filter(ShipmentsExpedition.expedition_id == exp.expedition_id).count(),
        inventory_count=db.query(InventoryExpedition).filter(InventoryExpedition.expedition_id == exp.expedition_id).count(),
        assets_count=db.query(AssetsExpedition).filter(AssetsExpedition.expedition_id == exp.expedition_id).count(),
    )

    logs = db.query(ExpeditionAuditLog).filter(
        ExpeditionAuditLog.expedition_id == exp.expedition_id
    ).order_by(desc(ExpeditionAuditLog.timestamp)).all()

    return ExpeditionDetailResponse(
        expedition=exp,
        module_connections=counts,
        audit_logs=logs
    )

@router.post("", response_model=ExpeditionOut, status_code=status.HTTP_201_CREATED)
def create_expedition(
    payload: ExpeditionCreate,
    db: Session = Depends(get_db),
    user: dict = Depends(require_expedition_manager)
):
    # Duplicate ID check
    existing_id = db.query(Expedition).filter(Expedition.expedition_id.ilike(payload.expedition_id)).first()
    if existing_id:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Expedition ID already exists.")

    # Duplicate Code check
    existing_code = db.query(Expedition).filter(Expedition.expedition_code.ilike(payload.expedition_code)).first()
    if existing_code:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Expedition code already exists.")

    new_exp = Expedition(
        expedition_id=payload.expedition_id.strip(),
        expedition_name=payload.expedition_name.strip(),
        expedition_code=payload.expedition_code.strip(),
        expedition_year=payload.expedition_year,
        description=payload.description.strip() if payload.description else None,
        mission_objective=payload.mission_objective.strip() if payload.mission_objective else None,
        target_region=payload.target_region.strip(),
        lead_organization=payload.lead_organization.strip(),
        expedition_leader=payload.expedition_leader.strip(),
        start_date=payload.start_date,
        end_date=payload.end_date,
        status=payload.status.value,
        notes=payload.notes.strip() if payload.notes else None,
        created_by=user.get("email"),
        updated_by=user.get("email")
    )
    db.add(new_exp)
    db.flush()

    # Create Audit Log
    audit = ExpeditionAuditLog(
        expedition_id=new_exp.expedition_id,
        user_email=user.get("email", "unknown"),
        user_name=user.get("name", "Unknown User"),
        user_role=user.get("role", "Expedition Manager"),
        action="CREATED",
        previous_state=None,
        new_state=json.dumps({"expedition_id": new_exp.expedition_id, "status": new_exp.status}),
        details=f"Expedition {new_exp.expedition_id} ({new_exp.expedition_name}) registered successfully."
    )
    db.add(audit)
    db.commit()
    db.refresh(new_exp)
    return new_exp

@router.put("/{id_or_code}", response_model=ExpeditionOut)
def update_expedition(
    id_or_code: str,
    payload: ExpeditionUpdate,
    db: Session = Depends(get_db),
    user: dict = Depends(require_expedition_manager)
):
    if id_or_code.isdigit():
        exp = db.query(Expedition).filter(Expedition.id == int(id_or_code)).first()
    else:
        exp = db.query(Expedition).filter(Expedition.expedition_id.ilike(id_or_code)).first()

    if not exp:
        raise HTTPException(status_code=404, detail=f"Expedition '{id_or_code}' not found.")

    previous_state = json.dumps({
        "name": exp.expedition_name,
        "status": exp.status,
        "start_date": exp.start_date,
        "end_date": exp.end_date
    })

    # Code uniqueness check if modified
    if payload.expedition_code and payload.expedition_code.lower() != exp.expedition_code.lower():
        code_conflict = db.query(Expedition).filter(
            and_(Expedition.expedition_code.ilike(payload.expedition_code), Expedition.id != exp.id)
        ).first()
        if code_conflict:
            raise HTTPException(status_code=409, detail="Expedition code already exists.")
        exp.expedition_code = payload.expedition_code.strip()

    # Date order validation if either date is modified
    new_start = payload.start_date or exp.start_date
    new_end = payload.end_date or exp.end_date
    if new_end < new_start:
        raise HTTPException(status_code=400, detail="End date cannot be before start date.")

    # Status transition check
    status_changed = False
    action_type = "UPDATED"
    if payload.status and payload.status.value != exp.status:
        curr_enum = ExpeditionStatusEnum(exp.status)
        target_enum = payload.status
        allowed = VALID_TRANSITIONS.get(curr_enum, [])
        if target_enum not in allowed:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status transition from '{exp.status}' to '{target_enum.value}'."
            )
        exp.status = target_enum.value
        status_changed = True
        action_type = target_enum.value.upper()

    # Apply other fields
    if payload.expedition_name is not None:
        exp.expedition_name = payload.expedition_name.strip()
    if payload.expedition_year is not None:
        exp.expedition_year = payload.expedition_year
    if payload.description is not None:
        exp.description = payload.description.strip()
    if payload.mission_objective is not None:
        exp.mission_objective = payload.mission_objective.strip()
    if payload.target_region is not None:
        exp.target_region = payload.target_region.strip()
    if payload.lead_organization is not None:
        exp.lead_organization = payload.lead_organization.strip()
    if payload.expedition_leader is not None:
        exp.expedition_leader = payload.expedition_leader.strip()
    if payload.notes is not None:
        exp.notes = payload.notes.strip()

    exp.start_date = new_start
    exp.end_date = new_end
    exp.updated_at = datetime.utcnow()
    exp.updated_by = user.get("email")

    new_state = json.dumps({
        "name": exp.expedition_name,
        "status": exp.status,
        "start_date": exp.start_date,
        "end_date": exp.end_date
    })

    audit = ExpeditionAuditLog(
        expedition_id=exp.expedition_id,
        user_email=user.get("email", "unknown"),
        user_name=user.get("name", "Unknown User"),
        user_role=user.get("role", "Expedition Manager"),
        action=action_type,
        previous_state=previous_state,
        new_state=new_state,
        details=f"Expedition {exp.expedition_id} updated. Status: {exp.status}."
    )
    db.add(audit)
    db.commit()
    db.refresh(exp)
    return exp

@router.delete("/{id_or_code}")
def delete_expedition(
    id_or_code: str,
    db: Session = Depends(get_db),
    user: dict = Depends(require_expedition_manager)
):
    if id_or_code.isdigit():
        exp = db.query(Expedition).filter(Expedition.id == int(id_or_code)).first()
    else:
        exp = db.query(Expedition).filter(Expedition.expedition_id.ilike(id_or_code)).first()

    if not exp:
        raise HTTPException(status_code=404, detail=f"Expedition '{id_or_code}' not found.")

    # Check for associated operational records
    personnel_count = db.query(PersonnelExpedition).filter(PersonnelExpedition.expedition_id == exp.expedition_id).count()
    teams_count = db.query(TeamsExpedition).filter(TeamsExpedition.expedition_id == exp.expedition_id).count()
    cargo_count = db.query(CargoExpedition).filter(CargoExpedition.expedition_id == exp.expedition_id).count()
    shipments_count = db.query(ShipmentsExpedition).filter(ShipmentsExpedition.expedition_id == exp.expedition_id).count()
    inventory_count = db.query(InventoryExpedition).filter(InventoryExpedition.expedition_id == exp.expedition_id).count()
    assets_count = db.query(AssetsExpedition).filter(AssetsExpedition.expedition_id == exp.expedition_id).count()

    total_records = personnel_count + teams_count + cargo_count + shipments_count + inventory_count + assets_count

    if total_records > 0 or exp.status in [ExpeditionStatusEnum.ACTIVE.value, ExpeditionStatusEnum.COMPLETED.value]:
        # Log rejected attempt
        audit = ExpeditionAuditLog(
            expedition_id=exp.expedition_id,
            user_email=user.get("email", "unknown"),
            user_name=user.get("name", "Unknown User"),
            user_role=user.get("role", "Expedition Manager"),
            action="DELETE_ATTEMPTED",
            previous_state=json.dumps({"expedition_id": exp.expedition_id, "records": total_records}),
            details=f"Delete rejected: contains {total_records} associated operational records."
        )
        db.add(audit)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This expedition cannot be deleted because it contains associated operational records."
        )

    exp_id = exp.expedition_id
    db.delete(exp)
    db.commit()
    return {"success": True, "message": f"Expedition {exp_id} successfully deleted."}

@router.get("/{id_or_code}/audit-logs", response_model=List[ExpeditionAuditLogOut])
def get_audit_trail(id_or_code: str, db: Session = Depends(get_db)):
    if id_or_code.isdigit():
        exp = db.query(Expedition).filter(Expedition.id == int(id_or_code)).first()
        exp_id = exp.expedition_id if exp else ""
    else:
        exp_id = id_or_code

    return db.query(ExpeditionAuditLog).filter(
        ExpeditionAuditLog.expedition_id.ilike(exp_id)
    ).order_by(desc(ExpeditionAuditLog.timestamp)).all()
