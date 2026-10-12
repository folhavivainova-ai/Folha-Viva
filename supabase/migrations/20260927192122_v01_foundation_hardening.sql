-- Restored verbatim from applied migration history.
ALTER TABLE producer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE plots ENABLE ROW LEVEL SECURITY;
ALTER TABLE crop_varieties ENABLE ROW LEVEL SECURITY;
ALTER TABLE crop_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE satellite_scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE plot_satellite_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE irrigation_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE flowering_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE carbon_estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

ALTER TABLE crop_varieties DROP CONSTRAINT IF EXISTS crop_varieties_crop_type_check;
ALTER TABLE crop_cycles DROP CONSTRAINT IF EXISTS crop_cycles_crop_type_check;
ALTER TABLE field_events DROP CONSTRAINT IF EXISTS field_events_type_check;
ALTER TABLE plot_satellite_metrics DROP CONSTRAINT IF EXISTS plot_satellite_metrics_metric_check;
ALTER TABLE weather_series DROP CONSTRAINT IF EXISTS weather_series_variable_check;

CREATE INDEX IF NOT EXISTS idx_properties_producer_id ON properties(producer_id);
CREATE INDEX IF NOT EXISTS idx_crop_cycles_plot_id ON crop_cycles(plot_id);
CREATE INDEX IF NOT EXISTS idx_field_photos_event_id ON field_photos(event_id);
CREATE INDEX IF NOT EXISTS idx_satellite_scenes_acquired_at ON satellite_scenes(acquired_at DESC);

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS producer_profiles_set_updated_at ON producer_profiles;
CREATE TRIGGER producer_profiles_set_updated_at BEFORE UPDATE ON producer_profiles
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS properties_set_updated_at ON properties;
CREATE TRIGGER properties_set_updated_at BEFORE UPDATE ON properties
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS plots_set_updated_at ON plots;
CREATE TRIGGER plots_set_updated_at BEFORE UPDATE ON plots
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS feature_flags (
  key TEXT PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

INSERT INTO feature_flags(key,enabled,description)
VALUES
 ('v1_coffee',true,'Café disponível na V1'),
 ('v1_pasture',true,'Capim disponível na V1'),
 ('v1_mixed',true,'Misto disponível na V1')
ON CONFLICT (key) DO UPDATE SET enabled=EXCLUDED.enabled, description=EXCLUDED.description, updated_at=NOW();

CREATE OR REPLACE VIEW foundation_health AS
SELECT
  (SELECT count(*) FROM producer_profiles) AS producer_profiles,
  (SELECT count(*) FROM properties) AS properties,
  (SELECT count(*) FROM plots) AS plots,
  (SELECT count(*) FROM field_events) AS field_events,
  (SELECT count(*) FROM alerts) AS alerts;

