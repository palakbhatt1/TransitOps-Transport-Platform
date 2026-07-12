from app.schemas.contracts import Vehicle, VehicleStatus, Driver, DriverStatus, Trip, TripStatus, MaintenanceLog
from datetime import datetime, timedelta

# Seed data for vehicles
mock_vehicles_db = [
    Vehicle(
        id="v1",
        registration_number="TRUCK-001",
        model="Volvo FH16",
        type="Heavy Duty Truck",
        max_load_kg=20000,
        odometer=150000,
        acquisition_cost=120000.00,
        region="North",
        status=VehicleStatus.available
    ),
    Vehicle(
        id="v2",
        registration_number="VAN-002",
        model="Ford Transit",
        type="Cargo Van",
        max_load_kg=1500,
        odometer=45000,
        acquisition_cost=35000.00,
        region="South",
        status=VehicleStatus.on_trip
    ),
    Vehicle(
        id="v3",
        registration_number="TRUCK-003",
        model="Scania R500",
        type="Flatbed Truck",
        max_load_kg=15000,
        odometer=98000,
        acquisition_cost=95000.00,
        region="East",
        status=VehicleStatus.in_shop
    ),
    Vehicle(
        id="v4",
        registration_number="VAN-004",
        model="Mercedes Sprinter",
        type="Cargo Van",
        max_load_kg=1800,
        odometer=12000,
        acquisition_cost=42000.00,
        region="West",
        status=VehicleStatus.available
    ),
    Vehicle(
        id="v5",
        registration_number="TRUCK-005",
        model="Volvo FH16",
        type="Heavy Duty Truck",
        max_load_kg=20000,
        odometer=250000,
        acquisition_cost=110000.00,
        region="North",
        status=VehicleStatus.retired
    )
]

# Seed data for drivers
mock_drivers_db = [
    Driver(
        id="d1",
        name="John Doe",
        license_number="DL-12345",
        category="Class A",
        license_expiry=(datetime.now() + timedelta(days=365)).strftime("%Y-%m-%d"),
        contact="+1-555-0101",
        safety_score=4.8,
        status=DriverStatus.available
    ),
    Driver(
        id="d2",
        name="Jane Smith",
        license_number="DL-67890",
        category="Class B",
        license_expiry=(datetime.now() + timedelta(days=180)).strftime("%Y-%m-%d"),
        contact="+1-555-0102",
        safety_score=4.9,
        status=DriverStatus.on_trip
    ),
    Driver(
        id="d3",
        name="Bob Johnson",
        license_number="DL-11111",
        category="Class A",
        license_expiry=(datetime.now() - timedelta(days=10)).strftime("%Y-%m-%d"),  # Expired
        contact="+1-555-0103",
        safety_score=3.5,
        status=DriverStatus.off_duty
    ),
    Driver(
        id="d4",
        name="Alice Williams",
        license_number="DL-22222",
        category="Class B",
        license_expiry=(datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d"),
        contact="+1-555-0104",
        safety_score=2.1,  # Low safety score, but available
        status=DriverStatus.suspended
    ),
    Driver(
        id="d5",
        name="Charlie Brown",
        license_number="DL-33333",
        category="Class A",
        license_expiry=(datetime.now() + timedelta(days=200)).strftime("%Y-%m-%d"),
        contact="+1-555-0105",
        safety_score=4.5,
        status=DriverStatus.available
    )
]

# Seed data for trips
mock_trips_db = [
    Trip(
        id="t1",
        vehicle_id="v2",
        driver_id="d2",
        origin="Warehouse A",
        destination="Client X",
        cargo_weight_kg=1200.0,
        status=TripStatus.dispatched,
        dispatched_at=datetime.utcnow() - timedelta(hours=2)
    ),
    Trip(
        id="t2",
        vehicle_id="v1",
        driver_id="d1",
        origin="Warehouse B",
        destination="Client Y",
        cargo_weight_kg=15000.0,
        status=TripStatus.draft
    )
]

# Seed data for maintenance logs
mock_maintenance_db = [
    MaintenanceLog(
        id="m1",
        vehicle_id="v3",
        service_type="Brake Replacement",
        cost=850.0,
        opened_at=datetime.utcnow() - timedelta(days=1)
    )
]
