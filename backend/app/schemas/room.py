from typing import Optional
from datetime import date
from pydantic import BaseModel, Field
from app.models.room import RoomAvailabilityStatus

class RoomBase(BaseModel):
    room_number: str
    room_type: str
    capacity: int = Field(gt=0)
    price_per_night: float = Field(gt=0)
    availability_status: Optional[RoomAvailabilityStatus] = RoomAvailabilityStatus.ACTIVE
    description: Optional[str] = None
    amenities: Optional[str] = None

class RoomCreate(RoomBase):
    pass

class RoomUpdate(BaseModel):
    room_number: Optional[str] = None
    room_type: Optional[str] = None
    capacity: Optional[int] = Field(default=None, gt=0)
    price_per_night: Optional[float] = Field(default=None, gt=0)
    availability_status: Optional[RoomAvailabilityStatus] = None
    description: Optional[str] = None
    amenities: Optional[str] = None

class RoomStatusUpdate(BaseModel):
    availability_status: RoomAvailabilityStatus

class RoomResponse(RoomBase):
    id: int
    hotel_id: int

    class Config:
        from_attributes = True

class RoomSearchQuery(BaseModel):
    organization_id: Optional[int] = None
    hotel_id: Optional[int] = None
    check_in_date: date
    check_out_date: date
    number_of_guests: int = Field(gt=0)
