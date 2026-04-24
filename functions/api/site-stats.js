import { getOptionalVisitorToken, json, jsonError } from "../_lib/http.js";
import { getHydratedSiteStats } from "../_lib/site-stats.js";

export async function onRequestGet(context) {
  try {
    const visitorToken = getOptionalVisitorToken(context.request);
    const stats = await getHydratedSiteStats(context.env.DB, { visitorToken });
    return json({ ok: true, stats });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "invalid request", 400);
  }
}
