from datetime import date, datetime, timedelta
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.booking import Booking, BookingStatus
from app.models.room import Room, RoomAvailabilityStatus
from app.models.hotel import Hotel
from app.models.user import User, UserRole
from app.services.room_service import check_availability
from app.dependencies.auth import verify_hotel_access
from app.config import settings

def create_booking(
    db: Session,
    customer_id: int,
    organization_id: int,
    hotel_id: int,
    room_id: int,
    check_in_date: date,
    check_out_date: date,
    number_of_guests: int
) -> Booking:
    """
    Creates a new booking atomically.
    Validates capacity, dates, room/hotel existence, and prevents double-booking using DB locking/atomic checks.
    """
    if check_in_date >= check_out_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Check-out date must be strictly after check-in date"
        )

    # In SQLite or Postgres, lock the room row if supported (with_for_update)
    try:
        room = db.query(Room).filter(Room.id == room_id).with_for_update().first()
    except Exception:
        room = db.query(Room).filter(Room.id == room_id).first()

    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")

    if room.hotel_id != hotel_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Room does not belong to specified hotel")

    if room.availability_status != RoomAvailabilityStatus.ACTIVE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Room is not active for booking")

    hotel = db.query(Hotel).filter(Hotel.id == hotel_id).first()
    if not hotel or hotel.organization_id != organization_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid hotel or organization mapping")

    if number_of_guests > room.capacity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Guest count ({number_of_guests}) exceeds room capacity ({room.capacity})"
        )

    # Check for overlapping CONFIRMED bookings
    # Overlap formula: existing.check_in < requested.check_out AND existing.check_out > requested.check_in
    overlapping = db.query(Booking).filter(
        Booking.room_id == room_id,
        Booking.booking_status == BookingStatus.CONFIRMED,
        Booking.check_in_date < check_out_date,
        Booking.check_out_date > check_in_date
    ).first()

    if overlapping:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Room is already booked for overlapping dates: {overlapping.check_in_date} to {overlapping.check_out_date}"
        )

    nights = (check_out_date - check_in_date).days
    total_amount = float(nights * room.price_per_night)

    booking = Booking(
        customer_id=customer_id,
        organization_id=organization_id,
        hotel_id=hotel_id,
        room_id=room_id,
        check_in_date=check_in_date,
        check_out_date=check_out_date,
        number_of_guests=number_of_guests,
        booking_date=datetime.utcnow(),
        total_amount=total_amount,
        booking_status=BookingStatus.CONFIRMED
    )

    db.add(booking)
    db.commit()
    db.refresh(booking)
    return booking


def get_booking(db: Session, booking_id: int, current_user: User) -> Booking:
    """
    Fetches booking with strict role & tenant verification:
    - Product Admin: can view any booking.
    - Org Admin: can view bookings belonging to their organization.
    - Receptionist: can view bookings belonging to hotels they are assigned to.
    - Customer: can view ONLY their own bookings.
    """
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    if current_user.role == UserRole.PRODUCT_ADMIN:
        return booking

    if current_user.role == UserRole.ORGANIZATION_ADMIN:
        if current_user.organization_id != booking.organization_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to booking outside organization")
        return booking

    if current_user.role == UserRole.RECEPTIONIST:
        if not verify_hotel_access(current_user, booking.hotel_id, db):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to booking at unassigned hotel")
        return booking

    if current_user.role == UserRole.CUSTOMER:
        if current_user.id != booking.customer_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to another customer's booking")
        return booking

    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized")


def cancel_booking(db: Session, booking_id: int, current_user: User) -> Booking:
    """
    Cancels a booking.
    Customer Rule: Allowed directly up to 24 hours (1 day) before check-in date.
    Staff Rule: Product Admin, Org Admin, or assigned Receptionist can cancel/override at any time.
    """
    booking = get_booking(db, booking_id, current_user)

    if booking.booking_status == BookingStatus.CANCELLED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Booking is already cancelled")

    if booking.booking_status == BookingStatus.COMPLETED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot cancel a completed booking")

    # If the user is a customer, enforce the 24 hours / 1 day cancellation policy
    if current_user.role == UserRole.CUSTOMER:
        # Check-in boundary: midnight of the check-in date
        check_in_datetime = datetime.combine(booking.check_in_date, datetime.min.time())
        cancellation_deadline = check_in_datetime - timedelta(hours=settings.CANCELLATION_DEADLINE_HOURS)
        now = datetime.utcnow()

        if now > cancellation_deadline:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Direct customer cancellation is only allowed up to {settings.CANCELLATION_DEADLINE_HOURS} hours before check-in. Please contact hotel staff."
            )

    booking.booking_status = BookingStatus.CANCELLED
    db.commit()
    db.refresh(booking)
    return booking


def list_bookings(
    db: Session,
    current_user: User,
    hotel_id: Optional[int] = None,
    status_filter: Optional[BookingStatus] = None,
    skip: int = 0,
    limit: int = 100
) -> List[Booking]:
    """Lists bookings according to user role and data isolation rules."""
    query = db.query(Booking)

    if current_user.role == UserRole.PRODUCT_ADMIN:
        if hotel_id:
            query = query.filter(Booking.hotel_id == hotel_id)
    elif current_user.role == UserRole.ORGANIZATION_ADMIN:
        query = query.filter(Booking.organization_id == current_user.organization_id)
        if hotel_id:
            query = query.filter(Booking.hotel_id == hotel_id)
    elif current_user.role == UserRole.RECEPTIONIST:
        from app.models.hotel import ReceptionistHotel
        assigned_hotel_ids = [
            h.hotel_id for h in db.query(ReceptionistHotel).filter(
                ReceptionistHotel.receptionist_id == current_user.id
            ).all()
        ]
        if hotel_id:
            if hotel_id not in assigned_hotel_ids:
                return []
            query = query.filter(Booking.hotel_id == hotel_id)
        else:
            query = query.filter(Booking.hotel_id.in_(assigned_hotel_ids))
    elif current_user.role == UserRole.CUSTOMER:
        query = query.filter(Booking.customer_id == current_user.id)

    if status_filter:
        query = query.filter(Booking.booking_status == status_filter)

    return query.order_by(Booking.check_in_date.desc()).offset(skip).limit(limit).all()
