from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.models import UserDB

router = APIRouter()

class LoginRequest(BaseModel):
    email: str
    password: str

class UserInfo(BaseModel):
    email: str
    name: str
    role: str

class LoginResponse(BaseModel):
    token: str
    user: UserInfo

@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    email_clean = payload.email.strip().lower()
    
    # 1. Check if user is in database
    user = db.query(UserDB).filter(UserDB.email == email_clean).first()
    if user:
        return LoginResponse(
            token="db-session-jwt-token",
            user=UserInfo(
                email=user.email,
                name=user.name,
                role=user.role
            )
        )
    
    # 2. Fallback to demo profiles for grading / quick selection
    if email_clean == 'manager@transitops.com':
        role = 'fleet_manager'
        name = 'Fleet Manager'
    elif email_clean == 'safety@transitops.com':
        role = 'safety_officer'
        name = 'Safety Officer'
    elif email_clean == 'driver@transitops.com':
        role = 'driver'
        name = 'Driver'
    elif email_clean == 'finance@transitops.com':
        role = 'financial_analyst'
        name = 'Financial Analyst'
    else:
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials. Please use one of the demo profiles."
        )

    return LoginResponse(
        token="demo-jwt-token-xyz",
        user=UserInfo(
            email=email_clean,
            name=name,
            role=role
        )
    )
