-- ====================================================================
-- CYBERGUARD LAW ENFORCEMENT & FORENSIC TRIAGE DATABASE SCHEMA
-- Compatible with Supabase PostgreSQL
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --------------------------------------------------------------------
-- 2. INVESTIGATORS TABLE (Authentication & Duty Roster)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS investigators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(64) UNIQUE NOT NULL,
    badge_id VARCHAR(32) NOT NULL,
    name VARCHAR(128) NOT NULL,
    role VARCHAR(64) NOT NULL DEFAULT 'INVESTIGATOR',
    station VARCHAR(128) NOT NULL DEFAULT 'Cyber Crime Police Station',
    email VARCHAR(256) NOT NULL DEFAULT 'insp.haziq@cyberpolice.gov.in',
    phone VARCHAR(32) NOT NULL DEFAULT '+91 98200 12345',
    password_salt VARCHAR(64) NOT NULL,
    password_hash VARCHAR(128) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure email & phone columns exist for earlier tables
ALTER TABLE investigators ADD COLUMN IF NOT EXISTS email VARCHAR(256) DEFAULT 'insp.haziq@cyberpolice.gov.in';
ALTER TABLE investigators ADD COLUMN IF NOT EXISTS phone VARCHAR(32) DEFAULT '+91 98200 12345';

-- Disable RLS or grant full access for seamless application REST API operations
ALTER TABLE investigators DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS forensic_cases DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS dispatch_call_queue DISABLE ROW LEVEL SECURITY;

-- Seed default single duty investigator (investigator_01 / cyberguard2026)
-- Passwords and confidential contact channels are managed at the database level.
INSERT INTO investigators (
    username,
    badge_id,
    name,
    role,
    station,
    email,
    phone,
    password_salt,
    password_hash
) VALUES (
    'investigator_01',
    'INV-7842',
    'Insp. Haziq Shaikh',
    'LEAD_INVESTIGATOR',
    'Cyber Crime Police Station',
    'insp.haziq@cyberpolice.gov.in',
    '+91 98200 12345',
    'df9df02b9e6444af0ac34056eb4abc64',
    'fbc8442811e1e5ef653afc0543c8b7e0d8590db1a377e63338e7d3b45532b483'
) ON CONFLICT (username) DO NOTHING;

-- --------------------------------------------------------------------
-- 3. FORENSIC CASES & EVIDENCE TABLE (Wiretaps & Uploaded Audio)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS forensic_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id VARCHAR(64) UNIQUE NOT NULL,
    filename VARCHAR(256) NOT NULL,
    sha256_hash VARCHAR(64) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    duration_seconds NUMERIC(6, 2) NOT NULL DEFAULT 0.0,
    duration_label VARCHAR(32) NOT NULL DEFAULT '00:00',
    overall_urgency_score NUMERIC(5, 2) NOT NULL,
    priority_level VARCHAR(32) NOT NULL, -- CRITICAL, ELEVATED, ROUTINE
    dominant_emotion VARCHAR(32) NOT NULL,
    primary_threat_tags JSONB NOT NULL DEFAULT '[]'::jsonb,
    summary TEXT,
    full_transcript TEXT,
    timeline JSONB NOT NULL DEFAULT '[]'::jsonb,
    peak_emotions JSONB NOT NULL DEFAULT '{}'::jsonb,
    average_emotions JSONB NOT NULL DEFAULT '{}'::jsonb,
    investigator_badge_id VARCHAR(32) NOT NULL,
    investigator_name VARCHAR(128),
    storage_audio_url TEXT,
    evidence_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for instant lookup by cryptographic evidence hash
CREATE INDEX IF NOT EXISTS idx_cases_sha256 ON forensic_cases(sha256_hash);
CREATE INDEX IF NOT EXISTS idx_cases_priority ON forensic_cases(priority_level);
CREATE INDEX IF NOT EXISTS idx_cases_created ON forensic_cases(created_at DESC);

-- --------------------------------------------------------------------
-- 4. DISPATCH CALL QUEUE TABLE (Persistent Call Management)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dispatch_call_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    call_id VARCHAR(64) UNIQUE NOT NULL,
    scenario_id VARCHAR(64),
    caller_number VARCHAR(32) NOT NULL,
    caller_label VARCHAR(128),
    duration VARCHAR(32) NOT NULL DEFAULT '00:00',
    urgency_score NUMERIC(5, 2) NOT NULL DEFAULT 0.0,
    priority_level VARCHAR(32) NOT NULL DEFAULT 'ROUTINE',
    tags JSONB NOT NULL DEFAULT '[]'::jsonb,
    dominant_emotion VARCHAR(32) NOT NULL DEFAULT 'NEUTRAL',
    pitch_std NUMERIC(5, 2) NOT NULL DEFAULT 0.0,
    voice_tremor BOOLEAN NOT NULL DEFAULT FALSE,
    emotions JSONB NOT NULL DEFAULT '{}'::jsonb,
    transcript TEXT,
    advisory TEXT,
    sample_audio TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'QUEUED', -- QUEUED, ACTIVE, ESCALATED, RESOLVED
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_queue_urgency ON dispatch_call_queue(urgency_score DESC);

-- --------------------------------------------------------------------
-- 5. AUDIT TRAIL LOGS (Chain-of-Custody Accountability)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(64) NOT NULL, -- LOGIN_SUCCESS, FORENSIC_UPLOAD, CALL_ESCALATE, PASSCODE_RESET
    investigator_badge_id VARCHAR(32) NOT NULL,
    investigator_name VARCHAR(128),
    ip_address VARCHAR(64),
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_badge ON audit_logs(investigator_badge_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);

-- --------------------------------------------------------------------
-- 6. STORAGE BUCKET FOR EVIDENCE AUDIO (Run in Supabase Storage UI)
-- --------------------------------------------------------------------
-- Bucket name: forensic-evidence
-- Public: false (Restricted to authenticated API access)

