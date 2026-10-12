-- Restored verbatim from applied migration history.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

CREATE TABLE IF NOT EXISTS producer_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_session_id TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    producer_id UUID NOT NULL REFERENCES producer_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    activity_profile TEXT NOT NULL CHECK (activity_profile IN ('coffee', 'pasture', 'mixed')),
    centroid GEOMETRY(Point, 4326),
    boundary GEOMETRY(MultiPolygon, 4326),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    geometry GEOMETRY(Polygon, 4326) NOT NULL,
    area_ha NUMERIC(10, 4) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crop_varieties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    crop_type TEXT NOT NULL,
    common_name TEXT NOT NULL,
    cultivar TEXT,
    scientific_name TEXT,
    is_custom BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crop_cycles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plot_id UUID NOT NULL REFERENCES plots(id) ON DELETE CASCADE,
    crop_type TEXT NOT NULL,
    subtype TEXT,
    cultivar TEXT,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS field_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plot_id UUID NOT NULL REFERENCES plots(id) ON DELETE CASCADE,
    client_generated_id TEXT UNIQUE,
    type TEXT NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    geometry GEOMETRY(Point, 4326),
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS field_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES field_events(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    lat NUMERIC(10, 7),
    lon NUMERIC(10, 7),
    captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS satellite_scenes (
    id TEXT PRIMARY KEY,
    provider TEXT NOT NULL,
    mission TEXT NOT NULL,
    acquired_at TIMESTAMPTZ NOT NULL,
    cloud_score NUMERIC(5, 2),
    footprint GEOMETRY(Polygon, 4326),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plot_satellite_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plot_id UUID NOT NULL REFERENCES plots(id) ON DELETE CASCADE,
    scene_id TEXT NOT NULL REFERENCES satellite_scenes(id) ON DELETE CASCADE,
    metric TEXT NOT NULL,
    mean NUMERIC(8, 5) NOT NULL,
    p10 NUMERIC(8, 5),
    p50 NUMERIC(8, 5),
    p90 NUMERIC(8, 5),
    stddev NUMERIC(8, 5),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(plot_id, scene_id, metric)
);

CREATE TABLE IF NOT EXISTS weather_series (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    plot_id UUID REFERENCES plots(id) ON DELETE CASCADE,
    source TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    variable TEXT NOT NULL,
    value NUMERIC(10, 4) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS irrigation_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plot_id UUID NOT NULL REFERENCES plots(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    water_balance NUMERIC(8, 2) NOT NULL,
    need_score NUMERIC(5, 2) NOT NULL,
    confidence TEXT NOT NULL CHECK (confidence IN ('high', 'moderate', 'low')),
    rationale TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS flowering_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plot_id UUID NOT NULL REFERENCES plots(id) ON DELETE CASCADE,
    window_start DATE NOT NULL,
    window_end DATE NOT NULL,
    score NUMERIC(5, 2) NOT NULL,
    confidence TEXT NOT NULL CHECK (confidence IN ('high', 'moderate', 'low')),
    evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS carbon_estimates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plot_id UUID NOT NULL REFERENCES plots(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    gpp_npp_proxy NUMERIC(10, 4),
    carbon_kg NUMERIC(12, 2) NOT NULL,
    co2_kg NUMERIC(12, 2) NOT NULL,
    o2_equiv_kg NUMERIC(12, 2) NOT NULL,
    confidence TEXT NOT NULL CHECK (confidence IN ('high', 'moderate', 'low')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plot_id UUID NOT NULL REFERENCES plots(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('info', 'attention', 'high')),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved', 'false_positive')),
    evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
    dedup_key TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_plots_property_id ON plots(property_id);
CREATE INDEX IF NOT EXISTS idx_plots_geometry ON plots USING GIST(geometry);
CREATE INDEX IF NOT EXISTS idx_field_events_plot_occurred ON field_events(plot_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_plot_satellite_metrics_lookup ON plot_satellite_metrics(plot_id, metric, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_weather_series_lookup ON weather_series(property_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_active ON alerts(plot_id, status) WHERE status = 'open';

