/** 媒体选择器 */

import { adminApi } from "../admin-api.js";
import { escapeHtml } from "../admin-utils.js";

export function openFilePicker(options = {}) {
  const { multiple = false, onSelect } = options;
  const selectedIds = new Set();
  const modal = document.createElement("div");
  modal.className = "admin-modal-overlay";
  modal.innerHTML = `
    <div class="admin-modal" style="max-width:720px">
      <div class="admin-modal__header"><h3 class="admin-modal__title">选择媒体</h3><button class="admin-modal__close">&times;</button></div>
      <div class="admin-modal__body">
        <div style="margin-bottom:12px"><input type="text" class="admin-input" id="fpSearch" placeholder="搜索..."></div>
        <div class="file-picker-grid" id="fpGrid"></div>
        <div style="margin-top:16px;text-align:right">
          <button class="admin-btn" id="fpCancel">取消</button>
          <button class="admin-btn admin-btn--primary" id="fpSelect">选择</button>
        </div>
      </div></div>`;
  document.body.appendChild(modal);
  requestAnimationFrame(() => modal.classList.add("open"));
  const close = () => { modal.classList.remove("open"); setTimeout(() => modal.remove(), 300); };
  modal.querySelector(".admin-modal__close").onclick = close;
  modal.querySelector("#fpCancel").onclick = close;
  modal.addEventListener("click", (e) => { if (e.target === modal) close(); });

  async function loadMedia(search = "") {
    const params = { type: "image", per_page: 40 }; if (search) params.search = search;
    const data = await adminApi.getMedia(params);
    document.getElementById("fpGrid").innerHTML = (data.media || []).map((m) => `
      <div class="media-item ${selectedIds.has(m.id) ? "selected" : ""}" data-id="${m.id}">
        <img src="${m.thumb_url || m.url}" alt="${escapeHtml(m.original_filename)}"><div class="media-item__check">✓</div>
      </div>`).join("");
    document.getElementById("fpGrid").querySelectorAll(".media-item").forEach((item) => {
      item.addEventListener("click", () => {
        const id = parseInt(item.dataset.id);
        if (multiple) { if (selectedIds.has(id)) selectedIds.delete(id); else selectedIds.add(id); item.classList.toggle("selected"); }
        else { document.getElementById("fpGrid").querySelectorAll(".media-item").forEach(i => i.classList.remove("selected")); selectedIds.clear(); selectedIds.add(id); item.classList.add("selected"); }
      });
    });
  }
  loadMedia();
  document.getElementById("fpSearch").addEventListener("input", (e) => loadMedia(e.target.value.trim()));
  document.getElementById("fpSelect").addEventListener("click", () => { if (onSelect) onSelect(multiple ? [...selectedIds] : [...selectedIds][0] || null); close(); });
  return { close };
}
