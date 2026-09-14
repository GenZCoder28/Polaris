# POLARIS Expedition Planning Module REST API Documentation

## Base URL
`/api/expeditions`

## Authentication & Role Headers
- `x-user-role`: `Expedition Manager` | `Viewer`
- `x-user-email`: e.g. `manager@ncpor.gov.in`
- `x-user-name`: e.g. `Dr. Rajesh Sharma`

---

### 1. Dashboard Statistics
- **Endpoint**: `GET /api/expeditions/stats/dashboard`
- **Description**: Returns operational counters (Total, Planned, Approved, Active, Completed, Cancelled, Upcoming) and the 6 most recent campaigns.
- **Response**: `200 OK`
```json
{
  "total_expeditions": 5,
  "planned_expeditions": 1,
  "approved_expeditions": 1,
  "active_expeditions": 1,
  "completed_expeditions": 1,
  "cancelled_expeditions": 1,
  "upcoming_expeditions": 2,
  "recent_expeditions": [ ... ]
}
```

---

### 2. Search & Filter Expeditions
- **Endpoint**: `GET /api/expeditions/search`
- **Query Parameters**:
  - `q` (string): Text search across ID, name, code, region, leader, and objectives (e.g. `q=Bharat`, `q=2026`).
  - `status` (string): e.g. `Planned`, `Approved`, `Active`, `Completed`, `Cancelled`.
  - `year` (integer): e.g. `2026`.
  - `target_region` (string): e.g. `Larsemann Hills`.
  - `lead_organization` (string): e.g. `NCPOR`.
  - `start_date` / `end_date`: Filter bounds.
  - `date_from` / `date_to`: Operational overlap date window.
- **Response**: `200 OK` - Array of `ExpeditionRecord`.

---

### 3. Get Single Expedition Details
- **Endpoint**: `GET /api/expeditions/{id_or_code}`
- **Description**: Fetches expedition record together with future module relationship counts and immutable audit logs.
- **Response**: `200 OK`
```json
{
  "expedition": {
    "id": 1,
    "expedition_id": "EXP-2025-044",
    "expedition_name": "44th Indian Scientific Expedition to Antarctica",
    "expedition_code": "ISEA-44",
    "expedition_year": 2025,
    "description": "...",
    "mission_objective": "...",
    "target_region": "Larsemann Hills (Bharati Station)",
    "lead_organization": "NCPOR",
    "expedition_leader": "Dr. Shailendra Saini",
    "start_date": "2025-11-15",
    "end_date": "2026-04-10",
    "status": "Active",
    "notes": "..."
  },
  "module_connections": {
    "personnel_count": 3,
    "teams_count": 2,
    "locations_count": 2,
    "cargo_count": 2,
    "shipments_count": 1,
    "inventory_count": 2,
    "assets_count": 2
  },
  "audit_logs": [ ... ]
}
```

---

### 4. Create Expedition
- **Endpoint**: `POST /api/expeditions`
- **Role Requirement**: `Expedition Manager` (Viewers receive `403 Forbidden`)
- **Body**:
```json
{
  "expedition_id": "EXP-2027-046",
  "expedition_name": "46th Indian Scientific Expedition to Antarctica",
  "expedition_code": "ISEA-46",
  "expedition_year": 2027,
  "description": "...",
  "mission_objective": "...",
  "target_region": "Larsemann Hills (Bharati Station)",
  "lead_organization": "NCPOR - National Centre for Polar and Ocean Research",
  "expedition_leader": "Dr. Priya Verma",
  "start_date": "2027-11-15",
  "end_date": "2028-04-10",
  "status": "Planned",
  "notes": "..."
}
```
- **Error Responses**:
  - `400 Bad Request`: "End date cannot be before start date."
  - `403 Forbidden`: "You are not authorized to create an expedition. Expedition Manager role required."
  - `409 Conflict`: "Expedition ID already exists." or "Expedition code already exists."

---

### 5. Update Expedition
- **Endpoint**: `PUT /api/expeditions/{id_or_code}`
- **Role Requirement**: `Expedition Manager`
- **Validation**: Enforces valid status transitions and date chronological consistency.

---

### 6. Delete Expedition
- **Endpoint**: `DELETE /api/expeditions/{id_or_code}`
- **Role Requirement**: `Expedition Manager`
- **Delete Protection**:
  - If associated records exist: `409 Conflict`
    `{"error": "This expedition cannot be deleted because it contains associated operational records."}`
  - If unlinked: `200 OK`
