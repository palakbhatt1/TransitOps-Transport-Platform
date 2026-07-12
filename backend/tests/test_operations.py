from fastapi.testclient import TestClient
from main import app
from app.schemas.contracts import TripStatus, VehicleStatus, DriverStatus
from app.database.database import SessionLocal
from app.models.models import VehicleDB, DriverDB, TripDB, MaintenanceLogDB
from datetime import datetime, timedelta
import pytest

client = TestClient(app)

@pytest.fixture(autouse=True)
def reset_db():
    # Helper to restore SQL database to clean state before each test
    db = SessionLocal()
    try:
        db.query(TripDB).delete()
        db.query(MaintenanceLogDB).delete()
        db.query(VehicleDB).delete()
        db.query(DriverDB).delete()
        db.commit()
        
        db.add_all([
            VehicleDB(
                id="v1", registration_number="TRUCK-001", model="Volvo", type="Truck",
                max_load_kg=20000, odometer=100, acquisition_cost=10000.0, region="North",
                status=VehicleStatus.available.value
            ),
            VehicleDB(
                id="v2", registration_number="TRUCK-002", model="Volvo", type="Truck",
                max_load_kg=20000, odometer=100, acquisition_cost=10000.0, region="North",
                status=VehicleStatus.in_shop.value
            ),
            VehicleDB(
                id="v3", registration_number="TRUCK-003", model="Volvo", type="Truck",
                max_load_kg=20000, odometer=100, acquisition_cost=10000.0, region="North",
                status=VehicleStatus.on_trip.value
            )
        ])
        
        db.add_all([
            DriverDB(
                id="d1", name="John Doe", license_number="DL-1", category="A",
                license_expiry=(datetime.now() + timedelta(days=100)).strftime("%Y-%m-%d"),
                contact="123", safety_score=5.0, status=DriverStatus.available.value
            ),
            DriverDB(
                id="d2", name="Jane Doe", license_number="DL-2", category="A",
                license_expiry=(datetime.now() - timedelta(days=10)).strftime("%Y-%m-%d"),
                contact="123", safety_score=5.0, status=DriverStatus.available.value
            ),
            DriverDB(
                id="d3", name="Jack Doe", license_number="DL-3", category="A",
                license_expiry=(datetime.now() + timedelta(days=100)).strftime("%Y-%m-%d"),
                contact="123", safety_score=1.0, status=DriverStatus.suspended.value
            )
        ])
        db.commit()
    finally:
        db.close()

def check_vehicle_status(vehicle_id: str, expected_status: VehicleStatus):
    db = SessionLocal()
    try:
        vehicle = db.query(VehicleDB).filter(VehicleDB.id == vehicle_id).first()
        assert vehicle is not None
        assert vehicle.status == expected_status.value
    finally:
        db.close()

def check_driver_status(driver_id: str, expected_status: DriverStatus):
    db = SessionLocal()
    try:
        driver = db.query(DriverDB).filter(DriverDB.id == driver_id).first()
        assert driver is not None
        assert driver.status == expected_status.value
    finally:
        db.close()

def test_create_and_dispatch_trip_success():
    # 1. Create a draft trip
    payload = {
        "vehicle_id": "v1",
        "driver_id": "d1",
        "origin": "A",
        "destination": "B",
        "cargo_weight_kg": 5000.0,
        "status": "draft"
    }
    create_response = client.post("/api/trips/", json=payload)
    assert create_response.status_code == 200
    trip_id = create_response.json()["id"]
    
    # Check that vehicle and driver are still available
    check_vehicle_status("v1", VehicleStatus.available)
    check_driver_status("d1", DriverStatus.available)
    
    # 2. Dispatch it
    dispatch_response = client.post(f"/api/trips/{trip_id}/dispatch")
    assert dispatch_response.status_code == 200
    assert dispatch_response.json()["status"] == "dispatched"
    
    # Check that vehicle and driver status are updated to on_trip
    check_vehicle_status("v1", VehicleStatus.on_trip)
    check_driver_status("d1", DriverStatus.on_trip)

def test_dispatch_overweight_cargo():
    # Create trip with 25000 kg cargo on a 20000 kg capacity vehicle
    payload = {
        "vehicle_id": "v1",
        "driver_id": "d1",
        "origin": "A",
        "destination": "B",
        "cargo_weight_kg": 25000.0,
        "status": "draft"
    }
    create_response = client.post("/api/trips/", json=payload)
    trip_id = create_response.json()["id"]
    
    dispatch_response = client.post(f"/api/trips/{trip_id}/dispatch")
    assert dispatch_response.status_code == 400
    err = dispatch_response.json()["detail"]
    assert err["code"] == "CARGO_EXCEEDS_CAPACITY"

def test_dispatch_with_expired_license():
    # Driver d2 has an expired license
    payload = {
        "vehicle_id": "v1",
        "driver_id": "d2",
        "origin": "A",
        "destination": "B",
        "cargo_weight_kg": 5000.0,
        "status": "draft"
    }
    create_response = client.post("/api/trips/", json=payload)
    trip_id = create_response.json()["id"]
    
    dispatch_response = client.post(f"/api/trips/{trip_id}/dispatch")
    assert dispatch_response.status_code == 400
    err = dispatch_response.json()["detail"]
    assert err["code"] == "DRIVER_LICENSE_EXPIRED"

def test_dispatch_unavailable_driver():
    # Driver d3 is suspended
    payload = {
        "vehicle_id": "v1",
        "driver_id": "d3",
        "origin": "A",
        "destination": "B",
        "cargo_weight_kg": 5000.0,
        "status": "draft"
    }
    create_response = client.post("/api/trips/", json=payload)
    trip_id = create_response.json()["id"]
    
    dispatch_response = client.post(f"/api/trips/{trip_id}/dispatch")
    assert dispatch_response.status_code == 400
    err = dispatch_response.json()["detail"]
    assert err["code"] == "DRIVER_UNAVAILABLE"

def test_dispatch_unavailable_vehicle():
    # Vehicle v2 is in_shop
    payload = {
        "vehicle_id": "v2",
        "driver_id": "d1",
        "origin": "A",
        "destination": "B",
        "cargo_weight_kg": 5000.0,
        "status": "draft"
    }
    create_response = client.post("/api/trips/", json=payload)
    trip_id = create_response.json()["id"]
    
    dispatch_response = client.post(f"/api/trips/{trip_id}/dispatch")
    assert dispatch_response.status_code == 400
    err = dispatch_response.json()["detail"]
    assert err["code"] == "VEHICLE_UNAVAILABLE"

def test_maintenance_workflow():
    # 1. Put v1 into maintenance
    payload = {
        "vehicle_id": "v1",
        "service_type": "Oil Change",
        "cost": 150.0,
        "opened_at": datetime.now().isoformat()
    }
    maint_response = client.post("/api/maintenance/", json=payload)
    assert maint_response.status_code == 200
    maint_id = maint_response.json()["id"]
    
    # Vehicle status should be in_shop now
    check_vehicle_status("v1", VehicleStatus.in_shop)
    
    # 2. Try to dispatch a trip with v1 - should fail because it's in maintenance
    trip_payload = {
        "vehicle_id": "v1",
        "driver_id": "d1",
        "origin": "A",
        "destination": "B",
        "cargo_weight_kg": 5000.0,
        "status": "draft"
    }
    create_response = client.post("/api/trips/", json=trip_payload)
    trip_id = create_response.json()["id"]
    dispatch_response = client.post(f"/api/trips/{trip_id}/dispatch")
    assert dispatch_response.status_code == 400
    
    # 3. Close the maintenance log
    close_response = client.put(f"/api/maintenance/{maint_id}/close")
    assert close_response.status_code == 200
    
    # Vehicle status should be available now
    check_vehicle_status("v1", VehicleStatus.available)
    
    # 4. Dispatch should now succeed
    dispatch_response = client.post(f"/api/trips/{trip_id}/dispatch")
    assert dispatch_response.status_code == 200

def test_create_trip_invalid_inputs():
    # 1. Empty origin
    payload = {
        "vehicle_id": "v1",
        "driver_id": "d1",
        "origin": "   ",
        "destination": "B",
        "cargo_weight_kg": 5000.0,
        "status": "draft"
    }
    res = client.post("/api/trips/", json=payload)
    assert res.status_code == 400
    assert res.json()["detail"]["code"] == "INVALID_ORIGIN"

    # 2. Negative cargo weight
    payload["origin"] = "A"
    payload["cargo_weight_kg"] = -100
    res = client.post("/api/trips/", json=payload)
    assert res.status_code == 400
    assert res.json()["detail"]["code"] == "INVALID_CARGO_WEIGHT"

def test_maintenance_invalid_inputs():
    # 1. Negative cost
    payload = {
        "vehicle_id": "v1",
        "service_type": "Tire Rotation",
        "cost": -50.0,
        "opened_at": datetime.now().isoformat()
    }
    res = client.post("/api/maintenance/", json=payload)
    assert res.status_code == 400
    assert res.json()["detail"]["code"] == "INVALID_COST"
