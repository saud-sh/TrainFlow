"""Abstract base class for all integration connectors."""
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from datetime import datetime


class BaseConnector(ABC):
    """Base connector interface for all integration providers."""

    def __init__(self, config: Dict[str, Any], credentials: Dict[str, Any]):
        self.config = config
        self.credentials = credentials

    @abstractmethod
    def test_connection(self) -> bool:
        """Test connectivity to the external system."""
        pass

    @abstractmethod
    def pull(self, query: Optional[str] = None) -> List[Dict[str, Any]]:
        """Pull data from the external system."""
        pass

    @abstractmethod
    def push(self, data: List[Dict[str, Any]]) -> bool:
        """Push data to the external system."""
        pass

    def sync(self, pull_first: bool = True) -> Dict[str, Any]:
        """Perform a full sync operation."""
        result = {"status": "pending", "pulled": 0, "pushed": 0, "errors": []}
        try:
            if pull_first:
                pulled_data = self.pull()
                result["pulled"] = len(pulled_data) if pulled_data else 0
            result["status"] = "success"
        except Exception as e:
            result["status"] = "error"
            result["errors"].append(str(e))
        return result

    def transform(self, data: Dict[str, Any], mappings: List[Dict[str, str]]) -> Dict[str, Any]:
        """Transform data using field mappings."""
        transformed = {}
        for mapping in mappings:
            source = mapping.get("source_field")
            target = mapping.get("target_field")
            if source in data:
                transformed[target] = data[source]
        return transformed

    def validate(self, data: Dict[str, Any]) -> bool:
        """Validate data before sync."""
        return bool(data)

    def log_result(self, status: str, message: str, payload: Optional[Dict] = None) -> Dict[str, Any]:
        """Generate a log result."""
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "status": status,
            "message": message,
            "payload": payload or {},
        }
