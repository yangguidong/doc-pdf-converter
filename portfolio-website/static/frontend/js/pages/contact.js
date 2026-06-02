/** Contact Page — Form + Social Links */

import { api } from "../api.js";
import { escapeHtml, getPlatformIcon } from "../utils.js";
import { showToast } from "../components/toast.js";
import { initScrollReveal } from "../components/scroll-reveal.js";

export class ContactPage {
  constructor(container) {
    this.container = container;
  }

  async render() {
    this.container.innerHTML = `
      <section class="section" style="padding-top: calc(var(--nav-height) + 32px)">
        <div class="container">
          <div class="section-header" data-reveal>
            <h2 class="section-header__title">Get in Touch</h2>
            <p class="section-header__subtitle">Have a project in mind? Let's talk!</p>
          </div>
          <div class="contact-layout" id="contactLayout">
            <div class="contact-form" id="contactForm" data-reveal>
              <h3 class="contact-form__title">Send a Message</h3>
              <form id="contactFormInner">
                <div class="form-group">
                  <label class="form-label" for="cfName">Name *</label>
                  <input type="text" class="form-input" id="cfName" required placeholder="Your name">
                </div>
                <div class="form-group">
                  <label class="form-label" for="cfEmail">Email *</label>
                  <input type="email" class="form-input" id="cfEmail" required placeholder="you@example.com">
                </div>
                <div class="form-group">
                  <label class="form-label" for="cfMessage">Message *</label>
                  <textarea class="form-textarea" id="cfMessage" required placeholder="Tell me about your project..."></textarea>
                </div>
                <button type="submit" class="btn btn-primary btn-lg" style="width:100%">Send Message</button>
              </form>
            </div>
            <div class="contact-social" data-reveal id="contactSocial"></div>
          </div>
        </div>
      </section>
    `;

    this._bindForm();
    await this._loadSocial();
    initScrollReveal();
  }

  _bindForm() {
    const form = document.getElementById("contactFormInner");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = form.querySelector("button");
      btn.disabled = true;
      btn.textContent = "Sending...";

      try {
        await api.submitContact({
          name: document.getElementById("cfName").value.trim(),
          email: document.getElementById("cfEmail").value.trim(),
          message: document.getElementById("cfMessage").value.trim(),
        });

        // Show success
        const contactForm = document.getElementById("contactForm");
        contactForm.innerHTML = `
          <div class="contact-success">
            <div class="contact-success__icon">✅</div>
            <h3>Thank You!</h3>
            <p>Your message has been sent. I'll get back to you soon.</p>
          </div>
        `;
        showToast("Message sent successfully!", "success");
      } catch (err) {
        showToast(err.message || "Failed to send message", "error");
        btn.disabled = false;
        btn.textContent = "Send Message";
      }
    });
  }

  async _loadSocial() {
    const container = document.getElementById("contactSocial");
    try {
      const data = await api.getSocialLinks();
      const links = data.social_links || [];

      container.innerHTML = `
        <h3 class="contact-social__title">Connect</h3>
        <p style="color:var(--color-text-muted);margin-bottom:16px">Find me on social media</p>
        <div class="contact-social__list">
          ${links
            .map(
              (s) => `
            <a href="${s.url}" target="_blank" rel="noopener" class="contact-social__item">
              <div class="contact-social__icon">${getPlatformIcon(s.platform)}</div>
              <div>
                <div style="font-weight:var(--font-weight-semibold)">${escapeHtml(s.label)}</div>
                <div style="font-size:var(--font-size-xs);color:var(--color-text-muted)">${escapeHtml(s.platform)}</div>
              </div>
            </a>
          `
            )
            .join("")}
        </div>
      `;
    } catch (err) {
      console.error("Failed to load social links:", err);
    }
  }

  destroy() {}
}
