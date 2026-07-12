from fastapi import APIRouter, HTTPException, Depends, status
from typing import List
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.models import DriverDB
from app.schemas.contracts import Driver, DriverBase, DriverStatus
import uuid

router = APIRouter()

@router.get("/", response_model=List[Driver])
def get_drivers(db: Session = Depends(get_db)):
    """Retrieve all drivers from the database."""
    return db.query(DriverDB).all()

@router.post("/", response_model=Driver)
def create_driver(payload: DriverBase, db: Session = Depends(get_db)):
    """Create a new driver with license number uniqueness validation."""
    # Check license number uniqueness
    existing = db.query(DriverDB).filter(
        DriverDB.license_number == payload.license_number
    ).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Validation failed",
                "code": "LICENSE_NOT_UNIQUE",
                "message": f"License number {payload.license_number} is already registered.",
                "field": "license_number"
            }
        )

    db_driver = DriverDB(
        id=f"drv_{uuid.uuid4().hex[:8]}",
        name=payload.name,
        license_number=payload.license_number,
        category=payload.category,
        license_expiry=payload.license_expiry,
        contact=payload.contact,
        safety_score=payload.safety_score,
        status=payload.status.value
    )
    db.add(db_driver)
    db.commit()
    db.refresh(db_driver)
    return db_driver

@router.put("/{id}", response_model=Driver)
def update_driver(id: str, payload: DriverBase, db: Session = Depends(get_db)):
    """Update driver details."""
    db_driver = db.query(DriverDB).filter(DriverDB.id == id).first()
    if not db_driver:
        raise HTTPException(status_code=404, detail="Driver not found")

    # Check license number uniqueness if updated
    if db_driver.license_number != payload.license_number:
        existing = db.query(DriverDB).filter(
            DriverDB.license_number == payload.license_number
        ).first()
        if existing:
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "Validation failed",
                    "code": "LICENSE_NOT_UNIQUE",
                    "message": f"License number {payload.license_number} is already registered.",
                    "field": "license_number"
                }
            )

    db_driver.name = payload.name
    db_driver.license_number = payload.license_number
    db_driver.category = payload.category
    db_driver.license_expiry = payload.license_expiry
    db_driver.contact = payload.contact
    db_driver.safety_score = payload.safety_score
    db_driver.status = payload.status.value

    db.commit()
    db.refresh(db_driver)
    return db_driver

@router.delete("/{id}")
def delete_driver(id: str, db: Session = Depends(get_db)):
    """Delete a driver from the system."""
    db_driver = db.query(DriverDB).filter(DriverDB.id == id).first()
    if not db_driver:
        raise HTTPException(status_code=404, detail="Driver not found")

    db.delete(db_driver)
    db.commit()
    return {"message": "Driver successfully deleted", "id": id}
