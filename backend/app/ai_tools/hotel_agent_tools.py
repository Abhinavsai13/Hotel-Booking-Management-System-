from datetime import date
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.room import Room
from app.models.booking import Booking
from app.services.room_service import (
    search_rooms as svc_search_rooms,
    check_availability as svc_check_availability,
)
from app.services.booking_service import (
    create_booking as svc_create_booking,
    get_booking as svc_get_booking,
    cancel_booking as svc_cancel_booking,
)

# AI Tool Function Call Signatures & Wrappers

def search_rooms_tool(
    db: Session,
    organization_id: Optional[int] = None,
    hotel_id: Optional[int] = None,
    check_in_date: Optional[str] = None,
    check_out_date: Optional[str] = None,
    number_of_guests: Optional[int] = None
) -> List[Dict[str, Any]]:
    """
    AI Tool: Searches available rooms based on hotel, dates, and guests.
    Dates are formatted as YYYY-MM-DD strings.
    """
    in_date = date.fromisoformat(check_in_date) if check_in_date else None
    out_date = date.fromisoformat(check_out_date) if check_out_date else None
    rooms = svc_search_rooms(
        db=db,
        organization_id=organization_id,
        hotel_id=hotel_id,
        check_in_date=in_date,
        check_out_date=out_date,
        number_of_guests=number_of_guests
    )
    return [
        {
            "id": r.id,
            "hotel_id": r.hotel_id,
            "room_number": r.room_number,
            "room_type": r.room_type,
            "capacity": r.capacity,
            "price_per_night": r.price_per_night,
            "amenities": r.amenities,
            "description": r.description
        }
        for r in rooms
    ]

def check_availability_tool(
    db: Session,
    room_id: int,
    check_in_date: str,
    check_out_date: str
) -> Dict[str, Any]:
    """
    AI Tool: Checks if a specific room is available for the given dates.
    """
    in_date = date.fromisoformat(check_in_date)
    out_date = date.fromisoformat(check_out_date)
    is_avail, reason, room = svc_check_availability(
        db=db,
        room_id=room_id,
        check_in_date=in_date,
        check_out_date=out_date
    )
    nights = (out_date - in_date).days if (in_date and out_date and out_date > in_date) else 0
    price_per_night = room.price_per_night if room else 0.0
    total = nights * price_per_night

    return {
        "room_id": room_id,
        "is_available": is_avail,
        "reason": reason,
        "price_per_night": price_per_night,
        "nights": nights,
        "total_amount": total
    }

def create_booking_tool(
    db: Session,
    customer_id: int,
    organization_id: int,
    hotel_id: int,
    room_id: int,
    check_in_date: str,
    check_out_date: str,
    number_of_guests: int
) -> Dict[str, Any]:
    """
    AI Tool: Books a room on behalf of an authenticated user.
    """
    in_date = date.fromisoformat(check_in_date)
    out_date = date.fromisoformat(check_out_date)
    booking = svc_create_booking(
        db=db,
        customer_id=customer_id,
        organization_id=organization_id,
        hotel_id=hotel_id,
        room_id=room_id,
        check_in_date=in_date,
        check_out_date=out_date,
        number_of_guests=number_of_guests
    )
    return {
        "booking_id": booking.id,
        "customer_id": booking.customer_id,
        "hotel_id": booking.hotel_id,
        "room_id": booking.room_id,
        "check_in_date": str(booking.check_in_date),
        "check_out_date": str(booking.check_out_date),
        "total_amount": booking.total_amount,
        "status": booking.booking_status.value
    }

def get_booking_tool(
    db: Session,
    booking_id: int,
    current_user: User
) -> Dict[str, Any]:
    """
    AI Tool: Retrieves booking details strictly observing role permissions.
    """
    booking = svc_get_booking(db=db, booking_id=booking_id, current_user=current_user)
    return {
        "booking_id": booking.id,
        "customer_id": booking.customer_id,
        "hotel_id": booking.hotel_id,
        "room_id": booking.room_id,
        "check_in_date": str(booking.check_in_date),
        "check_out_date": str(booking.check_out_date),
        "number_of_guests": booking.number_of_guests,
        "total_amount": booking.total_amount,
        "status": booking.booking_status.value
    }

def cancel_booking_tool(
    db: Session,
    booking_id: int,
    current_user: User
) -> Dict[str, Any]:
    """
    AI Tool: Cancels a booking, respecting the 24-hour cancellation rule.
    """
    booking = svc_cancel_booking(db=db, booking_id=booking_id, current_user=current_user)
    return {
        "booking_id": booking.id,
        "status": booking.booking_status.value,
        "message": "Booking successfully cancelled"
    }

# Export tool schemas for LLM agent integration (OpenAI/Anthropic tool schemas)
AI_TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "search_rooms",
            "description": "Search available hotel rooms based on organization, hotel, date range, and guests count.",
            "parameters": {
                "type": "object",
                "properties": {
                    "organization_id": {"type": "integer", "description": "Optional organization ID filter."},
                    "hotel_id": {"type": "integer", "description": "Optional hotel ID filter."},
                    "check_in_date": {"type": "string", "description": "Check-in date (YYYY-MM-DD)."},
                    "check_out_date": {"type": "string", "description": "Check-out date (YYYY-MM-DD)."},
                    "number_of_guests": {"type": "integer", "description": "Number of guests staying."}
                },
                "required": ["check_in_date", "check_out_date", "number_of_guests"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "check_availability",
            "description": "Check if a specific room is available for given dates.",
            "parameters": {
                "type": "object",
                "properties": {
                    "room_id": {"type": "integer", "description": "ID of the room."},
                    "check_in_date": {"type": "string", "description": "Check-in date (YYYY-MM-DD)."},
                    "check_out_date": {"type": "string", "description": "Check-out date (YYYY-MM-DD)."}
                },
                "required": ["room_id", "check_in_date", "check_out_date"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "create_booking",
            "description": "Create a room reservation. Business rules and overlapping date checks are enforced.",
            "parameters": {
                "type": "object",
                "properties": {
                    "hotel_id": {"type": "integer", "description": "ID of the hotel."},
                    "room_id": {"type": "integer", "description": "ID of the room."},
                    "check_in_date": {"type": "string", "description": "Check-in date (YYYY-MM-DD)."},
                    "check_out_date": {"type": "string", "description": "Check-out date (YYYY-MM-DD)."},
                    "number_of_guests": {"type": "integer", "description": "Number of guests."}
                },
                "required": ["hotel_id", "room_id", "check_in_date", "check_out_date", "number_of_guests"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_booking",
            "description": "Retrieve booking status and details with multi-tenant permissions.",
            "parameters": {
                "type": "object",
                "properties": {
                    "booking_id": {"type": "integer", "description": "ID of the booking."}
                },
                "required": ["booking_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "cancel_booking",
            "description": "Cancel an existing booking adhering to the 24-hour advance policy.",
            "parameters": {
                "type": "object",
                "properties": {
                    "booking_id": {"type": "integer", "description": "ID of the booking to cancel."}
                },
                "required": ["booking_id"]
            }
        }
    }
]
