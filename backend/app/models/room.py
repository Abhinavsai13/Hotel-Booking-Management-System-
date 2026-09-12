from sqlalchemy import Column, Integer, String, Float, ForeignKey, Enum as SQLEnum, Text
from sqlalchemy.orm import relationship
import enum
from app.database import Base

class RoomAvailabilityStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    MAINTENANCE = "MAINTENANCE"
    INACTIVE = "INACTIVE"

class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True)
    hotel_id = Column(Integer, ForeignKey("hotels.id", ondelete="CASCADE"), nullable=False)
    room_number = Column(String(50), nullable=False)
    room_type = Column(String(100), nullable=False)
    capacity = Column(Integer, nullable=False)
    price_per_night = Column(Float, nullable=False)
    availability_status = Column(SQLEnum(RoomAvailabilityStatus), default=RoomAvailabilityStatus.ACTIVE, nullable=False)
    description = Column(Text, nullable=True)
    amenities = Column(Text, nullable=True)  # Comma-separated or JSON string

    hotel = relationship("Hotel", back_populates="rooms")
    bookings = relationship("Booking", back_populates="room", cascade="all, delete-orphan")
