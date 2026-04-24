const SUPPORTED_ARTICLES = {
  "kafka-oom-pipeline": {
    title: "From 100M Stuck Messages to Zero OOM: A 7-Month War with a Go Event Pipeline"
  },
  "revenue-reconciliation-fix": {
    title: "When Every Dollar Counts: Rewriting Revenue From Source of Truth"
  }
};

const SITE_PROFILE_KEY = "portfolio";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeWhitespace(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function requireArticleSlug(slug) {
  const normalized = normalizeWhitespace(slug);
  if (!SUPPORTED_ARTICLES[normalized]) {
    throw new Error("unsupported article slug");
  }
  return normalized;
}

function normalizeRating(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error("rating must be a number");
  }
  if (!Number.isInteger(parsed)) {
    throw new Error("rating must be a whole number");
  }
  if (parsed < 1 || parsed > 5) {
    throw new Error("rating must be between 1 and 5");
  }
  return parsed;
}

function validateContactInput(input) {
  const company = normalizeWhitespace(input.company);
  if (company) {
    throw new Error("spam detected");
  }

  const name = normalizeWhitespace(input.name);
  const email = normalizeWhitespace(input.email).toLowerCase();
  const subject = normalizeWhitespace(input.subject);
  const message = normalizeWhitespace(input.message);

  if (!EMAIL_RE.test(email)) {
    throw new Error("valid email is required");
  }
  if (name.length < 2) {
    throw new Error("name must be at least 2 characters");
  }
  if (message.length < 20) {
    throw new Error("message must be at least 20 characters");
  }

  return {
    name,
    email,
    subject: subject || "Portfolio inquiry",
    message
  };
}

function validateArticleCommentInput(input) {
  const website = normalizeWhitespace(input.website);
  if (website) {
    throw new Error("spam detected");
  }
  if (input.consent !== true) {
    throw new Error("comment consent is required");
  }

  const slug = requireArticleSlug(input.slug);
  const authorName = normalizeWhitespace(input.authorName);
  const authorRole = normalizeWhitespace(input.authorRole);
  const body = normalizeWhitespace(input.body);

  if (authorName.length < 2) {
    throw new Error("author name must be at least 2 characters");
  }
  if (body.length < 24) {
    throw new Error("comment must be at least 24 characters");
  }

  return {
    slug,
    authorName,
    authorRole,
    body
  };
}

function buildArticleStatsPayload({ slug, metrics = {}, comments = [] }) {
  const normalizedSlug = requireArticleSlug(slug);
  const ratingCount = Number(metrics.ratingCount ?? 0);
  const ratingSum = Number(metrics.ratingSum ?? 0);

  return {
    slug: normalizedSlug,
    title: SUPPORTED_ARTICLES[normalizedSlug].title,
    viewCount: Number(metrics.viewCount ?? 0),
    ratingCount,
    averageRating: ratingCount > 0 ? Number((ratingSum / ratingCount).toFixed(1)) : null,
    commentCount: Number(metrics.commentCount ?? comments.length ?? 0),
    comments: comments.map((comment) => ({
      id: Number(comment.id),
      authorName: normalizeWhitespace(comment.authorName),
      authorRole: normalizeWhitespace(comment.authorRole),
      body: normalizeWhitespace(comment.body),
      createdAt: comment.createdAt
    }))
  };
}

function buildSiteStatsPayload({ metrics = {}, likedByVisitor = false }) {
  return {
    key: SITE_PROFILE_KEY,
    viewCount: Number(metrics.viewCount ?? 0),
    likeCount: Number(metrics.likeCount ?? 0),
    githubStarCount:
      metrics.githubStarCount === null || metrics.githubStarCount === undefined
        ? null
        : Number(metrics.githubStarCount),
    githubStarsCheckedAt: metrics.githubStarsCheckedAt ?? null,
    likedByVisitor
  };
}

export {
  SITE_PROFILE_KEY,
  SUPPORTED_ARTICLES,
  buildArticleStatsPayload,
  buildSiteStatsPayload,
  normalizeRating,
  requireArticleSlug,
  validateArticleCommentInput,
  validateContactInput
};
