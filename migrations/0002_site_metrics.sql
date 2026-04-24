CREATE TABLE IF NOT EXISTS site_metrics (
  key TEXT PRIMARY KEY,
  view_count INTEGER NOT NULL DEFAULT 0,
  like_count INTEGER NOT NULL DEFAULT 0,
  github_star_count INTEGER,
  github_stars_checked_at TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS site_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  metric_key TEXT NOT NULL,
  visitor_token TEXT NOT NULL,
  view_day TEXT NOT NULL,
  user_agent_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (metric_key, visitor_token, view_day)
);

CREATE INDEX IF NOT EXISTS idx_site_views_key_day
  ON site_views (metric_key, view_day);

CREATE TABLE IF NOT EXISTS site_likes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  metric_key TEXT NOT NULL,
  visitor_token TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (metric_key, visitor_token)
);

CREATE INDEX IF NOT EXISTS idx_site_likes_key_created
  ON site_likes (metric_key, created_at DESC);
