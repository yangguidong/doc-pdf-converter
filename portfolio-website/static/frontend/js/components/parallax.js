/** Mousemove parallax effect on hero (desktop only) */

let rafId = null;

export function initParallax() {
  const hero = document.querySelector(".hero");
  if (!hero) return;

  // Only on devices with fine pointer
  if (!window.matchMedia("(pointer: fine)").matches) return;

  const layers = hero.querySelectorAll(".hero-parallax-layer");
  if (!layers.length) return;

  hero.addEventListener("mousemove", (e) => {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      const rect = hero.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      layers.forEach((layer, i) => {
        const speed = 0.02 + i * 0.03;
        layer.style.transform = `translate(${x * speed * 100}px, ${y * speed * 100}px)`;
      });
    });
  });
}
