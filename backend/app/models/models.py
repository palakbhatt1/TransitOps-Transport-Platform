from sqlalchemy import Column, String, Integer, Float, ForeignKey, DateTime
from app.database.database import Base

class UserDB(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    role = Column(String, nullable=False)  # stored as string matching Role enum
    hashed_password = Column(String, nullable=False)

class VehicleDB(Base):
    __tablename__ = "vehicles"

    id = Column(String, primary_key=True, index=True)
    registration_number = Column(String, unique=True, index=True, nullable=False)
    model = Column(String, nullable=False)
    type = Column(String, nullable=False)
    max_load_kg = Column(Integer, nullable=False)
    odometer = Column(Integer, nullable=False)
    acquisition_cost = Column(Float, nullable=False)
    region = Column(String, nullable=False)
    status = Column(String, nullable=False)  # stored as string matching VehicleStatus enum

class DriverDB(Base):
    __tablename__ = "drivers"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    license_number = Column(String, unique=True, index=True, nullable=False)
    category = Column(String, nullable=False)
    license_expiry = Column(String, nullable=False)  # YYYY-MM-DD string
    contact = Column(String, nullable=False)
    safety_score = Column(Float, nullable=False)
    status = Column(String, nullable=False)  # stored as string matching DriverStatus enum

class TripDB(Base):
    __tablename__ = "trips"

    id = Column(String, primary_key=True, index=True)
    vehicle_id = Column(String, ForeignKey("vehicles.id"), nullable=False)
    driver_id = Column(String, ForeignKey("drivers.id"), nullable=False)
    origin = Column(String, nullable=False)
    destination = Column(String, nullable=False)
    cargo_weight_kg = Column(Float, nullable=False)
    status = Column(String, nullable=False)  # stored as string matching TripStatus enum
    dispatched_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)

class MaintenanceLogDB(Base):
    __tablename__ = "maintenance_logs"

    id = Column(String, primary_key=True, index=True)
    vehicle_id = Column(String, ForeignKey("vehicles.id"), nullable=False)
    service_type = Column(String, nullable=False)
    cost = Column(Float, nullable=False)
    opened_at = Column(DateTime, nullable=False)
    closed_at = Column(DateTime, nullable=True)
