import { jsonError } from "./_lib/http.js";

export async function onRequest(context) {
  try {
    const response = await context.next();
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    return response;
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "internal server error", 500);
  }
}
