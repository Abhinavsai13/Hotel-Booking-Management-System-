from datetime import date
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from app.models.room import Room, RoomAvailabilityStatus
from app.models.hotel import Hotel, HotelStatus
from app.models.booking import Booking, BookingStatus

def check_availability(
    db: Session,
    room_id: int,
    check_in_date: date,
    check_out_date: date
) -> Tuple[bool, Optional[str], Optional[Room]]:
    """
    Checks if a room is available for the given date range.
    Availability Rules:
    1. Room exists and status is ACTIVE.
    2. Hotel exists and is ACTIVE.
    3. check_in_date < check_out_date and check_in_date >= current_date (or valid date range).
    4. No overlapping CONFIRMED booking exists. Checkout date is a valid boundary
       (i.e. check_in_date < existing.check_out_date AND check_out_date > existing.check_in_date).
    """
    if check_in_date >= check_out_date:
        return False, "Check-out date must be strictly after check-in date", None

    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        return False, "Room not found", None

    if room.availability_status != RoomAvailabilityStatus.ACTIVE:
        return False, f"Room is currently {room.availability_status.value}", room

    hotel = db.query(Hotel).filter(Hotel.id == room.hotel_id).first()
    if not hotel or hotel.status != HotelStatus.ACTIVE:
        return False, "Hotel is currently inactive", room

    # Overlapping bookings check
    overlapping_booking = db.query(Booking).filter(
        Booking.room_id == room_id,
        Booking.booking_status == BookingStatus.CONFIRMED,
        Booking.check_in_date < check_out_date,
        Booking.check_out_date > check_in_date
    ).first()

    if overlapping_booking:
        return False, f"Room is already booked from {overlapping_booking.check_in_date} to {overlapping_booking.check_out_date}", room

    return True, None, room


def search_rooms(
    db: Session,
    organization_id: Optional[int] = None,
    hotel_id: Optional[int] = None,
    check_in_date: Optional[date] = None,
    check_out_date: Optional[date] = None,
    number_of_guests: Optional[int] = None
) -> List[Room]:
    """
    Searches for rooms matching criteria and date availability.
    Accessible by Customer, Receptionist, Org Admin, and AI agent.
    """
    query = db.query(Room).join(Hotel, Room.hotel_id == Hotel.id).filter(
        Room.availability_status == RoomAvailabilityStatus.ACTIVE,
        Hotel.status == HotelStatus.ACTIVE
    )

    if hotel_id:
        query = query.filter(Room.hotel_id == hotel_id)
    elif organization_id:
        query = query.filter(Hotel.organization_id == organization_id)

    if number_of_guests:
        query = query.filter(Room.capacity >= number_of_guests)

    rooms = query.all()

    # If dates are specified, filter by non-overlapping availability
    if check_in_date and check_out_date:
        if check_in_date >= check_out_date:
            return []

        # Find IDs of rooms that have overlapping confirmed bookings
        booked_room_ids = db.query(Booking.room_id).filter(
            Booking.booking_status == BookingStatus.CONFIRMED,
            Booking.check_in_date < check_out_date,
            Booking.check_out_date > check_in_date
        ).subquery()

        rooms = [r for r in rooms if r.id not in [b[0] for b in db.query(booked_room_ids).all()]]

    return rooms
