/** Work card component for portfolio grid */

import { escapeHtml } from "../utils.js";
import { navigateTo } from "../router.js";

export function renderWorkCard(work) {
  const card = document.createElement("div");
  card.className = "work-card";
  card.setAttribute("data-reveal", "");

  const coverUrl = work.cover_url || "";
  const thumbUrl = work.cover_thumb_url || coverUrl;

  card.innerHTML = `
    <img class="work-card__image" src="${thumbUrl || "/static/frontend/assets/placeholder-cover.svg"}"
         alt="${escapeHtml(work.title)}" loading="lazy">
    <div class="work-card__overlay">
      <span class="work-card__cat">${escapeHtml(work.category)}</span>
      <h3 class="work-card__title">${escapeHtml(work.title)}</h3>
      ${work.subtitle ? `<p class="work-card__subtitle">${escapeHtml(work.subtitle)}</p>` : ""}
    </div>
    <div class="work-card__body">
      <span class="work-card__cat">${escapeHtml(work.category)}</span>
      <h3 class="work-card__title">${escapeHtml(work.title)}</h3>
    </div>
  `;

  card.addEventListener("click", () => {
    navigateTo("/works/" + work.slug);
  });

  return card;
}
