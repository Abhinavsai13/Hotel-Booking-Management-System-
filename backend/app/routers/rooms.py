from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User, UserRole
from app.models.room import Room, RoomAvailabilityStatus
from app.models.hotel import Hotel
from app.schemas.room import RoomCreate, RoomUpdate, RoomStatusUpdate, RoomResponse
from app.schemas.booking import AvailabilityResponse
from app.dependencies.auth import get_current_user, require_roles, verify_hotel_access
from app.services.room_service import search_rooms, check_availability

router = APIRouter(tags=["Rooms"])

@router.get("/rooms/search", response_model=List[RoomResponse])
def search_rooms_endpoint(
    organization_id: Optional[int] = None,
    hotel_id: Optional[int] = None,
    check_in_date: Optional[date] = None,
    check_out_date: Optional[date] = None,
    number_of_guests: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Search available rooms matching criteria, capacity, and date availability.
    Accessible to Customer, Staff, and AI Tools.
    """
    return search_rooms(
        db=db,
        organization_id=organization_id,
        hotel_id=hotel_id,
        check_in_date=check_in_date,
        check_out_date=check_out_date,
        number_of_guests=number_of_guests
    )

@router.get("/rooms/{room_id}/availability", response_model=AvailabilityResponse)
def check_room_availability_endpoint(
    room_id: int,
    check_in_date: date = Query(...),
    check_out_date: date = Query(...),
    db: Session = Depends(get_db)
):
    """Checks availability for a specific room and returns calculated price & nights."""
    is_avail, reason, room = check_availability(
        db=db,
        room_id=room_id,
        check_in_date=check_in_date,
        check_out_date=check_out_date
    )
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=reason or "Room not found")

    nights = max((check_out_date - check_in_date).days, 0)
    total_amount = float(nights * room.price_per_night)

    return AvailabilityResponse(
        room_id=room_id,
        is_available=is_avail,
        price_per_night=room.price_per_night,
        total_amount=total_amount,
        nights=nights,
        message=reason if not is_avail else "Room is available"
    )

@router.get("/hotels/{hotel_id}/rooms", response_model=List[RoomResponse])
def get_rooms_by_hotel(hotel_id: int, db: Session = Depends(get_db)):
    return db.query(Room).filter(Room.hotel_id == hotel_id).all()

@router.post("/hotels/{hotel_id}/rooms", response_model=RoomResponse, status_code=status.HTTP_201_CREATED)
def create_room(
    hotel_id: int,
    room_in: RoomCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check permissions (Org Admin or assigned Receptionist)
    if not verify_hotel_access(current_user, hotel_id, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to manage rooms in this hotel")

    # Check unique room_number inside the same hotel
    existing = db.query(Room).filter(Room.hotel_id == hotel_id, Room.room_number == room_in.room_number).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Room {room_in.room_number} already exists in this hotel")

    room = Room(
        hotel_id=hotel_id,
        room_number=room_in.room_number,
        room_type=room_in.room_type,
        capacity=room_in.capacity,
        price_per_night=room_in.price_per_night,
        availability_status=room_in.availability_status or RoomAvailabilityStatus.ACTIVE,
        description=room_in.description,
        amenities=room_in.amenities
    )
    db.add(room)
    db.commit()
    db.refresh(room)
    return room

@router.get("/rooms/{room_id}", response_model=RoomResponse)
def get_room(room_id: int, db: Session = Depends(get_db)):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")
    return room

@router.put("/rooms/{room_id}", response_model=RoomResponse)
def update_room(
    room_id: int,
    room_in: RoomUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")

    if not verify_hotel_access(current_user, room.hotel_id, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to update room")

    for field, val in room_in.model_dump(exclude_unset=True).items():
        setattr(room, field, val)

    db.commit()
    db.refresh(room)
    return room

@router.patch("/rooms/{room_id}/status", response_model=RoomResponse)
def update_room_status(
    room_id: int,
    status_update: RoomStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Staff updates room availability status (ACTIVE / MAINTENANCE / INACTIVE)."""
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")

    if not verify_hotel_access(current_user, room.hotel_id, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to update room status")

    room.availability_status = status_update.availability_status
    db.commit()
    db.refresh(room)
    return room
