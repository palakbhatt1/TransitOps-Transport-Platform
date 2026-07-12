from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.models import TripDB, VehicleDB, DriverDB
from app.schemas.contracts import Trip, TripBase, TripStatus, VehicleStatus, DriverStatus
import uuid
from datetime import datetime

router = APIRouter()

@router.get("/", response_model=List[Trip])
def get_trips(db: Session = Depends(get_db)):
    """Retrieve all scheduled and dispatched trips from the system."""
    return db.query(TripDB).all()

@router.post("/", response_model=Trip)
def create_trip(trip: TripBase, db: Session = Depends(get_db)):
    """Create a new trip in draft status with input validations."""
    if not trip.origin.strip():
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Validation failed",
                "code": "INVALID_ORIGIN",
                "message": "Origin cannot be empty or blank space",
                "field": "origin"
            }
        )
    if not trip.destination.strip():
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Validation failed",
                "code": "INVALID_DESTINATION",
                "message": "Destination cannot be empty or blank space",
                "field": "destination"
            }
        )
    if trip.cargo_weight_kg <= 0:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Validation failed",
                "code": "INVALID_CARGO_WEIGHT",
                "message": "Cargo weight must be greater than 0 kg",
                "field": "cargo_weight_kg"
            }
        )
        
    # Verify vehicle and driver exist
    vehicle = db.query(VehicleDB).filter(VehicleDB.id == trip.vehicle_id).first()
    if not vehicle:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Validation failed",
                "code": "VEHICLE_NOT_FOUND",
                "message": f"Vehicle with ID {trip.vehicle_id} does not exist",
                "field": "vehicle_id"
            }
        )
        
    driver = db.query(DriverDB).filter(DriverDB.id == trip.driver_id).first()
    if not driver:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Validation failed",
                "code": "DRIVER_NOT_FOUND",
                "message": f"Driver with ID {trip.driver_id} does not exist",
                "field": "driver_id"
            }
        )

    new_trip = TripDB(
        id=str(uuid.uuid4()),
        vehicle_id=trip.vehicle_id,
        driver_id=trip.driver_id,
        origin=trip.origin,
        destination=trip.destination,
        cargo_weight_kg=trip.cargo_weight_kg,
        status=TripStatus.draft.value
    )
    db.add(new_trip)
    db.commit()
    db.refresh(new_trip)
    return new_trip

@router.get("/{id}", response_model=Trip)
def get_trip(id: str, db: Session = Depends(get_db)):
    trip = db.query(TripDB).filter(TripDB.id == id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip

@router.put("/{id}", response_model=Trip)
def update_trip(id: str, trip: TripBase, db: Session = Depends(get_db)):
    """Update trip details."""
    db_trip = db.query(TripDB).filter(TripDB.id == id).first()
    if not db_trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    if not trip.origin.strip():
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Validation failed",
                "code": "INVALID_ORIGIN",
                "message": "Origin cannot be empty or blank space",
                "field": "origin",
            },
        )
    if not trip.destination.strip():
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Validation failed",
                "code": "INVALID_DESTINATION",
                "message": "Destination cannot be empty or blank space",
                "field": "destination",
            },
        )
    if trip.cargo_weight_kg <= 0:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Validation failed",
                "code": "INVALID_CARGO_WEIGHT",
                "message": "Cargo weight must be greater than 0 kg",
                "field": "cargo_weight_kg",
            },
        )

    # Verify vehicle and driver exist
    vehicle = db.query(VehicleDB).filter(VehicleDB.id == trip.vehicle_id).first()
    if not vehicle:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Validation failed",
                "code": "VEHICLE_NOT_FOUND",
                "message": f"Vehicle with ID {trip.vehicle_id} does not exist",
                "field": "vehicle_id",
            },
        )

    driver = db.query(DriverDB).filter(DriverDB.id == trip.driver_id).first()
    if not driver:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Validation failed",
                "code": "DRIVER_NOT_FOUND",
                "message": f"Driver with ID {trip.driver_id} does not exist",
                "field": "driver_id",
            },
        )

    db_trip.vehicle_id = trip.vehicle_id
    db_trip.driver_id = trip.driver_id
    db_trip.origin = trip.origin
    db_trip.destination = trip.destination
    db_trip.cargo_weight_kg = trip.cargo_weight_kg
    db_trip.status = trip.status.value
    db_trip.dispatched_at = trip.dispatched_at
    db_trip.completed_at = trip.completed_at

    db.commit()
    db.refresh(db_trip)
    return db_trip

@router.post("/{id}/dispatch", response_model=Trip)
def dispatch_trip(id: str, db: Session = Depends(get_db)):
    """Dispatch a trip and update vehicle and driver status to active."""
    trip = db.query(TripDB).filter(TripDB.id == id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    if trip.status != TripStatus.draft.value:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Validation failed",
                "code": "INVALID_TRIP_STATUS",
                "message": f"Cannot dispatch trip in {trip.status} status. Must be in 'draft' status.",
                "field": "status"
            }
        )

    # 1. Fetch Vehicle, ensure status == available
    vehicle = db.query(VehicleDB).filter(VehicleDB.id == trip.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle assigned to trip not found")
        
    if vehicle.status != VehicleStatus.available.value:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Validation failed",
                "code": "VEHICLE_UNAVAILABLE",
                "message": f"Vehicle {vehicle.registration_number} is currently {vehicle.status}",
                "field": "vehicle_id"
            }
        )

    # 2. Fetch Driver, ensure status == available
    driver = db.query(DriverDB).filter(DriverDB.id == trip.driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver assigned to trip not found")
        
    if driver.status != DriverStatus.available.value:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Validation failed",
                "code": "DRIVER_UNAVAILABLE",
                "message": f"Driver {driver.name} is currently {driver.status}",
                "field": "driver_id"
            }
        )

    # Check for expired license
    try:
        expiry_date = datetime.strptime(driver.license_expiry, "%Y-%m-%d")
        if expiry_date < datetime.now():
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "Validation failed",
                    "code": "DRIVER_LICENSE_EXPIRED",
                    "message": f"Driver {driver.name}'s license expired on {driver.license_expiry}",
                    "field": "driver_id"
                }
            )
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Validation failed",
                "code": "INVALID_LICENSE_EXPIRY",
                "message": f"Driver license expiry date format is invalid: {driver.license_expiry}",
                "field": "driver_id"
            }
        )

    # 3. Check cargo_weight_kg <= vehicle.max_load_kg
    if trip.cargo_weight_kg > vehicle.max_load_kg:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Validation failed",
                "code": "CARGO_EXCEEDS_CAPACITY",
                "message": f"Cargo weight ({trip.cargo_weight_kg} kg) exceeds vehicle capacity ({vehicle.max_load_kg} kg)",
                "field": "cargo_weight_kg"
            }
        )

    # 4. Vehicle/Driver double assignment check (sanity check, covered by status but good practice)
    active_vehicle_trip = db.query(TripDB).filter(
        TripDB.vehicle_id == vehicle.id,
        TripDB.status == TripStatus.dispatched.value
    ).first()
    if active_vehicle_trip:
         raise HTTPException(
            status_code=400,
            detail={
                "error": "Validation failed",
                "code": "VEHICLE_ALREADY_ASSIGNED",
                "message": f"Vehicle {vehicle.registration_number} is already assigned to active trip {active_vehicle_trip.id}",
                "field": "vehicle_id"
            }
        )

    active_driver_trip = db.query(TripDB).filter(
        TripDB.driver_id == driver.id,
        TripDB.status == TripStatus.dispatched.value
    ).first()
    if active_driver_trip:
         raise HTTPException(
            status_code=400,
            detail={
                "error": "Validation failed",
                "code": "DRIVER_ALREADY_ASSIGNED",
                "message": f"Driver {driver.name} is already assigned to active trip {active_driver_trip.id}",
                "field": "driver_id"
            }
        )

    # Atomic transaction
    trip.status = TripStatus.dispatched.value
    trip.dispatched_at = datetime.utcnow()
    vehicle.status = VehicleStatus.on_trip.value
    driver.status = DriverStatus.on_trip.value
    
    db.commit()
    db.refresh(trip)
    return trip

@router.post("/{id}/complete", response_model=Trip)
def complete_trip(id: str, db: Session = Depends(get_db)):
    trip = db.query(TripDB).filter(TripDB.id == id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
        
    if trip.status != TripStatus.dispatched.value:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Validation failed",
                "code": "INVALID_TRIP_STATUS",
                "message": f"Cannot complete trip in {trip.status} status. Must be in 'dispatched' status.",
                "field": "status"
            }
        )
    
    vehicle = db.query(VehicleDB).filter(VehicleDB.id == trip.vehicle_id).first()
    driver = db.query(DriverDB).filter(DriverDB.id == trip.driver_id).first()

    trip.status = TripStatus.completed.value
    trip.completed_at = datetime.utcnow()
    
    if vehicle:
        vehicle.status = VehicleStatus.available.value
    if driver:
        driver.status = DriverStatus.available.value
        
    db.commit()
    db.refresh(trip)
    return trip

@router.post("/{id}/cancel", response_model=Trip)
def cancel_trip(id: str, db: Session = Depends(get_db)):
    trip = db.query(TripDB).filter(TripDB.id == id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
        
    if trip.status != TripStatus.dispatched.value and trip.status != TripStatus.draft.value:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Validation failed",
                "code": "INVALID_TRIP_STATUS",
                "message": f"Cannot cancel trip in {trip.status} status. Must be in 'draft' or 'dispatched' status.",
                "field": "status"
            }
        )
    
    vehicle = db.query(VehicleDB).filter(VehicleDB.id == trip.vehicle_id).first()
    driver = db.query(DriverDB).filter(DriverDB.id == trip.driver_id).first()

    trip.status = TripStatus.cancelled.value
    
    if vehicle:
        vehicle.status = VehicleStatus.available.value
    if driver:
        driver.status = DriverStatus.available.value
        
    db.commit()
    db.refresh(trip)
    return trip
