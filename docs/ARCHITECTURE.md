# POLARIS Antarctic Expedition Planning Module - Architecture & Specification

## 1. Executive Summary
The Expedition Planning module is the core registry and command center for all scientific and logistical campaigns conducted in Antarctica by the National Centre for Polar and Ocean Research (NCPOR). It governs the lifecycle of expeditions from preliminary planning and diplomatic clearance, through field execution, up to post-expedition demobilization.

## 2. System Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                 POLARIS Web Frontend (React 18 + TS)        │
│  - Expedition Dashboard (Real-time operational KPIs)       │
│  - Expedition Registry & Multi-Filter Search Engine         │
│  - Multi-Section Structured Expedition Registration Form    │
│  - Expedition Detail Command & Future Module Linkage View   │
│  - Controlled Status Transition Engine                      │
│  - Complete Immutable Audit Trail Viewer                    │
└──────────────┬───────────────────────────────▲──────────────┘
               │ HTTP REST                     │ JSON Telemetry
┌──────────────▼───────────────────────────────┴──────────────┐
│       Backend Engine (Node/Express & Python FastAPI Spec)   │
│  - Dual-stack ready: TypeScript Node engine + FastAPI       │
│  - Strict Role-Based Access Control (RBAC)                  │
│  - Uniqueness & Chronological Date Validation Middleware     │
│  - Finite State Machine (Planned → Approved → Active → ...) │
│  - Automatic State-Change Audit Logging Generator           │
│  - Referential Integrity & Delete-Protection Engine         │
└──────────────┬───────────────────────────────▲──────────────┘
               │ Drizzle ORM / SQLAlchemy      │ Foreign Key Links
┌──────────────▼───────────────────────────────┴──────────────┐
│     PostgreSQL Relational Database (Cloud SQL / pg15)       │
│  - `expeditions`: Master expedition records                 │
│  - `expedition_audit_logs`: Immutable audit trails           │
│  - `expedition_personnel`: Personnel module foreign keys    │
│  - `expedition_teams`: Team groupings foreign keys          │
│  - `expedition_locations`: Geographic coordinates           │
│  - `expedition_cargo`: Manifest links                        │
│  - `expedition_shipments`: Marine vessel connections         │
│  - `expedition_inventory`: Stock allocations                │
│  - `expedition_assets`: High-value vehicles & generators    │
└─────────────────────────────────────────────────────────────┘
```

## 3. Finite State Machine (Status Workflow)
- **Planned**: Initial state. Logistics, budgets, and environmental impact assessments are drafted.
  - Allowed transitions: `Approved`, `Cancelled`.
- **Approved**: Operational and diplomatic authorization granted. Icebreaker charters locked.
  - Allowed transitions: `Active`, `Cancelled`.
- **Active**: Expedition team deployed in Antarctica. Telemetry, communications, and daily logs active.
  - Allowed transitions: `Completed`, `Cancelled`.
- **Completed**: Mission objectives achieved, scientific samples secured, team repatriated.
  - Allowed transitions: None (Terminal State).
- **Cancelled**: Aborted due to extreme weather, ice pack obstruction, or administrative decisions.
  - Allowed transitions: None (Terminal State).

## 4. Delete Protection Policy
An expedition record cannot be deleted if:
1. Associated operational records exist in personnel, teams, locations, cargo, shipments, inventory, or assets link tables.
2. The expedition has reached `Active` or `Completed` operational status.

In such cases, the system returns HTTP 409 Conflict with:
`"This expedition cannot be deleted because it contains associated operational records."`
and guides the user to transition the status to `Cancelled` or `Completed` instead.
