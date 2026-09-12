import pytest
from datetime import date, datetime, timedelta
from fastapi import HTTPException
from app.database import SessionLocal, engine, Base
from app.models.user import User, UserRole
from app.models.organization import Organization, OrgStatus
from app.models.hotel import Hotel, HotelStatus, ReceptionistHotel
from app.models.room import Room, RoomAvailabilityStatus
from app.models.booking import Booking, BookingStatus
from app.dependencies.auth import get_password_hash
from app.services.room_service import search_rooms, check_availability
from app.services.booking_service import create_booking, get_booking, cancel_booking, list_bookings
from app.ai_tools.hotel_agent_tools import (
    search_rooms_tool,
    check_availability_tool,
    create_booking_tool,
    cancel_booking_tool
)

@pytest.fixture(scope="function")
def db():
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from app.seed import seed_database
    test_engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=test_engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
    session = TestingSessionLocal()
    
    # Run seeding in test db
    from app import seed
    orig_engine = seed.engine
    orig_session = seed.SessionLocal
    seed.engine = test_engine
    seed.SessionLocal = TestingSessionLocal
    seed.seed_database()
    seed.engine = orig_engine
    seed.SessionLocal = orig_session

    yield session
    session.close()


def test_models_and_seed_data(db):
    org = db.query(Organization).first()
    assert org is not None
    assert org.name == "Grand Heritage Hospitality"

    hotels = db.query(Hotel).all()
    assert len(hotels) >= 2

    # Verify rooms
    rooms = db.query(Room).all()
    assert len(rooms) >= 10
    types = set([r.room_type for r in rooms])
    assert "Deluxe King" in types
    assert "Deluxe Twin" in types
    assert "Premier Sea View" in types
    assert "Executive Suite" in types
    assert "Family Suite" in types

def test_room_search(db):
    hotel = db.query(Hotel).first()
    # Search for guests = 2
    results = search_rooms(db, hotel_id=hotel.id, number_of_guests=2)
    assert len(results) > 0
    for r in results:
        assert r.capacity >= 2

def test_availability_boundary_conditions(db):
    # Sept 20 -> Sept 25 has a seeded booking for room 101 at Mumbai Palace
    hotel_mumbai = db.query(Hotel).filter(Hotel.name == "Grand Heritage Palace").first()
    room_101 = db.query(Room).filter(Room.hotel_id == hotel_mumbai.id, Room.room_number == "101").first()

    # Test exact overlap: Sept 21 to Sept 24 -> NOT AVAILABLE
    avail, reason, _ = check_availability(db, room_101.id, date(2026, 9, 21), date(2026, 9, 24))
    assert avail is False
    assert "already booked" in reason

    # Test partial overlap: Sept 18 to Sept 22 -> NOT AVAILABLE
    avail, reason, _ = check_availability(db, room_101.id, date(2026, 9, 18), date(2026, 9, 22))
    assert avail is False

    # Test boundary condition: checkout date Sept 25 is checkout of existing booking.
    # Allowed: Sept 25 -> Sept 28 -> AVAILABLE
    avail, reason, _ = check_availability(db, room_101.id, date(2026, 9, 25), date(2026, 9, 28))
    assert avail is True

    # Test boundary condition before: Sept 15 -> Sept 20 -> AVAILABLE
    avail, reason, _ = check_availability(db, room_101.id, date(2026, 9, 15), date(2026, 9, 20))
    assert avail is True

def test_booking_conflict_409(db):
    hotel_mumbai = db.query(Hotel).filter(Hotel.name == "Grand Heritage Palace").first()
    room_101 = db.query(Room).filter(Room.hotel_id == hotel_mumbai.id, Room.room_number == "101").first()
    customer = db.query(User).filter(User.role == UserRole.CUSTOMER).first()

    # Try booking overlapping date: Sept 22 to Sept 27
    with pytest.raises(HTTPException) as exc_info:
        create_booking(
            db=db,
            customer_id=customer.id,
            organization_id=hotel_mumbai.organization_id,
            hotel_id=hotel_mumbai.id,
            room_id=room_101.id,
            check_in_date=date(2026, 9, 22),
            check_out_date=date(2026, 9, 27),
            number_of_guests=2
        )
    assert exc_info.value.status_code == 409

def test_booking_successful_creation(db):
    hotel_mumbai = db.query(Hotel).filter(Hotel.name == "Grand Heritage Palace").first()
    room_102 = db.query(Room).filter(Room.hotel_id == hotel_mumbai.id, Room.room_number == "102").first()
    customer = db.query(User).filter(User.role == UserRole.CUSTOMER).first()

    # Book Room 102 for Oct 1 to Oct 4 (3 nights, 8500 * 3 = 25500)
    booking = create_booking(
        db=db,
        customer_id=customer.id,
        organization_id=hotel_mumbai.organization_id,
        hotel_id=hotel_mumbai.id,
        room_id=room_102.id,
        check_in_date=date(2026, 10, 1),
        check_out_date=date(2026, 10, 4),
        number_of_guests=2
    )
    assert booking.id is not None
    assert booking.total_amount == 25500.0
    assert booking.booking_status == BookingStatus.CONFIRMED

def test_cancellation_policy(db):
    customer = db.query(User).filter(User.email == "customer@example.com").first()
    hotel_mumbai = db.query(Hotel).filter(Hotel.name == "Grand Heritage Palace").first()
    room_201 = db.query(Room).filter(Room.hotel_id == hotel_mumbai.id, Room.room_number == "201").first()

    # 1. Booking far in future (allowed to cancel directly by customer)
    future_booking = create_booking(
        db=db,
        customer_id=customer.id,
        organization_id=hotel_mumbai.organization_id,
        hotel_id=hotel_mumbai.id,
        room_id=room_201.id,
        check_in_date=date(2027, 1, 10),
        check_out_date=date(2027, 1, 15),
        number_of_guests=2
    )
    cancelled = cancel_booking(db, future_booking.id, current_user=customer)
    assert cancelled.booking_status == BookingStatus.CANCELLED

    # 2. Booking that has check-in today or past (less than 24h away)
    # Direct customer cancellation should be rejected with 400
    near_booking = Booking(
        customer_id=customer.id,
        organization_id=hotel_mumbai.organization_id,
        hotel_id=hotel_mumbai.id,
        room_id=room_201.id,
        check_in_date=date.today(),
        check_out_date=date.today() + timedelta(days=2),
        number_of_guests=2,
        booking_date=datetime.utcnow(),
        total_amount=25000.0,
        booking_status=BookingStatus.CONFIRMED
    )
    db.add(near_booking)
    db.commit()
    db.refresh(near_booking)

    with pytest.raises(HTTPException) as exc_info:
        cancel_booking(db, near_booking.id, current_user=customer)
    assert exc_info.value.status_code == 400
    assert "24 hours" in exc_info.value.detail

    # But staff (Org Admin or Receptionist) CAN cancel/override
    org_admin = db.query(User).filter(User.role == UserRole.ORGANIZATION_ADMIN).first()
    staff_cancelled = cancel_booking(db, near_booking.id, current_user=org_admin)
    assert staff_cancelled.booking_status == BookingStatus.CANCELLED

def test_data_isolation(db):
    customer1 = db.query(User).filter(User.email == "customer@example.com").first()
    customer2 = db.query(User).filter(User.email == "elena@example.com").first()
    hotel_mumbai = db.query(Hotel).filter(Hotel.name == "Grand Heritage Palace").first()
    room = db.query(Room).filter(Room.hotel_id == hotel_mumbai.id, Room.room_number == "301").first()

    booking = create_booking(
        db=db,
        customer_id=customer1.id,
        organization_id=hotel_mumbai.organization_id,
        hotel_id=hotel_mumbai.id,
        room_id=room.id,
        check_in_date=date(2027, 3, 1),
        check_out_date=date(2027, 3, 5),
        number_of_guests=2
    )

    # Customer 2 attempting to view Customer 1's booking must fail with 403
    with pytest.raises(HTTPException) as exc_info:
        get_booking(db, booking.id, current_user=customer2)
    assert exc_info.value.status_code == 403

    # Customer 1 can view it
    fetched = get_booking(db, booking.id, current_user=customer1)
    assert fetched.id == booking.id

def test_ai_tools_layer(db):
    hotel = db.query(Hotel).first()
    # Test search_rooms_tool
    found = search_rooms_tool(
        db=db,
        hotel_id=hotel.id,
        check_in_date="2027-05-01",
        check_out_date="2027-05-05",
        number_of_guests=2
    )
    assert isinstance(found, list)
    assert len(found) > 0

    # Test check_availability_tool
    first_room = found[0]
    res = check_availability_tool(
        db=db,
        room_id=first_room["id"],
        check_in_date="2027-05-01",
        check_out_date="2027-05-05"
    )
    assert res["is_available"] is True
    assert res["nights"] == 4
    assert res["total_amount"] == 4 * first_room["price_per_night"]
