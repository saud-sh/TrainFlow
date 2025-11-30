"""REST API connector for pulling/pushing data to external APIs."""
from typing import Any, Dict, List, Optional
import httpx
from backend.app.integrations.base_connector import BaseConnector


class APIConnector(BaseConnector):
    """Connector for REST API integrations."""

    def __init__(self, config: Dict[str, Any], credentials: Dict[str, Any]):
        super().__init__(config, credentials)
        self.base_url = config.get("base_url", "")
        self.timeout = config.get("timeout", 30)
        self.auth_type = config.get("auth_type", "bearer")  # bearer, basic, token

    def test_connection(self) -> bool:
        """Test API connectivity."""
        try:
            headers = self._get_headers()
            with httpx.Client(timeout=self.timeout) as client:
                response = client.get(f"{self.base_url}/health", headers=headers)
                return response.status_code < 400
        except Exception:
            return False

    def pull(self, query: Optional[str] = None) -> List[Dict[str, Any]]:
        """Pull data from API endpoint."""
        try:
            endpoint = query or self.config.get("pull_endpoint", "/data")
            headers = self._get_headers()
            with httpx.Client(timeout=self.timeout) as client:
                response = client.get(f"{self.base_url}{endpoint}", headers=headers)
                response.raise_for_status()
                data = response.json()
                return data if isinstance(data, list) else [data]
        except Exception as e:
            raise Exception(f"API pull failed: {str(e)}")

    def push(self, data: List[Dict[str, Any]]) -> bool:
        """Push data to API endpoint."""
        try:
            endpoint = self.config.get("push_endpoint", "/data")
            headers = self._get_headers()
            with httpx.Client(timeout=self.timeout) as client:
                for record in data:
                    response = client.post(
                        f"{self.base_url}{endpoint}",
                        json=record,
                        headers=headers,
                    )
                    response.raise_for_status()
            return True
        except Exception as e:
            raise Exception(f"API push failed: {str(e)}")

    def _get_headers(self) -> Dict[str, str]:
        """Build authentication headers based on auth type."""
        headers = {"Content-Type": "application/json"}
        
        if self.auth_type == "bearer":
            token = self.credentials.get("token", "")
            headers["Authorization"] = f"Bearer {token}"
        elif self.auth_type == "basic":
            import base64
            username = self.credentials.get("username", "")
            password = self.credentials.get("password", "")
            credentials = base64.b64encode(f"{username}:{password}".encode()).decode()
            headers["Authorization"] = f"Basic {credentials}"
        elif self.auth_type == "token":
            token = self.credentials.get("token", "")
            headers["X-API-Token"] = token

        return headers
