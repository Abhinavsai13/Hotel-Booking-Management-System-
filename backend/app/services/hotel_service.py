from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.hotel import Hotel, HotelStatus, ReceptionistHotel
from app.models.user import User, UserRole
from app.schemas.hotel import HotelCreate, HotelUpdate

def get_hotels(
    db: Session,
    organization_id: Optional[int] = None,
    current_user: Optional[User] = None,
    skip: int = 0,
    limit: int = 100
) -> List[Hotel]:
    query = db.query(Hotel)

    if current_user:
        if current_user.role == UserRole.ORGANIZATION_ADMIN:
            query = query.filter(Hotel.organization_id == current_user.organization_id)
        elif current_user.role == UserRole.RECEPTIONIST:
            assigned_ids = [
                h.hotel_id for h in db.query(ReceptionistHotel).filter(
                    ReceptionistHotel.receptionist_id == current_user.id
                ).all()
            ]
            query = query.filter(Hotel.id.in_(assigned_ids))
        elif organization_id:
            query = query.filter(Hotel.organization_id == organization_id)
    elif organization_id:
        query = query.filter(Hotel.organization_id == organization_id)

    return query.offset(skip).limit(limit).all()

def get_hotel_by_id(db: Session, hotel_id: int) -> Hotel:
    hotel = db.query(Hotel).filter(Hotel.id == hotel_id).first()
    if not hotel:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hotel not found")
    return hotel

def create_hotel(db: Session, hotel_data: HotelCreate, org_id: int) -> Hotel:
    hotel = Hotel(
        organization_id=org_id,
        name=hotel_data.name,
        address=hotel_data.address,
        contact_number=hotel_data.contact_number,
        email=hotel_data.email,
        status=hotel_data.status or HotelStatus.ACTIVE
    )
    db.add(hotel)
    db.commit()
    db.refresh(hotel)
    return hotel

def update_hotel(db: Session, hotel_id: int, hotel_data: HotelUpdate) -> Hotel:
    hotel = get_hotel_by_id(db, hotel_id)
    if hotel_data.name is not None:
        hotel.name = hotel_data.name
    if hotel_data.address is not None:
        hotel.address = hotel_data.address
    if hotel_data.contact_number is not None:
        hotel.contact_number = hotel_data.contact_number
    if hotel_data.email is not None:
        hotel.email = hotel_data.email
    if hotel_data.status is not None:
        hotel.status = hotel_data.status
    db.commit()
    db.refresh(hotel)
    return hotel

def assign_receptionist_to_hotel(db: Session, hotel_id: int, receptionist_id: int) -> ReceptionistHotel:
    hotel = get_hotel_by_id(db, hotel_id)
    user = db.query(User).filter(User.id == receptionist_id).first()
    if not user or user.role != UserRole.RECEPTIONIST:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Target user must be a RECEPTIONIST")

    # Receptionist must belong to the same organization
    if user.organization_id != hotel.organization_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Receptionist does not belong to hotel's organization")

    existing = db.query(ReceptionistHotel).filter(
        ReceptionistHotel.hotel_id == hotel_id,
        ReceptionistHotel.receptionist_id == receptionist_id
    ).first()
    if existing:
        return existing

    assignment = ReceptionistHotel(hotel_id=hotel_id, receptionist_id=receptionist_id)
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return assignment
