from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.database import Base

class Expedition(Base):
    __tablename__ = "expeditions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    expedition_id = Column(String(50), unique=True, nullable=False, index=True)
    expedition_name = Column(String(255), nullable=False, index=True)
    expedition_code = Column(String(50), unique=True, nullable=False, index=True)
    expedition_year = Column(Integer, nullable=False, index=True)
    description = Column(Text, nullable=True)
    mission_objective = Column(Text, nullable=True)
    target_region = Column(String(150), nullable=False, index=True)
    lead_organization = Column(String(200), nullable=False, index=True)
    expedition_leader = Column(String(150), nullable=False)
    start_date = Column(String(10), nullable=False, index=True)  # YYYY-MM-DD
    end_date = Column(String(10), nullable=False, index=True)    # YYYY-MM-DD
    status = Column(String(30), nullable=False, default="Planned", index=True) # Planned, Approved, Active, Completed, Cancelled
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    created_by = Column(String(100), nullable=True)
    updated_by = Column(String(100), nullable=True)

    # Future module relationships referencing expedition_id
    audit_logs = relationship("ExpeditionAuditLog", back_populates="expedition", cascade="all, delete-orphan")
    personnel_links = relationship("PersonnelExpedition", back_populates="expedition")
    teams_links = relationship("TeamsExpedition", back_populates="expedition")
    locations_links = relationship("LocationsExpedition", back_populates="expedition")
    cargo_links = relationship("CargoExpedition", back_populates="expedition")
    shipments_links = relationship("ShipmentsExpedition", back_populates="expedition")
    inventory_links = relationship("InventoryExpedition", back_populates="expedition")
    assets_links = relationship("AssetsExpedition", back_populates="expedition")

    __table_args__ = (
        Index("idx_expedition_status_year", "status", "expedition_year"),
        Index("idx_expedition_dates", "start_date", "end_date"),
    )

class ExpeditionAuditLog(Base):
    __tablename__ = "expedition_audit_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    expedition_id = Column(String(50), ForeignKey("expeditions.expedition_id", ondelete="CASCADE"), nullable=False, index=True)
    user_email = Column(String(100), nullable=False)
    user_name = Column(String(150), nullable=False)
    user_role = Column(String(50), nullable=False)
    action = Column(String(50), nullable=False)  # CREATED, UPDATED, STATUS_CHANGED, APPROVED, ACTIVATED, COMPLETED, CANCELLED, DELETE_ATTEMPTED, DELETED
    previous_state = Column(Text, nullable=True)  # JSON representation
    new_state = Column(Text, nullable=True)       # JSON representation
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    expedition = relationship("Expedition", back_populates="audit_logs")

# Future Module Relationship Models (Schema-Ready)
class PersonnelExpedition(Base):
    __tablename__ = "expedition_personnel"
    id = Column(Integer, primary_key=True, index=True)
    expedition_id = Column(String(50), ForeignKey("expeditions.expedition_id"), nullable=False, index=True)
    personnel_id = Column(String(50), nullable=False)
    role = Column(String(100), nullable=False)
    expedition = relationship("Expedition", back_populates="personnel_links")

class TeamsExpedition(Base):
    __tablename__ = "expedition_teams"
    id = Column(Integer, primary_key=True, index=True)
    expedition_id = Column(String(50), ForeignKey("expeditions.expedition_id"), nullable=False, index=True)
    team_name = Column(String(100), nullable=False)
    team_lead = Column(String(100), nullable=False)
    expedition = relationship("Expedition", back_populates="teams_links")

class LocationsExpedition(Base):
    __tablename__ = "expedition_locations"
    id = Column(Integer, primary_key=True, index=True)
    expedition_id = Column(String(50), ForeignKey("expeditions.expedition_id"), nullable=False, index=True)
    location_name = Column(String(150), nullable=False)
    coordinates = Column(String(100), nullable=False)
    expedition = relationship("Expedition", back_populates="locations_links")

class CargoExpedition(Base):
    __tablename__ = "expedition_cargo"
    id = Column(Integer, primary_key=True, index=True)
    expedition_id = Column(String(50), ForeignKey("expeditions.expedition_id"), nullable=False, index=True)
    container_no = Column(String(50), nullable=False)
    weight_kg = Column(Float, nullable=False)
    expedition = relationship("Expedition", back_populates="cargo_links")

class ShipmentsExpedition(Base):
    __tablename__ = "expedition_shipments"
    id = Column(Integer, primary_key=True, index=True)
    expedition_id = Column(String(50), ForeignKey("expeditions.expedition_id"), nullable=False, index=True)
    shipment_code = Column(String(50), nullable=False)
    vessel_name = Column(String(100), nullable=False)
    expedition = relationship("Expedition", back_populates="shipments_links")

class InventoryExpedition(Base):
    __tablename__ = "expedition_inventory"
    id = Column(Integer, primary_key=True, index=True)
    expedition_id = Column(String(50), ForeignKey("expeditions.expedition_id"), nullable=False, index=True)
    item_code = Column(String(50), nullable=False)
    allocated_quantity = Column(Integer, nullable=False)
    expedition = relationship("Expedition", back_populates="inventory_links")

class AssetsExpedition(Base):
    __tablename__ = "expedition_assets"
    id = Column(Integer, primary_key=True, index=True)
    expedition_id = Column(String(50), ForeignKey("expeditions.expedition_id"), nullable=False, index=True)
    asset_code = Column(String(50), nullable=False)
    asset_name = Column(String(100), nullable=False)
    expedition = relationship("Expedition", back_populates="assets_links")
