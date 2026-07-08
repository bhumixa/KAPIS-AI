-- ==============================================================================
-- Kapis AI Platform - Initial Schema Bootstrap
-- Runs automatically on first Postgres container start via
-- docker-entrypoint-initdb.d (see docker-compose.yml).
--
-- Sprint 1 only provisions the schemas needed by the platform's core
-- infrastructure. Product tables (patients, appointments, doctors, etc.)
-- are added as versioned files in database/migrations/ in later sprints.
-- ==============================================================================

-- Dedicated schema so n8n's internal tables stay isolated from product data.
CREATE SCHEMA IF NOT EXISTS n8n;

-- Dedicated schema for Kapis Clinic AI application tables (populated later).
CREATE SCHEMA IF NOT EXISTS clinic;
