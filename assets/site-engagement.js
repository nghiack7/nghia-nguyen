import { formatCompactNumber, getJson, postJson } from "./site-api.js";

const LIKE_STORAGE_KEY = "nghia-site-liked-v1";

function setText(root, selector, value) {
  const element = root.querySelector(selector);
  if (element) {
    element.textContent = value;
  }
}

function renderStats(root, stats) {
  setText(root, "[data-site-view-count]", formatCompactNumber(stats.viewCount));
  setText(root, "[data-site-like-count]", formatCompactNumber(stats.likeCount));
  setText(
    root,
    "[data-github-star-count]",
    stats.githubStarCount === null ? "--" : formatCompactNumber(stats.githubStarCount)
  );

  const liked = stats.likedByVisitor || window.localStorage.getItem(LIKE_STORAGE_KEY) === "1";
  const likeButton = root.querySelector("[data-site-like-button]");
  if (likeButton) {
    likeButton.classList.toggle("liked", liked);
    likeButton.setAttribute("aria-pressed", String(liked));
    likeButton.disabled = liked;
  }
}

function setStatus(root, message, tone = "muted") {
  const status = root.querySelector("[data-site-stats-status]");
  if (!status) {
    return;
  }

  status.textContent = message;
  status.dataset.tone = tone;
}

async function loadStats(root) {
  try {
    const response = await postJson("/api/site-view", {});
    renderStats(root, response.stats);
    setStatus(root, "");
  } catch {
    try {
      const fallback = await getJson("/api/site-stats");
      renderStats(root, fallback.stats);
      setStatus(root, "Live stats loaded without recording this visit.");
    } catch {
      setStatus(root, "Live stats temporarily unavailable.", "error");
    }
  }
}

function initSiteEngagement(root) {
  loadStats(root);

  const likeButton = root.querySelector("[data-site-like-button]");
  likeButton?.addEventListener("click", async () => {
    if (likeButton.disabled) {
      return;
    }

    likeButton.disabled = true;
    setStatus(root, "Saving like...");

    try {
      const response = await postJson("/api/site-like", {});
      window.localStorage.setItem(LIKE_STORAGE_KEY, "1");
      renderStats(root, response.stats);
      setStatus(root, "Thanks. Like saved.", "success");
    } catch (error) {
      likeButton.disabled = false;
      setStatus(root, error.message, "error");
    }
  });
}

if (typeof document !== "undefined") {
  document.querySelectorAll("[data-site-engagement]").forEach((root) => {
    initSiteEngagement(root);
  });
}
