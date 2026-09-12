from datetime import datetime, date
from typing import Dict, Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.user import User, UserRole
from app.models.organization import Organization
from app.models.hotel import Hotel, ReceptionistHotel
from app.models.room import Room
from app.models.booking import Booking, BookingStatus
from app.schemas.booking import BookingResponse
from app.dependencies.auth import get_current_user
from app.services.booking_service import list_bookings

router = APIRouter(prefix="/dashboard", tags=["Dashboards"])

@router.get("/customer-summary")
def get_customer_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Provides categorized bookings for the customer dashboard."""
    today = date.today()
    bookings = db.query(Booking).filter(Booking.customer_id == current_user.id).all()

    upcoming = []
    completed = []
    cancelled = []

    for b in bookings:
        hotel = db.query(Hotel).filter(Hotel.id == b.hotel_id).first()
        room = db.query(Room).filter(Room.id == b.room_id).first()
        item = {
            "id": b.id,
            "hotel_name": hotel.name if hotel else "Hotel",
            "room_number": room.room_number if room else "N/A",
            "room_type": room.room_type if room else "N/A",
            "check_in_date": str(b.check_in_date),
            "check_out_date": str(b.check_out_date),
            "total_amount": b.total_amount,
            "booking_status": b.booking_status.value,
            "booking_date": b.booking_date.isoformat()
        }
        if b.booking_status == BookingStatus.CANCELLED:
            cancelled.append(item)
        elif b.check_out_date < today or b.booking_status == BookingStatus.COMPLETED:
            completed.append(item)
        else:
            upcoming.append(item)

    return {
        "upcoming": upcoming,
        "completed": completed,
        "cancelled": cancelled,
        "total_bookings": len(bookings)
    }

@router.get("/staff-stats")
def get_staff_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Metrics and statistics filtered for Org Admin and Receptionists."""
    bookings_query = db.query(Booking)
    hotels_query = db.query(Hotel)
    rooms_query = db.query(Room)

    if current_user.role == UserRole.ORGANIZATION_ADMIN:
        bookings_query = bookings_query.filter(Booking.organization_id == current_user.organization_id)
        hotels_query = hotels_query.filter(Hotel.organization_id == current_user.organization_id)
        rooms_query = rooms_query.join(Hotel, Room.hotel_id == Hotel.id).filter(Hotel.organization_id == current_user.organization_id)
    elif current_user.role == UserRole.RECEPTIONIST:
        assigned_hotel_ids = [
            h.hotel_id for h in db.query(ReceptionistHotel).filter(
                ReceptionistHotel.receptionist_id == current_user.id
            ).all()
        ]
        bookings_query = bookings_query.filter(Booking.hotel_id.in_(assigned_hotel_ids))
        hotels_query = hotels_query.filter(Hotel.id.in_(assigned_hotel_ids))
        rooms_query = rooms_query.filter(Room.hotel_id.in_(assigned_hotel_ids))
    elif current_user.role == UserRole.PRODUCT_ADMIN:
        pass  # Global access

    total_bookings = bookings_query.count()
    confirmed_bookings = bookings_query.filter(Booking.booking_status == BookingStatus.CONFIRMED).count()
    cancelled_bookings = bookings_query.filter(Booking.booking_status == BookingStatus.CANCELLED).count()
    total_hotels = hotels_query.count()
    total_rooms = rooms_query.count()

    total_revenue = db.query(func.sum(Booking.total_amount)).filter(
        Booking.id.in_([b.id for b in bookings_query.filter(Booking.booking_status == BookingStatus.CONFIRMED).all()])
    ).scalar() or 0.0

    return {
        "role": current_user.role.value,
        "total_hotels": total_hotels,
        "total_rooms": total_rooms,
        "total_bookings": total_bookings,
        "confirmed_bookings": confirmed_bookings,
        "cancelled_bookings": cancelled_bookings,
        "total_revenue": total_revenue
    }
