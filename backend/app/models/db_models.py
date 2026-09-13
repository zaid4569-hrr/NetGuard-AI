import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class UserModel(Base):
    __tablename__ = "ng_users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    # Bcrypt hash only — never a reversible encryption of the password.
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    organization_name = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Integer, default=1)  # simple boolean-as-int for SQLite

    assessments = relationship("AssessmentModel", back_populates="owner", cascade="all, delete-orphan")

class AssessmentModel(Base):
    __tablename__ = "ng_assessments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("ng_users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    total_devices = Column(Integer, default=0)
    overall_score = Column(Float, default=0.0)
    critical_count = Column(Integer, default=0)
    high_count = Column(Integer, default=0)
    medium_count = Column(Integer, default=0)
    low_count = Column(Integer, default=0)
    info_count = Column(Integer, default=0)
    executive_summary = Column(Text, nullable=True)
    ai_insights = Column(JSON, nullable=True)

    owner = relationship("UserModel", back_populates="assessments")
    devices = relationship("DeviceModel", back_populates="assessment", cascade="all, delete-orphan")
    findings = relationship("FindingModel", back_populates="assessment", cascade="all, delete-orphan")
    category_scores = relationship("CategoryScoreModel", back_populates="assessment", cascade="all, delete-orphan")

class DeviceModel(Base):
    __tablename__ = "ng_devices"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    assessment_id = Column(String(36), ForeignKey("ng_assessments.id", ondelete="CASCADE"), nullable=False)
    filename = Column(String(255), nullable=False)
    hostname = Column(String(255), nullable=True)
    vendor = Column(String(50), nullable=False)
    vendor_confidence = Column(Float, default=1.0)
    os_version = Column(String(100), nullable=True)
    device_type = Column(String(50), nullable=True)
    security_score = Column(Float, default=0.0)
    critical_count = Column(Integer, default=0)
    high_count = Column(Integer, default=0)
    medium_count = Column(Integer, default=0)
    low_count = Column(Integer, default=0)
    info_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    assessment = relationship("AssessmentModel", back_populates="devices")
    findings = relationship("FindingModel", back_populates="device", cascade="all, delete-orphan")
    category_scores = relationship("CategoryScoreModel", back_populates="device", cascade="all, delete-orphan")

class CategoryScoreModel(Base):
    __tablename__ = "ng_category_scores"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    assessment_id = Column(String(36), ForeignKey("ng_assessments.id", ondelete="CASCADE"), nullable=True)
    device_id = Column(String(36), ForeignKey("ng_devices.id", ondelete="CASCADE"), nullable=True)
    category = Column(String(50), nullable=False)
    score = Column(Float, nullable=False)
    findings_count = Column(Integer, default=0)

    assessment = relationship("AssessmentModel", back_populates="category_scores")
    device = relationship("DeviceModel", back_populates="category_scores")

class FindingModel(Base):
    __tablename__ = "ng_findings"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    assessment_id = Column(String(36), ForeignKey("ng_assessments.id", ondelete="CASCADE"), nullable=False)
    device_id = Column(String(36), ForeignKey("ng_devices.id", ondelete="CASCADE"), nullable=False)
    rule_id = Column(String(50), nullable=False)
    title = Column(String(255), nullable=False)
    category = Column(String(50), nullable=False)
    severity = Column(String(20), nullable=False)  # CRITICAL, HIGH, MEDIUM, LOW, INFO
    evidence = Column(Text, nullable=False)        # Masked evidence snippet
    explanation = Column(Text, nullable=False)
    recommendation = Column(Text, nullable=False)
    remediation_script = Column(Text, nullable=True)
    cis_reference = Column(String(100), nullable=True)
    nist_reference = Column(String(100), nullable=True)
    iso27001_reference = Column(String(100), nullable=True)
    confidence = Column(Float, default=1.0)
    correlated_group = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    assessment = relationship("AssessmentModel", back_populates="findings")
    device = relationship("DeviceModel", back_populates="findings")

class RuleModel(Base):
    __tablename__ = "ng_rules"

    rule_id = Column(String(50), primary_key=True)
    title = Column(String(255), nullable=False)
    category = Column(String(50), nullable=False)
    severity = Column(String(20), nullable=False)
    description = Column(Text, nullable=False)
    remediation = Column(Text, nullable=False)
    supported_vendors = Column(JSON, nullable=False)
    cis_benchmark_ref = Column(String(100), nullable=True)
    nist_ref = Column(String(100), nullable=True)
    iso27001_ref = Column(String(100), nullable=True)


class BlockModel(Base):
    """
    Represents a single block in the NetGuard AI tamper-evident audit ledger.

    Each block anchors one assessment's key metrics (score + finding count)
    as a SHA-256 data_hash and links to the previous block via previous_hash,
    forming an immutable chain. Satisfies NIST AU-10 and ISO 27001 A.12.4.
    """
    __tablename__ = "ng_blockchain_blocks"

    index = Column(Integer, primary_key=True)                        # Block position (0 = genesis)
    previous_hash = Column(String(64), nullable=False)               # SHA-256 hex of prior block
    timestamp = Column(String(50), nullable=False)                   # ISO-8601 UTC anchoring time
    assessment_id = Column(String(36), nullable=False, index=True)   # UUID of anchored assessment
    data_hash = Column(String(64), nullable=False)                   # SHA-256 of assessment payload
    block_hash = Column(String(64), nullable=False, unique=True)     # SHA-256 of the whole block
