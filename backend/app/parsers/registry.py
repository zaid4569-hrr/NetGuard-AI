from typing import Dict, Type, Optional, Tuple, List
from app.parsers.base import BaseVendorParser
from app.parsers.cisco import CiscoParser
from app.parsers.fortinet import FortinetParser
from app.parsers.juniper import JuniperParser
from app.parsers.paloalto import PaloAltoParser
from app.parsers.mikrotik import MikroTikParser
from app.parsers.aruba import ArubaParser
from app.parsers.detector import VendorDetector
from app.schemas.normalized import NormalizedDeviceConfig

class ParserRegistry:
    """
    Central registry managing vendor parsers with extensible plugin architecture.
    """
    
    _parsers: Dict[str, BaseVendorParser] = {}

    @classmethod
    def register(cls, parser_instance: BaseVendorParser) -> None:
        cls._parsers[parser_instance.vendor_name().lower()] = parser_instance

    @classmethod
    def get_parser(cls, vendor_name: str) -> Optional[BaseVendorParser]:
        return cls._parsers.get(vendor_name.lower())

    @classmethod
    def list_supported_vendors(cls) -> List[str]:
        return [p.vendor_name() for p in cls._parsers.values()]

    @classmethod
    def auto_detect_and_parse(
        cls, 
        raw_text: str, 
        filename: str = "config.cfg", 
        manual_vendor_override: Optional[str] = None
    ) -> Tuple[NormalizedDeviceConfig, str, float]:
        """
        Detects vendor, selects the appropriate parser adapter, and returns
        the parsed NormalizedDeviceConfig, detected vendor name, and confidence score.
        """
        if manual_vendor_override and manual_vendor_override.lower() in cls._parsers:
            vendor = manual_vendor_override
            confidence = 1.0
        else:
            vendor, confidence = VendorDetector.detect(raw_text)

        parser = cls.get_parser(vendor)
        if not parser:
            # Fallback to Cisco parser as default network heuristic
            parser = cls._parsers["cisco"]
            vendor = "Cisco" if confidence < 0.25 else vendor

        normalized_config = parser.parse(raw_text, filename=filename)
        normalized_config.metadata.vendor = vendor
        normalized_config.metadata.vendor_confidence = confidence

        return normalized_config, vendor, confidence

# Initialize and register default vendor parsers
ParserRegistry.register(CiscoParser())
ParserRegistry.register(FortinetParser())
ParserRegistry.register(JuniperParser())
ParserRegistry.register(PaloAltoParser())
ParserRegistry.register(MikroTikParser())
ParserRegistry.register(ArubaParser())
