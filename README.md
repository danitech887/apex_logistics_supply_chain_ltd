# Apex Logistics & Supply Chain Ltd - Enterprise Monorepo

Enterprise-grade logistics, fleet management, human resources, double-entry finance, and warehouse CRM platform. Built with a **Modular Monolith** architecture in Django Core (PostgreSQL multi-schema namespaces) and a high-performance **React Single Page Application (SPA)** with dedicated departmental portals and a mobile-optimized PWA for Employee Self-Service (ESS).

---

## 1. Monorepo Architecture Overview

```
apex_enterprise/
├── .env.example              # Sample environment variables for local & container execution
├── .gitignore                # Production ignore patterns for Python, JS, build assets
├── docker-compose.yml        # Multi-container orchestration (PostgreSQL 16, Redis 7, Backend, Celery, Frontend)
├── README.md                 # System overview and deployment guide
│
├── backend/                  # Django Core (Modular Monolith with PostgreSQL Schema Namespaces)
└── frontend/                 # React SPA (Vite + Tailwind CSS + TanStack Tables + Modular Portals)
```

### Modular Domain Mapping

| Business Domain | Django App Path | PostgreSQL Namespace Schema | Key Domain Models |
| :--- | :--- | :--- | :--- |
| **Authentication & RBAC** | `apps/authentication/` | `auth_core` | `Tenant`, `User`, `Role`, `UserRole` |
| **HR & Payroll** | `apps/hr_payroll/` | `hr_payroll` | `Employee`, `LeaveRequest`, `PayrollRun`, `Payslip` |
| **Fleet Operations** | `apps/fleet_ops/` | `fleet_ops` | `Vehicle`, `Trip`, `FuelLog` |
| **Finance & Ledger** | `apps/finance/` | `finance` | `Account`, `Invoice`, `JournalEntry`, `JournalLine` |
| **Warehouse & CRM** | `apps/warehouse_crm/` | `warehouse_crm` | `Client`, `WarehouseItem`, `Waybill` |

---

## 2. Technology Stack

### Backend
- **Framework:** Python 3.12+ / Django 5.x + Django REST Framework (DRF)
- **Database:** PostgreSQL 16 (Multi-Schema: `auth_core`, `hr_payroll`, `finance`, `fleet_ops`, `warehouse_crm`)
- **Task Queue & Broker:** Celery 5.x + Redis 7
- **Authentication:** Custom JWT Bearer decoding with Tenant isolation & multi-role evaluation
- **Mathematical Engines:** Statutory PAYE / SHA / NSSF / Housing Levy formulas, balanced double-entry validation (`Σ Debit = Σ Credit`)

### Frontend
- **Framework:** React 18 SPA powered by Vite
- **Styling:** Tailwind CSS with responsive layout grids & department-tailored theming
- **Data Tables:** TanStack Table concepts with client-side & server-side pagination, sorting, and debounced filtering
- **State & HTTP:** React Context (`AuthContext`), custom hooks (`useAuth`, `useDebounce`, `usePayrollCalculations`, `useGeneralLedger`, `useTripTracker`), and Axios interceptors for automatic token refresh

---

## 3. Quick Start with Docker

### Prerequisites
- Docker Engine 24+ & Docker Compose v2+

### Spin up the entire infrastructure:
```bash
cd apex_enterprise
cp .env.example .env
docker compose up --build -d
```

### Service Endpoints:
- **Frontend SPA (Vite Portals):** [http://localhost:5173](http://localhost:5173)
- **Django Core API:** [http://localhost:8000/api/v1/](http://localhost:8000/api/v1/)
- **PostgreSQL 16:** `localhost:5432` (Database: `apex_logistics_db`)
- **Redis 7 Cache / Broker:** `localhost:6379`

---

## 4. Local Development Setup (Without Docker)

### Backend Setup:
```bash
cd apex_enterprise/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements/local.txt

# Run migrations and start server
python manage.py migrate
python manage.py runserver 8000
```

### Frontend Setup:
```bash
cd apex_enterprise/frontend
npm install
npm run dev
```

---

## 5. Security & Multi-Tenancy

Every incoming HTTP request is authenticated via custom JWT Bearer token headers:
1. `common/authentication.py` decodes the token, verifies cryptographic signatures, and extracts `tenant_id` and `user_id`.
2. The user's tenant isolation is strictly enforced across queries via Django ORM managers.
3. `common/permissions.py` evaluates granular departmental permissions (`IsHROfficer`, `IsAccountant`, `IsFleetManager`, `IsDriver`, `IsSuperAdmin`).
