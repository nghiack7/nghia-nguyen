import { SITE_PROFILE_KEY, buildArticleStatsPayload, buildSiteStatsPayload } from "./engagement.js";
import { getClientIp, getUserAgent, sha256Hex } from "./http.js";

const GITHUB_STAR_CACHE_TTL_MS = 6 * 60 * 60 * 1000;

async function ensureArticleMetrics(db, slug) {
  await db
    .prepare(
      `INSERT OR IGNORE INTO article_metrics (slug, view_count, rating_sum, rating_count, comment_count, updated_at)
       VALUES (?, 0, 0, 0, 0, ?)`
    )
    .bind(slug, new Date().toISOString())
    .run();
}

async function ensureSiteMetrics(db, key = SITE_PROFILE_KEY) {
  await db
    .prepare(
      `INSERT OR IGNORE INTO site_metrics
         (key, view_count, like_count, github_star_count, github_stars_checked_at, updated_at)
       VALUES (?, 0, 0, NULL, NULL, ?)`
    )
    .bind(key, nowIso())
    .run();
}

function nowIso() {
  return new Date().toISOString();
}

function todayIsoDate() {
  return nowIso().slice(0, 10);
}

function isGithubStarCacheStale(metrics = {}, now = new Date()) {
  const checkedAt = Date.parse(metrics.githubStarsCheckedAt || "");
  if (!Number.isFinite(checkedAt)) {
    return true;
  }

  return now.getTime() - checkedAt > GITHUB_STAR_CACHE_TTL_MS;
}

async function getArticleStats(db, slug) {
  await ensureArticleMetrics(db, slug);

  const [metricsResult, commentsResult] = await db.batch([
    db
      .prepare(
        `SELECT slug, view_count AS viewCount, rating_sum AS ratingSum, rating_count AS ratingCount, comment_count AS commentCount
         FROM article_metrics
         WHERE slug = ?`
      )
      .bind(slug),
    db
      .prepare(
        `SELECT id, author_name AS authorName, author_role AS authorRole, body, created_at AS createdAt
         FROM article_comments
         WHERE slug = ? AND is_approved = 1
         ORDER BY created_at DESC
         LIMIT 20`
      )
      .bind(slug)
  ]);

  return buildArticleStatsPayload({
    slug,
    metrics: metricsResult.results?.[0] || {},
    comments: commentsResult.results || []
  });
}

async function recordArticleView(db, { slug, visitorToken, request }) {
  await ensureArticleMetrics(db, slug);

  const inserted = await db
    .prepare(
      `INSERT OR IGNORE INTO article_views (slug, visitor_token, view_day, user_agent_hash, created_at)
       VALUES (?, ?, ?, ?, ?)`
    )
    .bind(slug, visitorToken, todayIsoDate(), await sha256Hex(getUserAgent(request)), nowIso())
    .run();

  if ((inserted.meta?.changes || 0) > 0) {
    await db
      .prepare(
        `UPDATE article_metrics
         SET view_count = view_count + 1, updated_at = ?
         WHERE slug = ?`
      )
      .bind(nowIso(), slug)
      .run();
  }

  return getArticleStats(db, slug);
}

async function recordArticleRating(db, { slug, visitorToken, rating }) {
  await ensureArticleMetrics(db, slug);

  const existing = await db
    .prepare(
      `SELECT rating
       FROM article_ratings
       WHERE slug = ? AND visitor_token = ?`
    )
    .bind(slug, visitorToken)
    .first();

  if (!existing) {
    await db
      .prepare(
        `INSERT INTO article_ratings (slug, visitor_token, rating, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`
      )
      .bind(slug, visitorToken, rating, nowIso(), nowIso())
      .run();

    await db
      .prepare(
        `UPDATE article_metrics
         SET rating_sum = rating_sum + ?, rating_count = rating_count + 1, updated_at = ?
         WHERE slug = ?`
      )
      .bind(rating, nowIso(), slug)
      .run();
  } else if (Number(existing.rating) !== rating) {
    const delta = rating - Number(existing.rating);

    await db
      .prepare(
        `UPDATE article_ratings
         SET rating = ?, updated_at = ?
         WHERE slug = ? AND visitor_token = ?`
      )
      .bind(rating, nowIso(), slug, visitorToken)
      .run();

    await db
      .prepare(
        `UPDATE article_metrics
         SET rating_sum = rating_sum + ?, updated_at = ?
         WHERE slug = ?`
      )
      .bind(delta, nowIso(), slug)
      .run();
  }

  return getArticleStats(db, slug);
}

async function recordArticleComment(db, { slug, visitorToken, authorName, authorRole, body }) {
  await ensureArticleMetrics(db, slug);

  const bodyHash = await sha256Hex(`${slug}:${visitorToken}:${body.toLowerCase()}`);
  const inserted = await db
    .prepare(
      `INSERT OR IGNORE INTO article_comments
         (slug, author_name, author_role, body, visitor_token, body_hash, is_approved, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 1, ?)`
    )
    .bind(slug, authorName, authorRole, body, visitorToken, bodyHash, nowIso())
    .run();

  if ((inserted.meta?.changes || 0) > 0) {
    await db
      .prepare(
        `UPDATE article_metrics
         SET comment_count = comment_count + 1, updated_at = ?
         WHERE slug = ?`
      )
      .bind(nowIso(), slug)
      .run();
  }

  return getArticleStats(db, slug);
}

async function getSiteMetricsRow(db, key = SITE_PROFILE_KEY) {
  await ensureSiteMetrics(db, key);

  return db
    .prepare(
      `SELECT key,
              view_count AS viewCount,
              like_count AS likeCount,
              github_star_count AS githubStarCount,
              github_stars_checked_at AS githubStarsCheckedAt
       FROM site_metrics
       WHERE key = ?`
    )
    .bind(key)
    .first();
}

async function hasSiteLike(db, { key = SITE_PROFILE_KEY, visitorToken }) {
  if (!visitorToken) {
    return false;
  }

  const row = await db
    .prepare(
      `SELECT 1 AS liked
       FROM site_likes
       WHERE metric_key = ? AND visitor_token = ?
       LIMIT 1`
    )
    .bind(key, visitorToken)
    .first();

  return Boolean(row);
}

async function getSiteStats(db, { key = SITE_PROFILE_KEY, visitorToken } = {}) {
  const metrics = await getSiteMetricsRow(db, key);
  const likedByVisitor = await hasSiteLike(db, { key, visitorToken });

  return buildSiteStatsPayload({
    metrics,
    likedByVisitor
  });
}

async function recordSiteView(db, { key = SITE_PROFILE_KEY, visitorToken, request }) {
  await ensureSiteMetrics(db, key);

  const inserted = await db
    .prepare(
      `INSERT OR IGNORE INTO site_views (metric_key, visitor_token, view_day, user_agent_hash, created_at)
       VALUES (?, ?, ?, ?, ?)`
    )
    .bind(key, visitorToken, todayIsoDate(), await sha256Hex(getUserAgent(request)), nowIso())
    .run();

  if ((inserted.meta?.changes || 0) > 0) {
    await db
      .prepare(
        `UPDATE site_metrics
         SET view_count = view_count + 1, updated_at = ?
         WHERE key = ?`
      )
      .bind(nowIso(), key)
      .run();
  }

  return getSiteStats(db, { key, visitorToken });
}

async function recordSiteLike(db, { key = SITE_PROFILE_KEY, visitorToken }) {
  await ensureSiteMetrics(db, key);

  const inserted = await db
    .prepare(
      `INSERT OR IGNORE INTO site_likes (metric_key, visitor_token, created_at)
       VALUES (?, ?, ?)`
    )
    .bind(key, visitorToken, nowIso())
    .run();

  if ((inserted.meta?.changes || 0) > 0) {
    await db
      .prepare(
        `UPDATE site_metrics
         SET like_count = like_count + 1, updated_at = ?
         WHERE key = ?`
      )
      .bind(nowIso(), key)
      .run();
  }

  return getSiteStats(db, { key, visitorToken });
}

async function updateSiteGithubStars(db, { key = SITE_PROFILE_KEY, starCount }) {
  await ensureSiteMetrics(db, key);

  await db
    .prepare(
      `UPDATE site_metrics
       SET github_star_count = ?, github_stars_checked_at = ?, updated_at = ?
       WHERE key = ?`
    )
    .bind(starCount, nowIso(), nowIso(), key)
    .run();

  return getSiteMetricsRow(db, key);
}

async function touchSiteGithubStarsChecked(db, { key = SITE_PROFILE_KEY } = {}) {
  await ensureSiteMetrics(db, key);

  await db
    .prepare(
      `UPDATE site_metrics
       SET github_stars_checked_at = ?, updated_at = ?
       WHERE key = ?`
    )
    .bind(nowIso(), nowIso(), key)
    .run();

  return getSiteMetricsRow(db, key);
}

async function recordContactMessage(db, { visitorToken, payload, request }) {
  const ipHash = await sha256Hex(getClientIp(request));
  const messageHash = await sha256Hex(`${payload.email}:${payload.subject}:${payload.message}`);

  const inserted = await db
    .prepare(
      `INSERT OR IGNORE INTO contact_messages
         (name, email, subject, message, visitor_token, ip_hash, message_hash, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'new', ?)`
    )
    .bind(
      payload.name,
      payload.email,
      payload.subject,
      payload.message,
      visitorToken,
      ipHash,
      messageHash,
      nowIso()
    )
    .run();

  return {
    accepted: (inserted.meta?.changes || 0) > 0
  };
}

export {
  getArticleStats,
  getSiteMetricsRow,
  getSiteStats,
  isGithubStarCacheStale,
  recordArticleComment,
  recordArticleRating,
  recordArticleView,
  recordContactMessage,
  recordSiteLike,
  recordSiteView,
  touchSiteGithubStarsChecked,
  updateSiteGithubStars
};
