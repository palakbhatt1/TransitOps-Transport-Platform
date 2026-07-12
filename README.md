<p align="center">
  <img src="frontend/src/assets/TransitOps_Poster.png" alt="TransitOps — Smart Transport Operations Platform" width="100%" />
</p>



<a href="https://drive.google.com/file/d/1VdbhKgCgSgCLe_acdXf5aGTFt7uOpwFP/view?usp=drive_link">
    <img src="https://img.shields.io/badge/Demo-Video-blue?style=flat-square&logo=google-drive&logoColor=white" alt="Demo Video" />
</a>


## Overview

TransitOps is a full-stack fleet operations platform built for transport teams that need more than spreadsheets. It provides a single dashboard to register vehicles and drivers, plan and dispatch trips, track maintenance, log fuel and expenses, and monitor KPIs — all backed by a REST API with automatic validation at every critical step.

The platform is designed around real operational workflows: when a trip is dispatched, vehicle and driver statuses update atomically; when maintenance opens, the vehicle is blocked from dispatch until service is closed; and when trips complete, resources return to an available state for the next assignment.

**Built for every role:**

- **Fleet Manager** — oversee assets, maintenance, and fleet utilization
- **Driver** — create and track trips with validated dispatch
- **Safety Officer** — monitor license validity, safety scores, and compliance
- **Financial Analyst** — review fuel, maintenance, and operational costs with ROI reporting

---

## Key Features

| Module | Capabilities |
|--------|-------------|
| **Dashboard** | Live KPIs — active/available vehicles, maintenance count, active & pending trips, drivers on duty, fleet utilization % |
| **Fleet Management** | Register vehicles, track status, odometer, capacity, region, and lifecycle |
| **Driver Management** | Manage profiles, licenses, safety scores, and availability |
| **Trip Management** | Create draft trips, dispatch with validation, complete or cancel with status sync |
| **Maintenance** | Open/close service logs; vehicles move to `in_shop` and back to `available` |
| **Fuel & Expenses** | Log fuel fills and operational expenses per vehicle |
| **Analytics & Reports** | Fuel efficiency, ROI analysis, and CSV export endpoints |
| **Auth & Roles** | JWT-based login with role-aware demo profiles |

---

## Business Rules & Validation

TransitOps enforces operational rules at the API layer. Invalid actions return structured error responses with machine-readable codes.

### Trip dispatch rules

| Rule | Error Code | Description |
|------|------------|-------------|
| Cargo capacity | `CARGO_EXCEEDS_CAPACITY` | Cargo weight must not exceed vehicle `max_load_kg` |
| Driver license | `DRIVER_LICENSE_EXPIRED` | Driver license must be valid (not past expiry date) |
| Driver availability | `DRIVER_UNAVAILABLE` | Driver must be in `available` status (not suspended/off-duty) |
| Vehicle availability | `VEHICLE_UNAVAILABLE` | Vehicle must be in `available` status (not in shop or on trip) |
| Double assignment | `VEHICLE_ALREADY_ASSIGNED` / `DRIVER_ALREADY_ASSIGNED` | No duplicate active dispatches |
| Trip status | `INVALID_TRIP_STATUS` | Only `draft` trips can be dispatched |

### Input validation

| Field | Error Code | Rule |
|-------|------------|------|
| Origin / destination | `INVALID_ORIGIN`, `INVALID_DESTINATION` | Must be non-empty |
| Cargo weight | `INVALID_CARGO_WEIGHT` | Must be greater than 0 |
| Maintenance cost | `INVALID_COST` | Must not be negative |

### Example workflow

<p align="center">
  <img src="frontend/src/assets/example_workflow.png" alt="TransitOps Example Workflow — Business Rules in Action" width="100%" />
</p>

Business rules are covered by automated tests in `backend/tests/test_operations.py`.

---

## System Architecture

<p align="center">
  <img src="frontend/src/assets/system_architecture.png" alt="TransitOps System Architecture" width="100%" />
</p>

**Request flow:** The React frontend calls REST endpoints under `/api/*`. FastAPI routers handle CRUD and business logic; SQLAlchemy persists entities. On startup, the backend auto-creates tables and seeds demo data if the database is empty.

**Shared contracts:** Frontend (`frontend/src/api/contracts.js`) and backend (`backend/app/schemas/contracts.py`) share matching enums and data models to keep the API surface consistent.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, Vite 8, React Router, Tailwind CSS, Axios, Lucide icons |
| **Backend** | Python 3.9+, FastAPI, Uvicorn, Pydantic, SQLAlchemy |
| **Database** | SQLite (default) or PostgreSQL 15 (Docker) |
| **Auth** | JWT tokens, role-based demo profiles |
| **Testing** | pytest, httpx, FastAPI TestClient |
| **Tooling** | Docker Compose, oxlint |

---

## Project Structure

```
TransitOps-Transport-Platform/
├── backend/
│   ├── main.py                 # FastAPI app entry, CORS, router registration, seed
│   ├── requirements.txt
│   ├── app/
│   │   ├── core/config.py      # Environment & database settings
│   │   ├── database/           # SQLAlchemy engine & session
│   │   ├── models/models.py    # ORM entities (vehicles, drivers, trips, etc.)
│   │   ├── schemas/contracts.py# Pydantic models & enums (shared API contract)
│   │   ├── routers/            # API route handlers
│   │   │   ├── auth.py
│   │   │   ├── vehicles.py
│   │   │   ├── drivers.py
│   │   │   ├── trips.py        # Trip engine + business rules
│   │   │   ├── maintenance.py
│   │   │   ├── finance.py
│   │   │   ├── dashboard.py
│   │   │   └── reports.py
│   │   └── mock_db.py          # Seed data
│   └── tests/
│       └── test_operations.py  # Business rule integration tests
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.js       # Axios API client
│   │   │   └── contracts.js    # Shared enums & types
│   │   ├── components/         # Reusable UI (DataTable, Modal, Toast, etc.)
│   │   ├── layouts/            # App shell & sidebar
│   │   ├── pages/              # Route pages (Dashboard, Trips, Fleet, etc.)
│   │   └── assets/             # Logo, poster, illustrations
│   ├── package.json
│   └── vite.config.js
├── docker-compose.yml          # PostgreSQL service (optional)
└── README.md
```

---

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Python](https://www.python.org/) v3.9+
- [Git](https://git-scm.com/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) *(optional — for PostgreSQL)*

### Clone Repository

```bash
git clone https://github.com/palakbhatt1/TransitOps-Transport-Platform.git
cd TransitOps-Transport-Platform
```

### Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
```

**Database options:**

- **SQLite (default)** — no extra setup. A `transitops.db` file is created automatically on first run.
- **PostgreSQL** — start Docker and point the backend at Postgres:

```bash
# From project root
docker compose up -d
```

Create `backend/.env`:

```env
DATABASE_URL=postgresql://transit_user:transit_password@localhost:5432/transitops
```

Start the API server:

```bash
uvicorn main:app --reload
```

### Frontend Setup

Open a **new terminal**:

```bash
cd frontend
npm install
npm run dev
```

### Running the Application

1. Start the backend (`uvicorn main:app --reload` in `backend/`)
2. Start the frontend (`npm run dev` in `frontend/`)
3. Open the app in your browser and log in

**Run backend tests:**

```bash
cd backend
pytest
```

---

## API Documentation

Once the backend is running, use the interactive Swagger UI at `/docs` (e.g. `http://127.0.0.1:8000/docs`).

| Tag | Base Path | Description |
|-----|-----------|-------------|
| Auth | `/api/auth` | Login and session |
| Vehicles | `/api/vehicles` | Fleet CRUD |
| Drivers | `/api/drivers` | Driver CRUD |
| Trips | `/api/trips` | Trip lifecycle (create, dispatch, complete, cancel) |
| Maintenance | `/api/maintenance` | Service logs |
| Finance | `/api/finance` | Fuel logs and expenses |
| Dashboard | `/api/dashboard` | Live KPIs and DB status |
| Reports | `/api/reports` | Efficiency, ROI, CSV exports |
