-- ============================================================================
-- Apex Logistics & Supply Chain Ltd - Enterprise Database Schema
-- Target: PostgreSQL 16
-- Multi-Tenant, Role-Based Access Control, Double-Entry General Ledger,
-- Staff Registry, Trips & Fuel Tracking.
-- ============================================================================

-- ============================================================================
-- 0. SCHEMA DEFINITIONS
-- ============================================================================
CREATE SCHEMA IF NOT EXISTS auth_core;
CREATE SCHEMA IF NOT EXISTS hr_payroll;
CREATE SCHEMA IF NOT EXISTS finance;
CREATE SCHEMA IF NOT EXISTS fleet_ops;

-- ============================================================================
-- 1. AUTH_CORE SCHEMA (Tenancy, Identity, RBAC)
-- ============================================================================
CREATE TABLE auth_core.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(150) NOT NULL,
    subdomain VARCHAR(63) NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE auth_core.roles (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE, -- e.g., 'SUPER_ADMIN', 'HR_OFFICER', 'ACCOUNTANT', 'DRIVER'
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE auth_core.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES auth_core.tenants(id) ON DELETE RESTRICT,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(30),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_user_email UNIQUE (tenant_id, email)
);

CREATE TABLE auth_core.user_roles (
    user_id UUID NOT NULL REFERENCES auth_core.users(id) ON DELETE CASCADE,
    role_id INT NOT NULL REFERENCES auth_core.roles(id) ON DELETE RESTRICT,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id)
);

-- ============================================================================
-- 2. HR_PAYROLL SCHEMA (Staff Registry & Payroll Computations)
-- ============================================================================
CREATE TABLE hr_payroll.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES auth_core.tenants(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL UNIQUE REFERENCES auth_core.users(id) ON DELETE RESTRICT,
    staff_number VARCHAR(50) NOT NULL,
    national_id VARCHAR(50) NOT NULL,
    tax_pin VARCHAR(50) NOT NULL,
    department VARCHAR(50) NOT NULL,
    designation VARCHAR(100) NOT NULL,
    base_salary NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    hourly_rate NUMERIC(8, 2) NOT NULL DEFAULT 0.00,
    date_of_hire DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_staff_no UNIQUE (tenant_id, staff_number)
);

CREATE TABLE hr_payroll.payroll_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES auth_core.tenants(id) ON DELETE RESTRICT,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    run_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT', -- 'DRAFT', 'APPROVED', 'DISBURSED'
    total_gross NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    total_net NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE hr_payroll.payslips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payroll_run_id UUID NOT NULL REFERENCES hr_payroll.payroll_runs(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES hr_payroll.employees(id) ON DELETE RESTRICT,
    base_pay NUMERIC(12, 2) NOT NULL,
    allowances NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    deductions_tax NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    deductions_statutory NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    net_pay NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_run_employee UNIQUE (payroll_run_id, employee_id)
);

-- ============================================================================
-- 3. FLEET_OPS SCHEMA (Vehicles, Operations, Trips)
-- ============================================================================
CREATE TABLE fleet_ops.vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES auth_core.tenants(id) ON DELETE RESTRICT,
    registration_plate VARCHAR(20) NOT NULL,
    make VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    payload_capacity_kg NUMERIC(10, 2) NOT NULL,
    current_odometer INT NOT NULL DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE', -- 'AVAILABLE', 'IN_TRANSIT', 'MAINTENANCE'
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_vehicle_plate UNIQUE (tenant_id, registration_plate)
);

CREATE TABLE fleet_ops.trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES auth_core.tenants(id) ON DELETE RESTRICT,
    vehicle_id UUID NOT NULL REFERENCES fleet_ops.vehicles(id) ON DELETE RESTRICT,
    driver_id UUID NOT NULL REFERENCES hr_payroll.employees(id) ON DELETE RESTRICT,
    customer_id UUID NOT NULL, -- Logical reference to client record
    origin VARCHAR(100) NOT NULL,
    destination VARCHAR(100) NOT NULL,
    cargo_description TEXT NOT NULL,
    cargo_weight_kg NUMERIC(10, 2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'SCHEDULED', -- 'SCHEDULED', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED'
    scheduled_departure TIMESTAMPTZ NOT NULL,
    actual_departure TIMESTAMPTZ,
    actual_arrival TIMESTAMPTZ,
    start_odometer INT,
    end_odometer INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE fleet_ops.fuel_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES fleet_ops.trips(id) ON DELETE CASCADE,
    liters_filled NUMERIC(8, 2) NOT NULL,
    cost_per_liter NUMERIC(8, 2) NOT NULL,
    total_cost NUMERIC(10, 2) NOT NULL,
    odometer_reading INT NOT NULL,
    receipt_number VARCHAR(50) NOT NULL,
    logged_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 4. FINANCE SCHEMA (Double-Entry Bookkeeping & Invoicing)
-- ============================================================================
CREATE TABLE finance.accounts (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES auth_core.tenants(id) ON DELETE RESTRICT,
    account_code VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    account_type VARCHAR(20) NOT NULL, -- 'ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_tenant_account_code UNIQUE (tenant_id, account_code)
);

CREATE TABLE finance.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES auth_core.tenants(id) ON DELETE RESTRICT,
    trip_id UUID UNIQUE REFERENCES fleet_ops.trips(id) ON DELETE RESTRICT,
    invoice_number VARCHAR(50) NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL,
    tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(12, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'UNPAID', -- 'UNPAID', 'PARTIALLY_PAID', 'PAID', 'VOID'
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_invoice_no UNIQUE (tenant_id, invoice_number)
);

CREATE TABLE finance.journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES auth_core.tenants(id) ON DELETE RESTRICT,
    entry_date DATE NOT NULL,
    reference_type VARCHAR(50) NOT NULL, -- 'TRIP_INVOICE', 'PAYROLL_RUN', 'FUEL_EXPENSE'
    reference_id UUID NOT NULL,          -- Pointer to source entity (e.g., invoices.id)
    description TEXT,
    posted_by UUID NOT NULL REFERENCES auth_core.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE finance.journal_lines (
    id BIGSERIAL PRIMARY KEY,
    journal_entry_id UUID NOT NULL REFERENCES finance.journal_entries(id) ON DELETE CASCADE,
    account_id INT NOT NULL REFERENCES finance.accounts(id) ON DELETE RESTRICT,
    debit NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    credit NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    CONSTRAINT chk_positive_lines CHECK (debit >= 0 AND credit >= 0),
    CONSTRAINT chk_mutually_exclusive CHECK (
        (debit > 0 AND credit = 0) OR (credit > 0 AND debit = 0)
    )
);

-- ============================================================================
-- 5. PERFORMANCE INDEXES
-- ============================================================================
CREATE INDEX idx_users_tenant_email ON auth_core.users (tenant_id, email);
CREATE INDEX idx_employees_tenant_user ON hr_payroll.employees (tenant_id, user_id);
CREATE INDEX idx_trips_driver_status ON fleet_ops.trips (driver_id, status);
CREATE INDEX idx_trips_vehicle_status ON fleet_ops.trips (vehicle_id, status);
CREATE INDEX idx_journal_lines_entry ON finance.journal_lines (journal_entry_id);
CREATE INDEX idx_journal_entries_ref ON finance.journal_entries (reference_type, reference_id);
