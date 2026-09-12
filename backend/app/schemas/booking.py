from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, Field
from app.models.booking import BookingStatus
from app.schemas.room import RoomResponse
from app.schemas.hotel import HotelResponse

class BookingCreate(BaseModel):
    hotel_id: int
    room_id: int
    check_in_date: date
    check_out_date: date
    number_of_guests: int = Field(gt=0)
    customer_id: Optional[int] = None  # Populated from authenticated user or specified by admin

class BookingResponse(BaseModel):
    id: int
    customer_id: int
    organization_id: int
    hotel_id: int
    room_id: int
    check_in_date: date
    check_out_date: date
    number_of_guests: int
    booking_date: datetime
    total_amount: float
    booking_status: BookingStatus

    class Config:
        from_attributes = True

class BookingDetailResponse(BookingResponse):
    hotel: Optional[HotelResponse] = None
    room: Optional[RoomResponse] = None

class AvailabilityResponse(BaseModel):
    room_id: int
    is_available: bool
    price_per_night: float
    total_amount: float
    nights: int
    message: Optional[str] = None
