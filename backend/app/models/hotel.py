from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum
from app.database import Base

class HotelStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"

class Hotel(Base):
    __tablename__ = "hotels"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    address = Column(String(500), nullable=False)
    contact_number = Column(String(50), nullable=False)
    email = Column(String(255), nullable=False)
    status = Column(SQLEnum(HotelStatus), default=HotelStatus.ACTIVE, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    organization = relationship("Organization", back_populates="hotels")
    rooms = relationship("Room", back_populates="hotel", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="hotel")
    receptionist_assignments = relationship("ReceptionistHotel", back_populates="hotel", cascade="all, delete-orphan")

class ReceptionistHotel(Base):
    __tablename__ = "receptionist_hotels"

    id = Column(Integer, primary_key=True, index=True)
    receptionist_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    hotel_id = Column(Integer, ForeignKey("hotels.id", ondelete="CASCADE"), nullable=False)

    receptionist = relationship("User", back_populates="hotel_assignments")
    hotel = relationship("Hotel", back_populates="receptionist_assignments")
