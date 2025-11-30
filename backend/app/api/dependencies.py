"""API dependencies for authentication, RBAC, and tenant isolation."""
from typing import Optional
from fastapi import Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from backend.app.db.database import get_db
from backend.app.db.models import User
from backend.app.services.auth_service import decode_token
from backend.app.core.enums import UserRole

def get_current_user(
    request: Request,
    db: Session = Depends(get_db)
) -> User:
    """Extract current user from JWT token in cookies."""
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    payload = decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    user_id = payload.get("user_id")
    tenant_id = payload.get("tenant_id")
    
    if not user_id or not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )
    
    user = db.query(User).filter(
        User.id == user_id,
        User.tenant_id == tenant_id
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    # Set tenant_id in request state for tenant isolation
    request.state.tenant_id = tenant_id
    request.state.user_id = user_id
    
    return user

def require_role(*allowed_roles: str):
    """Dependency to enforce role-based access control."""
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"This action requires one of roles: {', '.join(allowed_roles)}"
            )
        return current_user
    return role_checker

def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Enforce admin role."""
    if current_user.role != UserRole.ADMINISTRATOR:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return current_user

def require_training_officer(current_user: User = Depends(get_current_user)) -> User:
    """Enforce training officer or admin role."""
    if current_user.role not in [UserRole.TRAINING_OFFICER, UserRole.ADMINISTRATOR]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Training officer access required")
    return current_user

def require_manager_plus(current_user: User = Depends(get_current_user)) -> User:
    """Enforce manager or higher role."""
    allowed = [UserRole.MANAGER, UserRole.ADMINISTRATOR]
    if current_user.role not in allowed:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Manager or higher access required")
    return current_user

def require_foreman_plus(current_user: User = Depends(get_current_user)) -> User:
    """Enforce foreman or higher role."""
    allowed = [UserRole.FOREMAN, UserRole.MANAGER, UserRole.ADMINISTRATOR]
    if current_user.role not in allowed:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Foreman or higher access required")
    return current_user
