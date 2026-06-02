/** Admin Work 编辑or Page — Add / 编辑 */

import { adminApi } from "../admin-api.js";
import { renderSidebar } from "../components/sidebar.js";
import { showToast } from "../components/toast.js";
import { openFilePicker } from "../components/file-picker.js";
import { escapeHtml } from "../admin-utils.js";

export class Work编辑orPage {
  constructor(container) { this.container = container; this.params = {}; }

  async render() {
    const editId = this.params.id;
    const isNew = !editId;

    this.container.innerHTML = `
      <div class="admin-layout">
        ${renderSidebar("/works")}
        <div class="admin-main">
          <div class="admin-header">
            <h2 class="admin-header__title">${isNew ? "＋ 新建作品" : "编辑作品"}</h2>
            <a href="#/works" class="admin-btn admin-btn--sm" id="btn退出">← 返回</a>
          </div>
          <div class="admin-content">
            <form id="workForm">
              <div style="display:grid;grid-template-columns:1fr 300px;gap:24px">
                <div>
                  <div class="admin-card">
                    <h3 class="admin-card__title">作品详情</h3>
                    <div class="admin-form-group">
                      <label class="admin-label">作品标题 *</label>
                      <input type="text" class="admin-input" id="wfTitle" required>
                    </div>
                    <div class="admin-form-group">
                      <label class="admin-label">副标题</label>
                      <input type="text" class="admin-input" id="wf副标题">
                    </div>
                    <div class="admin-form-group">
                      <label class="admin-label">分类</label>
                      <input type="text" class="admin-input" id="wf分类" value="other" list="catList">
                      <datalist id="catList"></datalist>
                    </div>
                    <div class="admin-form-group">
                      <label class="admin-label">描述</label>
                      <textarea class="admin-textarea" id="wf描述" rows="8"></textarea>
                    </div>
                    <div class="admin-form-group">
                      <label class="admin-label">使用工具（逗号分隔）</label>
                      <input type="text" class="admin-input" id="wfTools" placeholder="Figma, Photoshop, Blender">
                    </div>
                    <div class="admin-form-group">
                      <label class="admin-label">创作日期</label>
                      <input type="date" class="admin-input" id="wfDate">
                    </div>
                  </div>

                  <!-- 视频 -->
                  <div class="admin-card">
                    <div class="admin-flex admin-flex-between admin-mb">
                      <h3 class="admin-card__title" style="margin-bottom:0">视频</h3>
                      <button type="button" class="admin-btn admin-btn--sm" id="btnAddVideo">＋ Add Video</button>
                    </div>
                    <div id="videosList"></div>
                  </div>
                </div>

                <div>
                  <div class="admin-card">
                    <h3 class="admin-card__title">封面图</h3>
                    <div id="cover‹iew" style="margin-bottom:12px"></div>
                    <button type="button" class="admin-btn" id="btnPick封面">选择封面</button>
                    <button type="button" class="admin-btn admin-btn--sm" id="btn移除封面" style="display:none;margin-left:4px">移除</button>
                    <input type="hidden" id="wf封面MediaId">
                  </div>

                  <div class="admin-card">
                    <h3 class="admin-card__title">详情图片</h3>
                    <div class="gallery-list" id="galleryList"></div>
                    <button type="button" class="admin-btn admin-mt" id="btnAddGallery">＋ 添加图片</button>
                  </div>

                  <div class="admin-card">
                    <h3 class="admin-card__title">设置</h3>
                    <div class="admin-form-group">
                      <label class="admin-label">排序序号</label>
                      <input type="number" class="admin-input" id="wfSort排序" value="0">
                    </div>
                    <div class="admin-form-group">
                      <label><input type="checkbox" id="wf已发布" checked> 已发布</label>
                    </div>
                    <div class="admin-form-group">
                      <label><input type="checkbox" id="wf推荐d"> 首页推荐</label>
                    </div>
                  </div>

                  <button type="submit" class="admin-btn admin-btn--primary" style="width:100%;padding:12px">保存作品</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    // Load categories for datalist
    try {
      const catData = await adminApi.getWork分类();
      const list = document.getElementById("catList");
      (catData.categories || []).forEach((c) => {
        const opt = document.createElement("option");
        opt.value = c.name;
        list.appendChild(opt);
      });
    } catch {}

    // Bind cover picker
    document.getElementById("btnPick封面").addEventListener("click", () => {
      openFilePicker({
        multiple: false,
        on选择: async (mediaId) => {
          if (mediaId) {
            document.getElementById("wf封面MediaId").value = mediaId;
            document.getElementById("btn移除封面").style.display = "";
            try {
              const data = await adminApi.getMedia(mediaId);
              document.getElementById("cover‹iew").innerHTML = data.media.thumb_url
                ? `<img src="${data.media.thumb_url}" style="width:100%;border-radius:6px">`
                : `<img src="${data.media.url}" style="width:100%;border-radius:6px">`;
            } catch {}
          }
        },
      });
    });

    document.getElementById("btn移除封面").addEventListener("click", () => {
      document.getElementById("wf封面MediaId").value = "";
      document.getElementById("cover‹iew").innerHTML = "";
      document.getElementById("btn移除封面").style.display = "none";
    });

    // Gallery management
    this._galleryMediaIds = [];
    const bindGalleryEvents = () => {
      document.getElementById("btnAddGallery").addEventListener("click", () => {
        openFilePicker({
          multiple: true,
          on选择: (ids) => {
            if (ids && ids.length) {
              ids.forEach(async (mid) => {
                if (!this._galleryMediaIds.includes(mid)) {
                  this._galleryMediaIds.push(mid);
                  await this._renderGalleryItem(mid);
                }
              });
            }
          },
        });
      });
    };

    // Video add
    document.getElementById("btnAddVideo").addEventListener("click", () => {
      this._addVideoForm();
    });

    // Load existing data
    if (!isNew) {
      try {
        const data = await adminApi.getWork(editId);
        const w = data.work;
        document.getElementById("wfTitle").value = w.title || "";
        document.getElementById("wf副标题").value = w.subtitle || "";
        document.getElementById("wf分类").value = w.category || "other";
        document.getElementById("wf描述").value = w.description || "";
        document.getElementById("wfTools").value = (w.tools || []).join(", ");
        document.getElementById("wfDate").value = w.date_created || "";
        document.getElementById("wfSort排序").value = w.sort_order || 0;
        document.getElementById("wf已发布").checked = w.is_published;
        document.getElementById("wf推荐d").checked = w.is_featured;

        if (w.cover_media_id) {
          document.getElementById("wf封面MediaId").value = w.cover_media_id;
          document.getElementById("btn移除封面").style.display = "";
          document.getElementById("cover‹iew").innerHTML = w.cover_thumb_url
            ? `<img src="${w.cover_thumb_url}" style="width:100%;border-radius:6px">`
            : "";
        }

        if (w.gallery) {
          this._galleryMediaIds = w.gallery.map((g) => g.media_id);
          for (const g of w.gallery) {
            await this._renderGalleryItem(g.media_id, g.id);
          }
        }

        if (w.videos) {
          w.videos.forEach((v) => this._addVideoForm(v));
        }
      } catch (err) {
        showToast("加载失败 work: " + err.message, "error");
        window.location.hash = "#/works";
        return;
      }
    }

    bindGalleryEvents();

    // Form submit
    document.getElementById("workForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const body = {
        title: document.getElementById("wfTitle").value.trim(),
        subtitle: document.getElementById("wf副标题").value.trim(),
        category: document.getElementById("wf分类").value.trim(),
        description: document.getElementById("wf描述").value.trim(),
        tools: document.getElementById("wfTools").value.split(",").map((s) => s.trim()).filter(Boolean),
        date_created: document.getElementById("wfDate").value || null,
        cover_media_id: parseInt(document.getElementById("wf封面MediaId").value) || null,
        is_published: document.getElementById("wf已发布").checked,
        is_featured: document.getElementById("wf推荐d").checked,
        sort_order: parseInt(document.getElementById("wfSort排序").value) || 0,
        gallery_media_ids: this._galleryMediaIds,
        videos: this._collect视频(),
      };

      try {
        if (isNew) {
          const res = await adminApi.createWork(body);
          window.location.hash = `#/works/${res.work.id}/edit`;
        } else {
          await adminApi.updateWork(editId, body);
          showToast("作品已保存！", "success");
        }
      } catch (err) {
        showToast(err.message, "error");
      }
    });
  }

  async _renderGalleryItem(mediaId, workImageId) {
    const list = document.getElementById("galleryList");
    const item = document.createElement("li");
    item.className = "gallery-item";
    item.draggable = true;
    item.dataset.mediaId = mediaId;
    if (workImageId) item.dataset.wiId = workImageId;

    try {
      const data = await adminApi.getMedia(mediaId);
      item.innerHTML = `<img src="${data.media.thumb_url || data.media.url}" alt=""><button class="gallery-item__remove">×</button>`;
    } catch {
      item.textContent = "?";
    }

    item.query选择or(".gallery-item__remove").addEventListener("click", () => {
      this._galleryMediaIds = this._galleryMediaIds.filter((id) => id !== mediaId);
      item.remove();
    });

    list.appendChild(item);
  }

  _addVideoForm(videoData = {}) {
    const list = document.getElementById("videosList");
    const div = document.createElement("div");
    div.style.cssText = "border:1px solid var(--admin-border);border-radius:6px;padding:12px;margin-bottom:8px";
    div.innerHTML = `
      <div class="admin-form-group">
        <label class="admin-label">Platform</label>
        <select class="admin-select video-platform">
          <option value="youtube" ${videoData.platform === "youtube" ? "selected" : ""}>YouTube</option>
          <option value="vimeo" ${videoData.platform === "vimeo" ? "selected" : ""}>Vimeo</option>
          <option value="direct" ${videoData.platform === "direct" ? "selected" : ""}>Direct URL</option>
        </select>
      </div>
      <div class="admin-form-group">
        <label class="admin-label">Video URL</label>
        <input type="text" class="admin-input video-url" value="${escapeHtml(videoData.video_url || "")}">
      </div>
      <div class="admin-form-group">
        <label class="admin-label">Title</label>
        <input type="text" class="admin-input video-title" value="${escapeHtml(videoData.title || "")}">
      </div>
      <button type="button" class="admin-btn admin-btn--sm admin-btn--danger remove-video">移除</button>
    `;
    div.query选择or(".remove-video").addEventListener("click", () => div.remove());
    list.appendChild(div);
  }

  _collect视频() {
    const videos = [];
    document.query选择or全部("#videosList > div").forEach((div) => {
      const platform = div.query选择or(".video-platform").value;
      const url = div.query选择or(".video-url").value.trim();
      const title = div.query选择or(".video-title").value.trim();
      if (url) videos.push({ platform, video_url: url, title });
    });
    return videos;
  }

  destroy() {}
}
