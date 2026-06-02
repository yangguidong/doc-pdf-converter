/** Generic modal dialog */

const container = document.getElementById("modalContainer");

export function openModal(content, options = {}) {
  const { closable = true, onClose } = options;

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";

  const modal = document.createElement("div");
  overlay.className = "modal-content glass-card";
  modal.innerHTML = content;

  overlay.appendChild(modal);
  container.appendChild(overlay);

  // Animate in
  requestAnimationFrame(() => overlay.classList.add("open"));

  const close = () => {
    overlay.classList.remove("open");
    overlay.addEventListener("transitionend", () => {
      overlay.remove();
      if (onClose) onClose();
    }, { once: true });
    // Fallback
    setTimeout(() => { if (overlay.parentNode) overlay.remove(); }, 400);
  };

  if (closable) {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close();
    });
  }

  document.addEventListener("keydown", function escHandler(e) {
    if (e.key === "Escape") {
      close();
      document.removeEventListener("keydown", escHandler);
    }
  });

  return { close };
}
