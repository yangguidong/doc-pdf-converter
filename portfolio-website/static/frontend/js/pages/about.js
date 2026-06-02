/** About Page — Profile + Timeline */

import { api } from "../api.js";
import { escapeHtml } from "../utils.js";
import { initScrollReveal } from "../components/scroll-reveal.js";

export class AboutPage {
  constructor(container) {
    this.container = container;
  }

  async render() {
    this.container.innerHTML = `
      <section class="section" style="padding-top: calc(var(--nav-height) + 32px)">
        <div class="container"><div style="text-align:center;padding:80px 0">Loading...</div></div>
      </section>`;

    try {
      const [profile, exhibitionsData] = await Promise.all([
        api.getProfile(),
        api.getExhibitions({}),
      ]);

      const exhibitions = exhibitionsData.exhibitions || [];

      this.container.innerHTML = `
        <section class="section" style="padding-top: calc(var(--nav-height) + 32px)">
          <div class="container">
            <div class="section-header" data-reveal>
              <h2 class="section-header__title">About Me</h2>
            </div>

            <div class="about-layout">
              <div class="about-photo" data-reveal>
                ${profile.avatar_url ? `<img src="${profile.avatar_url}" alt="${escapeHtml(profile.name)}">` : `<div style="width:240px;height:240px;border-radius:16px;background:var(--color-bg-muted);margin:0 auto;display:flex;align-items:center;justify-content:center;font-size:4rem">👤</div>`}
              </div>
              <div data-reveal>
                <h3>${escapeHtml(profile.name)}</h3>
                ${profile.tagline ? `<p class="lead">${escapeHtml(profile.tagline)}</p>` : ""}
                ${profile.bio ? `<div class="about-bio">${profile.bio.replace(/\n/g, "<br>")}</div>` : ""}
                ${profile.artistic_philosophy ? `
                  <div class="about-philosophy">
                    <h4 class="about-philosophy__title">Artistic Philosophy</h4>
                    <p style="color:var(--color-text-secondary)">${profile.artistic_philosophy.replace(/\n/g, "<br>")}</p>
                  </div>
                ` : ""}

                ${profile.location ? `<p style="margin-top:16px;color:var(--color-text-muted)">📍 ${escapeHtml(profile.location)}</p>` : ""}
                ${profile.email ? `<p style="color:var(--color-text-muted)">✉️ <a href="mailto:${profile.email}">${escapeHtml(profile.email)}</a></p>` : ""}
              </div>
            </div>

            ${exhibitions.length ? `
            <div class="section-header" data-reveal style="margin-top:var(--space-3xl)">
              <h3 class="section-header__title">Exhibitions & Awards</h3>
            </div>
            <div class="timeline" data-reveal>
              ${exhibitions
                .map(
                  (ex) => `
                <div class="timeline-item ${ex.type ? "timeline-item--" + ex.type : ""}">
                  <div class="timeline-item__date">${escapeHtml(ex.date_display)}</div>
                  <div class="timeline-item__title">${escapeHtml(ex.title)}</div>
                  ${ex.venue ? `<div class="timeline-item__venue">${escapeHtml(ex.venue)}</div>` : ""}
                  ${ex.description ? `<div class="timeline-item__desc">${escapeHtml(ex.description)}</div>` : ""}
                </div>
              `
                )
                .join("")}
            </div>
            ` : ""}
          </div>
        </section>
      `;

      initScrollReveal();

    } catch (err) {
      this.container.innerHTML = `
        <section class="section" style="padding-top: 100px">
          <div class="container" style="text-align:center;padding:80px 0">
            <h2>About</h2>
            <p>Failed to load profile information.</p>
          </div>
        </section>`;
      console.error("Failed to load about page:", err);
    }
  }

  destroy() {}
}
