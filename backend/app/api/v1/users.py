from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from sqlalchemy.orm import Session
from datetime import timedelta
from backend.app.db.database import get_db
from backend.app.db.models import User, Tenant
from backend.app.api.dependencies import get_current_user, require_admin, require_training_officer
from backend.app.services.auth_service import authenticate_user, hash_password, create_access_token
from backend.app.core.config import settings
from backend.app.seeds.demo_seed import run_demo_seed
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class LoginRequest(BaseModel):
    email: str
    password: str
    tenant_id: Optional[str] = None

class LoginResponse(BaseModel):
    user_id: str
    email: str
    first_name: Optional[str]
    last_name: Optional[str]
    role: str
    tenant_id: str
    department_id: Optional[str]

class CurrentUserResponse(BaseModel):
    id: str
    email: str
    first_name: Optional[str]
    last_name: Optional[str]
    role: str
    tenant_id: str
    department_id: Optional[str]

@router.post("/login")
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Login with email and password. Returns JWT in HttpOnly cookie."""
    # If no tenant_id provided, default to first active tenant
    tenant_id = request.tenant_id
    if not tenant_id:
        tenant = db.query(Tenant).filter(Tenant.is_active == True).first()
        if not tenant:
            raise HTTPException(status_code=400, detail="No active tenant found")
        tenant_id = str(tenant.id)
    
    user = authenticate_user(db, request.email, request.password, tenant_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    access_token = create_access_token(
        data={"user_id": str(user.id), "tenant_id": str(user.tenant_id)},
        expires_delta=timedelta(hours=24)
    )
    
    response = Response(
        content='{"message": "Login successful"}',
        media_type="application/json"
    )
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=settings.ENVIRONMENT == "production",
        samesite="lax",
        max_age=86400
    )
    
    return {
        "user_id": str(user.id),
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "role": user.role,
        "tenant_id": str(user.tenant_id),
        "department_id": str(user.department_id) if user.department_id else None
    }

@router.post("/logout")
async def logout():
    """Logout by clearing JWT cookie."""
    response = Response(
        content='{"message": "Logged out successfully"}',
        media_type="application/json"
    )
    response.delete_cookie(key="access_token")
    return {"message": "Logged out successfully"}

@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current user info."""
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "role": current_user.role,
        "tenant_id": str(current_user.tenant_id),
        "department_id": str(current_user.department_id) if current_user.department_id else None
    }

@router.get("/")
async def list_users(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """List all users in tenant (admin only)."""
    users = db.query(User).filter(User.tenant_id == current_user.tenant_id).all()
    return [
        {
            "id": str(u.id),
            "email": u.email,
            "first_name": u.first_name,
            "last_name": u.last_name,
            "role": u.role,
            "is_active": u.is_active
        }
        for u in users
    ]

@router.post("/seed-demo")
async def seed_demo(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Create comprehensive demo data (admin only). Idempotent."""
    summary = run_demo_seed(db)
    return summary
