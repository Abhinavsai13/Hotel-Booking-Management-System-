from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User, UserRole
from app.schemas.organization import OrganizationCreate, OrganizationUpdate, OrganizationResponse
from app.dependencies.auth import get_current_user, require_roles
from app.services.organization_service import (
    get_organizations as svc_get_organizations,
    get_organization_by_id as svc_get_org_by_id,
    create_organization as svc_create_organization,
    update_organization as svc_update_organization
)

router = APIRouter(prefix="/organizations", tags=["Organizations"])

@router.get("", response_model=List[OrganizationResponse])
def list_organizations(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Publicly list active organizations for customer browsing or admin listing."""
    return svc_get_organizations(db, skip=skip, limit=limit)

@router.post("", response_model=OrganizationResponse, status_code=status.HTTP_201_CREATED)
def create_org(
    org_in: OrganizationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.PRODUCT_ADMIN]))
):
    """Product Admin creates a new organization."""
    return svc_create_organization(db, org_in)

@router.get("/{org_id}", response_model=OrganizationResponse)
def get_org(
    org_id: int,
    db: Session = Depends(get_db)
):
    return svc_get_org_by_id(db, org_id)

@router.put("/{org_id}", response_model=OrganizationResponse)
def update_org(
    org_id: int,
    org_in: OrganizationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Only Product Admin or Org Admin of that specific organization
    if current_user.role == UserRole.PRODUCT_ADMIN or (
        current_user.role == UserRole.ORGANIZATION_ADMIN and current_user.organization_id == org_id
    ):
        return svc_update_organization(db, org_id, org_in)

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You do not have permission to manage this organization"
    )
