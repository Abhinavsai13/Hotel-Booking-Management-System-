from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User, UserRole
from app.models.room import Room
from app.models.hotel import Hotel
from app.models.booking import Booking, BookingStatus
from app.schemas.booking import BookingCreate, BookingResponse, BookingDetailResponse
from app.dependencies.auth import get_current_user
from app.services.booking_service import (
    create_booking,
    get_booking,
    cancel_booking,
    list_bookings
)

router = APIRouter(prefix="/bookings", tags=["Bookings"])

@router.post("", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
def create_new_booking(
    booking_in: BookingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Creates a booking.
    Customer creates for self. Staff can create for customer if customer_id is provided.
    Double-booking prevention and 409 conflict detection handled in service layer.
    """
    target_customer_id = current_user.id
    if current_user.role in [UserRole.PRODUCT_ADMIN, UserRole.ORGANIZATION_ADMIN, UserRole.RECEPTIONIST]:
        if booking_in.customer_id:
            target_customer_id = booking_in.customer_id

    # Retrieve hotel to verify organization hierarchy
    hotel = db.query(Hotel).filter(Hotel.id == booking_in.hotel_id).first()
    if not hotel:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hotel not found")

    return create_booking(
        db=db,
        customer_id=target_customer_id,
        organization_id=hotel.organization_id,
        hotel_id=booking_in.hotel_id,
        room_id=booking_in.room_id,
        check_in_date=booking_in.check_in_date,
        check_out_date=booking_in.check_out_date,
        number_of_guests=booking_in.number_of_guests
    )

@router.get("", response_model=List[BookingResponse])
def get_all_bookings(
    hotel_id: Optional[int] = None,
    status_filter: Optional[BookingStatus] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Returns bookings filtered strictly by the user's role and data isolation domain."""
    return list_bookings(
        db=db,
        current_user=current_user,
        hotel_id=hotel_id,
        status_filter=status_filter,
        skip=skip,
        limit=limit
    )

@router.get("/{booking_id}", response_model=BookingDetailResponse)
def get_booking_by_id(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    booking = get_booking(db, booking_id, current_user)
    # Eager load relationships for detail view
    return booking

@router.post("/{booking_id}/cancel", response_model=BookingResponse)
def cancel_booking_endpoint(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Cancels a booking.
    Customers are subject to the 24-hour advance cancellation policy.
    Staff may cancel anytime.
    """
    return cancel_booking(db, booking_id, current_user)
