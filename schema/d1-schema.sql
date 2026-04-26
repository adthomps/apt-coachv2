-- APT Fitness Coach — D1 Schema (Cloudflare D1 / SQLite)
-- Documentation only — not executed in the frontend app.
-- All mass/weight values stored in pounds (lbs).

-- ============ Users ============

CREATE TABLE users (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============ User Roles ============

CREATE TABLE user_roles (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'admin')),
  UNIQUE (user_id, role)
);

CREATE INDEX idx_user_roles_user ON user_roles(user_id);

-- ============ Exercises ============

CREATE TABLE exercises (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  movement_pattern TEXT NOT NULL CHECK (movement_pattern IN (
    'horizontal_push', 'horizontal_pull', 'vertical_push', 'vertical_pull',
    'hip_hinge', 'knee_dominant', 'core', 'isolation'
  )),
  muscle_groups TEXT NOT NULL DEFAULT '[]',   -- JSON array
  equipment TEXT NOT NULL DEFAULT '[]',       -- JSON array
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  description TEXT,
  instructions TEXT DEFAULT '[]',             -- JSON array
  cues TEXT DEFAULT '[]',                     -- JSON array
  substitutions TEXT DEFAULT '[]',            -- JSON array of slugs
  user_id TEXT REFERENCES users(id),          -- NULL = global/system exercise
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_exercises_slug ON exercises(slug);
CREATE INDEX idx_exercises_pattern ON exercises(movement_pattern);

-- ============ Workouts ============

CREATE TABLE workouts (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  description TEXT,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  estimated_duration INTEGER NOT NULL, -- minutes
  tags TEXT DEFAULT '[]',              -- JSON array
  user_id TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE workout_blocks (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  workout_id TEXT NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('straight_sets', 'superset', 'giant_set', 'six_twelve_twentyfive', 'drop_set')),
  rounds INTEGER,
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_workout_blocks_workout ON workout_blocks(workout_id);

CREATE TABLE workout_block_items (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  block_id TEXT NOT NULL REFERENCES workout_blocks(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL REFERENCES exercises(id),
  sets INTEGER NOT NULL,
  reps_min INTEGER NOT NULL,
  reps_max INTEGER NOT NULL,
  rest_seconds INTEGER NOT NULL DEFAULT 60,
  rpe_target REAL,
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_block_items_block ON workout_block_items(block_id);

-- ============ Programs ============

CREATE TABLE programs (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  description TEXT,
  duration_weeks INTEGER NOT NULL,
  goal TEXT NOT NULL CHECK (goal IN ('strength', 'hypertrophy', 'endurance', 'recomposition', 'general_fitness')),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  user_id TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE program_days (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  program_id TEXT NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  workout_id TEXT REFERENCES workouts(id),
  is_rest_day INTEGER NOT NULL DEFAULT 0,
  notes TEXT
);

CREATE INDEX idx_program_days_program ON program_days(program_id);

-- ============ Snapshots (Body Composition) ============
-- All mass values in lbs

CREATE TABLE snapshots (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id),
  scan_date TEXT NOT NULL,
  provider TEXT,
  total_mass REAL NOT NULL,
  fat_mass REAL NOT NULL,
  lean_mass REAL NOT NULL,
  bone_mass REAL NOT NULL,
  body_fat_percentage REAL NOT NULL,
  visceral_fat_area REAL,
  bone_density_t_score REAL,
  bone_density_z_score REAL,
  bone_density_lumbar REAL,
  bone_density_femur REAL,
  raw_json TEXT NOT NULL DEFAULT '{}',
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_snapshots_user_date ON snapshots(user_id, scan_date DESC);

CREATE TABLE snapshot_regional_data (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  snapshot_id TEXT NOT NULL REFERENCES snapshots(id) ON DELETE CASCADE,
  region TEXT NOT NULL CHECK (region IN ('arms', 'legs', 'trunk', 'android', 'gynoid')),
  fat_mass REAL NOT NULL,
  lean_mass REAL NOT NULL,
  bone_mass REAL NOT NULL,
  fat_percentage REAL NOT NULL
);

CREATE INDEX idx_regional_snapshot ON snapshot_regional_data(snapshot_id);

-- ============ Workout Sessions ============
-- All weight values in lbs

CREATE TABLE sessions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id),
  workout_id TEXT NOT NULL REFERENCES workouts(id),
  workout_name TEXT NOT NULL,
  program_id TEXT REFERENCES programs(id),
  status TEXT NOT NULL CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  started_at TEXT NOT NULL,
  completed_at TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_sessions_user ON sessions(user_id, created_at DESC);

CREATE TABLE session_exercise_logs (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL REFERENCES exercises(id),
  exercise_name TEXT NOT NULL,
  planned_sets INTEGER NOT NULL,
  planned_reps_min INTEGER NOT NULL,
  planned_reps_max INTEGER NOT NULL,
  planned_weight REAL,
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_exercise_logs_session ON session_exercise_logs(session_id);

CREATE TABLE session_set_logs (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  exercise_log_id TEXT NOT NULL REFERENCES session_exercise_logs(id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL,
  weight REAL NOT NULL,
  reps INTEGER NOT NULL,
  rpe REAL,
  completed INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_set_logs_exercise ON session_set_logs(exercise_log_id);

-- ============ Schedule ============

CREATE TABLE schedule_entries (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id),
  date TEXT NOT NULL,
  workout_id TEXT REFERENCES workouts(id),
  workout_name TEXT,
  program_id TEXT REFERENCES programs(id),
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'completed', 'skipped', 'rescheduled')),
  session_id TEXT REFERENCES sessions(id),
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_schedule_user_date ON schedule_entries(user_id, date DESC);

-- ============ Performance Profiles ============

CREATE TABLE performance_profiles (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id),
  exercise_id TEXT NOT NULL REFERENCES exercises(id),
  exercise_name TEXT NOT NULL,
  last_weight REAL NOT NULL DEFAULT 0,
  best_weight REAL NOT NULL DEFAULT 0,
  recent_average_reps REAL NOT NULL DEFAULT 0,
  progression_state TEXT NOT NULL DEFAULT 'new' CHECK (progression_state IN ('new', 'progressing', 'stalled', 'regressing')),
  fatigue_indicator TEXT NOT NULL DEFAULT 'low' CHECK (fatigue_indicator IN ('low', 'moderate', 'high')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (user_id, exercise_id)
);

-- ============ Adaptive Recommendations ============

CREATE TABLE adaptive_recommendations (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id),
  type TEXT NOT NULL,
  target_exercise_id TEXT REFERENCES exercises(id),
  target_exercise_name TEXT,
  suggested_weight REAL,
  suggested_reps TEXT,
  suggested_sets INTEGER,
  exercise_substitution_id TEXT REFERENCES exercises(id),
  exercise_substitution_name TEXT,
  schedule_adjustment TEXT,
  food_suggestion TEXT,
  rationale TEXT NOT NULL,
  confidence_score REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_recs_user ON adaptive_recommendations(user_id, created_at DESC);

-- ============ Import Jobs ============

CREATE TABLE import_jobs (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id),
  type TEXT NOT NULL CHECK (type IN ('exercise_library', 'workouts', 'programs', 'snapshots')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  total_items INTEGER NOT NULL DEFAULT 0,
  processed_items INTEGER NOT NULL DEFAULT 0,
  success_items INTEGER NOT NULL DEFAULT 0,
  failed_items INTEGER NOT NULL DEFAULT 0,
  errors TEXT DEFAULT '[]', -- JSON array
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT
);

-- ============ Blood Panels (RythmHealth) ============

CREATE TABLE blood_panels (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id),
  source TEXT NOT NULL DEFAULT 'rythmhealth',
  panel_date TEXT NOT NULL,
  raw_csv TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_blood_panels_user_date ON blood_panels(user_id, panel_date DESC);

CREATE TABLE blood_markers (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  panel_id TEXT NOT NULL REFERENCES blood_panels(id) ON DELETE CASCADE,
  marker TEXT NOT NULL,
  value REAL NOT NULL,
  unit TEXT NOT NULL,
  reference_range TEXT NOT NULL,
  reference_min REAL NOT NULL,
  reference_max REAL NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('optimal', 'average', 'outOfRange')),
  time TEXT NOT NULL
);

CREATE INDEX idx_blood_markers_panel ON blood_markers(panel_id);
