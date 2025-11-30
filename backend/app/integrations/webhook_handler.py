"""Webhook receiver and event processor for integrations."""
from typing import Any, Dict, Optional
from datetime import datetime
from backend.app.integrations.utils import validate_webhook_signature


class WebhookHandler:
    """Handles incoming webhook events from external systems."""

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.secret = config.get("webhook_secret", "")

    def validate_request(self, payload: str, signature: str) -> bool:
        """Validate incoming webhook request signature."""
        if not self.secret:
            return True  # Skip validation if no secret configured
        return validate_webhook_signature(payload, signature, self.secret)

    def parse_event(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """Parse webhook event into standard format."""
        return {
            "event_type": raw_data.get("event_type", "unknown"),
            "data": raw_data.get("data", {}),
            "timestamp": raw_data.get("timestamp", datetime.utcnow().isoformat()),
            "source": self.config.get("provider", "unknown"),
        }

    def should_process(self, event: Dict[str, Any]) -> bool:
        """Check if event should be processed."""
        event_type = event.get("event_type")
        subscribed_events = self.config.get("subscribed_events", [])
        
        if not subscribed_events:
            return True
        
        return event_type in subscribed_events
