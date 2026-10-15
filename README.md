# Apex Logistics & Supply Chain Ltd - Enterprise Platform

[![Database: Neon PostgreSQL](https://img.shields.io/badge/Database-Neon%20PostgreSQL%2016-00E699?logo=postgresql)](https://neon.tech)
[![Python: 3.12](https://img.shields.io/badge/Python-3.12-3776AB?logo=python)](https://python.org)
[![Django: 5.x](https://img.shields.io/badge/Django-5.x-092E20?logo=django)](https://djangoproject.com)
[![React: 18](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev)
[![Tailwind CSS: 3.4](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwindcss)](https://tailwindcss.com)

Enterprise-grade logistics, telemetry fleet tracking, human resources & statutory payroll, double-entry financial general ledger, and warehouse inventory management system. Built as a high-performance **Modular Monolith** in Django REST Framework with multi-schema PostgreSQL isolation, paired with a modern **React SPA** featuring departmental portals and a mobile PWA for Driver Self-Service (ESS).

---

## 1. System Architecture

```
apex_logistics_supply_chain_ltd/
├── .gitignore                     # Repository-wide ignore definitions
├── README.md                      # Platform overview & development guide
├── schema.sql                     # Enterprise PostgreSQL schema definitions
│
└── apex_enterprise/
    ├── .env.example               # Full environment configuration template
    │
    ├── backend/                   # Django REST Framework Modular Monolith
    │   ├── requirements.txt       # Python dependencies (WhiteNoise, dj-database-url, gunicorn)
    │   ├── manage.py
    │   ├── config/                # Settings (base.py, local.py, production.py), WSGI & ASGI
    │   ├── apps/
    │   │   ├── authentication/    # Multi-tenant RBAC, JWT, Tenant model (Schema: auth_core)
    │   │   ├── hr_payroll/        # Employee records, leaves, Kenyan statutory payroll (Schema: hr_payroll)
    │   │   ├── fleet_ops/         # Vehicle telemetry, dispatch trips, fuel auditing (Schema: fleet_ops)
    │   │   ├── finance/           # Double-entry ledger, accounts, invoicing (Schema: finance)
    │   │   └── warehouse_crm/     # Consignee CRM, inventory, weighbridge waybills (Schema: warehouse_crm)
    │   └── common/                # Shared JWT middleware, custom permissions, exception handlers
    │
    └── frontend/                  # React 18 Single Page Application (SPA)
        ├── package.json
        ├── vite.config.js         # Vite builder with optimized chunk splitting & dev proxy
        └── src/
            ├── api/               # Axios client with auto-refresh interceptors & dynamic endpoints
            ├── context/           # Authentication and multi-portal role state
            ├── portals/           # Modular portal interfaces (Admin, HR, Fleet, Finance, Warehouse, ESS, Client)
            └── App.jsx
```

### Domain Schemas in PostgreSQL

| Business Domain | Django App Path | PostgreSQL Schema Namespace | Primary Domain Models |
| :--- | :--- | :--- | :--- |
| **Identity & Tenancy** | `apps/authentication/` | `auth_core` | `Tenant`, `User`, `Role`, `UserRole` |
| **HR & Statutory Payroll** | `apps/hr_payroll/` | `hr_payroll` | `Employee`, `LeaveRequest`, `PayrollRun`, `Payslip` |
| **Fleet & Operations** | `apps/fleet_ops/` | `fleet_ops` | `Vehicle`, `Trip`, `FuelLog` |
| **Finance & Ledger** | `apps/finance/` | `finance` | `Account`, `Invoice`, `JournalEntry`, `JournalLine` |
| **Warehouse & Logistics CRM** | `apps/warehouse_crm/` | `warehouse_crm` | `CorporateClient`, `InventoryItem`, `Waybill` |

---

## 2. Database Configuration (Neon PostgreSQL)

The application is pre-configured and verified against an external Neon Serverless PostgreSQL database with multi-schema isolation:

- **Automatic Schema Initialization**: The Django startup signal automatically verifies and executes `CREATE SCHEMA IF NOT EXISTS` for all five isolated schemas (`auth_core`, `hr_payroll`, `finance`, `fleet_ops`, `warehouse_crm`) upon connection.
- **PgBouncer Pooler Support**: `dj-database-url` and `config/settings/base.py` dynamically configure connection parameters and set the Postgres `search_path` without conflicting with PgBouncer startup restrictions.

---

## 3. Pre-Seeded Enterprise Demo Accounts

The database includes pre-seeded roles and personnel for testing all portals. All accounts use the default password: **`password123`**.

| Department / Role | Name | Email Address | Access Portal |
| :--- | :--- | :--- | :--- |
| **Super Admin** | Catherine Njeri | `admin@apexlogistics.co.ke` | System Administration & Tenants |
| **Human Resources** | Joseph Omondi | `hr.manager@apexlogistics.co.ke` | HR & Statutory Payroll Engine |
| **Fleet Operations** | Hassan Kipchoge | `fleet.ops@apexlogistics.co.ke` | Fleet Telemetry & Trip Dispatch |
| **Finance & Accounts**| Wanjiku Mwangi, CPA | `finance.lead@apexlogistics.co.ke`| General Ledger & Invoicing |
| **Lead Heavy Driver** | Michael Kamau | `m.kamau@apexlogistics.co.ke` | Driver Self-Service PWA (ESS) |
| **Commercial Driver** | Bernard Mutua | `b.mutua@apexlogistics.co.ke` | Driver Self-Service PWA (ESS) |
| **Warehouse Lead** | Kevin Wafula | `k.wafula@apexlogistics.co.ke` | Inventory & Waybill Weighbridge |
| **Procurement** | Amina Abdi | `procurement@apexlogistics.co.ke` | Supplier Purchase Orders & RFQs |
| **Commercial Sales** | Brian Otieno | `sales.lead@apexlogistics.co.ke` | Freight Quotations & CRM |
| **Client Consignee** | James Kariuki | `unilever.logistics@apexlogistics.co.ke`| Consignee Cargo Tracking |

---

## 4. Local Development Setup

### Backend (Local):
```bash
cd apex_enterprise/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Run migrations and start server
python manage.py migrate
python manage.py seed_enterprise_data
python manage.py runserver 0.0.0.0:8000
```

### Frontend (Local):
```bash
cd apex_enterprise/frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser. All API requests are automatically proxied to Django on port `8000`.

---

## 5. Automated Health Check Verification

The backend exposes a JSON health check endpoint:

- **Endpoint**: `GET /api/v1/health/`
- **Response**:
```json
{
  "status": "healthy",
  "service": "Apex Logistics Enterprise Core API",
  "version": "1.0.0",
  "domains": [
    "auth_core",
    "hr_payroll",
    "fleet_ops",
    "finance",
    "warehouse_crm"
  ]
}
```

---

## 6. License & Corporate Rights

&copy; 2026 Apex Logistics & Supply Chain Ltd. All Rights Reserved. Proprietary Enterprise ERP Platform.
