from fastapi import APIRouter, HTTPException, Depends, status
from typing import List
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.models import VehicleDB
from app.schemas.contracts import Vehicle, VehicleBase, VehicleStatus
import uuid

router = APIRouter()

@router.get("/", response_model=List[Vehicle])
def get_vehicles(db: Session = Depends(get_db)):
    """Retrieve all vehicles from the database."""
    return db.query(VehicleDB).all()

@router.post("/", response_model=Vehicle)
def create_vehicle(payload: VehicleBase, db: Session = Depends(get_db)):
    """Create a new vehicle with registration number uniqueness validation."""
    # Check registration number uniqueness
    existing = db.query(VehicleDB).filter(
        VehicleDB.registration_number == payload.registration_number
    ).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Validation failed",
                "code": "REGISTRATION_NOT_UNIQUE",
                "message": f"Registration number {payload.registration_number} is already registered.",
                "field": "registration_number"
            }
        )

    db_vehicle = VehicleDB(
        id=f"veh_{uuid.uuid4().hex[:8]}",
        registration_number=payload.registration_number,
        model=payload.model,
        type=payload.type,
        max_load_kg=payload.max_load_kg,
        odometer=payload.odometer,
        acquisition_cost=payload.acquisition_cost,
        region=payload.region,
        status=payload.status.value
    )
    db.add(db_vehicle)
    db.commit()
    db.refresh(db_vehicle)
    return db_vehicle

@router.put("/{id}", response_model=Vehicle)
def update_vehicle(id: str, payload: VehicleBase, db: Session = Depends(get_db)):
    """Update vehicle specifications."""
    db_vehicle = db.query(VehicleDB).filter(VehicleDB.id == id).first()
    if not db_vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    # Check registration number uniqueness if updated
    if db_vehicle.registration_number != payload.registration_number:
        existing = db.query(VehicleDB).filter(
            VehicleDB.registration_number == payload.registration_number
        ).first()
        if existing:
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "Validation failed",
                    "code": "REGISTRATION_NOT_UNIQUE",
                    "message": f"Registration number {payload.registration_number} is already registered.",
                    "field": "registration_number"
                }
            )

    db_vehicle.registration_number = payload.registration_number
    db_vehicle.model = payload.model
    db_vehicle.type = payload.type
    db_vehicle.max_load_kg = payload.max_load_kg
    db_vehicle.odometer = payload.odometer
    db_vehicle.acquisition_cost = payload.acquisition_cost
    db_vehicle.region = payload.region
    db_vehicle.status = payload.status.value

    db.commit()
    db.refresh(db_vehicle)
    return db_vehicle

@router.delete("/{id}")
def delete_vehicle(id: str, db: Session = Depends(get_db)):
    """Delete a vehicle from the system."""
    db_vehicle = db.query(VehicleDB).filter(VehicleDB.id == id).first()
    if not db_vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    db.delete(db_vehicle)
    db.commit()
    return {"message": "Vehicle successfully deleted", "id": id}
