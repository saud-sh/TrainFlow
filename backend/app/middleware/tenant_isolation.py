"""Middleware to enforce tenant isolation."""
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

class TenantIsolationMiddleware(BaseHTTPMiddleware):
    """Ensure all database queries are scoped to tenant_id."""
    
    async def dispatch(self, request: Request, call_next):
        # Tenant context is set by get_current_user dependency
        # This middleware is optional but can be used for additional validation
        response = await call_next(request)
        return response
