/** Touch-enabled image slider with thumbnails and lightbox */

export function renderImageSlider(container, images) {
  if (!images.length) {
    container.innerHTML = `<div class="detail-slider" style="display:flex;align-items:center;justify-content:center;color:var(--color-text-muted)">No images</div>`;
    return;
  }

  const initialIndex = 0;

  container.innerHTML = `
    <div class="detail-slider" id="detailSlider">
      <div class="slider-main" id="sliderMain">
        ${images
          .map(
            (img, i) => `
          <div class="slider-slide">
            <img src="${img.url}" alt="${img.alt_text || ""}" loading="${i === 0 ? "eager" : "lazy"}"
                 data-index="${i}">
          </div>
        `
          )
          .join("")}
      </div>
      ${images.length > 1 ? `
        <button class="slider-nav-btn slider-nav-btn--prev" id="sliderPrev">&#8249;</button>
        <button class="slider-nav-btn slider-nav-btn--next" id="sliderNext">&#8250;</button>
      ` : ""}
    </div>
    ${images.length > 1 ? `
      <div class="slider-thumbs" id="sliderThumbs">
        ${images
          .map(
            (img, i) => `
          <div class="slider-thumb ${i === initialIndex ? "active" : ""}" data-index="${i}">
            <img src="${img.thumb_url || img.url}" alt="">
          </div>
        `
          )
          .join("")}
      </div>
    ` : ""}
  `;

  const sliderMain = document.getElementById("sliderMain");
  let currentIndex = initialIndex;

  function goTo(index) {
    if (index < 0 || index >= images.length) return;
    currentIndex = index;
    sliderMain.style.transform = `translateX(-${index * 100}%)`;

    // Update thumbs
    document.querySelectorAll(".slider-thumb").forEach((t) => {
      t.classList.toggle("active", parseInt(t.dataset.index) === index);
    });
  }

  // Navigation buttons
  document.getElementById("sliderPrev")?.addEventListener("click", () => goTo(currentIndex - 1));
  document.getElementById("sliderNext")?.addEventListener("click", () => goTo(currentIndex + 1));

  // Thumbnail clicks
  document.querySelectorAll(".slider-thumb").forEach((thumb) => {
    thumb.addEventListener("click", () => goTo(parseInt(thumb.dataset.index)));
  });

  // Touch/swipe
  let touchStartX = 0;
  sliderMain.addEventListener("touchstart", (e) => {
    touchStartX = e.touches[0].clientX;
  });
  sliderMain.addEventListener("touchend", (e) => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      goTo(currentIndex + (diff > 0 ? 1 : -1));
    }
  });

  // Keyboard
  document.addEventListener("keydown", function sliderKeys(e) {
    if (e.key === "ArrowLeft") goTo(currentIndex - 1);
    if (e.key === "ArrowRight") goTo(currentIndex + 1);
  });

  // Lightbox on click
  sliderMain.querySelectorAll("img").forEach((img) => {
    img.addEventListener("click", () => openLightbox(images, currentIndex));
  });
}

function openLightbox(images, startIndex) {
  const container = document.getElementById("lightboxContainer");
  let idx = startIndex;

  container.innerHTML = `
    <div class="lightbox-backdrop">
      <button class="lightbox-close" id="lbClose">&times;</button>
      <button class="lightbox-nav lightbox-nav--prev" id="lbPrev">&#8249;</button>
      <img src="${images[idx].url}" id="lbImage" alt="">
      <button class="lightbox-nav lightbox-nav--next" id="lbNext">&#8250;</button>
      <div class="lightbox-counter">${idx + 1} / ${images.length}</div>
    </div>
  `;

  const backdrop = container.querySelector(".lightbox-backdrop");
  const lbImage = document.getElementById("lbImage");

  // Inject lightbox styles if not present
  if (!document.getElementById("lb-styles")) {
    const style = document.createElement("style");
    style.id = "lb-styles";
    style.textContent = `
      .lightbox-backdrop {
        position: fixed; inset: 0; z-index: var(--z-lightbox);
        background: rgba(0,0,0,0.95); display: flex; align-items: center; justify-content: center;
      }
      .lightbox-backdrop img { max-width: 90vw; max-height: 85vh; object-fit: contain; }
      .lightbox-close { position: absolute; top: 20px; right: 20px; background: none; border: none; color: #fff; font-size: 2rem; cursor: pointer; z-index: 1; }
      .lightbox-nav { position: absolute; top: 50%; transform: translateY(-50%); background: rgba(255,255,255,0.1); border: none; color: #fff; font-size: 2.5rem; width: 60px; height: 60px; border-radius: 50%; cursor: pointer; }
      .lightbox-nav--prev { left: 20px; }
      .lightbox-nav--next { right: 20px; }
      .lightbox-counter { position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); color: rgba(255,255,255,0.6); font-size: 0.9rem; }
    `;
    document.head.appendChild(style);
  }

  function updateImage() {
    lbImage.src = images[idx].url;
    container.querySelector(".lightbox-counter").textContent = `${idx + 1} / ${images.length}`;
  }

  function close() {
    container.innerHTML = "";
    document.removeEventListener("keydown", keyHandler);
  }

  function keyHandler(e) {
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft" && idx > 0) { idx--; updateImage(); }
    if (e.key === "ArrowRight" && idx < images.length - 1) { idx++; updateImage(); }
  }

  document.addEventListener("keydown", keyHandler);
  document.getElementById("lbClose").addEventListener("click", close);
  backdrop.addEventListener("click", (e) => { if (e.target === backdrop) close(); });
  document.getElementById("lbPrev").addEventListener("click", () => { if (idx > 0) { idx--; updateImage(); } });
  document.getElementById("lbNext").addEventListener("click", () => { if (idx < images.length - 1) { idx++; updateImage(); } });
}
