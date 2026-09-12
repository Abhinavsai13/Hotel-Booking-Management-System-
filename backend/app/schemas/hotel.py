from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr
from app.models.hotel import HotelStatus

class HotelBase(BaseModel):
    name: str
    address: str
    contact_number: str
    email: EmailStr
    status: Optional[HotelStatus] = HotelStatus.ACTIVE

class HotelCreate(HotelBase):
    organization_id: Optional[int] = None  # Will be overridden or validated via auth role

class HotelUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    contact_number: Optional[str] = None
    email: Optional[EmailStr] = None
    status: Optional[HotelStatus] = None

class HotelResponse(HotelBase):
    id: int
    organization_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class ReceptionistAssignment(BaseModel):
    receptionist_id: int
