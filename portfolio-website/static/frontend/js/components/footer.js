/** Footer component */

export async function renderFooter() {
  const footer = document.getElementById("footer");
  try {
    const res = await fetch("/api/social-links");
    const data = await res.json();
    const links = data.social_links || [];
    const socialHtml = links
      .map(
        (s) =>
          `<a href="${s.url}" target="_blank" rel="noopener" title="${s.label}">${s.platform.charAt(0).toUpperCase() + s.platform.slice(1)}</a>`
      )
      .join("");

    footer.innerHTML = `
      <div class="container">
        <div class="footer__social">${socialHtml}</div>
        <p class="footer__text">&copy; ${new Date().getFullYear()} All Rights Reserved.</p>
      </div>
    `;
  } catch {
    footer.innerHTML = `
      <div class="container">
        <p class="footer__text">&copy; ${new Date().getFullYear()} All Rights Reserved.</p>
      </div>
    `;
  }
}
