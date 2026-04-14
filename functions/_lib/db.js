import { buildArticleStatsPayload } from "./engagement.js";
import { getClientIp, getUserAgent, sha256Hex } from "./http.js";

async function ensureArticleMetrics(db, slug) {
  await db
    .prepare(
      `INSERT OR IGNORE INTO article_metrics (slug, view_count, rating_sum, rating_count, comment_count, updated_at)
       VALUES (?, 0, 0, 0, 0, ?)`
    )
    .bind(slug, new Date().toISOString())
    .run();
}

function nowIso() {
  return new Date().toISOString();
}

function todayIsoDate() {
  return nowIso().slice(0, 10);
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

export { getArticleStats, recordArticleComment, recordArticleRating, recordArticleView, recordContactMessage };
