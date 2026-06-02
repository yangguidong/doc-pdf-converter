/** Dark/Light mode toggle with localStorage persistence */

export function initThemeToggle() {
  const btn = document.getElementById("themeToggle");
  if (!btn) return;

  const sunIcon = document.getElementById("themeIconSun");
  const moonIcon = document.getElementById("themeIconMoon");

  btn.addEventListener("click", () => {
    const html = document.documentElement;
    html.classList.add("theme-transitioning");

    const current = html.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";

    html.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    updateIcons(next);

    setTimeout(() => html.classList.remove("theme-transitioning"), 400);
  });

  updateIcons(getCurrentTheme());
}

export function getCurrentTheme() {
  const saved = localStorage.getItem("theme");
  if (saved) return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function initTheme() {
  document.documentElement.setAttribute("data-theme", getCurrentTheme());
}

function updateIcons(theme) {
  const sun = document.getElementById("themeIconSun");
  const moon = document.getElementById("themeIconMoon");
  if (sun && moon) {
    sun.style.display = theme === "dark" ? "none" : "";
    moon.style.display = theme === "dark" ? "" : "none";
  }
}
