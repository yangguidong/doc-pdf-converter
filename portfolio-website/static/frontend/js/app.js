/** Frontend App — Entry point */

import { HashRouter } from "./router.js";
import { initTheme } from "./components/theme-toggle.js";
import { renderNavbar } from "./components/navbar.js";
import { renderFooter } from "./components/footer.js";
import { initScrollReveal } from "./components/scroll-reveal.js";
import { HomePage } from "./pages/home.js";
import { PortfolioPage } from "./pages/portfolio.js";
import { DetailPage } from "./pages/detail.js";
import { AboutPage } from "./pages/about.js";
import { ContactPage } from "./pages/contact.js";

// Initialize theme
initTheme();

// Render common UI
renderNavbar();
renderFooter();

// Create router
const router = new HashRouter("#app", [
  { path: "/", page: HomePage },
  { path: "/works", page: PortfolioPage },
  { path: "/works/:slug", page: DetailPage },
  { path: "/about", page: AboutPage },
  { path: "/contact", page: ContactPage },
]);

// After each navigation, re-init scroll effects
router.on("after", () => {
  initScrollReveal();
  window.scrollTo({ top: 0, behavior: "instant" });
});

// Start
router.resolve();
