"""Utility functions for integrations (encryption, validation, etc)."""
import json
from typing import Any, Dict, Optional
from cryptography.fernet import Fernet
import hmac
import hashlib


def encrypt_credentials(data: Dict[str, Any], secret_key: str) -> str:
    """Encrypt credentials using Fernet."""
    cipher = Fernet(secret_key.encode()[:32].ljust(32, b'0'))
    json_str = json.dumps(data)
    encrypted = cipher.encrypt(json_str.encode())
    return encrypted.decode()


def decrypt_credentials(encrypted_data: str, secret_key: str) -> Dict[str, Any]:
    """Decrypt credentials using Fernet."""
    cipher = Fernet(secret_key.encode()[:32].ljust(32, b'0'))
    decrypted = cipher.decrypt(encrypted_data.encode())
    return json.loads(decrypted.decode())


def validate_webhook_signature(payload: str, signature: str, secret: str) -> bool:
    """Validate incoming webhook signature."""
    expected_sig = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()
    return hmac.compare_digest(signature, expected_sig)


def sanitize_config(config: Dict[str, Any]) -> Dict[str, Any]:
    """Remove sensitive fields from config for logging."""
    sensitive_fields = ["password", "token", "api_key", "secret", "credentials"]
    sanitized = {}
    for key, value in config.items():
        if any(sensitive in key.lower() for sensitive in sensitive_fields):
            sanitized[key] = "***REDACTED***"
        else:
            sanitized[key] = value
    return sanitized
