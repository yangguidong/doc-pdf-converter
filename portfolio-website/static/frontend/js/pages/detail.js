/** Work Detail Page — Slider + Video + Info + Related */

import { api } from "../api.js";
import { escapeHtml, formatDate } from "../utils.js";
import { renderImageSlider } from "../components/image-slider.js";
import { renderVideoPlayer } from "../components/video-player.js";
import { renderShareButtons, initShareEvents } from "../components/share-buttons.js";
import { renderWorkCard } from "../components/work-card.js";
import { initScrollReveal } from "../components/scroll-reveal.js";

export class DetailPage {
  constructor(container) {
    this.container = container;
    this.params = {};
  }

  async render() {
    const slug = this.params.slug;
    this.container.innerHTML = `
      <section class="section" style="padding-top: 100px">
        <div class="container"><div style="text-align:center;padding:80px 0">Loading...</div></div>
      </section>`;

    try {
      const [workData, relatedData] = await Promise.all([
        api.getWork(slug),
        api.getRelatedWorks(slug),
      ]);

      const work = workData.work;
      const related = relatedData.works || [];

      const shareHtml = renderShareButtons(work);

      this.container.innerHTML = `
        <section class="section" style="padding-top: calc(var(--nav-height) + 32px)">
          <div class="container">
            <!-- Back link -->
            <a href="#/works" style="display:inline-block;margin-bottom:24px;font-size:14px;color:var(--color-text-muted)">&larr; Back to Works</a>

            <!-- Gallery or Video -->
            ${work.videos && work.videos.length ? renderVideoPlayer(work.videos[0]) : ""}
            <div class="detail-slider-container" id="detailSliderContainer"></div>

            <!-- Content -->
            <div class="detail-layout">
              <div class="detail-main">
                <h1 class="detail-title">${escapeHtml(work.title)}</h1>
                ${work.subtitle ? `<p class="detail-subtitle">${escapeHtml(work.subtitle)}</p>` : ""}

                <div class="detail-meta">
                  ${work.date_created ? `<span>📅 ${formatDate(work.date_created)}</span>` : ""}
                  <span>🏷️ ${escapeHtml(work.category)}</span>
                  ${work.view_count ? `<span>👁️ ${work.view_count} views</span>` : ""}
                </div>

                ${work.tools && work.tools.length ? `
                  <div class="detail-tools">
                    ${work.tools.map((t) => `<span class="detail-tool-tag">${escapeHtml(t)}</span>`).join("")}
                  </div>
                ` : ""}

                ${work.description ? `
                  <div class="detail-description">${work.description.replace(/\n/g, "<br>")}</div>
                ` : ""}

                ${shareHtml}
              </div>

              <div class="detail-sidebar">
                ${work.videos && work.videos.length > 1 ? `
                  <div style="margin-bottom:24px">
                    <h3 style="margin-bottom:12px">More Videos</h3>
                    ${work.videos.slice(1).map((v) => renderVideoPlayer(v)).join("")}
                  </div>
                ` : ""}
              </div>
            </div>

            <!-- Related Works -->
            ${related.length ? `
            <div class="related-works">
              <h3 class="section-header__title" style="text-align:left">Related Works</h3>
              <div class="related-grid" id="relatedGrid"></div>
            </div>
            ` : ""}
          </div>
        </section>
      `;

      // Render slider
      const sliderContainer = document.getElementById("detailSliderContainer");
      if (sliderContainer && work.gallery && work.gallery.length) {
        renderImageSlider(sliderContainer, work.gallery);
      }

      // Init share buttons
      initShareEvents(this.container);

      // Related works grid
      const relatedGrid = document.getElementById("relatedGrid");
      if (relatedGrid) {
        related.forEach((w) => relatedGrid.appendChild(renderWorkCard(w)));
      }

      initScrollReveal();

    } catch (err) {
      this.container.innerHTML = `
        <section class="section" style="padding-top: 100px">
          <div class="container" style="text-align:center;padding:80px 0">
            <h2>Work not found</h2>
            <p style="margin-top:16px"><a href="#/works">Back to portfolio</a></p>
          </div>
        </section>`;
      console.error("Failed to load work detail:", err);
    }
  }

  destroy() {}
}
