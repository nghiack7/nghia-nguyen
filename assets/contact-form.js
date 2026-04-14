import { postJson } from "./site-api.js";

const form = typeof document !== "undefined" ? document.getElementById("contactForm") : null;

if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitButton = document.getElementById("submitBtn");
    const status = document.getElementById("contactStatus");
    const formData = new FormData(form);
    const payload = {
      name: formData.get("name"),
      email: formData.get("email"),
      subject: formData.get("subject"),
      message: formData.get("message"),
      company: formData.get("company")
    };

    submitButton.disabled = true;
    submitButton.innerHTML = "Sending...";
    status.textContent = "";
    status.dataset.tone = "muted";

    try {
      const response = await postJson("/api/contact", payload);
      submitButton.innerHTML = "Sent";
      status.textContent = response.message;
      status.dataset.tone = "success";
      form.reset();
    } catch (error) {
      submitButton.innerHTML = "Send Message";
      status.textContent = `${error.message}. Email or Telegram is the fallback path.`;
      status.dataset.tone = "error";
      submitButton.disabled = false;
      return;
    }

    window.setTimeout(() => {
      submitButton.innerHTML = "Send Message";
      submitButton.disabled = false;
    }, 2400);
  });
}
