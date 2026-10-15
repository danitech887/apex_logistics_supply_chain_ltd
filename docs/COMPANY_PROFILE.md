# Case Study: Company Profile & Department Breakdown

## Company Overview

- **Company Name:** Apex Logistics & Supply Chain Ltd
- **Core Business:** Regional freight hauling, ambient warehousing, and fleet distribution.
- **Operational Footprint:**
  - **Corporate Headquarters:** Nairobi
  - **Transit Warehouses & Regional Hubs:** Mombasa, Nakuru, Kisumu
- **Scale:**
  - **Workforce:** 350 Employees
  - **Fleet:** 120 Fleet Trucks (Heavy commercial articulated trucks & medium distribution vans)

---

## Departmental Analysis

### 1. Human Resources & Payroll
- **Operational Scope:** Staff lifecycle management, contracts, shift and crew scheduling (drivers vs. administrative staff), leave administration, statutory deductions (PAYE, SHA/NHIF, NSSF, Housing Levy), and monthly bank payroll disbursement.
- **Core Strengths:** Strong internal labor compliance and disciplined staff onboarding protocols.
- **Operational Pain Points:** Drivers and mechanics log overtime and daily allowances manually on paper clipboards. HR spends roughly 5 business days at month-end cross-checking physical logsheets against trip sheets before running payroll.

---

### 2. Finance & Accounting
- **Operational Scope:** General ledger maintenance, double-entry bookkeeping, Accounts Receivable (AR client invoices), Accounts Payable (AP supplier bills), asset depreciation, tax compliance, and bank reconciliations.
- **Core Strengths:** Strict financial control and diligent physical record archiving.
- **Operational Pain Points:** Invoicing is handled via isolated spreadsheets while accounting records live in a standalone legacy tool. Reconciling trip fuel receipts with supplier invoices leads to recurring ledger discrepancies and delayed financial closes.

---

### 3. Procurement & Vendor Management
- **Operational Scope:** Supplier pre-qualification, parts sourcing (tires, lubricants, engine assemblies), supplier price negotiations, Request for Quotations (RFQs), and issuing Local Purchase Orders (LPOs).
- **Core Strengths:** Established supplier networks with tire distributors and fuel stations along major transit corridors.
- **Operational Pain Points:** Emergency repair parts are frequently purchased via verbal approval without checking budget lines, creating unexpected liabilities for the Finance department.

---

### 4. Fleet Operations & Maintenance
- **Operational Scope:** Vehicle tracking, preventative maintenance schedules, mechanic work orders, spare-parts fitting, fuel usage tracking, and daily driver-vehicle assignments.
- **Core Strengths:** Experienced workshop personnel capable of fast turnaround for major engine and suspension overhauls.
- **Operational Pain Points:** Preventative maintenance intervals are regularly missed because service intervals are calculated manually from physical odometer sheets. Unscheduled transit breakdowns cause heavy contract penalties.

---

### 5. Warehouse & Inventory Control
- **Operational Scope:** Receiving cargo, container stuffing/stripping, stock slotting, dispatch verification, warehouse storage fees, and handling packaging consumables.
- **Core Strengths:** High storage density and disciplined dock gate operations.
- **Operational Pain Points:** Stock ledgers and cargo manifestations do not sync with finance or billing in real time; cargo weight mismatches are only caught during transit weighbridge inspections.

---

### 6. Sales & Business Development (CRM)
- **Operational Scope:** Corporate client acquisition, route rate negotiations, managing corporate credit terms, quotation generation, and sales pipeline tracking.
- **Core Strengths:** Consistent customer relationships with leading agricultural, manufacturing, and FMCG brands.
- **Operational Pain Points:** Sales reps often commit to custom discount rates without verifying current fuel price surcharges or consulting Finance regarding a client’s overdue credit balance.

---

### 7. Customer Service & B2B Client Portal
- **Operational Scope:** Order intake, transit status updates, issuing electronic Proof of Delivery (POD), client query management, and dispatch confirmations.
- **Core Strengths:** Responsive telephone and WhatsApp communication desks.
- **Operational Pain Points:** Support desks are inundated with inbound phone calls and emails from corporate clients asking for cargo locations, because customers lack a self-service tracking interface.

---

### 8. Employee Self-Service (ESS Desk - Company-Wide)
- **Operational Scope:** Digital payslip access, leave applications, daily trip per-diem claims, mileage logs, and personal record updates for all 350 staff members.
- **Core Strengths:** High smartphone adoption among drivers, dock workers, and mechanics.
- **Operational Pain Points:** Workers must travel to the main office to collect printed payslips or check leave day balances, creating operational downtime and administrative friction for HR.

---

## Operational Pain Points & System Integration Matrix

| Department | Key Bottle-Neck / Risk | Cross-Department Impact | Target Digital Capability |
| :--- | :--- | :--- | :--- |
| **HR & Payroll** | Manual clipboard logsheets for overtime & per-diem (5 days wasted/month) | Finance (Payroll delays) | Mobile driver logs & automated overtime/allowance calculations |
| **Finance & Accounting** | Siloed spreadsheets vs. legacy accounting tool; fuel reconciliation lag | Procurement & Fleet | Unified general ledger, automated invoice-to-receipt matching |
| **Procurement** | Verbal approvals on emergency parts without budget checks | Finance (Unplanned liabilities) | Digital LPO workflow with budget limits and threshold rules |
| **Fleet Operations** | Manual odometer tracking leading to missed preventative maintenance | Customer Service & Finance (Breakdown penalties) | Telematics / digital odometer sync & automated service schedule alerts |
| **Warehouse & Inventory** | Cargo manifests not syncing with finance; weighbridge mismatches | Finance & Dispatch | Integrated WMS with real-time billing and weighbridge checks |
| **Sales (CRM)** | Blind discounting without fuel surcharge or credit check verification | Finance (Bad debt, margin erosion) | Automated pricing engine tied to fuel rates & credit limit checks |
| **Customer Service** | Inbound call/email flood for tracking & PODs | Operations & Clients | Customer self-service tracking portal & electronic POD (e-POD) |
| **Employee Self-Service** | Physical trips to HQ for payslips and leave requests | HR & Productivity | Mobile-first Employee Self-Service (ESS) portal |

---

## End-to-End Operational Lifecycle Workflow

For complete stage breakdown, state transitions, and validation rules, see [OPERATIONAL_WORKFLOW.md](file:///home/danitech/Desktop/Projects/Apex%20Logistics%20&%20Supply%20Chain%20Ltd/OPERATIONAL_WORKFLOW.md).

```
[1. CRM / Sales]
Corporate customer contract finalized; quote converted into confirmed Sales Order.
       │
       ▼
[2. Finance Verification]
Credit limit automatically checked; pro-forma invoice and deposit ledger entry created.
       │
       ▼
[3. Fleet Operations & HR Validation]
Trip scheduled; vehicle assigned based on maintenance status; driver assigned based on active license & rest hours.
       │
       ▼
[4. Warehouse Cargo Intake]
Cargo inspected and loaded; digital Waybill generated with verified tare/gross weights.
       │
       ▼
[5. Real-Time Transit & Customer Portal]
Driver departs; customer tracks transit milestones and delivery ETA via client portal.
       │
       ▼
[6. Delivery & Proof of Delivery (POD)]
Receiving dock signs digital POD on mobile terminal; trip state marked as COMPLETED.
       │
       ▼
[7. Automatic Cross-Department Reconciliation]
├── Finance: Final Tax Invoice generated; Accounts Receivable debited; Freight Revenue credited.
├── Fleet Ops: Vehicle status reset to AVAILABLE; odometer and fuel consumption updated.
└── HR / Payroll: Driver trip per-diem and mileage allowance pushed to next payroll cycle.
```

---

## Technical System Architecture

- Architectural Overview & Tier Specifications: [SYSTEM_ARCHITECTURE.md](file:///home/danitech/Desktop/Projects/Apex%20Logistics%20&%20Supply%20Chain%20Ltd/SYSTEM_ARCHITECTURE.md)
- Relational Data Model & ERD: [DATABASE_DESIGN.md](file:///home/danitech/Desktop/Projects/Apex%20Logistics%20&%20Supply%20Chain%20Ltd/DATABASE_DESIGN.md)
- PostgreSQL 16 DDL Script: [schema.sql](file:///home/danitech/Desktop/Projects/Apex%20Logistics%20&%20Supply%20Chain%20Ltd/schema.sql)



