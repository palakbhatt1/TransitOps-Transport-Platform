from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.models import VehicleDB, DriverDB, TripDB
from app.schemas.contracts import DashboardKPIs, VehicleStatus, DriverStatus, TripStatus

router = APIRouter()

@router.get("/kpis", response_model=DashboardKPIs)
def get_dashboard_kpis(db: Session = Depends(get_db)):
    """Calculate and return real-time fleet KPIs from the database."""
    total_vehicles = db.query(VehicleDB).count()
    retired_vehicles = db.query(VehicleDB).filter(VehicleDB.status == VehicleStatus.retired.value).count()
    
    active_vehicles = db.query(VehicleDB).filter(VehicleDB.status == VehicleStatus.on_trip.value).count()
    available_vehicles = db.query(VehicleDB).filter(VehicleDB.status == VehicleStatus.available.value).count()
    vehicles_in_maintenance = db.query(VehicleDB).filter(VehicleDB.status == VehicleStatus.in_shop.value).count()
    
    active_trips = db.query(TripDB).filter(TripDB.status == TripStatus.dispatched.value).count()
    pending_trips = db.query(TripDB).filter(TripDB.status == TripStatus.draft.value).count()
    
    # Drivers on duty are those who are available or currently on trip
    drivers_on_duty = db.query(DriverDB).filter(
        DriverDB.status.in_([DriverStatus.available.value, DriverStatus.on_trip.value])
    ).count()
    
    # Utilization pct = (active vehicles / non-retired vehicles) * 100
    active_capacity = total_vehicles - retired_vehicles
    if active_capacity > 0:
        fleet_utilization_pct = round((active_vehicles / active_capacity) * 100, 1)
    else:
        fleet_utilization_pct = 0.0

    return DashboardKPIs(
        active_vehicles=active_vehicles,
        available_vehicles=available_vehicles,
        vehicles_in_maintenance=vehicles_in_maintenance,
        active_trips=active_trips,
        pending_trips=pending_trips,
        drivers_on_duty=drivers_on_duty,
        fleet_utilization_pct=fleet_utilization_pct
    )

@router.get("/db-status")
def get_db_status(db: Session = Depends(get_db)):
    """Return the currently active database type (sqlite or postgresql)."""
    try:
        dialect = db.bind.dialect.name
    except Exception:
        dialect = "unknown"
    return {"database_type": dialect}

