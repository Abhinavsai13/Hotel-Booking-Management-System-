from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.organization import Organization, OrgStatus
from app.models.user import User, UserRole
from app.schemas.organization import OrganizationCreate, OrganizationUpdate

def get_organizations(db: Session, skip: int = 0, limit: int = 100) -> List[Organization]:
    return db.query(Organization).offset(skip).limit(limit).all()

def get_organization_by_id(db: Session, org_id: int) -> Organization:
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")
    return org

def create_organization(db: Session, org_data: OrganizationCreate) -> Organization:
    existing = db.query(Organization).filter(Organization.name == org_data.name).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Organization name already exists")
    
    org = Organization(name=org_data.name, status=org_data.status or OrgStatus.ACTIVE)
    db.add(org)
    db.commit()
    db.refresh(org)
    return org

def update_organization(db: Session, org_id: int, org_data: OrganizationUpdate) -> Organization:
    org = get_organization_by_id(db, org_id)
    if org_data.name is not None:
        org.name = org_data.name
    if org_data.status is not None:
        org.status = org_data.status
    db.commit()
    db.refresh(org)
    return org
