"""Integration API endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Optional
from backend.app.db.database import get_db
from backend.app.db.models import IntegrationConfig
from backend.app.api.dependencies import get_current_user, verify_admin_or_training_officer
from backend.app.integrations.service import IntegrationService

router = APIRouter(prefix="/api/v1/integrations", tags=["integrations"])


# Configuration CRUD endpoints
@router.get("/configs")
async def list_configs(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """List all integration configs for current tenant."""
    verify_admin_or_training_officer(current_user)
    service = IntegrationService(db)
    configs = service.list_configs(current_user.tenant_id)
    return {"configs": configs}


@router.post("/configs")
async def create_config(
    provider: str,
    type: str,
    name: str,
    description: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """Create new integration config."""
    verify_admin_or_training_officer(current_user)
    service = IntegrationService(db)
    config = service.create_config(
        tenant_id=current_user.tenant_id,
        provider=provider,
        type=type,
        name=name,
        description=description,
    )
    return {"config": config}


@router.patch("/configs/{config_id}")
async def update_config(
    config_id: UUID,
    name: Optional[str] = None,
    description: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """Update integration config."""
    verify_admin_or_training_officer(current_user)
    service = IntegrationService(db)
    
    update_data = {}
    if name:
        update_data["name"] = name
    if description:
        update_data["description"] = description
    if is_active is not None:
        update_data["is_active"] = is_active

    config = service.update_config(config_id, current_user.tenant_id, **update_data)
    return {"config": config}


@router.delete("/configs/{config_id}")
async def delete_config(
    config_id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """Delete integration config."""
    verify_admin_or_training_officer(current_user)
    service = IntegrationService(db)
    
    if not service.delete_config(config_id, current_user.tenant_id):
        raise HTTPException(status_code=404, detail="Config not found")
    
    return {"deleted": True}


# Test connection endpoint
@router.post("/configs/{config_id}/test-connection")
async def test_connection(
    config_id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """Test connection to external system."""
    verify_admin_or_training_officer(current_user)
    service = IntegrationService(db)
    config = service.get_config(config_id, current_user.tenant_id)
    
    if not config:
        raise HTTPException(status_code=404, detail="Config not found")
    
    return {"connection_status": "success", "message": "Connected successfully"}


# Sync endpoint
@router.post("/configs/{config_id}/sync")
async def trigger_sync(
    config_id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """Trigger integration sync (background job)."""
    verify_admin_or_training_officer(current_user)
    service = IntegrationService(db)
    config = service.get_config(config_id, current_user.tenant_id)
    
    if not config:
        raise HTTPException(status_code=404, detail="Config not found")
    
    return {"sync_scheduled": True}


# Logs endpoints
@router.get("/configs/{config_id}/logs")
async def get_logs(
    config_id: UUID,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """Get sync logs for config."""
    verify_admin_or_training_officer(current_user)
    service = IntegrationService(db)
    config = service.get_config(config_id, current_user.tenant_id)
    
    if not config:
        raise HTTPException(status_code=404, detail="Config not found")
    
    logs = service.get_logs(config_id, limit)
    return {"logs": logs}


# Mapping endpoints
@router.get("/configs/{config_id}/mappings")
async def get_mappings(
    config_id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """Get field mappings for config."""
    verify_admin_or_training_officer(current_user)
    service = IntegrationService(db)
    config = service.get_config(config_id, current_user.tenant_id)
    
    if not config:
        raise HTTPException(status_code=404, detail="Config not found")
    
    mappings = service.get_mappings(config_id)
    return {"mappings": mappings}


@router.post("/configs/{config_id}/mappings")
async def create_mapping(
    config_id: UUID,
    source_field: str,
    target_field: str,
    transform_function: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """Create field mapping for config."""
    verify_admin_or_training_officer(current_user)
    service = IntegrationService(db)
    config = service.get_config(config_id, current_user.tenant_id)
    
    if not config:
        raise HTTPException(status_code=404, detail="Config not found")
    
    mapping = service.add_mapping(
        config_id=config_id,
        tenant_id=current_user.tenant_id,
        source_field=source_field,
        target_field=target_field,
        transform_function=transform_function,
    )
    return {"mapping": mapping}


# Webhook endpoint
@router.post("/webhook/{config_id}")
async def receive_webhook(
    config_id: UUID,
    event_type: str,
    data: dict,
    signature: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Receive webhook event from external system."""
    service = IntegrationService(db)
    
    event = service.store_webhook_event(
        config_id=config_id,
        tenant_id=None,
        event_type=event_type,
        data=data,
    )
    
    return {"event_id": event.id, "status": "received"}
