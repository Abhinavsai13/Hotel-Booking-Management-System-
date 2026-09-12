from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User, UserRole
from app.schemas.hotel import HotelCreate, HotelUpdate, HotelResponse, ReceptionistAssignment
from app.dependencies.auth import get_current_user, require_roles, verify_hotel_access
from app.services.hotel_service import (
    get_hotels as svc_get_hotels,
    get_hotel_by_id as svc_get_hotel_by_id,
    create_hotel as svc_create_hotel,
    update_hotel as svc_update_hotel,
    assign_receptionist_to_hotel as svc_assign_receptionist
)

router = APIRouter(prefix="/hotels", tags=["Hotels"])

@router.get("", response_model=List[HotelResponse])
def list_hotels(
    organization_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Publicly browse hotels or filter by organization."""
    return svc_get_hotels(db=db, organization_id=organization_id, skip=skip, limit=limit)

@router.post("", response_model=HotelResponse, status_code=status.HTTP_201_CREATED)
def create_new_hotel(
    hotel_in: HotelCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.PRODUCT_ADMIN, UserRole.ORGANIZATION_ADMIN]))
):
    org_id = current_user.organization_id
    if current_user.role == UserRole.PRODUCT_ADMIN:
        if not hotel_in.organization_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="organization_id is required for Product Admin")
        org_id = hotel_in.organization_id

    if not org_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User is not associated with an organization")

    return svc_create_hotel(db, hotel_in, org_id)

@router.get("/{hotel_id}", response_model=HotelResponse)
def get_hotel(hotel_id: int, db: Session = Depends(get_db)):
    return svc_get_hotel_by_id(db, hotel_id)

@router.put("/{hotel_id}", response_model=HotelResponse)
def update_existing_hotel(
    hotel_id: int,
    hotel_in: HotelUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not verify_hotel_access(current_user, hotel_id, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to manage this hotel")
    return svc_update_hotel(db, hotel_id, hotel_in)

@router.post("/{hotel_id}/receptionists", status_code=status.HTTP_200_OK)
def assign_receptionist(
    hotel_id: int,
    assignment: ReceptionistAssignment,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.PRODUCT_ADMIN, UserRole.ORGANIZATION_ADMIN]))
):
    """Organization Admin assigns a receptionist to this hotel."""
    if current_user.role == UserRole.ORGANIZATION_ADMIN and not verify_hotel_access(current_user, hotel_id, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to manage this hotel")

    svc_assign_receptionist(db, hotel_id, assignment.receptionist_id)
    return {"message": f"Receptionist {assignment.receptionist_id} assigned to hotel {hotel_id}"}
