CREATE TABLE IF NOT EXISTS article_metrics (
  slug TEXT PRIMARY KEY,
  view_count INTEGER NOT NULL DEFAULT 0,
  rating_sum INTEGER NOT NULL DEFAULT 0,
  rating_count INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS article_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL,
  visitor_token TEXT NOT NULL,
  view_day TEXT NOT NULL,
  user_agent_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (slug, visitor_token, view_day)
);

CREATE INDEX IF NOT EXISTS idx_article_views_slug_day
  ON article_views (slug, view_day);

CREATE TABLE IF NOT EXISTS article_ratings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL,
  visitor_token TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (slug, visitor_token)
);

CREATE INDEX IF NOT EXISTS idx_article_ratings_slug
  ON article_ratings (slug);

CREATE TABLE IF NOT EXISTS article_comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_role TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL,
  visitor_token TEXT NOT NULL,
  body_hash TEXT NOT NULL,
  is_approved INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  UNIQUE (slug, visitor_token, body_hash)
);

CREATE INDEX IF NOT EXISTS idx_article_comments_slug_created
  ON article_comments (slug, is_approved, created_at DESC);

CREATE TABLE IF NOT EXISTS contact_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  visitor_token TEXT NOT NULL,
  ip_hash TEXT NOT NULL,
  message_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TEXT NOT NULL,
  UNIQUE (visitor_token, message_hash)
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_created
  ON contact_messages (created_at DESC);
