from pydantic import BaseModel, ConfigDict
from typing import Optional
from enum import Enum
from datetime import datetime

class VehicleStatus(str, Enum):
    available = 'available'
    on_trip = 'on_trip'
    in_shop = 'in_shop'
    retired = 'retired'

class DriverStatus(str, Enum):
    available = 'available'
    on_trip = 'on_trip'
    off_duty = 'off_duty'
    suspended = 'suspended'

class TripStatus(str, Enum):
    draft = 'draft'
    dispatched = 'dispatched'
    completed = 'completed'
    cancelled = 'cancelled'

class Role(str, Enum):
    fleet_manager = 'fleet_manager'
    driver = 'driver'
    safety_officer = 'safety_officer'
    financial_analyst = 'financial_analyst'

class VehicleBase(BaseModel):
    registration_number: str
    model: str
    type: str
    max_load_kg: int
    odometer: int
    acquisition_cost: float
    region: str
    status: VehicleStatus

class Vehicle(VehicleBase):
    model_config = ConfigDict(from_attributes=True)
    id: str

class DriverBase(BaseModel):
    name: str
    license_number: str
    category: str
    license_expiry: str
    contact: str
    safety_score: float
    status: DriverStatus

class Driver(DriverBase):
    model_config = ConfigDict(from_attributes=True)
    id: str

class TripBase(BaseModel):
    vehicle_id: str
    driver_id: str
    origin: str
    destination: str
    cargo_weight_kg: float
    status: TripStatus
    dispatched_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

class Trip(TripBase):
    model_config = ConfigDict(from_attributes=True)
    id: str

class MaintenanceLogBase(BaseModel):
    vehicle_id: str
    service_type: str
    cost: float
    opened_at: datetime
    closed_at: Optional[datetime] = None

class MaintenanceLog(MaintenanceLogBase):
    model_config = ConfigDict(from_attributes=True)
    id: str

class DashboardKPIs(BaseModel):
    active_vehicles: int
    available_vehicles: int
    vehicles_in_maintenance: int
    active_trips: int
    pending_trips: int
    drivers_on_duty: int
    fleet_utilization_pct: float
