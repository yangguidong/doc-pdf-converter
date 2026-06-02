/** Toast notification system */

const container = document.getElementById("toastContainer");

export function showToast(message, type = "info", duration = 3000) {
  const toast = document.createElement("div");
  toast.className = `toast toast--${type}`;
  toast.textContent = message;
  toast.style.cssText = `
    background: var(--color-bg-surface);
    color: var(--color-text-primary);
    border: 1px solid var(--color-border);
    padding: 12px 20px;
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg);
    font-size: var(--font-size-sm);
    animation: fadeInUp 0.3s ease;
    margin-bottom: 8px;
    pointer-events: auto;
  `;

  if (type === "success") toast.style.borderColor = "var(--color-success)";
  if (type === "error") toast.style.borderColor = "var(--color-error)";

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-10px)";
    toast.style.transition = "all 0.3s ease";
    toast.addEventListener("transitionend", () => toast.remove(), { once: true });
    setTimeout(() => { if (toast.parentNode) toast.remove(); }, 400);
  }, duration);
}
