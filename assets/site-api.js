const VISITOR_STORAGE_KEY = "nghia-site-visitor-token-v1";

function generateVisitorToken() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `visitor-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getOrCreateVisitorToken() {
  const existing = window.localStorage.getItem(VISITOR_STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const token = generateVisitorToken();
  window.localStorage.setItem(VISITOR_STORAGE_KEY, token);
  return token;
}

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : null;

  if (!response.ok) {
    const message = payload?.error || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload;
}

async function postJson(path, body) {
  const visitorToken = getOrCreateVisitorToken();
  const response = await fetch(new URL(path, window.location.origin), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-visitor-token": visitorToken
    },
    body: JSON.stringify({
      ...body,
      visitorToken
    })
  });

  return parseResponse(response);
}

async function getJson(path, params = {}) {
  const url = new URL(path, window.location.origin);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });

  const response = await fetch(url);
  return parseResponse(response);
}

function formatCompactNumber(value) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: value >= 1000 ? 1 : 0
  }).format(value || 0);
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

export { formatCompactNumber, formatDate, getJson, getOrCreateVisitorToken, postJson };
