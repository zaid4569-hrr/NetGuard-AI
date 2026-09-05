import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class AssessmentModel(Base):
    __tablename__ = "assessments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
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

    devices = relationship("DeviceModel", back_populates="assessment", cascade="all, delete-orphan")
    findings = relationship("FindingModel", back_populates="assessment", cascade="all, delete-orphan")
    category_scores = relationship("CategoryScoreModel", back_populates="assessment", cascade="all, delete-orphan")

class DeviceModel(Base):
    __tablename__ = "devices"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    assessment_id = Column(String(36), ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False)
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
    __tablename__ = "category_scores"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    assessment_id = Column(String(36), ForeignKey("assessments.id", ondelete="CASCADE"), nullable=True)
    device_id = Column(String(36), ForeignKey("devices.id", ondelete="CASCADE"), nullable=True)
    category = Column(String(50), nullable=False)
    score = Column(Float, nullable=False)
    findings_count = Column(Integer, default=0)

    assessment = relationship("AssessmentModel", back_populates="category_scores")
    device = relationship("DeviceModel", back_populates="category_scores")

class FindingModel(Base):
    __tablename__ = "findings"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    assessment_id = Column(String(36), ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False)
    device_id = Column(String(36), ForeignKey("devices.id", ondelete="CASCADE"), nullable=False)
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
    __tablename__ = "rules"

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
