-- ============================================================
-- PreOne — PostgreSQL Initialization Script
-- Runs automatically when the PostgreSQL container starts
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE preone TO preone;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO preone;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO preone;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO preone;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO preone;
