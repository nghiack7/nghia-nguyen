function json(data, init = {}) {
  const headers = new Headers(init.headers || {});
  if (!headers.has("content-type")) {
    headers.set("content-type", "application/json; charset=utf-8");
  }

  return new Response(JSON.stringify(data), {
    ...init,
    headers
  });
}

function jsonError(message, status = 400, extras = {}) {
  return json(
    {
      ok: false,
      error: message,
      ...extras
    },
    { status }
  );
}

async function readJson(request) {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error("content-type must be application/json");
  }
  return request.json();
}

async function sha256Hex(input) {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function getVisitorToken(request, payload = {}) {
  const headerToken = String(request.headers.get("x-visitor-token") || "");
  const payloadToken = String(payload.visitorToken || "");
  const token = (headerToken || payloadToken).trim();
  if (!token || token.length < 12 || token.length > 128) {
    throw new Error("visitor token is required");
  }
  return token;
}

function getOptionalVisitorToken(request) {
  const token = String(request.headers.get("x-visitor-token") || "").trim();
  if (!token) {
    return null;
  }
  if (token.length < 12 || token.length > 128) {
    return null;
  }
  return token;
}

function getClientIp(request) {
  return request.headers.get("CF-Connecting-IP") || "0.0.0.0";
}

function getUserAgent(request) {
  return request.headers.get("user-agent") || "unknown";
}

export { getClientIp, getOptionalVisitorToken, getUserAgent, getVisitorToken, json, jsonError, readJson, sha256Hex };
