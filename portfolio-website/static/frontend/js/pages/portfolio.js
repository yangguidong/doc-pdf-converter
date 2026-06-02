/** Portfolio List Page — Filters + Grid + Infinite Scroll */

import { api } from "../api.js";
import { escapeHtml, debounce } from "../utils.js";
import { renderWorkCard } from "../components/work-card.js";
import { initScrollReveal } from "../components/scroll-reveal.js";

export class PortfolioPage {
  constructor(container) {
    this.container = container;
    this.currentCategory = "all";
    this.currentPage = 1;
    this.hasMore = true;
    this.isLoading = false;
    this.observer = null;
    this.searchTerm = "";
  }

  async render() {
    this.container.innerHTML = `
      <section class="section portfolio-page">
        <div class="container">
          <div class="section-header" data-reveal>
            <h2 class="section-header__title">Portfolio</h2>
            <p class="section-header__subtitle">Explore my works</p>
          </div>
          <div class="filter-bar" id="filterBar" data-reveal>
            <button class="filter-btn active" data-cat="all">All</button>
          </div>
          <div style="text-align:center;margin-bottom:16px">
            <input type="text" class="form-input" id="workSearch" placeholder="Search works..." style="max-width:400px;display:inline-block">
          </div>
          <div class="works-grid" id="worksGrid"></div>
          <div class="scroll-sentinel" id="scrollSentinel"></div>
        </div>
      </section>
    `;

    await this._loadCategories();
    await this._loadWorks(true);
    this._bindFilters();
    this._bindInfiniteScroll();
    this._bindSearch();
  }

  async _loadCategories() {
    try {
      const data = await api.getWorkCategories();
      const filterBar = document.getElementById("filterBar");
      (data.categories || []).forEach((cat) => {
        const btn = document.createElement("button");
        btn.className = "filter-btn";
        btn.dataset.cat = cat.name;
        btn.textContent = `${cat.name} (${cat.count})`;
        filterBar.appendChild(btn);
      });
    } catch (e) {
      console.error("Failed to load categories:", e);
    }
  }

  async _loadWorks(reset = false) {
    if (this.isLoading) return;
    this.isLoading = true;

    if (reset) {
      this.currentPage = 1;
      this.hasMore = true;
      document.getElementById("worksGrid").innerHTML = "";
    }

    try {
      const params = { page: this.currentPage, per_page: 12 };
      if (this.currentCategory !== "all") params.category = this.currentCategory;
      if (this.searchTerm) params.search = this.searchTerm;
      if (this.currentPage > 1 && !this.searchTerm && this.currentCategory === "all") {
        params.featured = "false";
      }

      const data = await api.getWorks(params);
      const grid = document.getElementById("worksGrid");

      if (data.works.length === 0 && this.currentPage === 1) {
        grid.innerHTML = `
          <div class="empty-state" style="grid-column:1/-1">
            <div class="empty-state__icon">🎨</div>
            <p class="empty-state__text">No works found</p>
          </div>`;
      } else {
        data.works.forEach((w) => grid.appendChild(renderWorkCard(w)));
      }

      this.hasMore = this.currentPage < data.pages;
      this.currentPage++;
      initScrollReveal();
    } catch (e) {
      console.error("Failed to load works:", e);
    } finally {
      this.isLoading = false;
    }
  }

  _bindFilters() {
    const filterBar = document.getElementById("filterBar");
    filterBar.addEventListener("click", (e) => {
      const btn = e.target.closest(".filter-btn");
      if (!btn) return;
      filterBar.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      this.currentCategory = btn.dataset.cat;
      this._loadWorks(true);
    });
  }

  _bindInfiniteScroll() {
    if (this.observer) this.observer.disconnect();
    this.observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && this.hasMore && !this.isLoading) {
          this._loadWorks();
        }
      },
      { threshold: 0.1 }
    );
    const sentinel = document.getElementById("scrollSentinel");
    if (sentinel) this.observer.observe(sentinel);
  }

  _bindSearch() {
    const input = document.getElementById("workSearch");
    if (!input) return;
    input.addEventListener(
      "input",
      debounce((e) => {
        this.searchTerm = e.target.value.trim();
        this._loadWorks(true);
      }, 300)
    );
  }

  destroy() {
    if (this.observer) this.observer.disconnect();
  }
}
