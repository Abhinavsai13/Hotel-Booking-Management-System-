from datetime import date, datetime, timedelta
from app.database import SessionLocal, engine, Base
from app.models.user import User, UserRole
from app.models.organization import Organization, OrgStatus
from app.models.hotel import Hotel, HotelStatus, ReceptionistHotel
from app.models.room import Room, RoomAvailabilityStatus
from app.models.booking import Booking, BookingStatus
from app.dependencies.auth import get_password_hash

def seed_database():
    """Initializes the database schema and seeds demo roles and hotels with required initial room data."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if already seeded
        if db.query(User).filter(User.email == "admin@platform.com").first():
            print("Database already seeded. Skipping initial seeding.")
            return

        print("Seeding database with required initial data...")

        # 1. Product Admin
        product_admin = User(
            name="Platform SuperAdmin",
            email="admin@platform.com",
            password_hash=get_password_hash("admin123"),
            role=UserRole.PRODUCT_ADMIN
        )
        db.add(product_admin)
        db.commit()
        db.refresh(product_admin)

        # 2. Organization: Grand Heritage Hospitality
        org = Organization(
            name="Grand Heritage Hospitality",
            status=OrgStatus.ACTIVE
        )
        db.add(org)
        db.commit()
        db.refresh(org)

        # 3. Organization Admin
        org_admin = User(
            name="Alexander Vance (Org Admin)",
            email="orgadmin@grandhotels.com",
            password_hash=get_password_hash("admin123"),
            role=UserRole.ORGANIZATION_ADMIN,
            organization_id=org.id
        )
        db.add(org_admin)

        # 4. Receptionists
        receptionist1 = User(
            name="Sarah Jenkins (Receptionist)",
            email="reception@grandhotels.com",
            password_hash=get_password_hash("staff123"),
            role=UserRole.RECEPTIONIST,
            organization_id=org.id
        )
        receptionist2 = User(
            name="Michael Chang (Receptionist Goa)",
            email="michael@grandhotels.com",
            password_hash=get_password_hash("staff123"),
            role=UserRole.RECEPTIONIST,
            organization_id=org.id
        )
        db.add_all([receptionist1, receptionist2])

        # 5. Customers
        customer1 = User(
            name="John Doe",
            email="customer@example.com",
            password_hash=get_password_hash("customer123"),
            role=UserRole.CUSTOMER
        )
        customer2 = User(
            name="Elena Rostova",
            email="elena@example.com",
            password_hash=get_password_hash("customer123"),
            role=UserRole.CUSTOMER
        )
        db.add_all([customer1, customer2])
        db.commit()
        db.refresh(org_admin)
        db.refresh(receptionist1)
        db.refresh(receptionist2)
        db.refresh(customer1)

        # 6. Hotels
        hotel_mumbai = Hotel(
            organization_id=org.id,
            name="Grand Heritage Palace",
            address="Apollo Bunder, Colaba, Mumbai, Maharashtra 400001",
            contact_number="+91 22 6665 3366",
            email="palace.mumbai@grandhotels.com",
            status=HotelStatus.ACTIVE
        )
        hotel_goa = Hotel(
            organization_id=org.id,
            name="Grand Oceanfront Resort",
            address="Candolim Beach Road, Candolim, Goa 403515",
            contact_number="+91 832 664 5858",
            email="resort.goa@grandhotels.com",
            status=HotelStatus.ACTIVE
        )
        db.add_all([hotel_mumbai, hotel_goa])
        db.commit()
        db.refresh(hotel_mumbai)
        db.refresh(hotel_goa)

        # 7. Receptionist Hotel Assignments
        assignment1 = ReceptionistHotel(receptionist_id=receptionist1.id, hotel_id=hotel_mumbai.id)
        assignment2 = ReceptionistHotel(receptionist_id=receptionist2.id, hotel_id=hotel_goa.id)
        db.add_all([assignment1, assignment2])

        # 8. Seed Exact Specified Room Types & Physical Numbers:
        # | Room Type        | Capacity | Price/Night | Features                                |
        # | Deluxe King      |        2 |      ₹8,500 | King bed, city view, work desk          |
        # | Deluxe Twin      |        2 |      ₹8,500 | Two twin beds, city view, work desk     |
        # | Premier Sea View |        3 |     ₹12,500 | King bed, sea view, sofa chair          |
        # | Executive Suite  |        3 |     ₹18,000 | Bedroom, living area, sea view          |
        # | Family Suite     |        4 |     ₹22,000 | Two bedrooms, living area, dining table |

        room_catalog = [
            {"num": "101", "type": "Deluxe King", "cap": 2, "price": 8500.0, "feat": "King bed, city view, work desk, high-speed Wi-Fi, marble bath", "desc": "Refined urban luxury designed for comfort and productivity."},
            {"num": "102", "type": "Deluxe Twin", "cap": 2, "price": 8500.0, "feat": "Two twin beds, city view, work desk, rainfall shower, smart TV", "desc": "Spacious twin bed setup perfect for colleagues and friends."},
            {"num": "201", "type": "Premier Sea View", "cap": 3, "price": 12500.0, "feat": "King bed, sea view, sofa chair, private balcony, espresso machine", "desc": "Breathtaking ocean panoramas with serene balcony seating."},
            {"num": "301", "type": "Executive Suite", "cap": 3, "price": 18000.0, "feat": "Bedroom, living area, sea view, lounge access, soaking tub", "desc": "Exclusive top-tier suite with separate living and sleeping chambers."},
            {"num": "401", "type": "Family Suite", "cap": 4, "price": 22000.0, "feat": "Two bedrooms, living area, dining table, kitchenette, 2 baths", "desc": "Grand layout accommodating families in complete lavishness."},
        ]

        seeded_rooms = []
        for h in [hotel_mumbai, hotel_goa]:
            for item in room_catalog:
                room_num = f"{h.name[:3].upper()}-{item['num']}" if h == hotel_goa else item['num']
                room = Room(
                    hotel_id=h.id,
                    room_number=room_num,
                    room_type=item["type"],
                    capacity=item["cap"],
                    price_per_night=item["price"],
                    availability_status=RoomAvailabilityStatus.ACTIVE,
                    description=item["desc"],
                    amenities=item["feat"]
                )
                db.add(room)
                seeded_rooms.append(room)

        db.commit()

        # 9. Create a demo booking to test overlap and cancellation rules
        # Booking on 101 for Sept 20 to Sept 25, 2026
        sample_room = db.query(Room).filter(Room.hotel_id == hotel_mumbai.id, Room.room_number == "101").first()
        if sample_room:
            sample_booking = Booking(
                customer_id=customer1.id,
                organization_id=org.id,
                hotel_id=hotel_mumbai.id,
                room_id=sample_room.id,
                check_in_date=date(2026, 9, 20),
                check_out_date=date(2026, 9, 25),
                number_of_guests=2,
                booking_date=datetime.utcnow() - timedelta(days=2),
                total_amount=5 * 8500.0,
                booking_status=BookingStatus.CONFIRMED
            )
            db.add(sample_booking)
            db.commit()

        print("Database seeded successfully!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
