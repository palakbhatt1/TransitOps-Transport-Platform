# TransitOps 🚀

Welcome to the **TransitOps** project repository! This project is being built by a 4-person team in parallel over an 8-hour sprint.

## 🏗️ Architecture

- **Frontend**: React + Vite (JSX)
- **Backend**: Python + FastAPI
- **Database**: PostgreSQL (Docker)
- **Auth**: JWT (JSON Web Tokens)

---

## 🚦 Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (v18+)
- [Python](https://www.python.org/) (v3.9+)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for the local database)
- Git

---

### 1. Start the Database 🗄️

We use Docker to run a local PostgreSQL instance so nobody has to install Postgres manually.

```bash
docker compose up -d
```
*Note: This will spin up a Postgres 15 database on port 5432. Credentials are in the `docker-compose.yml` file.*

---

### 2. Set Up the Backend (FastAPI) 🐍

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   - **Windows**:
     ```bash
     python -m venv venv
     venv\Scripts\activate
     ```
   - **Mac/Linux**:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```
3. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the development server:
   ```bash
   uvicorn main:app --reload
   ```
*The API will be available at `http://localhost:8000`. You can view the automatic Swagger UI docs at `http://localhost:8000/docs`.*

---

### 3. Set Up the Frontend (React + Vite) ⚛️

1. Open a **new terminal tab** and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install the node modules:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
*The frontend will be available at the local URL specified in your terminal (usually `http://localhost:5173`).*

---

## 👥 Team Roles & Branching Strategy

We are working in parallel! Please ensure you create your branch off `main` and work in your designated areas.

| Dev | Role / Focus | Branch Name |
|-----|--------------|-------------|
| **Dev 1 (Platform)** | DB schema, Auth/RBAC, Vehicle & Driver APIs | `feat/auth-fleet` |
| **Dev 2 (Operations)** | Trip engine, business rules, maintenance APIs | `feat/trips-maintenance` |
| **Dev 3 (Experience)** | App shell, routing, UI, mocked API layer | `feat/frontend-shell` |
| **Dev 4 (Insights)** | Dashboard KPIs, fuel/expenses, CSV exports | `feat/dashboard-finance` |

> **Shared Contracts:** Both the frontend (`frontend/src/api/contracts.js`) and backend (`backend/app/schemas/contracts.py`) have matching enumerations and data models pre-populated based on our kickoff meeting. **Code against these contracts so nobody is blocked!**

## 🛑 Git Rules for the Sprint

1. **Commit often**: Aim for a commit every 30-45 minutes. Use descriptive messages (e.g., `feat(vehicles): add registration uniqueness check`).
2. **Never push directly to `main`**: Always use your feature branch and collaborate on merges.
3. **Integration Hour (Hour 5)**: We will pause parallel development to merge branches, wire up live APIs to the frontend, and squash bugs together. No one sits idle!
