from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from app.models.organization import OrgStatus

class OrganizationBase(BaseModel):
    name: str
    status: Optional[OrgStatus] = OrgStatus.ACTIVE

class OrganizationCreate(OrganizationBase):
    pass

class OrganizationUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[OrgStatus] = None

class OrganizationResponse(OrganizationBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
