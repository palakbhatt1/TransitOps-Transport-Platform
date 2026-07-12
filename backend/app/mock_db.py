from app.schemas.contracts import Vehicle, VehicleStatus, Driver, DriverStatus, Trip, TripStatus, MaintenanceLog, FuelLog, Expense
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
    ),
    Vehicle(
        id="v6",
        registration_number="TRUCK-006",
        model="MAN TGX",
        type="Heavy Duty Truck",
        max_load_kg=18000,
        odometer=85000,
        acquisition_cost=105000.00,
        region="East",
        status=VehicleStatus.available
    ),
    Vehicle(
        id="v7",
        registration_number="VAN-007",
        model="Renault Master",
        type="Cargo Van",
        max_load_kg=2000,
        odometer=32000,
        acquisition_cost=38000.00,
        region="South",
        status=VehicleStatus.available
    ),
    Vehicle(
        id="v8",
        registration_number="TRUCK-008",
        model="Kenworth T680",
        type="Heavy Duty Truck",
        max_load_kg=25000,
        odometer=195000,
        acquisition_cost=145000.00,
        region="West",
        status=VehicleStatus.on_trip
    ),
    Vehicle(
        id="v9",
        registration_number="TRUCK-009",
        model="Peterbilt 579",
        type="Heavy Duty Truck",
        max_load_kg=22000,
        odometer=112000,
        acquisition_cost=115000.00,
        region="East",
        status=VehicleStatus.available
    ),
    Vehicle(
        id="v10",
        registration_number="VAN-010",
        model="Nissan NV2500",
        type="Cargo Van",
        max_load_kg=1600,
        odometer=28000,
        acquisition_cost=32000.00,
        region="West",
        status=VehicleStatus.available
    ),
    Vehicle(
        id="v11",
        registration_number="TRUCK-011",
        model="Freightliner Cascadia",
        type="Heavy Duty Truck",
        max_load_kg=24000,
        odometer=182000,
        acquisition_cost=130000.00,
        region="North",
        status=VehicleStatus.on_trip
    ),
    Vehicle(
        id="v12",
        registration_number="VAN-012",
        model="Chevrolet Express",
        type="Cargo Van",
        max_load_kg=1400,
        odometer=73000,
        acquisition_cost=29000.00,
        region="South",
        status=VehicleStatus.in_shop
    ),
    Vehicle(
        id="v13",
        registration_number="TRUCK-013",
        model="Scania R500",
        type="Flatbed Truck",
        max_load_kg=15000,
        odometer=143000,
        acquisition_cost=96000.00,
        region="East",
        status=VehicleStatus.available
    ),
    Vehicle(
        id="v14",
        registration_number="VAN-014",
        model="Mercedes Sprinter",
        type="Cargo Van",
        max_load_kg=1800,
        odometer=31000,
        acquisition_cost=43000.00,
        region="North",
        status=VehicleStatus.available
    ),
    Vehicle(
        id="v15",
        registration_number="TRUCK-015",
        model="Volvo FH16",
        type="Heavy Duty Truck",
        max_load_kg=20000,
        odometer=295000,
        acquisition_cost=115000.00,
        region="West",
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
        license_expiry=(datetime.now() - timedelta(days=10)).strftime("%Y-%m-%d"),
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
        safety_score=2.1,
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
    ),
    Driver(
        id="d6",
        name="Michael Jordan",
        license_number="DL-44444",
        category="Class A",
        license_expiry=(datetime.now() + timedelta(days=300)).strftime("%Y-%m-%d"),
        contact="+1-555-0106",
        safety_score=4.7,
        status=DriverStatus.available
    ),
    Driver(
        id="d7",
        name="Sarah Connor",
        license_number="DL-55555",
        category="Class B",
        license_expiry=(datetime.now() + timedelta(days=100)).strftime("%Y-%m-%d"),
        contact="+1-555-0107",
        safety_score=4.6,
        status=DriverStatus.on_trip
    ),
    Driver(
        id="d8",
        name="David Beckham",
        license_number="DL-66666",
        category="Class A",
        license_expiry=(datetime.now() + timedelta(days=450)).strftime("%Y-%m-%d"),
        contact="+1-555-0108",
        safety_score=4.8,
        status=DriverStatus.available
    ),
    Driver(
        id="d9",
        name="Tom Brady",
        license_number="DL-77777",
        category="Class A",
        license_expiry=(datetime.now() + timedelta(days=280)).strftime("%Y-%m-%d"),
        contact="+1-555-0109",
        safety_score=4.4,
        status=DriverStatus.available
    ),
    Driver(
        id="d10",
        name="Serena Williams",
        license_number="DL-88888",
        category="Class B",
        license_expiry=(datetime.now() + timedelta(days=150)).strftime("%Y-%m-%d"),
        contact="+1-555-0110",
        safety_score=4.9,
        status=DriverStatus.on_trip
    ),
    Driver(
        id="d11",
        name="LeBron James",
        license_number="DL-99999",
        category="Class A",
        license_expiry=(datetime.now() + timedelta(days=400)).strftime("%Y-%m-%d"),
        contact="+1-555-0111",
        safety_score=4.7,
        status=DriverStatus.available
    ),
    Driver(
        id="d12",
        name="Emma Watson",
        license_number="DL-00000",
        category="Class B",
        license_expiry=(datetime.now() + timedelta(days=80)).strftime("%Y-%m-%d"),
        contact="+1-555-0112",
        safety_score=4.5,
        status=DriverStatus.off_duty
    ),
    Driver(
        id="d13",
        name="Lionel Messi",
        license_number="DL-12121",
        category="Class A",
        license_expiry=(datetime.now() + timedelta(days=500)).strftime("%Y-%m-%d"),
        contact="+1-555-0113",
        safety_score=5.0,
        status=DriverStatus.available
    ),
    Driver(
        id="d14",
        name="Cristiano Ronaldo",
        license_number="DL-13131",
        category="Class A",
        license_expiry=(datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d"),
        contact="+1-555-0114",
        safety_score=4.3,
        status=DriverStatus.available
    ),
    Driver(
        id="d15",
        name="Taylor Swift",
        license_number="DL-14141",
        category="Class B",
        license_expiry=(datetime.now() + timedelta(days=600)).strftime("%Y-%m-%d"),
        contact="+1-555-0115",
        safety_score=4.8,
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
    ),
    Trip(
        id="t3",
        vehicle_id="v4",
        driver_id="d5",
        origin="Warehouse C",
        destination="Client Z",
        cargo_weight_kg=1500.0,
        status=TripStatus.completed,
        dispatched_at=datetime.utcnow() - timedelta(days=2),
        completed_at=datetime.utcnow() - timedelta(days=1)
    ),
    Trip(
        id="t4",
        vehicle_id="v8",
        driver_id="d7",
        origin="Terminal 2",
        destination="Distribution Hub",
        cargo_weight_kg=22000.0,
        status=TripStatus.dispatched,
        dispatched_at=datetime.utcnow() - timedelta(hours=4)
    ),
    Trip(
        id="t5",
        vehicle_id="v1",
        driver_id="d1",
        origin="Factory Yard",
        destination="Retail Outlet",
        cargo_weight_kg=14000.0,
        status=TripStatus.completed,
        dispatched_at=datetime.utcnow() - timedelta(days=4),
        completed_at=datetime.utcnow() - timedelta(days=3)
    ),
    Trip(
        id="t6",
        vehicle_id="v6",
        driver_id="d6",
        origin="Harbor Depot",
        destination="Storage Facility",
        cargo_weight_kg=16000.0,
        status=TripStatus.cancelled
    ),
    Trip(
        id="t7",
        vehicle_id="v11",
        driver_id="d10",
        origin="Warehouse A",
        destination="Client M",
        cargo_weight_kg=18500.0,
        status=TripStatus.dispatched,
        dispatched_at=datetime.utcnow() - timedelta(hours=3)
    ),
    Trip(
        id="t8",
        vehicle_id="v6",
        driver_id="d9",
        origin="Warehouse B",
        destination="Client N",
        cargo_weight_kg=12000.0,
        status=TripStatus.completed,
        dispatched_at=datetime.utcnow() - timedelta(days=5),
        completed_at=datetime.utcnow() - timedelta(days=4)
    ),
    Trip(
        id="t9",
        vehicle_id="v13",
        driver_id="d11",
        origin="Factory Yard",
        destination="Client O",
        cargo_weight_kg=8000.0,
        status=TripStatus.completed,
        dispatched_at=datetime.utcnow() - timedelta(days=8),
        completed_at=datetime.utcnow() - timedelta(days=7)
    ),
    Trip(
        id="t10",
        vehicle_id="v7",
        driver_id="d13",
        origin="Harbor Depot",
        destination="Client P",
        cargo_weight_kg=1900.0,
        status=TripStatus.draft
    ),
    Trip(
        id="t11",
        vehicle_id="v14",
        driver_id="d14",
        origin="Terminal 2",
        destination="Client Q",
        cargo_weight_kg=1450.0,
        status=TripStatus.completed,
        dispatched_at=datetime.utcnow() - timedelta(days=1),
        completed_at=datetime.utcnow() - timedelta(hours=18)
    ),
    Trip(
        id="t12",
        vehicle_id="v9",
        driver_id="d15",
        origin="Warehouse C",
        destination="Client R",
        cargo_weight_kg=16200.0,
        status=TripStatus.completed,
        dispatched_at=datetime.utcnow() - timedelta(days=3),
        completed_at=datetime.utcnow() - timedelta(days=2)
    ),
    Trip(
        id="t13",
        vehicle_id="v10",
        driver_id="d6",
        origin="Warehouse A",
        destination="Client S",
        cargo_weight_kg=950.0,
        status=TripStatus.draft
    ),
    Trip(
        id="t14",
        vehicle_id="v1",
        driver_id="d8",
        origin="Warehouse B",
        destination="Client T",
        cargo_weight_kg=14800.0,
        status=TripStatus.completed,
        dispatched_at=datetime.utcnow() - timedelta(days=12),
        completed_at=datetime.utcnow() - timedelta(days=11)
    ),
    Trip(
        id="t15",
        vehicle_id="v13",
        driver_id="d13",
        origin="Terminal 2",
        destination="Client U",
        cargo_weight_kg=9800.0,
        status=TripStatus.cancelled
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
    ),
    MaintenanceLog(
        id="m2",
        vehicle_id="v1",
        service_type="Oil Change & Filter",
        cost=150.0,
        opened_at=datetime.utcnow() - timedelta(days=15),
        closed_at=datetime.utcnow() - timedelta(days=15)
    ),
    MaintenanceLog(
        id="m3",
        vehicle_id="v6",
        service_type="Tire Rotation",
        cost=320.0,
        opened_at=datetime.utcnow() - timedelta(days=3)
    ),
    MaintenanceLog(
        id="m4",
        vehicle_id="v12",
        service_type="AC Compressor Swap",
        cost=600.0,
        opened_at=datetime.utcnow() - timedelta(days=2)
    ),
    MaintenanceLog(
        id="m5",
        vehicle_id="v2",
        service_type="Routine Inspection",
        cost=75.0,
        opened_at=datetime.utcnow() - timedelta(days=20),
        closed_at=datetime.utcnow() - timedelta(days=20)
    ),
    MaintenanceLog(
        id="m6",
        vehicle_id="v6",
        service_type="Windshield Swap",
        cost=450.0,
        opened_at=datetime.utcnow() - timedelta(days=10),
        closed_at=datetime.utcnow() - timedelta(days=9)
    ),
    MaintenanceLog(
        id="m7",
        vehicle_id="v9",
        service_type="Transmission Flush",
        cost=950.0,
        opened_at=datetime.utcnow() - timedelta(days=1),
        closed_at=datetime.utcnow() - timedelta(days=1)
    ),
    MaintenanceLog(
        id="m8",
        vehicle_id="v11",
        service_type="Headlight Bulb Swap",
        cost=45.0,
        opened_at=datetime.utcnow() - timedelta(days=4),
        closed_at=datetime.utcnow() - timedelta(days=4)
    ),
    MaintenanceLog(
        id="m9",
        vehicle_id="v13",
        service_type="Radiator Patch",
        cost=380.0,
        opened_at=datetime.utcnow() - timedelta(days=6),
        closed_at=datetime.utcnow() - timedelta(days=5)
    ),
    MaintenanceLog(
        id="m10",
        vehicle_id="v8",
        service_type="Brake Adjustment",
        cost=200.0,
        opened_at=datetime.utcnow() - timedelta(days=14),
        closed_at=datetime.utcnow() - timedelta(days=14)
    )
]

# Seed data for fuel logs
mock_fuel_db = [
    FuelLog(
        id="f1",
        vehicle_id="v1",
        liters=120.5,
        cost=241.00,
        odometer=150200,
        date=datetime.utcnow() - timedelta(days=5),
        notes="First refill"
    ),
    FuelLog(
        id="f2",
        vehicle_id="v1",
        liters=115.0,
        cost=230.00,
        odometer=151100,
        date=datetime.utcnow() - timedelta(days=2),
        notes="Second refill"
    ),
    FuelLog(
        id="f3",
        vehicle_id="v2",
        liters=45.0,
        cost=90.00,
        odometer=44800,
        date=datetime.utcnow() - timedelta(days=4),
        notes="Routine fill"
    ),
    FuelLog(
        id="f4",
        vehicle_id="v4",
        liters=55.2,
        cost=110.40,
        odometer=11800,
        date=datetime.utcnow() - timedelta(days=3),
        notes="City depot fill"
    ),
    FuelLog(
        id="f5",
        vehicle_id="v3",
        liters=180.0,
        cost=360.00,
        odometer=97500,
        date=datetime.utcnow() - timedelta(days=12),
        notes="Pre-service fill"
    ),
    FuelLog(
        id="f6",
        vehicle_id="v6",
        liters=140.0,
        cost=280.00,
        odometer=84200,
        date=datetime.utcnow() - timedelta(days=10),
        notes="Route start refuel"
    ),
    FuelLog(
        id="f7",
        vehicle_id="v6",
        liters=138.5,
        cost=277.00,
        odometer=85100,
        date=datetime.utcnow() - timedelta(days=4),
        notes="Route end refuel"
    ),
    FuelLog(
        id="f8",
        vehicle_id="v9",
        liters=150.0,
        cost=300.00,
        odometer=110500,
        date=datetime.utcnow() - timedelta(days=18),
        notes="Standard depot fill"
    ),
    FuelLog(
        id="f9",
        vehicle_id="v9",
        liters=148.0,
        cost=296.00,
        odometer=111400,
        date=datetime.utcnow() - timedelta(days=10),
        notes="Second leg refuel"
    ),
    FuelLog(
        id="f10",
        vehicle_id="v11",
        liters=160.0,
        cost=320.00,
        odometer=180100,
        date=datetime.utcnow() - timedelta(days=15),
        notes="Heavy cargo trip prep"
    ),
    FuelLog(
        id="f11",
        vehicle_id="v11",
        liters=165.5,
        cost=331.00,
        odometer=181200,
        date=datetime.utcnow() - timedelta(days=7),
        notes="Mid-route fill"
    ),
    FuelLog(
        id="f12",
        vehicle_id="v13",
        liters=110.0,
        cost=220.00,
        odometer=141800,
        date=datetime.utcnow() - timedelta(days=9),
        notes="General refill"
    )
]

# Seed data for expenses
mock_expenses_db = [
    Expense(
        id="e1",
        vehicle_id="v2",
        category="Toll",
        cost=45.50,
        date=datetime.utcnow() - timedelta(days=3),
        notes="I-80 highway toll"
    ),
    Expense(
        id="e2",
        vehicle_id="v3",
        category="Permit",
        cost=150.00,
        date=datetime.utcnow() - timedelta(days=10),
        notes="Regional oversize load permit"
    ),
    Expense(
        id="e3",
        vehicle_id="v1",
        category="Repairs",
        cost=250.00,
        date=datetime.utcnow() - timedelta(days=20),
        notes="Windshield wiper motor swap"
    ),
    Expense(
        id="e4",
        vehicle_id="v6",
        category="Taxes",
        cost=400.00,
        date=datetime.utcnow() - timedelta(days=30),
        notes="Annual state road tax registration"
    ),
    Expense(
        id="e5",
        vehicle_id="v9",
        category="Toll",
        cost=55.00,
        date=datetime.utcnow() - timedelta(days=12),
        notes="NJ Turnpike toll tollway"
    ),
    Expense(
        id="e6",
        vehicle_id="v11",
        category="Permit",
        cost=120.00,
        date=datetime.utcnow() - timedelta(days=6),
        notes="Overweight state transit permit"
    ),
    Expense(
        id="e7",
        vehicle_id="v6",
        category="Toll",
        cost=38.50,
        date=datetime.utcnow() - timedelta(days=8),
        notes="Ohio Turnpike toll"
    ),
    Expense(
        id="e8",
        vehicle_id="v13",
        category="Toll",
        cost=42.00,
        date=datetime.utcnow() - timedelta(days=15),
        notes="PA Turnpike toll"
    ),
    Expense(
        id="e9",
        vehicle_id="v14",
        category="Permit",
        cost=80.00,
        date=datetime.utcnow() - timedelta(days=22),
        notes="Airport cargo access pass"
    ),
    Expense(
        id="e10",
        vehicle_id="v1",
        category="Other",
        cost=185.00,
        date=datetime.utcnow() - timedelta(days=25),
        notes="Vehicle annual emission certificate check"
    )
]
