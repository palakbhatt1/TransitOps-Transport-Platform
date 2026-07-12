from fastapi import APIRouter, HTTPException, status
from typing import List
from app.schemas.contracts import Trip, TripBase, TripStatus, VehicleStatus, DriverStatus
from app.mock_db import mock_trips_db, mock_vehicles_db, mock_drivers_db
import uuid
from datetime import datetime

router = APIRouter()

@router.get("/", response_model=List[Trip])
def get_trips():
    return mock_trips_db
    """Retrieve all scheduled and dispatched trips from the system."""

@router.post("/", response_model=Trip)
def create_trip(trip: TripBase):
    # Strict input validations
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
    vehicle = next((v for v in mock_vehicles_db if v.id == trip.vehicle_id), None)
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
        
    driver = next((d for d in mock_drivers_db if d.id == trip.driver_id), None)
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

    new_trip = Trip(
        id=str(uuid.uuid4()),
        **trip.model_dump()
    )
    new_trip.status = TripStatus.draft
    mock_trips_db.append(new_trip)
    return new_trip

@router.get("/{id}", response_model=Trip)
def get_trip(id: str):
    trip = next((t for t in mock_trips_db if t.id == id), None)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip

@router.post("/{id}/dispatch", response_model=Trip)
def dispatch_trip(id: str):
    trip = next((t for t in mock_trips_db if t.id == id), None)
    """Dispatch a trip and update vehicle and driver status to active."""
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    if trip.status != TripStatus.draft:
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
    vehicle = next((v for v in mock_vehicles_db if v.id == trip.vehicle_id), None)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle assigned to trip not found")
        
    if vehicle.status != VehicleStatus.available:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Validation failed",
                "code": "VEHICLE_UNAVAILABLE",
                "message": f"Vehicle {vehicle.registration_number} is currently {vehicle.status.value}",
                "field": "vehicle_id"
            }
        )

    # 2. Fetch Driver, ensure status == available
    driver = next((d for d in mock_drivers_db if d.id == trip.driver_id), None)
    if not driver:
        raise HTTPException(status_code=404, detail="Driver assigned to trip not found")
        
    if driver.status != DriverStatus.available:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Validation failed",
                "code": "DRIVER_UNAVAILABLE",
                "message": f"Driver {driver.name} is currently {driver.status.value}",
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
    active_vehicle_trip = next((t for t in mock_trips_db if t.vehicle_id == vehicle.id and t.status == TripStatus.dispatched), None)
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

    active_driver_trip = next((t for t in mock_trips_db if t.driver_id == driver.id and t.status == TripStatus.dispatched), None)
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

    # Atomic-like update (in-memory mutation)
    trip.status = TripStatus.dispatched
    trip.dispatched_at = datetime.utcnow()
    vehicle.status = VehicleStatus.on_trip
    driver.status = DriverStatus.on_trip
    
    return trip

@router.post("/{id}/complete", response_model=Trip)
def complete_trip(id: str):
    trip = next((t for t in mock_trips_db if t.id == id), None)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
        
    if trip.status != TripStatus.dispatched:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Validation failed",
                "code": "INVALID_TRIP_STATUS",
                "message": f"Cannot complete trip in {trip.status} status. Must be in 'dispatched' status.",
                "field": "status"
            }
        )
    
    vehicle = next((v for v in mock_vehicles_db if v.id == trip.vehicle_id), None)
    driver = next((d for d in mock_drivers_db if d.id == trip.driver_id), None)

    trip.status = TripStatus.completed
    trip.completed_at = datetime.utcnow()
    
    if vehicle:
        vehicle.status = VehicleStatus.available
    if driver:
        driver.status = DriverStatus.available
        
    return trip

@router.post("/{id}/cancel", response_model=Trip)
def cancel_trip(id: str):
    trip = next((t for t in mock_trips_db if t.id == id), None)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
        
    if trip.status != TripStatus.dispatched and trip.status != TripStatus.draft:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Validation failed",
                "code": "INVALID_TRIP_STATUS",
                "message": f"Cannot cancel trip in {trip.status} status. Must be in 'draft' or 'dispatched' status.",
                "field": "status"
            }
        )
    
    vehicle = next((v for v in mock_vehicles_db if v.id == trip.vehicle_id), None)
    driver = next((d for d in mock_drivers_db if d.id == trip.driver_id), None)

    trip.status = TripStatus.cancelled
    
    if vehicle:
        vehicle.status = VehicleStatus.available
    if driver:
        driver.status = DriverStatus.available
        
    return trip
