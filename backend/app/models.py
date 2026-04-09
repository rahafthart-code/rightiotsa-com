from datetime import datetime
from enum import Enum

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum as SqlEnum,
    Float,
    ForeignKey,
    Integer,
    String,
)
from sqlalchemy.orm import relationship

from .database import Base


class SpeciesEnum(str, Enum):
    CAMEL = "Camel"
    FALCON = "Falcon"
    HORSE = "Horse"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=True)
    email = Column(String, unique=True, index=True, nullable=False)
    national_id = Column(String, nullable=True)
    mobile = Column(String, nullable=True)
    city = Column(String, nullable=True)
    asset_type = Column(String, nullable=True)
    password_hash = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    animals = relationship("Animal", back_populates="owner", cascade="all, delete-orphan")
    otps = relationship("OtpCode", back_populates="user", cascade="all, delete-orphan")


class Animal(Base):
    __tablename__ = "animals"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    species = Column(SqlEnum(SpeciesEnum), nullable=False)
    device_imei = Column(String, unique=True, index=True, nullable=False)

    owner = relationship("User", back_populates="animals")
    telemetry = relationship("Telemetry", back_populates="animal", cascade="all, delete-orphan")


class Telemetry(Base):
    __tablename__ = "telemetry"

    id = Column(Integer, primary_key=True, index=True)
    device_imei = Column(String, ForeignKey("animals.device_imei"), index=True, nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    battery = Column(Integer, nullable=True)
    status = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True, nullable=False)

    animal = relationship("Animal", back_populates="telemetry")


class OtpCode(Base):
    __tablename__ = "otp_codes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    code_hash = Column(String, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    is_used = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="otps")

