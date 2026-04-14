import { formatCompactNumber, formatDate, getJson, postJson } from "./site-api.js";

function createCommentItem(comment) {
  const item = document.createElement("article");
  item.className = "comment-item";

  const header = document.createElement("div");
  header.className = "comment-head";

  const name = document.createElement("strong");
  name.className = "comment-author";
  name.textContent = comment.authorName;

  const meta = document.createElement("span");
  meta.className = "comment-meta";
  meta.textContent = [comment.authorRole, formatDate(comment.createdAt)].filter(Boolean).join(" · ");

  const body = document.createElement("p");
  body.className = "comment-body";
  body.textContent = comment.body;

  header.append(name, meta);
  item.append(header, body);
  return item;
}

function renderComments(root, comments) {
  const list = root.querySelector("[data-comment-list]");
  const empty = root.querySelector("[data-comment-empty]");
  list.innerHTML = "";

  if (!comments.length) {
    empty.hidden = false;
    return;
  }

  empty.hidden = true;
  comments.forEach((comment) => list.appendChild(createCommentItem(comment)));
}

function renderStats(root, stats, selectedRating = null) {
  root.querySelector("[data-view-count]").textContent = formatCompactNumber(stats.viewCount);
  root.querySelector("[data-rating-average]").textContent = stats.averageRating ? `${stats.averageRating}/5` : "No ratings";
  root.querySelector("[data-rating-count]").textContent = `${stats.ratingCount} rating${stats.ratingCount === 1 ? "" : "s"}`;
  root.querySelector("[data-comment-count]").textContent = `${stats.commentCount} comment${stats.commentCount === 1 ? "" : "s"}`;

  root.querySelectorAll("[data-rating-value]").forEach((button) => {
    const value = Number(button.dataset.ratingValue);
    const active = selectedRating ? value <= selectedRating : stats.averageRating ? value <= Math.round(stats.averageRating) : false;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(selectedRating === value));
  });

  renderComments(root, stats.comments || []);
}

function setStatus(root, selector, message, tone = "muted") {
  const element = root.querySelector(selector);
  if (!element) {
    return;
  }

  element.textContent = message;
  element.dataset.tone = tone;
}

async function initArticleEngagement(root) {
  const slug = root.dataset.articleSlug;
  let selectedRating = Number(window.localStorage.getItem(`rating:${slug}`) || 0);

  try {
    const viewed = await postJson("/api/article-view", { slug });
    renderStats(root, viewed.stats, selectedRating || null);
  } catch {
    try {
      const fallback = await getJson("/api/article-stats", { slug });
      renderStats(root, fallback.stats, selectedRating || null);
    } catch (error) {
      setStatus(root, "[data-rating-status]", error.message, "error");
    }
  }

  root.querySelectorAll("[data-rating-value]").forEach((button) => {
    button.addEventListener("click", async () => {
      const rating = Number(button.dataset.ratingValue);
      setStatus(root, "[data-rating-status]", "Submitting rating...", "muted");

      try {
        const response = await postJson("/api/article-rating", { slug, rating });
        selectedRating = rating;
        window.localStorage.setItem(`rating:${slug}`, String(rating));
        renderStats(root, response.stats, selectedRating);
        setStatus(root, "[data-rating-status]", "Rating saved.", "success");
      } catch (error) {
        setStatus(root, "[data-rating-status]", error.message, "error");
      }
    });
  });

  const form = root.querySelector("[data-comment-form]");
  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const payload = {
      slug,
      authorName: formData.get("authorName"),
      authorRole: formData.get("authorRole"),
      body: formData.get("body"),
      website: formData.get("website"),
      consent: formData.get("consent") === "on"
    };

    const submitButton = form.querySelector("button[type='submit']");
    submitButton.disabled = true;
    submitButton.textContent = "Publishing...";
    setStatus(root, "[data-comment-status]", "", "muted");

    try {
      const response = await postJson("/api/article-comment", payload);
      renderStats(root, response.stats, selectedRating || null);
      form.reset();
      setStatus(root, "[data-comment-status]", response.message, "success");
    } catch (error) {
      setStatus(root, "[data-comment-status]", error.message, "error");
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Post comment";
    }
  });
}

if (typeof document !== "undefined") {
  document.querySelectorAll("[data-article-slug]").forEach((root) => {
    initArticleEngagement(root);
  });
}
