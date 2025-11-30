"""Integration service - main business logic for managing integrations."""
from typing import Any, Dict, List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from backend.app.db.models import (
    IntegrationConfig,
    IntegrationCredential,
    IntegrationMapping,
    IntegrationLog,
    IntegrationWebhookEvent,
)
from backend.app.integrations.utils import encrypt_credentials, decrypt_credentials


class IntegrationService:
    """Service for managing integrations."""

    def __init__(self, db: Session):
        self.db = db

    def create_config(
        self,
        tenant_id: UUID,
        provider: str,
        type: str,
        name: str,
        description: Optional[str] = None,
        config: Optional[Dict[str, Any]] = None,
    ) -> IntegrationConfig:
        """Create new integration config."""
        new_config = IntegrationConfig(
            tenant_id=tenant_id,
            provider=provider,
            type=type,
            name=name,
            description=description,
            config=config or {},
            is_active=True,
        )
        self.db.add(new_config)
        self.db.commit()
        self.db.refresh(new_config)
        return new_config

    def get_config(self, config_id: UUID, tenant_id: UUID) -> Optional[IntegrationConfig]:
        """Get integration config by ID."""
        return self.db.query(IntegrationConfig).filter(
            IntegrationConfig.id == config_id,
            IntegrationConfig.tenant_id == tenant_id,
        ).first()

    def list_configs(self, tenant_id: UUID) -> List[IntegrationConfig]:
        """List all integration configs for tenant."""
        return self.db.query(IntegrationConfig).filter(
            IntegrationConfig.tenant_id == tenant_id
        ).all()

    def update_config(
        self,
        config_id: UUID,
        tenant_id: UUID,
        **kwargs,
    ) -> IntegrationConfig:
        """Update integration config."""
        config = self.get_config(config_id, tenant_id)
        if not config:
            raise ValueError("Config not found")

        for key, value in kwargs.items():
            if hasattr(config, key):
                setattr(config, key, value)

        self.db.commit()
        self.db.refresh(config)
        return config

    def delete_config(self, config_id: UUID, tenant_id: UUID) -> bool:
        """Delete integration config."""
        config = self.get_config(config_id, tenant_id)
        if not config:
            return False

        self.db.delete(config)
        self.db.commit()
        return True

    def save_credentials(
        self,
        config_id: UUID,
        tenant_id: UUID,
        credentials: Dict[str, Any],
        secret_key: str,
    ) -> IntegrationCredential:
        """Encrypt and save credentials."""
        encrypted = encrypt_credentials(credentials, secret_key)
        cred = IntegrationCredential(
            tenant_id=tenant_id,
            config_id=config_id,
            encrypted_payload=encrypted,
        )
        self.db.add(cred)
        self.db.commit()
        self.db.refresh(cred)
        return cred

    def get_credentials(
        self,
        config_id: UUID,
        secret_key: str,
    ) -> Optional[Dict[str, Any]]:
        """Decrypt and retrieve credentials."""
        cred = self.db.query(IntegrationCredential).filter(
            IntegrationCredential.config_id == config_id
        ).first()
        
        if not cred:
            return None

        return decrypt_credentials(cred.encrypted_payload, secret_key)

    def add_mapping(
        self,
        config_id: UUID,
        tenant_id: UUID,
        source_field: str,
        target_field: str,
        transform_function: Optional[str] = None,
    ) -> IntegrationMapping:
        """Add field mapping."""
        mapping = IntegrationMapping(
            tenant_id=tenant_id,
            config_id=config_id,
            source_field=source_field,
            target_field=target_field,
            transform_function=transform_function,
        )
        self.db.add(mapping)
        self.db.commit()
        self.db.refresh(mapping)
        return mapping

    def get_mappings(self, config_id: UUID) -> List[IntegrationMapping]:
        """Get all mappings for a config."""
        return self.db.query(IntegrationMapping).filter(
            IntegrationMapping.config_id == config_id
        ).all()

    def log_sync(
        self,
        config_id: UUID,
        tenant_id: UUID,
        status: str,
        message: str,
        payload: Optional[Dict[str, Any]] = None,
    ) -> IntegrationLog:
        """Log integration sync result."""
        log = IntegrationLog(
            tenant_id=tenant_id,
            config_id=config_id,
            status=status,
            message=message,
            payload=payload,
        )
        self.db.add(log)
        self.db.commit()
        return log

    def get_logs(self, config_id: UUID, limit: int = 100) -> List[IntegrationLog]:
        """Get sync logs for a config."""
        return self.db.query(IntegrationLog).filter(
            IntegrationLog.config_id == config_id
        ).order_by(IntegrationLog.created_at.desc()).limit(limit).all()

    def store_webhook_event(
        self,
        config_id: UUID,
        tenant_id: UUID,
        event_type: str,
        data: Dict[str, Any],
    ) -> IntegrationWebhookEvent:
        """Store incoming webhook event."""
        event = IntegrationWebhookEvent(
            tenant_id=tenant_id,
            config_id=config_id,
            event_type=event_type,
            data=data,
            processed=False,
        )
        self.db.add(event)
        self.db.commit()
        self.db.refresh(event)
        return event

    def get_unprocessed_events(self, config_id: UUID) -> List[IntegrationWebhookEvent]:
        """Get unprocessed webhook events."""
        return self.db.query(IntegrationWebhookEvent).filter(
            IntegrationWebhookEvent.config_id == config_id,
            IntegrationWebhookEvent.processed == False,
        ).all()

    def mark_event_processed(self, event_id: UUID) -> IntegrationWebhookEvent:
        """Mark webhook event as processed."""
        event = self.db.query(IntegrationWebhookEvent).filter(
            IntegrationWebhookEvent.id == event_id
        ).first()
        if event:
            event.processed = True
            self.db.commit()
            self.db.refresh(event)
        return event
