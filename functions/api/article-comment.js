import { validateArticleCommentInput } from "../_lib/engagement.js";
import { recordArticleComment } from "../_lib/db.js";
import { getVisitorToken, json, jsonError, readJson } from "../_lib/http.js";

export async function onRequestPost(context) {
  try {
    const payload = await readJson(context.request);
    const comment = validateArticleCommentInput(payload);
    const visitorToken = getVisitorToken(context.request, payload);

    const stats = await recordArticleComment(context.env.DB, {
      ...comment,
      visitorToken
    });

    return json({
      ok: true,
      message: "Comment published.",
      stats
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "invalid request", 400);
  }
}

export function onRequestOptions() {
  return json({ ok: true });
}
