// AI Chat — talks to /api/chat, which proxies to z.ai with a server-side key.

(function() {
  const PROXY_URL = "/api/chat";

  let isOpen = false;
  let messages = [];
  let lang = localStorage.getItem("lang") || "en";

  const fab = document.getElementById("chat-fab");
  const panel = document.getElementById("chat-panel");
  const closeBtn = document.getElementById("chat-close");
  const body = document.getElementById("chat-body");
  const sugWrap = document.getElementById("chat-suggestions");
  const input = document.getElementById("chat-input");
  const sendBtn = document.getElementById("chat-send");

  function applyI18n() {
    if (!window.CONTENT || !window.CONTENT[lang]) return;
    const c = window.CONTENT[lang].chat || {};
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const k = el.dataset.i18n.split(".")[1];
      if (c[k]) el.textContent = c[k];
    });
    if (c.placeholder) input.placeholder = c.placeholder;
    renderSuggestions();
    if (messages.length === 0) renderWelcome();
  }

  function renderWelcome() {
    body.innerHTML = "";
    if (!window.CONTENT || !window.CONTENT[lang]) return;
    const c = window.CONTENT[lang].chat;
    appendMsg("bot", c.welcome);
  }

  function renderSuggestions() {
    sugWrap.innerHTML = "";
    if (!window.CONTENT || !window.CONTENT[lang]) return;
    const c = window.CONTENT[lang].chat;
    if (messages.length > 1) return;
    (c.suggestions || []).forEach(s => {
      const b = document.createElement("button");
      b.textContent = s;
      b.onclick = () => { input.value = s; send(); };
      sugWrap.appendChild(b);
    });
  }

  function appendMsg(who, text) {
    const div = document.createElement("div");
    div.className = `chat-msg ${who}`;
    div.textContent = text;
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
    return div;
  }

  function appendTyping() {
    const div = document.createElement("div");
    div.className = "chat-msg bot typing";
    div.innerHTML = "<span></span><span></span><span></span>";
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
    return div;
  }

  async function send() {
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    sendBtn.disabled = true;

    appendMsg("user", text);
    messages.push({ role: "user", content: text });
    sugWrap.innerHTML = "";

    const typing = appendTyping();

    try {
      const reply = await callClaude(messages);
      typing.remove();
      appendMsg("bot", reply);
      messages.push({ role: "assistant", content: reply });
    } catch (e) {
      console.error(e);
      typing.remove();
      const c = (window.CONTENT && window.CONTENT[lang]?.chat) || { error: "Unable to reach AI. Email ngocnghia128@gmail.com" };
      appendMsg("bot", c.error);
    } finally {
      sendBtn.disabled = false;
      input.focus();
    }
  }

  async function callClaude(msgs) {
    const res = await fetch(PROXY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: msgs }),
    });
    if (!res.ok) throw new Error("proxy " + res.status);
    const data = await res.json();
    if (data?.ok && typeof data.reply === "string" && data.reply.trim()) {
      return data.reply;
    }
    throw new Error(data?.error || "no content");
  }

  function toggle() {
    isOpen = !isOpen;
    panel.classList.toggle("open", isOpen);
    fab.classList.toggle("open", isOpen);
    if (isOpen) {
      if (messages.length === 0) renderWelcome();
      renderSuggestions();
      setTimeout(() => input.focus(), 300);
    }
  }

  fab.addEventListener("click", toggle);
  closeBtn.addEventListener("click", toggle);
  sendBtn.addEventListener("click", send);
  input.addEventListener("keydown", e => {
    if (e.key === "Enter") send();
  });

  window.addEventListener("lang-changed", e => {
    lang = e.detail.lang;
    applyI18n();
  });

  function waitForContent() {
    if (window.CONTENT && window.CONTENT[lang]) {
      applyI18n();
    } else {
      setTimeout(waitForContent, 50);
    }
  }
  waitForContent();
})();
