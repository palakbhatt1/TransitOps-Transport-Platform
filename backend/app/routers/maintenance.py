from fastapi import APIRouter, HTTPException, status
from typing import List
from app.schemas.contracts import MaintenanceLog, MaintenanceLogBase, VehicleStatus
from app.mock_db import mock_maintenance_db, mock_vehicles_db
import uuid
from datetime import datetime

router = APIRouter()

@router.get("/", response_model=List[MaintenanceLog])
def get_maintenance_logs():
    return mock_maintenance_db

@router.post("/", response_model=MaintenanceLog)
def open_maintenance_log(log: MaintenanceLogBase):
    # Strict input validations
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
    vehicle = next((v for v in mock_vehicles_db if v.id == log.vehicle_id), None)
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
    if vehicle.status == VehicleStatus.in_shop:
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
    if vehicle.status == VehicleStatus.on_trip:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Validation failed",
                "code": "VEHICLE_ON_TRIP",
                "message": f"Vehicle {vehicle.registration_number} is currently on an active trip and cannot be sent to maintenance",
                "field": "vehicle_id"
            }
        )

    new_log = MaintenanceLog(
        id=str(uuid.uuid4()),
        vehicle_id=log.vehicle_id,
        service_type=log.service_type,
        cost=log.cost,
        opened_at=datetime.utcnow()
    )
    mock_maintenance_db.append(new_log)
    
    # Set vehicle status to 'in_shop'
    vehicle.status = VehicleStatus.in_shop
    
    return new_log

@router.put("/{id}/close", response_model=MaintenanceLog)
def close_maintenance_log(id: str):
    log = next((m for m in mock_maintenance_db if m.id == id), None)
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
    
    # Set vehicle status back to 'available' if it is currently 'in_shop'
    vehicle = next((v for v in mock_vehicles_db if v.id == log.vehicle_id), None)
    if vehicle and vehicle.status == VehicleStatus.in_shop:
        vehicle.status = VehicleStatus.available
    
    return log
