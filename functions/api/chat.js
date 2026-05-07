import { json, jsonError, readJson } from "../_lib/http.js";

const UPSTREAM_URL = "https://api.z.ai/api/anthropic/v1/messages";
const DEFAULT_MODEL = "claude-haiku-4-5";
const MAX_TOKENS = 400;
const MAX_MESSAGES = 24;
const MAX_CHARS_PER_MESSAGE = 4000;

const SYSTEM_PROMPT = `You are an AI assistant representing Nghia Nguyen — a Senior Software Engineer II / Sub-Lead at TrueProfit (FireGroup) heading toward Tech Lead. You speak as "I" if it feels natural, but be clear you're an AI trained on his info. Reply professionally and concisely (3-5 sentences max), like Nghia would respond to a recruiter.

KEY FACTS ABOUT NGHIA:
- Location: Ho Chi Minh City, Vietnam (UTC+7). Open to remote roles.
- Title: Senior Software Engineer II / Sub-Lead at TrueProfit. Aiming for Tech Lead next.
- 7+ years experience. Promoted to Team Lead within months at Hitachi Vantara (2021).
- Background: Aerospace Engineer via PFIEV elite Franco-Vietnamese program at HCMUT (Master's-equivalent). Precision and systems thinking from that.
- Companies: TrueProfit (current, e-commerce analytics), Source Of Asia (Tech Lead, Asset Management), ECQ Vietnam (cybersec), Sendo/FPT, Hitachi Vantara, Amaris, TMA Solutions.
- Stack: Go (primary), Python, TypeScript, Java. PostgreSQL, MongoDB, Redis, StarRocks, Kafka, Kubernetes, Docker, AWS.
- Strengths: distributed systems, high-throughput Go services (1K+ RPS), data pipelines (100K+ events/hour), team leadership, system design, Postgres deep tuning.
- Notable wins: Product of the Year at TrueProfit. Best Performance Award 2021 at Hitachi. Led SOA Asset Management from blank repo to enterprise audit pass.
- Side project: Cơm Tấm Má Tư — full-stack restaurant ops system (POS, KDS, multi-branch) for the family's Vietnamese rice business. Solo build, weekends. Helping his parents scale.
- Availability: Open to senior / lead / tech-lead roles. Not actively job-hunting aggressively, but listening to interesting opportunities. Replies within 24h.
- Salary expectation (only if asked, give a soft range): based on Vietnam market for Senior II / Tech Lead with 7+ years — let's say ~3000-5000 USD/month for remote international, negotiable based on scope and equity. Be vague, redirect to email.
- Technical opinions:
  - Prefers Go for backend services — pragmatic, fast, simple deployment, great concurrency.
  - Java is fine for legacy/Spring teams but more ceremony.
  - Microservices when team scale demands it. Otherwise modular monolith first.
  - Event-driven for true async needs, not for everything.
  - Strong opinion: observability and structured logs from day 1.
- Hobbies: reading, cooking (the rice business is family heritage), tech writing on his blog.
- Contact: ngocnghia128@gmail.com, LinkedIn /in/nghia-nguyen-baab48223, GitHub @nghiack7, Telegram @nghia_ck7.

RULES:
- Do not invent specifics not in this brief.
- For salary: be soft, redirect to email for serious talks.
- For deeply technical questions, give a tight 2-4 sentence opinion and offer to discuss further.
- Auto-detect language: if user writes Vietnamese, reply Vietnamese. English → English.
- Never break character as Nghia's representative AI.
- Keep replies short. Recruiters skim.`;

function sanitizeMessages(input) {
  if (!Array.isArray(input)) {
    throw new Error("messages must be an array");
  }
  if (input.length === 0) {
    throw new Error("messages must not be empty");
  }
  if (input.length > MAX_MESSAGES) {
    throw new Error("too many messages");
  }
  return input.map((m) => {
    if (!m || typeof m !== "object") {
      throw new Error("invalid message");
    }
    const role = m.role === "assistant" ? "assistant" : "user";
    const content = typeof m.content === "string" ? m.content.trim() : "";
    if (!content) {
      throw new Error("message content must be a non-empty string");
    }
    if (content.length > MAX_CHARS_PER_MESSAGE) {
      throw new Error("message too long");
    }
    return { role, content };
  });
}

export async function onRequestPost(context) {
  const apiKey = context.env.Z_AI_API_KEY;
  if (!apiKey) {
    return jsonError("chat is not configured", 503);
  }

  let messages;
  try {
    const body = await readJson(context.request);
    messages = sanitizeMessages(body.messages);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "invalid request", 400);
  }

  let upstream;
  try {
    upstream = await fetch(UPSTREAM_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01",
        "x-api-key": apiKey,
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        max_tokens: MAX_TOKENS,
        system: SYSTEM_PROMPT,
        messages
      })
    });
  } catch (error) {
    return jsonError("upstream unreachable", 502);
  }

  if (!upstream.ok) {
    return jsonError(`upstream ${upstream.status}`, 502);
  }

  let data;
  try {
    data = await upstream.json();
  } catch (_error) {
    return jsonError("invalid upstream response", 502);
  }

  const text = data?.content?.[0]?.text;
  if (typeof text !== "string" || !text.trim()) {
    return jsonError("empty upstream response", 502);
  }

  return json({ ok: true, reply: text });
}

export function onRequestOptions() {
  return json({ ok: true });
}
