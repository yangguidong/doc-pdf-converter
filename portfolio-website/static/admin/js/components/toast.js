/** Admin toast notifications */

const container = document.getElementById("adminToastContainer");

export function showToast(message, type = "info", duration = 3000) {
  const toast = document.createElement("div");
  toast.className = `admin-toast admin-toast--${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(50px)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 400);
  }, duration);
}
