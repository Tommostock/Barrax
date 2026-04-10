-- Macro cycling: separate calorie targets for workout days vs rest days
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS rest_day_calorie_target INTEGER DEFAULT NULL;
