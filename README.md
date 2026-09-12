# LuxeStay - Hotel Booking Management System

An enterprise-grade, modular, **AI-ready Hotel Booking Management System** built with Python (FastAPI), React, PostgreSQL/SQLAlchemy, JWT + bcrypt authentication, and Pydantic validation.

---

## 🏛️ Hierarchy & Architecture

```text
Platform
  └── Organization (Hospitality Chain)
        └── Hotel (Property)
              └── Room (Inventory item)
                    └── Booking (Reservation)
```

Business logic is strictly decoupled into a dedicated Service Layer (`backend/app/services/`), enabling both the REST API routers and autonomous AI agents (`backend/app/ai_tools/`) to invoke identical operations with enforced business rules, transactions, and tenant isolation.

---

## 👥 Roles & Authorization Boundaries

1. **Product Admin**: Global platform level. Manages organizations and platform ecosystem.
2. **Organization Admin**: Manages their organization, hotels, rooms, bookings, and receptionist assignments.
3. **Receptionist**: Restricted strictly to assigned hotels. Views rooms, checks availability, manages bookings, and handles staff cancellations.
4. **Customer**: Searches hotels and rooms, verifies real-time availability, creates atomic reservations, and cancels up to 24 hours prior to check-in.

---

## ⚙️ Quick Start Guide

### 1. Backend (FastAPI)

```bash
cd backend
# Activate virtual environment
..\venv\Scripts\activate

# Run FastAPI server with auto-reload (defaults to port 8000)
uvicorn app.main:app --reload --port 8000
```

* Swagger API Documentation: [http://localhost:8000/docs](http://localhost:8000/docs)
* AI Tool Schemas: [http://localhost:8000/api/ai/tools](http://localhost:8000/api/ai/tools)

### 2. Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

* Web App: [http://localhost:5173](http://localhost:5173)

---

## 🔑 Pre-Seeded Demo Credentials

| Role | Email | Password | Scope |
| :--- | :--- | :--- | :--- |
| **Product Admin** | `admin@platform.com` | `admin123` | Platform-wide |
| **Org Admin** | `orgadmin@grandhotels.com` | `admin123` | Grand Heritage Hospitality |
| **Receptionist (Mumbai)** | `reception@grandhotels.com` | `staff123` | Grand Heritage Palace |
| **Customer** | `customer@example.com` | `customer123` | Personal bookings |

---

## 🤖 AI-Ready Service Functions

All core business operations are exposed via `app.services` and `app.ai_tools`:
* `search_rooms(organization_id, hotel_id, check_in_date, check_out_date, number_of_guests)`
* `check_availability(room_id, check_in_date, check_out_date)`
* `create_booking(customer_id, organization_id, hotel_id, room_id, check_in_date, check_out_date, number_of_guests)`
* `get_booking(booking_id, current_user)`
* `cancel_booking(booking_id, current_user)`

Simulate live agent executions via the frontend **"AI Booking Assistant"** modal or `POST /api/ai/execute`.

---

## 🧪 Running Automated Tests

```bash
cd backend
..\venv\Scripts\python -m pytest
```
