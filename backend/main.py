from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, vehicles, drivers, trips, maintenance, dashboard, finance, reports

from app.database.database import Base, engine, SessionLocal
import app.models.models
from app.models.models import VehicleDB, DriverDB, TripDB, MaintenanceLogDB
from app.mock_db import mock_vehicles_db, mock_drivers_db, mock_trips_db, mock_maintenance_db

# Auto-create tables
Base.metadata.create_all(bind=engine)

# Auto-seed if tables are empty
db = SessionLocal()
try:
    if db.query(VehicleDB).count() == 0:
        for v in mock_vehicles_db:
            db_v = VehicleDB(
                id=v.id,
                registration_number=v.registration_number,
                model=v.model,
                type=v.type,
                max_load_kg=v.max_load_kg,
                odometer=v.odometer,
                acquisition_cost=v.acquisition_cost,
                region=v.region,
                status=v.status.value
            )
            db.add(db_v)
        
        for d in mock_drivers_db:
            db_d = DriverDB(
                id=d.id,
                name=d.name,
                license_number=d.license_number,
                category=d.category,
                license_expiry=d.license_expiry,
                contact=d.contact,
                safety_score=d.safety_score,
                status=d.status.value
            )
            db.add(db_d)
            
        for t in mock_trips_db:
            db_t = TripDB(
                id=t.id,
                vehicle_id=t.vehicle_id,
                driver_id=t.driver_id,
                origin=t.origin,
                destination=t.destination,
                cargo_weight_kg=t.cargo_weight_kg,
                status=t.status.value,
                dispatched_at=t.dispatched_at,
                completed_at=t.completed_at
            )
            db.add(db_t)
            
        for m in mock_maintenance_db:
            db_m = MaintenanceLogDB(
                id=m.id,
                vehicle_id=m.vehicle_id,
                service_type=m.service_type,
                cost=m.cost,
                opened_at=m.opened_at,
                closed_at=m.closed_at
            )
            db.add(db_m)
            
        db.commit()
finally:
    db.close()

app = FastAPI(title="TransitOps API")



# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(vehicles.router, prefix="/api/vehicles", tags=["Vehicles"])
app.include_router(drivers.router, prefix="/api/drivers", tags=["Drivers"])
app.include_router(trips.router, prefix="/api/trips", tags=["Trips"])
app.include_router(maintenance.router, prefix="/api/maintenance", tags=["Maintenance"])
app.include_router(finance.router, prefix="/api/finance", tags=["Finance"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])

@app.get("/")
def read_root():
    return {"message": "Welcome to TransitOps API"}
