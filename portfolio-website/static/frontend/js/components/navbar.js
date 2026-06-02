/** Navigation bar with glassmorphism, mobile menu, active link tracking */

import { navigateTo } from "../router.js";

export function renderNavbar() {
  const nav = document.getElementById("navbar");
  nav.innerHTML = `
    <div class="nav-container">
      <a href="#/" class="nav-logo" id="navLogo">PORTFOLIO</a>
      <ul class="nav-menu" id="navMenu">
        <li><a href="#/" class="nav-link" data-nav="home">Home</a></li>
        <li><a href="#/works" class="nav-link" data-nav="works">Works</a></li>
        <li><a href="#/about" class="nav-link" data-nav="about">About</a></li>
        <li><a href="#/contact" class="nav-link" data-nav="contact">Contact</a></li>
        <li>
          <button class="theme-toggle" id="themeToggle" aria-label="Toggle theme" title="Toggle dark/light mode">
            <svg id="themeIconSun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            <svg id="themeIconMoon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:none"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          </button>
        </li>
      </ul>
      <button class="nav-toggle" id="navToggle" aria-label="Menu">
        <span></span><span></span><span></span>
      </button>
    </div>
  `;

  // Scroll: glassmorphism
  window.addEventListener("scroll", () => {
    nav.classList.toggle("scrolled", window.scrollY > 50);
  });

  // Mobile toggle
  const navToggle = document.getElementById("navToggle");
  const navMenu = document.getElementById("navMenu");
  navToggle.addEventListener("click", () => {
    navToggle.classList.toggle("active");
    navMenu.classList.toggle("open");
  });

  // Close mobile menu on link click
  navMenu.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      navToggle.classList.remove("active");
      navMenu.classList.remove("open");
    });
  });

  // Active link
  updateActiveLink();
  window.addEventListener("hashchange", updateActiveLink);

  // Theme toggle
  import("./theme-toggle.js").then((m) => m.initThemeToggle());
}

function updateActiveLink() {
  const hash = window.location.hash.slice(1) || "/";
  const links = document.querySelectorAll(".nav-link");
  links.forEach((link) => {
    const href = link.getAttribute("href").slice(1);
    link.classList.toggle("active", hash === href || (href === "/" && hash === "/"));
  });
}
