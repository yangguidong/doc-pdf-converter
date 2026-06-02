/** Admin 媒体库 Page */

import { adminApi } from "../admin-api.js";
import { renderSidebar } from "../components/sidebar.js";
import { showToast } from "../components/toast.js";
import { escapeHtml, formatBytes, confirmDialog, debounce } from "../admin-utils.js";

export class MediaLibraryPage {
  constructor(container) { this.container = container; }

  async render() {
    this.container.innerHTML = `
      <div class="admin-layout">
        ${renderSidebar("/media")}
        <div class="admin-main">
          <div class="admin-header">
            <h2 class="admin-header__title">媒体库</h2>
            <button class="admin-btn admin-btn--sm" id="btn退出">退出</button>
          </div>
          <div class="admin-content">
            <div class="admin-flex admin-flex-between admin-mb">
              <div class="admin-flex admin-gap-sm">
                <input type="text" class="admin-input" id="mSearch" placeholder="Search..." style="width:240px">
                <select class="admin-select" id="mType" style="width:120px">
                  <option value="all">全部类型</option>
                  <option value="image">图片</option>
                  <option value="video">视频</option>
                </select>
              </div>
              <div class="admin-flex admin-gap-sm">
                <label class="admin-btn upload-zone" style="padding:8px 16px;cursor:pointer;margin-bottom:0">
                  ＋ 上传文件
                  <input type="file" id="fileInput" multiple accept="image/*,video/*" style="display:none">
                </label>
              </div>
            </div>

            <div class="media-grid" id="mediaGrid"></div>

            <div class="admin-flex admin-flex-between admin-mt" id="mediaPagination">
              <span id="mediaCount"></span>
              <div class="admin-flex admin-gap-sm" id="pageBtns"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    this._page = 1;
    await this._loadMedia();
    this._bindFilters();
    this._bindUpload();

    document.getElementById("btn退出").addEventListener("click", async () => {
      await adminApi.logout();
      window.location.hash = "#/login";
    });
  }

  async _loadMedia() {
    const params = {
      page: this._page,
      per_page: 40,
      type: document.getElementById("mType")?.value || "all",
      search: document.getElementById("mSearch")?.value || "",
    };
    const data = await adminApi.getMedia(params);
    const grid = document.getElementById("mediaGrid");

    if (!data.media?.length) {
      grid.innerHTML = '<div class="admin-empty" style="grid-column:1/-1"><p>暂无媒体文件. 请上传！</p></div>';
      return;
    }

    grid.innerHTML = data.media
      .map(
        (m) => `
        <div class="media-item" data-id="${m.id}">
          ${m.mime_type?.startsWith("video/")
            ? `<video src="${m.url}" muted></video>`
            : `<img src="${m.thumb_url || m.url}" alt="${escapeHtml(m.original_filename)}">`}
          <div class="media-item__info">
            <div style="font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(m.original_filename)}</div>
            <div>${formatBytes(m.file_size)} ${m.width ? `· ${m.width}x${m.height}` : ""}</div>
          </div>
          <div class="media-item__check">✓</div>
        </div>`
      )
      .join("");

    // Click to view / select
    grid.query选择or全部(".media-item").forEach((item) => {
      item.addEventListener("dblclick", async () => {
        const id = parseInt(item.dataset.id);
        const ok = await confirmDialog("删除 Media", "删除 this file?");
        if (ok) {
          try {
            await adminApi.deleteMedia(id);
            showToast("Media deleted", "success");
            this._loadMedia();
          } catch (err) {
            showToast(err.message, "error");
          }
        }
      });
    });

    document.getElementById("mediaCount").textContent = `${data.total} files · Page ${data.page} of ${data.pages}`;

    const pageBtns = document.getElementById("pageBtns");
    pageBtns.innerHTML = "";
    if (data.page > 1) {
      const prev = document.createElement("button");
      prev.className = "admin-btn admin-btn--sm";
      prev.textContent = "‹ ‹";
      prev.onclick = () => { this._page--; this._loadMedia(); };
      pageBtns.appendChild(prev);
    }
    if (data.page < data.pages) {
      const next = document.createElement("button");
      next.className = "admin-btn admin-btn--sm";
      next.textContent = "下一页 ›";
      next.onclick = () => { this._page++; this._loadMedia(); };
      pageBtns.appendChild(next);
    }
  }

  _bindFilters() {
    const reload = debounce(() => { this._page = 1; this._loadMedia(); }, 300);
    document.getElementById("mSearch").addEventListener("input", reload);
    document.getElementById("mType").addEventListener("change", reload);
  }

  _bindUpload() {
    document.getElementById("fileInput").addEventListener("change", async (e) => {
      const files = [...e.target.files];
      if (!files.length) return;
      showToast(`Uploading ${files.length} file(s)...`, "info", 5000);
      try {
        const res = await adminApi.batchUpload(files);
        if (res.errors?.length) {
          showToast(`${res.errors.length} file(s) failed`, "error");
        }
        showToast(`${res.media?.length || 0} file(s) uploaded`, "success");
        e.target.value = "";
        await this._loadMedia();
      } catch (err) {
        showToast(err.message, "error");
      }
    });
  }

  destroy() {}
}
