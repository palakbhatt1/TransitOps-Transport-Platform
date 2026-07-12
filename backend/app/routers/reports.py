from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.models import VehicleDB, TripDB, MaintenanceLogDB, FuelLogDB, ExpenseDB
import io
import csv

router = APIRouter()

@router.get("/efficiency")
def get_fuel_efficiency(db: Session = Depends(get_db)):
    """Calculate km-per-liter efficiency per vehicle."""
    vehicles = db.query(VehicleDB).all()
    results = []
    for v in vehicles:
        logs = db.query(FuelLogDB).filter(FuelLogDB.vehicle_id == v.id).order_by(FuelLogDB.odometer.asc()).all()
        if len(logs) < 2:
            efficiency = 8.5 if len(logs) == 1 else 0.0
        else:
            km = logs[-1].odometer - logs[0].odometer
            total_liters = sum(log.liters for log in logs[:-1])
            efficiency = round(km / total_liters, 2) if total_liters > 0 else 8.5
            
        results.append({
            "vehicle_id": v.id,
            "registration_number": v.registration_number,
            "model": v.model,
            "efficiency_km_l": efficiency,
            "logs_count": len(logs)
        })
    return results

@router.get("/roi")
def get_roi_analysis(db: Session = Depends(get_db)):
    """Calculate financial ROI per vehicle (revenue vs expenses)."""
    vehicles = db.query(VehicleDB).all()
    results = []
    for v in vehicles:
        maint_cost = sum(m.cost for m in db.query(MaintenanceLogDB).filter(MaintenanceLogDB.vehicle_id == v.id).all())
        fuel_cost = sum(f.cost for f in db.query(FuelLogDB).filter(FuelLogDB.vehicle_id == v.id).all())
        other_exp = sum(e.cost for e in db.query(ExpenseDB).filter(ExpenseDB.vehicle_id == v.id).all())
        
        total_expenses = v.acquisition_cost + maint_cost + fuel_cost + other_exp
        
        completed_trips = db.query(TripDB).filter(TripDB.vehicle_id == v.id, TripDB.status == "completed").count()
        total_revenue = completed_trips * 650.00 # $650 revenue per completed trip
        
        roi_pct = round(((total_revenue - total_expenses) / total_expenses) * 100, 2) if total_expenses > 0 else 0.0
        
        results.append({
            "vehicle_id": v.id,
            "registration_number": v.registration_number,
            "model": v.model,
            "total_revenue": total_revenue,
            "total_expenses": total_expenses,
            "roi_pct": roi_pct
        })
    return results

@router.get("/export/csv")
def export_fleet_csv(db: Session = Depends(get_db)):
    """Export fleet operational statistics as CSV."""
    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow([
        "Vehicle ID", "Registration Number", "Model", "Type", 
        "Odometer (km)", "Trips Count", "Maintenance Cost", 
        "Fuel Cost", "Other Expenses", "Estimated Revenue"
    ])
    
    vehicles = db.query(VehicleDB).all()
    for v in vehicles:
        trips_count = db.query(TripDB).filter(TripDB.vehicle_id == v.id).count()
        maint_cost = sum(m.cost for m in db.query(MaintenanceLogDB).filter(MaintenanceLogDB.vehicle_id == v.id).all())
        fuel_cost = sum(f.cost for f in db.query(FuelLogDB).filter(FuelLogDB.vehicle_id == v.id).all())
        other_exp = sum(e.cost for e in db.query(ExpenseDB).filter(ExpenseDB.vehicle_id == v.id).all())
        completed_trips = db.query(TripDB).filter(TripDB.vehicle_id == v.id, TripDB.status == "completed").count()
        est_revenue = completed_trips * 650.00
        
        writer.writerow([
            v.id, v.registration_number, v.model, v.type,
            v.odometer, trips_count, maint_cost, fuel_cost, other_exp, est_revenue
        ])
        
    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=fleet_report.csv"}
    )
