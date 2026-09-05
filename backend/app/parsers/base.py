from abc import ABC, abstractmethod
from typing import Tuple, List, Dict, Any
from app.schemas.normalized import NormalizedDeviceConfig
from app.security.sanitizer import SecuritySanitizer

class BaseVendorParser(ABC):
    """
    Abstract Base Class for all Vendor Configuration Parsers.
    Follows Plugin / Adapter architecture.
    """
    
    @classmethod
    @abstractmethod
    def vendor_name(cls) -> str:
        """Returns the canonical vendor name e.g., 'Cisco', 'Fortinet', 'Juniper'."""
        pass

    @classmethod
    @abstractmethod
    def detect_confidence(cls, raw_text: str) -> float:
        """
        Analyzes configuration syntax and returns confidence score between 0.0 and 1.0.
        """
        pass

    @abstractmethod
    def parse(self, raw_text: str, filename: str = "config.cfg") -> NormalizedDeviceConfig:
        """
        Sanitizes, parses, and normalizes raw vendor configuration into NormalizedDeviceConfig.
        """
        pass

    def sanitize(self, raw_text: str) -> str:
        """Helper to ensure sanitization is executed before parsing."""
        return SecuritySanitizer.sanitize_text(raw_text)
