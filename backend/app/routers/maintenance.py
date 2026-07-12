from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Optional
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.models import MaintenanceLogDB, VehicleDB
from app.schemas.contracts import MaintenanceLog, MaintenanceLogBase, VehicleStatus
import uuid
from datetime import datetime

router = APIRouter()

class CloseMaintenanceRequest(BaseModel):
    cost: float

@router.get("/", response_model=List[MaintenanceLog])
def get_maintenance_logs(db: Session = Depends(get_db)):
    """Retrieve all logged maintenance logs."""
    return db.query(MaintenanceLogDB).all()

@router.post("/", response_model=MaintenanceLog)
def open_maintenance_log(log: MaintenanceLogBase, db: Session = Depends(get_db)):
    """Open a new maintenance log and set vehicle to in_shop status."""
    if not log.service_type.strip():
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Validation failed",
                "code": "INVALID_SERVICE_TYPE",
                "message": "Service type cannot be empty or blank space",
                "field": "service_type"
            }
        )
    if log.cost < 0:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Validation failed",
                "code": "INVALID_COST",
                "message": "Maintenance cost cannot be negative",
                "field": "cost"
            }
        )
        
    # Verify vehicle exists
    vehicle = db.query(VehicleDB).filter(VehicleDB.id == log.vehicle_id).first()
    if not vehicle:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Validation failed",
                "code": "VEHICLE_NOT_FOUND",
                "message": f"Vehicle with ID {log.vehicle_id} does not exist",
                "field": "vehicle_id"
            }
        )

    # Double check if vehicle is already in maintenance
    if vehicle.status == VehicleStatus.in_shop.value:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Validation failed",
                "code": "VEHICLE_ALREADY_IN_MAINTENANCE",
                "message": f"Vehicle {vehicle.registration_number} is already in maintenance",
                "field": "vehicle_id"
            }
        )

    # If vehicle is on a trip, block scheduling maintenance until trip is completed
    if vehicle.status == VehicleStatus.on_trip.value:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Validation failed",
                "code": "VEHICLE_ON_TRIP",
                "message": f"Vehicle {vehicle.registration_number} is currently on an active trip and cannot be sent to maintenance",
                "field": "vehicle_id"
            }
        )

    new_log = MaintenanceLogDB(
        id=str(uuid.uuid4()),
        vehicle_id=log.vehicle_id,
        service_type=log.service_type,
        cost=log.cost,
        opened_at=datetime.utcnow()
    )
    db.add(new_log)
    
    # Set vehicle status to 'in_shop'
    vehicle.status = VehicleStatus.in_shop.value
    
    db.commit()
    db.refresh(new_log)
    return new_log

def _close_log(id: str, db: Session, cost: Optional[float] = None):
    log = db.query(MaintenanceLogDB).filter(MaintenanceLogDB.id == id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Maintenance log not found")
    
    if log.closed_at:
        raise HTTPException(
            status_code=400, 
            detail={
                "error": "Validation failed",
                "code": "MAINTENANCE_LOG_ALREADY_CLOSED",
                "message": f"Maintenance log {id} is already closed"
            }
        )
        
    log.closed_at = datetime.utcnow()
    if cost is not None:
        log.cost = cost
    
    # Set vehicle status back to 'available' if it is currently 'in_shop'
    vehicle = db.query(VehicleDB).filter(VehicleDB.id == log.vehicle_id).first()
    if vehicle and vehicle.status == VehicleStatus.in_shop.value:
        vehicle.status = VehicleStatus.available.value
        
    db.commit()
    db.refresh(log)
    return log

@router.put("/{id}/close", response_model=MaintenanceLog)
def close_maintenance_log_put(id: str, db: Session = Depends(get_db)):
    """Close an open maintenance log (PUT, used by unit tests)."""
    return _close_log(id, db)

@router.post("/{id}/close", response_model=MaintenanceLog)
def close_maintenance_log_post(id: str, payload: CloseMaintenanceRequest, db: Session = Depends(get_db)):
    """Close an open maintenance log and set the final invoice cost (POST, used by frontend)."""
    return _close_log(id, db, cost=payload.cost)
