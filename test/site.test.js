import test from "node:test";
import assert from "node:assert/strict";

import {
  SITE_PROFILE_KEY,
  SUPPORTED_ARTICLES,
  buildArticleStatsPayload,
  buildSiteStatsPayload,
  normalizeRating,
  validateArticleCommentInput,
  validateContactInput
} from "../functions/_lib/engagement.js";
import { isGithubStarCacheStale } from "../functions/_lib/db.js";
import { fetchGithubStarCount } from "../functions/_lib/github.js";

test("SUPPORTED_ARTICLES exposes expected slugs", () => {
  assert.deepEqual(
    Object.keys(SUPPORTED_ARTICLES).sort(),
    ["kafka-oom-pipeline", "revenue-reconciliation-fix"]
  );
});

test("normalizeRating accepts integer values from one to five", () => {
  assert.equal(normalizeRating(5), 5);
  assert.equal(normalizeRating("3"), 3);
  assert.throws(() => normalizeRating(0), /rating must be between 1 and 5/i);
  assert.throws(() => normalizeRating(5.5), /rating must be a whole number/i);
});

test("validateContactInput trims fields and rejects invalid payloads", () => {
  assert.deepEqual(
    validateContactInput({
      name: "  Nghia Nguyen ",
      email: " nghia@example.com ",
      subject: " Portfolio ",
      message: " Need help with a Cloudflare rollout. ",
      company: ""
    }),
    {
      name: "Nghia Nguyen",
      email: "nghia@example.com",
      subject: "Portfolio",
      message: "Need help with a Cloudflare rollout."
    }
  );

  assert.throws(
    () =>
      validateContactInput({
        name: "",
        email: "bad-email",
        subject: "",
        message: "short",
        company: ""
      }),
    /valid email/i
  );
});

test("validateArticleCommentInput rejects honeypot spam and overly short comments", () => {
  assert.deepEqual(
    validateArticleCommentInput({
      slug: "kafka-oom-pipeline",
      authorName: "  Alex Chen ",
      authorRole: "Staff Engineer",
      body: "This was one of the better write-ups I've seen on taming backpressure in a Go pipeline.",
      website: "",
      consent: true
    }),
    {
      slug: "kafka-oom-pipeline",
      authorName: "Alex Chen",
      authorRole: "Staff Engineer",
      body: "This was one of the better write-ups I've seen on taming backpressure in a Go pipeline."
    }
  );

  assert.throws(
    () =>
      validateArticleCommentInput({
        slug: "kafka-oom-pipeline",
        authorName: "Spam Bot",
        authorRole: "",
        body: "Looks good",
        website: "https://spam.example",
        consent: true
      }),
    /spam/i
  );
});

test("buildArticleStatsPayload derives averages and UI-friendly counts", () => {
  assert.deepEqual(
    buildArticleStatsPayload({
      slug: "revenue-reconciliation-fix",
      metrics: {
        viewCount: 1284,
        ratingSum: 23,
        ratingCount: 5,
        commentCount: 2
      },
      comments: [
        {
          id: 11,
          authorName: "Taylor",
          authorRole: "Principal Engineer",
          body: "Clear explanation of why source-of-truth recalculation beats patching around bad accounting drift.",
          createdAt: "2026-04-12T10:00:00.000Z"
        }
      ]
    }),
    {
      slug: "revenue-reconciliation-fix",
      title: "When Every Dollar Counts: Rewriting Revenue From Source of Truth",
      viewCount: 1284,
      ratingCount: 5,
      averageRating: 4.6,
      commentCount: 2,
      comments: [
        {
          id: 11,
          authorName: "Taylor",
          authorRole: "Principal Engineer",
          body: "Clear explanation of why source-of-truth recalculation beats patching around bad accounting drift.",
          createdAt: "2026-04-12T10:00:00.000Z"
        }
      ]
    }
  );
});

test("buildSiteStatsPayload normalizes nullable GitHub stars and like state", () => {
  assert.deepEqual(
    buildSiteStatsPayload({
      metrics: {
        viewCount: "12",
        likeCount: "4",
        githubStarCount: null,
        githubStarsCheckedAt: null
      },
      likedByVisitor: true
    }),
    {
      key: SITE_PROFILE_KEY,
      viewCount: 12,
      likeCount: 4,
      githubStarCount: null,
      githubStarsCheckedAt: null,
      likedByVisitor: true
    }
  );
});

test("isGithubStarCacheStale refreshes missing and old GitHub star data", () => {
  const now = new Date("2026-04-23T12:00:00.000Z");

  assert.equal(isGithubStarCacheStale({ githubStarCount: null }, now), true);
  assert.equal(
    isGithubStarCacheStale(
      {
        githubStarCount: null,
        githubStarsCheckedAt: "2026-04-23T07:00:00.000Z"
      },
      now
    ),
    false
  );
  assert.equal(
    isGithubStarCacheStale(
      {
        githubStarCount: 10,
        githubStarsCheckedAt: "2026-04-23T07:00:00.000Z"
      },
      now
    ),
    false
  );
  assert.equal(
    isGithubStarCacheStale(
      {
        githubStarCount: 10,
        githubStarsCheckedAt: "2026-04-23T05:00:00.000Z"
      },
      now
    ),
    true
  );
});

test("fetchGithubStarCount sums paginated repository stars", async () => {
  const calls = [];
  const total = await fetchGithubStarCount(async (url) => {
    calls.push(url);
    const page = new URL(url).searchParams.get("page");

    if (page === "1") {
      return Response.json(
        Array.from({ length: 100 }, (_, index) => ({
          stargazers_count: index === 0 ? 3 : 0
        }))
      );
    }

    return Response.json([
      {
        stargazers_count: 7
      }
    ]);
  });

  assert.equal(total, 10);
  assert.equal(calls.length, 2);
});
