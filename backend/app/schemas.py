from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr

from .models import SpeciesEnum


class UserBase(BaseModel):
    full_name: Optional[str] = None
    email: EmailStr
    national_id: Optional[str] = None
    mobile: Optional[str] = None
    city: Optional[str] = None
    is_active: bool = True


class UserCreate(UserBase):
    pass


class UserRegister(BaseModel):
    full_name: str
    email: EmailStr
    national_id: str
    mobile: str
    city: str


class UserRead(UserBase):
    id: int

    class Config:
        from_attributes = True


class AnimalBase(BaseModel):
    name: str
    species: SpeciesEnum
    device_imei: str


class AnimalCreate(AnimalBase):
    owner_email: EmailStr


class AnimalRead(AnimalBase):
    id: int
    last_seen_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TelemetryIn(BaseModel):
    device_imei: str
    lat: float
    lng: float
    battery: Optional[int] = None
    status: Optional[str] = None
    timestamp: Optional[datetime] = None


class TelemetryRead(BaseModel):
    id: int
    device_imei: str
    lat: float
    lng: float
    battery: Optional[int] = None
    status: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True


class RequestOtpPayload(BaseModel):
    email_or_mobile: str  # Can be either email or mobile
    email: Optional[EmailStr] = None  # For backward compatibility
    full_name: Optional[str] = None
    national_id: Optional[str] = None
    mobile: Optional[str] = None
    city: Optional[str] = None
    asset_type: Optional[str] = None


class VerifyOtpPayload(BaseModel):
    email_or_mobile: str  # Can be either email or mobile
    code: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead
    is_admin: bool


class AdminCreateUser(BaseModel):
    full_name: Optional[str] = None
    email: EmailStr
    is_active: bool = True


class AdminDeviceRead(BaseModel):
    device_imei: str
    animal_name: str
    owner_email: EmailStr
    species: SpeciesEnum
    last_status: Optional[str] = None
    last_seen_at: Optional[datetime] = None

