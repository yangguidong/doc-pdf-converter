/** Home Page — Hero + Featured Works */

import { api } from "../api.js";
import { escapeHtml } from "../utils.js";
import { renderCarousel } from "../components/carousel.js";
import { initParallax } from "../components/parallax.js";

export class HomePage {
  constructor(container) {
    this.container = container;
  }

  async render() {
    this.container.innerHTML = `<section class="hero" id="hero"><div style="text-align:center;color:rgba(255,255,255,0.5);padding-top:40vh">Loading...</div></section>`;

    try {
      const [heroData, featuredRes] = await Promise.all([
        api.getHero(),
        api.getWorks({ featured: "true", per_page: 8 }),
      ]);

      const hero = heroData;
      const featured = featuredRes.works || [];

      let bgStyle = `background: linear-gradient(135deg, ${hero.gradient_start}, ${hero.gradient_end})`;
      if (hero.background_type === "image" && hero.background_url) {
        bgStyle += `; background-image: url(${hero.background_url}); background-size: cover; background-position: center`;
      }

      this.container.innerHTML = `
        <section class="hero" id="hero" style="${bgStyle}">
          ${hero.background_type === "video" && hero.background_url ? `<video class="hero-bg-video" autoplay muted loop playsinline src="${hero.background_url}"></video>` : ""}
          <div class="hero-parallax-layer"></div>
          <div class="hero-content">
            <p class="hero-greeting">${escapeHtml(hero.greeting_text)}</p>
            <h1 class="hero-name">${escapeHtml(hero.name)}</h1>
            <p class="hero-tagline">${escapeHtml(hero.tagline || "")}</p>
            <div class="hero-actions">
              <a href="#/works" class="btn btn-primary btn-lg">View Works</a>
              <a href="#/about" class="btn btn-secondary btn-lg">About Me</a>
            </div>
          </div>
          ${hero.show_scroll_hint ? `<div class="hero-scroll"><span></span></div>` : ""}
        </section>

        ${featured.length ? `
        <section class="section featured-section">
          <div class="container">
            <div class="section-header" data-reveal>
              <h2 class="section-header__title">Featured Works</h2>
              <p class="section-header__subtitle">A selection of my best projects</p>
            </div>
            <div class="featured-carousel" id="featuredCarousel" data-reveal></div>
          </div>
        </section>
        ` : ""}
      `;

      // Render carousel
      const carouselContainer = document.getElementById("featuredCarousel");
      if (carouselContainer && featured.length) {
        renderCarousel(carouselContainer, featured);
      }

      // Parallax
      initParallax();

    } catch (err) {
      this.container.innerHTML = `
        <section class="hero" style="background: linear-gradient(135deg, #0f172a, #334155)">
          <div class="hero-content">
            <p class="hero-greeting">Hello, I am</p>
            <h1 class="hero-name">Artist Name</h1>
            <p class="hero-tagline">Artist &amp; Designer</p>
            <div class="hero-actions">
              <a href="#/works" class="btn btn-primary btn-lg">View Works</a>
              <a href="#/about" class="btn btn-secondary btn-lg">About Me</a>
            </div>
          </div>
          <div class="hero-scroll"><span></span></div>
        </section>
      `;
      console.error("Failed to load home page:", err);
    }
  }

  destroy() {}
}
