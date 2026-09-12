from contextlib import asynccontextmanager
from typing import List, Optional
from pydantic import BaseModel
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.config import settings
from app.database import engine, Base, get_db
from app.seed import seed_database
from app.models.user import User
from app.dependencies.auth import get_current_user

# Import routers
from app.routers import auth, organizations, hotels, rooms, bookings, dashboards
# Import AI tools
from app.ai_tools.hotel_agent_tools import (
    AI_TOOL_DEFINITIONS,
    search_rooms_tool,
    check_availability_tool,
    create_booking_tool,
    get_booking_tool,
    cancel_booking_tool
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables and seed initial room data
    seed_database()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan
)

# CORS configuration for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permits Vite dev server and local clients
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include core API routes
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(organizations.router, prefix=settings.API_V1_STR)
app.include_router(hotels.router, prefix=settings.API_V1_STR)
app.include_router(rooms.router, prefix=settings.API_V1_STR)
app.include_router(bookings.router, prefix=settings.API_V1_STR)
app.include_router(dashboards.router, prefix=settings.API_V1_STR)

# --- Direct AI Agent Tool Endpoints ---
# Enables both direct LLM agent tool dispatch and UI AI sandbox testing

class AIToolExecuteRequest(BaseModel):
    tool_name: str
    arguments: dict

@app.get(f"{settings.API_V1_STR}/ai/tools")
def get_ai_tools_metadata():
    """Returns OpenAI/Anthropic tool schemas describing available service functions."""
    return {"tools": AI_TOOL_DEFINITIONS}

@app.post(f"{settings.API_V1_STR}/ai/execute")
def execute_ai_tool(
    req: AIToolExecuteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Executes service layer functions via AI Tool calling.
    Strictly verifies permissions and delegates to the same service layer functions.
    """
    name = req.tool_name
    args = req.arguments

    try:
        if name == "search_rooms":
            return search_rooms_tool(
                db=db,
                organization_id=args.get("organization_id"),
                hotel_id=args.get("hotel_id"),
                check_in_date=args.get("check_in_date"),
                check_out_date=args.get("check_out_date"),
                number_of_guests=args.get("number_of_guests")
            )
        elif name == "check_availability":
            return check_availability_tool(
                db=db,
                room_id=args["room_id"],
                check_in_date=args["check_in_date"],
                check_out_date=args["check_out_date"]
            )
        elif name == "create_booking":
            return create_booking_tool(
                db=db,
                customer_id=current_user.id,
                organization_id=args.get("organization_id", 1),
                hotel_id=args["hotel_id"],
                room_id=args["room_id"],
                check_in_date=args["check_in_date"],
                check_out_date=args["check_out_date"],
                number_of_guests=args["number_of_guests"]
            )
        elif name == "get_booking":
            return get_booking_tool(
                db=db,
                booking_id=args["booking_id"],
                current_user=current_user
            )
        elif name == "cancel_booking":
            return cancel_booking_tool(
                db=db,
                booking_id=args["booking_id"],
                current_user=current_user
            )
        else:
            raise HTTPException(status_code=400, detail=f"Unknown tool: {name}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/")
def root():
    return {
        "message": "Hotel Booking Management System API is running",
        "docs": "/docs",
        "ai_tools": f"{settings.API_V1_STR}/ai/tools"
    }
