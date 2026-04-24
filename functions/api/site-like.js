import { recordSiteLike } from "../_lib/db.js";
import { getVisitorToken, json, jsonError, readJson } from "../_lib/http.js";
import { getHydratedSiteStats } from "../_lib/site-stats.js";

export async function onRequestPost(context) {
  try {
    const payload = await readJson(context.request);
    const visitorToken = getVisitorToken(context.request, payload);

    await recordSiteLike(context.env.DB, {
      visitorToken
    });

    const stats = await getHydratedSiteStats(context.env.DB, { visitorToken });
    return json({ ok: true, stats });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "invalid request", 400);
  }
}

export function onRequestOptions() {
  return json({ ok: true });
}
