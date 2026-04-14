import test from "node:test";
import assert from "node:assert/strict";

import {
  SUPPORTED_ARTICLES,
  buildArticleStatsPayload,
  normalizeRating,
  validateArticleCommentInput,
  validateContactInput
} from "../functions/_lib/engagement.js";

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
