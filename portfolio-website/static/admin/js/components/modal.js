/** 弹窗组件 */

export function openModal(title, contentHtml, options = {}) {
  const { width = "560px", onClose } = options;
  const overlay = document.createElement("div");
  overlay.className = "admin-modal-overlay";
  overlay.innerHTML = `
    <div class="admin-modal" style="max-width:${width}">
      <div class="admin-modal__header">
        <h3 class="admin-modal__title">${title}</h3>
        <button class="admin-modal__close" id="modalClose">&times;</button>
      </div>
      <div class="admin-modal__body">${contentHtml}</div>
    </div>`;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add("open"));
  const close = () => {
    overlay.classList.remove("open");
    overlay.addEventListener("transitionend", () => overlay.remove(), { once: true });
    setTimeout(() => { if (overlay.parentNode) overlay.remove(); }, 300);
    if (onClose) onClose();
  };
  overlay.querySelector("#modalClose").onclick = close;
  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
  document.addEventListener("keydown", function escH(e) { if (e.key === "Escape") { close(); document.removeEventListener("keydown", escH); } });
  return { close, getBody: () => overlay.querySelector(".admin-modal__body") };
}
