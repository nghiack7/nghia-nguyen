import { requireArticleSlug } from "../_lib/engagement.js";
import { getArticleStats } from "../_lib/db.js";
import { json, jsonError } from "../_lib/http.js";

export async function onRequestGet(context) {
  try {
    const slug = context.request ? new URL(context.request.url).searchParams.get("slug") : null;
    if (!slug) {
      return jsonError("slug is required");
    }

    const stats = await getArticleStats(context.env.DB, requireArticleSlug(slug));
    return json({ ok: true, stats });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "invalid request", 400);
  }
}
