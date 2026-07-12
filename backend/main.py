from fastapi import FastAPI
from app.routers import auth, vehicles, drivers, trips, maintenance, dashboard, finance, reports

app = FastAPI(title="TransitOps API")

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
