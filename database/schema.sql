-- POLARIS Antarctic Expedition Management Database Schema
-- Compatible with PostgreSQL 14+ / Cloud SQL

CREATE TABLE IF NOT EXISTS expeditions (
    id SERIAL PRIMARY KEY,
    expedition_id VARCHAR(50) UNIQUE NOT NULL,
    expedition_name VARCHAR(255) NOT NULL,
    expedition_code VARCHAR(50) UNIQUE NOT NULL,
    expedition_year INTEGER NOT NULL,
    description TEXT,
    mission_objective TEXT,
    target_region VARCHAR(150) NOT NULL,
    lead_organization VARCHAR(200) NOT NULL,
    expedition_leader VARCHAR(150) NOT NULL,
    start_date VARCHAR(10) NOT NULL,
    end_date VARCHAR(10) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Planned',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_expeditions_status_year ON expeditions(status, expedition_year);
CREATE INDEX IF NOT EXISTS idx_expeditions_dates ON expeditions(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_expeditions_region ON expeditions(target_region);
CREATE INDEX IF NOT EXISTS idx_expeditions_org ON expeditions(lead_organization);

CREATE TABLE IF NOT EXISTS expedition_audit_logs (
    id SERIAL PRIMARY KEY,
    expedition_id VARCHAR(50) NOT NULL REFERENCES expeditions(expedition_id) ON DELETE CASCADE,
    user_email VARCHAR(100) NOT NULL,
    user_name VARCHAR(150) NOT NULL,
    user_role VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    previous_state TEXT,
    new_state TEXT,
    details TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_expedition_id ON expedition_audit_logs(expedition_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON expedition_audit_logs(timestamp);

-- Future Module Relational Tables
CREATE TABLE IF NOT EXISTS expedition_personnel (
    id SERIAL PRIMARY KEY,
    expedition_id VARCHAR(50) NOT NULL REFERENCES expeditions(expedition_id) ON DELETE RESTRICT,
    personnel_id VARCHAR(50) NOT NULL,
    role VARCHAR(100) NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS expedition_teams (
    id SERIAL PRIMARY KEY,
    expedition_id VARCHAR(50) NOT NULL REFERENCES expeditions(expedition_id) ON DELETE RESTRICT,
    team_name VARCHAR(100) NOT NULL,
    team_lead VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS expedition_locations (
    id SERIAL PRIMARY KEY,
    expedition_id VARCHAR(50) NOT NULL REFERENCES expeditions(expedition_id) ON DELETE RESTRICT,
    location_name VARCHAR(150) NOT NULL,
    coordinates VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS expedition_cargo (
    id SERIAL PRIMARY KEY,
    expedition_id VARCHAR(50) NOT NULL REFERENCES expeditions(expedition_id) ON DELETE RESTRICT,
    container_no VARCHAR(50) NOT NULL,
    weight_kg NUMERIC(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS expedition_shipments (
    id SERIAL PRIMARY KEY,
    expedition_id VARCHAR(50) NOT NULL REFERENCES expeditions(expedition_id) ON DELETE RESTRICT,
    shipment_code VARCHAR(50) NOT NULL,
    vessel_name VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS expedition_inventory (
    id SERIAL PRIMARY KEY,
    expedition_id VARCHAR(50) NOT NULL REFERENCES expeditions(expedition_id) ON DELETE RESTRICT,
    item_code VARCHAR(50) NOT NULL,
    allocated_quantity INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS expedition_assets (
    id SERIAL PRIMARY KEY,
    expedition_id VARCHAR(50) NOT NULL REFERENCES expeditions(expedition_id) ON DELETE RESTRICT,
    asset_code VARCHAR(50) NOT NULL,
    asset_name VARCHAR(100) NOT NULL
);
