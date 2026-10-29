from datetime import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime,
    ForeignKey,
    Text,
    JSON
)
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    email = Column(String(191), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class SkinAnalysis(Base):
    __tablename__ = "skin_analyses"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    record_id = Column(String(50), unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    image_path = Column(String(500), nullable=False)
    original_filename = Column(String(255), nullable=True)
    predicted_class = Column(String(150), nullable=True)
    confidence = Column(Float, nullable=True)
    risk_level = Column(String(50), nullable=True)
    heatmap_path = Column(String(500), nullable=True)
    status = Column(String(50), default="uploaded")
    created_at = Column(DateTime, default=datetime.utcnow)


class RiskAssessment(Base):
    __tablename__ = "risk_assessments"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    record_id = Column(String(50), unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    body_location = Column(JSON, nullable=True)
    duration = Column(String(100), nullable=True)
    appearance = Column(JSON, nullable=True)
    symptoms = Column(JSON, nullable=True)
    size = Column(String(100), nullable=True)
    change_status = Column(String(100), nullable=True)
    spread_status = Column(String(100), nullable=True)
    history = Column(JSON, nullable=True)
    notes = Column(Text, nullable=True)
    risk_score = Column(Integer, default=0)
    risk_category = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Disease(Base):
    __tablename__ = "diseases"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    slug = Column(String(100), unique=True, index=True, nullable=False)
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    symptoms = Column(Text, nullable=True)
    causes = Column(Text, nullable=True)
    prevention = Column(Text, nullable=True)
    treatment = Column(Text, nullable=True)
    warning = Column(Text, nullable=True)


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    report_id = Column(String(50), unique=True, index=True, nullable=False)
    user_id = Column(Integer, nullable=False)
    analysis_id = Column(Integer, nullable=False)
    pdf_path = Column(String(500), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
