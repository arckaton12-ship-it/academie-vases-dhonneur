-- Migration 052: Add Graduation class
INSERT INTO classes (name, level) VALUES ('Graduation', 4)
ON CONFLICT DO NOTHING;

-- Update ClassPicker to support Graduation (level 4)
-- No schema change needed, just data insertion
