from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.models import FuelLogDB, ExpenseDB
from app.schemas.contracts import FuelLog, FuelLogBase, Expense, ExpenseBase, FinanceLogsResponse
import uuid

router = APIRouter()

@router.get("/logs", response_model=FinanceLogsResponse)
def get_finance_logs(db: Session = Depends(get_db)):
    """Retrieve all fuel logs and general expenses."""
    fuel_logs = db.query(FuelLogDB).all()
    expenses = db.query(ExpenseDB).all()
    return FinanceLogsResponse(fuel_logs=fuel_logs, expenses=expenses)

@router.post("/fuel", response_model=FuelLog)
def record_fuel(log: FuelLogBase, db: Session = Depends(get_db)):
    """Record a fuel transaction."""
    db_log = FuelLogDB(
        id=str(uuid.uuid4()),
        vehicle_id=log.vehicle_id,
        liters=log.liters,
        cost=log.cost,
        odometer=log.odometer,
        date=log.date,
        notes=log.notes
    )
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log

@router.post("/expense", response_model=Expense)
def record_expense(log: ExpenseBase, db: Session = Depends(get_db)):
    """Record a general expense (e.g. tolls, parking)."""
    db_log = ExpenseDB(
        id=str(uuid.uuid4()),
        vehicle_id=log.vehicle_id,
        category=log.category,
        cost=log.cost,
        date=log.date,
        notes=log.notes
    )
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log
