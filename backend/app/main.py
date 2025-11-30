import json
import logging
from datetime import datetime
from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from backend.app.core.config import settings
from backend.app.db import get_db, engine, Base
from backend.app.middleware.security import SecurityHeadersMiddleware, LoggingMiddleware

# Import routers
from backend.app.api.v1 import users, departments, courses, enrollments, renewals, tasks
from backend.app.api.v1 import kpi, notifications, ai, integrations, audit, scorm
from backend.app.api.v1 import security_awareness, skills, career

# Create tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
)

# Add middleware
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(LoggingMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoints
@app.get("/api/health")
async def health_check():
    """Basic health check."""
    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/api/health/detailed")
async def health_check_detailed(db: Session = Depends(get_db)):
    """Detailed health check including database."""
    try:
        # Test DB connection
        db.execute("SELECT 1")
        db_status = "ok"
    except Exception as e:
        db_status = f"error: {str(e)}"
    
    return {
        "status": "ok" if db_status == "ok" else "degraded",
        "app": settings.APP_NAME,
        "database": db_status,
        "timestamp": datetime.utcnow().isoformat()
    }

# Register routers
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])
app.include_router(departments.router, prefix="/api/v1/departments", tags=["departments"])
app.include_router(courses.router, prefix="/api/v1/courses", tags=["courses"])
app.include_router(enrollments.router, prefix="/api/v1/enrollments", tags=["enrollments"])
app.include_router(renewals.router, prefix="/api/v1/renewals", tags=["renewals"])
app.include_router(tasks.router, prefix="/api/v1/tasks", tags=["tasks"])
app.include_router(kpi.router, prefix="/api/v1/kpi", tags=["kpi"])
app.include_router(notifications.router, prefix="/api/v1/notifications", tags=["notifications"])
app.include_router(ai.router, prefix="/api/v1/ai", tags=["ai"])
app.include_router(integrations.router, prefix="/api/v1/integrations", tags=["integrations"])
app.include_router(audit.router, prefix="/api/v1/audit", tags=["audit"])
app.include_router(scorm.router, prefix="/api/v1/scorm", tags=["scorm"])
app.include_router(security_awareness.router, prefix="/api/v1/security-awareness", tags=["security_awareness"])
app.include_router(skills.router, prefix="/api/v1/skills", tags=["skills"])
app.include_router(career.router, prefix="/api/v1/career", tags=["career"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
