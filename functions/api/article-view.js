import { requireArticleSlug } from "../_lib/engagement.js";
import { recordArticleView } from "../_lib/db.js";
import { getVisitorToken, json, jsonError, readJson } from "../_lib/http.js";

export async function onRequestPost(context) {
  try {
    const payload = await readJson(context.request);
    const slug = requireArticleSlug(payload.slug);
    const visitorToken = getVisitorToken(context.request, payload);

    const stats = await recordArticleView(context.env.DB, {
      slug,
      visitorToken,
      request: context.request
    });

    return json({ ok: true, stats });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "invalid request", 400);
  }
}

export function onRequestOptions() {
  return json({ ok: true });
}
