-- =========================================================================
-- IoT Waste Management Platform - Database Schema v2 (Neon / PostgreSQL)
-- =========================================================================

-- 1. Device Metadata Table
CREATE TABLE IF NOT EXISTS device_metadata (
    device_id   VARCHAR(50) PRIMARY KEY,
    location_lat DECIMAL(10, 8) NOT NULL,
    location_lng DECIMAL(11, 8) NOT NULL,
    status      VARCHAR(20) DEFAULT 'active',
    battery_pct SMALLINT CHECK (battery_pct >= 0 AND battery_pct <= 100),
    installed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    description TEXT
);

-- 2. Main Telemetry Table — per-category fill & weight columns
CREATE TABLE IF NOT EXISTS waste_data (
    id          BIGSERIAL PRIMARY KEY,
    device_id   VARCHAR(50) REFERENCES device_metadata(device_id) ON DELETE CASCADE,
    timestamp   TIMESTAMP WITH TIME ZONE NOT NULL,

    -- Per-category fill levels (%)
    organic_fill_pct      SMALLINT CHECK (organic_fill_pct >= 0 AND organic_fill_pct <= 100),
    recyclable_fill_pct   SMALLINT CHECK (recyclable_fill_pct >= 0 AND recyclable_fill_pct <= 100),
    hazardous_fill_pct    SMALLINT CHECK (hazardous_fill_pct >= 0 AND hazardous_fill_pct <= 100),

    -- Per-category weight (kg)
    organic_weight_kg     DECIMAL(6, 2),
    recyclable_weight_kg  DECIMAL(6, 2),
    hazardous_weight_kg   DECIMAL(6, 2),

    -- AI Classification
    waste_type  VARCHAR(20) CHECK (waste_type IN ('organic', 'recyclable', 'hazardous')),
    confidence  DECIMAL(4, 3) CHECK (confidence >= 0 AND confidence <= 1)
);

-- 3. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_waste_data_timestamp ON waste_data(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_waste_data_device_id ON waste_data(device_id);


-- =========================================================================
-- SAMPLE DATA INSERTS (uncomment to seed)
-- =========================================================================
/*
INSERT INTO device_metadata (device_id, location_lat, location_lng, status, battery_pct, description)
VALUES
    ('bin_001', 40.7128, -74.0060, 'active', 95, 'City Park - North Gate'),
    ('bin_002', 40.7138, -74.0075, 'active', 72, 'City Park - South Gate'),
    ('bin_003', 40.7148, -74.0085, 'active', 43, 'Market Street Corner');

INSERT INTO waste_data (device_id, timestamp,
    organic_fill_pct, recyclable_fill_pct, hazardous_fill_pct,
    organic_weight_kg, recyclable_weight_kg, hazardous_weight_kg,
    waste_type, confidence)
VALUES
    ('bin_001', NOW(), 65, 30, 5,  8.2, 3.5, 0.5, 'organic',    0.93),
    ('bin_002', NOW(), 20, 85, 10, 2.1, 9.8, 1.1, 'recyclable', 0.91),
    ('bin_003', NOW(), 10, 15, 82, 1.0, 1.5, 6.3, 'hazardous',  0.98);
*/


-- =========================================================================
-- SAMPLE ANALYTICS QUERIES
-- =========================================================================
/*
-- Average fill level per waste category
SELECT
    AVG(organic_fill_pct)    AS avg_organic_fill,
    AVG(recyclable_fill_pct) AS avg_recyclable_fill,
    AVG(hazardous_fill_pct)  AS avg_hazardous_fill
FROM waste_data
WHERE timestamp >= NOW() - INTERVAL '24 hours';

-- Latest bin status per device
SELECT DISTINCT ON (device_id)
    device_id, timestamp,
    organic_fill_pct, recyclable_fill_pct, hazardous_fill_pct
FROM waste_data
ORDER BY device_id, timestamp DESC;
*/
