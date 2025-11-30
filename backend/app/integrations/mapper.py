"""Field mapping engine for data transformation."""
from typing import Any, Dict, List, Optional


class FieldMapper:
    """Handles mapping and transformation of fields between systems."""

    def __init__(self, mappings: List[Dict[str, Any]]):
        """Initialize with a list of field mappings."""
        self.mappings = mappings

    def map_fields(self, source_data: Dict[str, Any]) -> Dict[str, Any]:
        """Map source data to target fields."""
        result = {}
        for mapping in self.mappings:
            source_field = mapping.get("source_field")
            target_field = mapping.get("target_field")
            transform_fn = mapping.get("transform_function")

            if source_field in source_data:
                value = source_data[source_field]
                
                # Apply transformation if provided
                if transform_fn:
                    try:
                        # Execute simple transformations (upper, lower, etc)
                        if transform_fn == "upper":
                            value = str(value).upper()
                        elif transform_fn == "lower":
                            value = str(value).lower()
                        elif transform_fn == "trim":
                            value = str(value).strip()
                        elif transform_fn.startswith("substring("):
                            # Parse substring(start, length)
                            parts = transform_fn[10:-1].split(",")
                            start = int(parts[0])
                            length = int(parts[1])
                            value = str(value)[start : start + length]
                    except Exception:
                        pass  # Keep original value on error

                result[target_field] = value

        return result

    def map_records(self, records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Map multiple records."""
        return [self.map_fields(record) for record in records]

    def validate_mapping(self, source_data: Dict[str, Any]) -> bool:
        """Validate that source data has required fields."""
        required_fields = [m.get("source_field") for m in self.mappings if m.get("required")]
        return all(field in source_data for field in required_fields)
