# Apex Logistics & Supply Chain Ltd - Enterprise Cloud Platform

[![Frontend: Vercel](https://img.shields.io/badge/Frontend-Vercel-black?logo=vercel)](https://vercel.com)
[![Backend: Render](https://img.shields.io/badge/Backend-Render-46E3B7?logo=render)](https://render.com)
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
├── render.yaml                    # Render Infrastructure as Code (Blueprint)
├── vercel.json                    # Root Vercel SPA routing and monorepo build rules
├── .gitignore                     # Repository-wide ignore definitions
├── README.md                      # Production deployment & operations guide
├── schema.sql                     # Enterprise PostgreSQL schema definitions
│
└── apex_enterprise/
    ├── .env.example               # Full environment configuration template
    │
    ├── backend/                   # Django REST Framework Modular Monolith
    │   ├── build.sh               # Render build execution script (pip, migrate, collectstatic, seed)
    │   ├── requirements.txt       # Production Python dependencies (WhiteNoise, dj-database-url, gunicorn)
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
        ├── vercel.json            # Vercel SPA routing fallback (/index.html)
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

## 2. Production Deployment Guide

### A. Database: Neon Serverless PostgreSQL

The application is pre-configured and fully verified against Neon Serverless PostgreSQL with SSL and connection pooling.

- **Connection URL**:
  ```text
  postgresql://neondb_owner:npg_rZ14vDQOJpEy@ep-young-frog-b4395nwt-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
  ```
- **Automatic Schema Initialization**: The Django startup signal automatically verifies and executes `CREATE SCHEMA IF NOT EXISTS` for all five isolated schemas (`auth_core`, `hr_payroll`, `finance`, `fleet_ops`, `warehouse_crm`) upon connection.
- **PgBouncer Pooler Support**: `dj-database-url` and `config/settings/base.py` automatically detect pooler endpoints and bypass startup parameter restrictions while dynamically setting the Postgres `search_path`.

---

### B. Backend Deployment: Render (Web Service)

#### Method 1: 1-Click Blueprint (Recommended)
1. In your [Render Dashboard](https://dashboard.render.com), click **New +** &rarr; **Blueprint**.
2. Connect your GitHub repository: `danitech887/apex_logistics_supply_chain_ltd`.
3. Render will automatically read [`render.yaml`](render.yaml) and pre-fill all settings, commands, and environment variables.
4. Click **Apply**.

#### Method 2: Manual Web Service Setup
1. In the Render Dashboard, click **New +** &rarr; **Web Service**.
2. Select your repository: `danitech887/apex_logistics_supply_chain_ltd`.
3. Configure the following service settings:

| Field | Configuration Value |
| :--- | :--- |
| **Name** | `apex-logistics-backend` |
| **Language** | `Python 3` |
| **Region** | `Ohio (US East)` *(matches Neon DB region for ultra-low latency)* |
| **Branch** | `main` |
| **Root Directory** | `apex_enterprise/backend` |
| **Build Command** | `./build.sh` |
| **Start Command** | `gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 3` |
| **Health Check Path**| `/api/v1/health/` |

4. In the **Environment Variables** tab, add:

| Environment Variable | Value | Description |
| :--- | :--- | :--- |
| `PYTHON_VERSION` | `3.12.0` | Python runtime version |
| `DJANGO_SETTINGS_MODULE` | `config.settings.production` | Production settings module |
| `DJANGO_DEBUG` | `False` | Disables debug mode in production |
| `DJANGO_SECRET_KEY` | *(Click "Generate" in Render)* | Cryptographic signing key |
| `DATABASE_URL` | `postgresql://neondb_owner:npg_rZ14vDQOJpEy@ep-young-frog-b4395nwt-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require` | Neon PostgreSQL pooled URL |
| `CORS_ALLOW_ALL_ORIGINS`| `True` *(or specify your Vercel URL)* | Allows cross-origin API calls |
| `CORS_ALLOWED_ORIGINS` | `https://your-frontend.vercel.app` | Explicit frontend origin |
| `SECURE_SSL_REDIRECT` | `False` | Render edge proxies handle SSL |

5. Click **Deploy Web Service**. Once deployed, Render will provide a live URL such as `https://apex-logistics-backend.onrender.com`.

---

### C. Frontend Deployment: Vercel

1. Log in to [Vercel](https://vercel.com) and click **Add New...** &rarr; **Project**.
2. Select the GitHub repository: `danitech887/apex_logistics_supply_chain_ltd`.
3. In **Project Settings**, configure:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click `Edit` and select `apex_enterprise/frontend`
   - **Build Command**: `npm run build` *(default)*
   - **Output Directory**: `dist` *(default)*
   - **Install Command**: `npm install` *(default)*
4. Under **Environment Variables**, add:
   ```env
   VITE_API_BASE_URL=https://<your-render-service-name>.onrender.com/api/v1
   ```
   *(Replace with the actual live URL from your Render backend deployment)*
5. Click **Deploy**. Vercel will build the frontend and serve it globally with SPA rewrites via [`vercel.json`](apex_enterprise/frontend/vercel.json).

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

The backend exposes a JSON health check endpoint used by Render uptime monitors and the React frontend:

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
