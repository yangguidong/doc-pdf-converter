/** Social share buttons */

import { showToast } from "./toast.js";

export function renderShareButtons(work) {
  const url = window.location.href;
  const text = `Check out "${work.title}"`;

  const buttons = [
    { label: "Copy Link", icon: "🔗", action: () => copyLink(url) },
    {
      label: "Twitter",
      icon: "𝕏",
      action: () =>
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, "_blank"),
    },
    {
      label: "Facebook",
      icon: "📘",
      action: () =>
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank"),
    },
    {
      label: "Email",
      icon: "✉️",
      action: () =>
        window.open(`mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}`),
    },
  ];

  return `
    <div class="share-bar">
      <span class="share-bar__label">Share:</span>
      ${buttons
        .map(
          (b) =>
            `<button class="share-btn" title="${b.label}" data-share-action>${b.icon}</button>`
        )
        .join("")}
    </div>
  `.trim();
}

export function initShareEvents(container) {
  const url = window.location.href;
  container.querySelectorAll("[data-share-action]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const title = btn.title;
      if (title === "Copy Link") {
        copyLink(url);
      } else if (title === "Twitter") {
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}`, "_blank");
      } else if (title === "Facebook") {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank");
      } else if (title === "Email") {
        window.open(`mailto:?subject=Check this out&body=${encodeURIComponent(url)}`);
      }
    });
  });
}

function copyLink(url) {
  navigator.clipboard
    .writeText(url)
    .then(() => showToast("Link copied!", "success"))
    .catch(() => showToast("Failed to copy", "error"));
}
