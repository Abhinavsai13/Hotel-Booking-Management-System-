# Hotel Booking Management System - Codebase & Architecture Overview

Comprehensive documentation of the full-stack architecture, hierarchy, data models, services, APIs, and frontend pages implemented across the repository.

---

## 1. System Hierarchy & Multi-Organization Architecture

```text
Platform
  └── Organization (e.g. Grand Heritage Hospitality)
        └── Hotel (e.g. Grand Heritage Palace, Grand Oceanfront Resort)
              ├── Address & Contact Phone Number
              ├── Receptionist Assignments (Data Isolation)
              └── Room (Inventory: 101, 102, 201, 301, 401)
                    └── Booking (Atomic reservation, non-overlapping constraints)
```

### Roles & Data Isolation Rules
1. **Admin (`ORGANIZATION_ADMIN`, `PRODUCT_ADMIN`)**:
   - Access the **Exclusive Admin Console** (`/admin-console`).
   - Create and manage Organizations and Hotel properties (with name, physical address, contact phone number, and official email).
   - Manage rooms, set availability status (`ACTIVE`, `MAINTENANCE`, `INACTIVE`), and assign receptionists to hotels.
   - Access only authorized organizations and hotels (an Organization Admin cannot access another organization's data).

2. **Receptionist (`RECEPTIONIST`)**:
   - Access assigned hotels strictly based on the `receptionist_hotels` assignment table.
   - View and manage rooms and toggle availability.
   - View bookings ledger, search/filter customer bookings, and process staff cancellations.

3. **Customer (`CUSTOMER`)**:
   - Browse organizations and hotels with multiple distinct room options.
   - Search real-time availability by check-in/check-out dates and guest count.
   - Select rooms via an interactive in-modal dropdown and receive reservation confirmation.
   - Manage their own bookings in the **Customer Dashboard** (Upcoming, Completed, Cancelled) and cancel up to 24h prior to check-in.

---

## 2. Core Service Layer (`backend/app/services/`)

All domain logic is contained in reusable service functions callable by both REST endpoints and autonomous agents:

- `search_rooms(db, organization_id, hotel_id, check_in_date, check_out_date, number_of_guests)`
- `check_availability(db, room_id, check_in_date, check_out_date)`
- `create_booking(db, customer_id, organization_id, hotel_id, room_id, check_in_date, check_out_date, number_of_guests)`
- `get_booking(db, booking_id, current_user)`
- `cancel_booking(db, booking_id, current_user)`
- `list_bookings(db, current_user, hotel_id, status_filter, skip, limit)`
- `create_organization(db, org_data)`
- `create_hotel(db, hotel_data, org_id)`
- `assign_receptionist_to_hotel(db, hotel_id, receptionist_id)`

---

## 3. Database Schema & Models (`backend/app/models/`)

- **`User`**: `id`, `name`, `email`, `password_hash`, `role` (`PRODUCT_ADMIN`, `ORGANIZATION_ADMIN`, `RECEPTIONIST`, `CUSTOMER`), `organization_id`, `created_at`.
- **`Organization`**: `id`, `name`, `status` (`ACTIVE`, `INACTIVE`), `created_at`.
- **`Hotel`**: `id`, `organization_id`, `name`, `address`, `contact_number`, `email`, `status` (`ACTIVE`, `INACTIVE`), `created_at`.
- **`ReceptionistHotel`**: `id`, `receptionist_id`, `hotel_id`.
- **`Room`**: `id`, `hotel_id`, `room_number`, `room_type`, `capacity`, `price_per_night`, `availability_status` (`ACTIVE`, `MAINTENANCE`, `INACTIVE`), `description`, `amenities`.
- **`Booking`**: `id`, `customer_id`, `organization_id`, `hotel_id`, `room_id`, `check_in_date`, `check_out_date`, `number_of_guests`, `booking_date`, `total_amount`, `booking_status` (`CONFIRMED`, `CANCELLED`, `COMPLETED`).

---

## 4. Frontend Structure (`frontend/src/`)

- **`context/`**:
  - `AuthContext.jsx`: Authentication session, JWT storage, user roles.
  - `ThemeContext.jsx`: Dark mode toggle with `localStorage` persistence.
- **`components/`**:
  - `Navbar.jsx`: Clean navigation with role badge, Dark Mode toggle, links to Browse, Concierge, My Bookings, Staff Operations, and Admin Console.
- **`pages/`**:
  - `CustomerBrowsePage.jsx`: Hotel-centric room browser with real-time date search and modal room dropdown selector.
  - `CustomerDashboard.jsx`: Categorized bookings (Upcoming, Completed, Cancelled), details viewer, and cancellation button.
  - `StaffDashboard.jsx`: Search & filter customer bookings by ID or status, view booking details, toggle room availability status, and add new rooms.
  - `AdminConsolePage.jsx`: Exclusive admin page to create organizations, add hotels with address & phone number, and assign receptionists.
  - `AssistantChatPage.jsx`: Chatbot concierge interface where customers can converse and describe their booking needs.
  - `LoginPage.jsx` & `RegisterPage.jsx`: Authentication with instant role demo buttons.

---

## 5. Pre-Seeded Demo Logins

| Role | Email | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **Admin** | `orgadmin@grandhotels.com` | `admin123` | Grand Heritage Hospitality & Properties |
| **Platform Admin** | `admin@platform.com` | `admin123` | Platform-wide |
| **Receptionist** | `reception@grandhotels.com` | `staff123` | Grand Heritage Palace (Mumbai) |
| **Customer** | `customer@example.com` | `customer123` | Personal reservations |
