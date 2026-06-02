/** 管理后台工具函数 */

export function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

export function formatDate(dateStr) {
  if (!dateStr) return "";
  try { return new Date(dateStr).toLocaleDateString("zh-CN", { year: "numeric", month: "short", day: "numeric" }); }
  catch { return dateStr; }
}

export function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0, size = bytes;
  while (size >= 1024 && i < units.length - 1) { size /= 1024; i++; }
  return `${size.toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
}

export function confirmDialog(title, message) {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "admin-modal-overlay open";
    overlay.innerHTML = `
      <div class="admin-modal">
        <div class="admin-modal__header"><h3 class="admin-modal__title">${title}</h3></div>
        <p style="margin-bottom:20px;color:#666">${message}</p>
        <div style="display:flex;gap:8px;justify-content:flex-end">
          <button class="admin-btn" id="confirmCancel">取消</button>
          <button class="admin-btn admin-btn--danger" id="confirmOk">确认</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector("#confirmCancel").onclick = () => { overlay.remove(); resolve(false); };
    overlay.querySelector("#confirmOk").onclick = () => { overlay.remove(); resolve(true); };
    overlay.addEventListener("click", (e) => { if (e.target === overlay) { overlay.remove(); resolve(false); } });
  });
}
