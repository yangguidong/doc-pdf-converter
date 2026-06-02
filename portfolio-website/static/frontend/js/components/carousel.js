/** Horizontal scroll-snap carousel for featured works */

import { renderWorkCard } from "./work-card.js";

export function renderCarousel(container, works) {
  if (!works.length) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML = `
    <div class="carousel-track" id="carouselTrack">
      ${works
        .map(
          (w) => `
        <div class="carousel-item">
          <a href="#/works/${w.slug}">
            <img src="${w.cover_thumb_url || w.cover_url || "/static/frontend/assets/placeholder-cover.svg"}"
                 alt="${w.title}" loading="lazy">
            <p class="carousel-item__title">${w.title}</p>
            <p class="carousel-item__cat">${w.category}</p>
          </a>
        </div>
      `
        )
        .join("")}
    </div>
    <div class="carousel-nav" id="carouselNav"></div>
  `;

  const track = document.getElementById("carouselTrack");
  const nav = document.getElementById("carouselNav");
  const items = track.querySelectorAll(".carousel-item");

  // Dots
  items.forEach((_, i) => {
    const dot = document.createElement("button");
    dot.className = "carousel-dot" + (i === 0 ? " active" : "");
    dot.addEventListener("click", () => {
      items[i].scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
    });
    nav.appendChild(dot);
  });

  // Auto-advance
  let current = 0;
  let interval = setInterval(() => {
    current = (current + 1) % items.length;
    items[current].scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
    updateDots();
  }, 5000);

  // Pause on hover
  container.addEventListener("mouseenter", () => clearInterval(interval));
  container.addEventListener("mouseleave", () => {
    interval = setInterval(() => {
      current = (current + 1) % items.length;
      items[current].scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
      updateDots();
    }, 5000);
  });

  // Update dots on scroll
  track.addEventListener("scroll", updateDots);

  function updateDots() {
    const scrollLeft = track.scrollLeft;
    const itemWidth = items[0]?.offsetWidth + 24 || 324;
    const idx = Math.round(scrollLeft / itemWidth);
    if (idx !== current) current = idx;
    nav.querySelectorAll(".carousel-dot").forEach((d, i) => {
      d.classList.toggle("active", i === idx);
    });
  }
}
