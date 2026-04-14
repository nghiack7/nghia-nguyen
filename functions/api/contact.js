import { recordContactMessage } from "../_lib/db.js";
import { validateContactInput } from "../_lib/engagement.js";
import { getVisitorToken, json, jsonError, readJson } from "../_lib/http.js";

export async function onRequestPost(context) {
  try {
    const payload = await readJson(context.request);
    const contact = validateContactInput(payload);
    const visitorToken = getVisitorToken(context.request, payload);
    const result = await recordContactMessage(context.env.DB, {
      visitorToken,
      payload: contact,
      request: context.request
    });

    return json({
      ok: true,
      accepted: result.accepted,
      message: result.accepted
        ? "Message received. Email or Telegram is still the fastest path for urgent work."
        : "This message already looks submitted. Email or Telegram is still the fastest path for urgent work."
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "invalid request", 400);
  }
}

export function onRequestOptions() {
  return json({ ok: true });
}
