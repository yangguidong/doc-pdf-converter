/** IntersectionObserver-based scroll reveal animations */

let observer = null;

export function initScrollReveal() {
  // Disconnect previous observer
  if (observer) observer.disconnect();

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
  );

  document.querySelectorAll("[data-reveal], .stagger-children").forEach((el) => {
    observer.observe(el);
  });
}
