/** 作品列表 */

import { adminApi } from "../admin-api.js";
import { renderSidebar } from "../components/sidebar.js";
import { showToast } from "../components/toast.js";
import { escapeHtml, formatDate, confirmDialog, debounce } from "../admin-utils.js";

export class WorksListPage {
  constructor(container) { this.container = container; }

  async render() {
    this.container.innerHTML = `
      <div class="admin-layout">
        ${renderSidebar("/works")}
        <div class="admin-main">
          <div class="admin-header">
            <h2 class="admin-header__title">作品管理</h2>
            <div class="admin-header__user"></div>
          </div>
          <div class="admin-content">
            <div class="admin-flex admin-flex-between admin-mb">
              <div class="admin-flex admin-gap-sm">
                <input type="text" class="admin-input" id="wsSearch" placeholder="搜索作品..." style="width:240px">
                <select class="admin-select" id="wsCategory" style="width:160px"><option value="all">全部分类</option></select>
                <select class="admin-select" id="wsStatus" style="width:140px">
                  <option value="all">全部状态</option><option value="published">已发布</option><option value="draft">草稿</option>
                </select>
              </div>
              <a href="#/works/new" class="admin-btn admin-btn--primary">＋ 新建作品</a>
            </div>
            <div class="admin-card" style="padding:0;overflow-x:auto">
              <table class="admin-table" id="worksTable">
                <thead><tr>
                  <th>封面</th><th data-sort="title">作品标题 ▾</th><th data-sort="category">分类</th>
                  <th data-sort="sort_order">排序</th><th>状态</th><th data-sort="created_at">创建时间</th><th>操作</th>
                </tr></thead>
                <tbody id="worksTbody"></tbody>
              </table>
            </div>
            <div class="admin-flex admin-flex-between admin-mt" id="worksPagination">
              <span id="worksCount"></span><div class="admin-flex admin-gap-sm" id="pageBtns"></div>
            </div>
          </div>
        </div>
      </div>`;

    await this._loadCategories();
    this._bindFilters();
    await this._loadWorks();
    this._bindSort();
  }

  async _loadCategories() {
    try {
      const data = await adminApi.getWorkCategories();
      const sel = document.getElementById("wsCategory");
      (data.categories || []).forEach((c) => {
        const opt = document.createElement("option"); opt.value = c.name; opt.textContent = `${c.name} (${c.count})`;
        sel.appendChild(opt);
      });
    } catch {}
  }

  _getFilters() {
    return {
      search: document.getElementById("wsSearch")?.value || "",
      category: document.getElementById("wsCategory")?.value || "",
      status: document.getElementById("wsStatus")?.value || "",
      sort_by: this._sortBy || "sort_order", sort_dir: this._sortDir || "asc", page: this._page || 1,
    };
  }

  async _loadWorks() {
    const data = await adminApi.getWorks(this._getFilters());
    const tbody = document.getElementById("worksTbody");
    tbody.innerHTML = (data.works || []).map((w) => `
      <tr>
        <td>${w.cover_thumb_url ? `<img src="${w.cover_thumb_url}" style="width:48px;height:36px;object-fit:cover;border-radius:4px">` : ""}</td>
        <td><strong>${escapeHtml(w.title)}</strong>${w.is_featured ? ' <span class="admin-tag admin-tag--featured">推荐</span>' : ""}</td>
        <td>${escapeHtml(w.category)}</td><td>${w.sort_order}</td>
        <td><span class="admin-tag admin-tag--${w.is_published ? "published" : "draft"}">${w.is_published ? "已发布" : "草稿"}</span></td>
        <td>${formatDate(w.created_at)}</td>
        <td><div class="admin-table-actions">
          <button class="admin-btn admin-btn--xs" data-action="edit" data-id="${w.id}">编辑</button>
          ${w.is_published
            ? `<button class="admin-btn admin-btn--xs" data-action="unpublish" data-id="${w.id}">下线</button>`
            : `<button class="admin-btn admin-btn--xs admin-btn--primary" data-action="publish" data-id="${w.id}">发布</button>`}
          <button class="admin-btn admin-btn--xs" data-action="feature" data-id="${w.id}" data-featured="${w.is_featured}">${w.is_featured ? "取消推荐" : "推荐"}</button>
          <button class="admin-btn admin-btn--xs admin-btn--danger" data-action="delete" data-id="${w.id}">删除</button>
        </div></td>
      </tr>`).join("");
    document.getElementById("worksCount").textContent = `${data.total} 个作品 · 第${data.page}页/共${data.pages}页`;
    const pageBtns = document.getElementById("pageBtns"); pageBtns.innerHTML = "";
    if (data.page > 1) { const b = document.createElement("button"); b.className = "admin-btn admin-btn--sm"; b.textContent = "‹ 上一页"; b.onclick = () => { this._page--; this._loadWorks(); }; pageBtns.appendChild(b); }
    if (data.page < data.pages) { const b = document.createElement("button"); b.className = "admin-btn admin-btn--sm"; b.textContent = "下一页 ›"; b.onclick = () => { this._page++; this._loadWorks(); }; pageBtns.appendChild(b); }
    this._bindRowActions();
  }

  _bindRowActions() {
    document.querySelectorAll("[data-action]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = parseInt(btn.dataset.id), action = btn.dataset.action;
        try {
          if (action === "edit") window.location.hash = `#/works/${id}/edit`;
          else if (action === "publish") { await adminApi.togglePublish(id, true); showToast("作品已发布", "success"); this._loadWorks(); }
          else if (action === "unpublish") { await adminApi.togglePublish(id, false); showToast("作品已下线", "success"); this._loadWorks(); }
          else if (action === "feature") { const v = btn.dataset.featured === "true"; await adminApi.toggleFeature(id, !v); showToast(v ? "已取消推荐" : "已设为推荐", "success"); this._loadWorks(); }
          else if (action === "delete") {
            if (await confirmDialog("删除作品", "确认删除此作品？此操作不可撤销。")) { await adminApi.deleteWork(id); showToast("已删除", "success"); this._loadWorks(); }
          }
        } catch (err) { showToast(err.message, "error"); }
      });
    });
  }

  _bindFilters() {
    this._page = 1; this._sortBy = "sort_order"; this._sortDir = "asc";
    const reload = debounce(() => { this._page = 1; this._loadWorks(); }, 300);
    document.getElementById("wsSearch").addEventListener("input", reload);
    document.getElementById("wsCategory").addEventListener("change", reload);
    document.getElementById("wsStatus").addEventListener("change", reload);
  }

  _bindSort() {
    document.querySelectorAll("#worksTable th[data-sort]").forEach((th) => {
      th.addEventListener("click", () => {
        const col = th.dataset.sort;
        this._sortDir = (this._sortBy === col && this._sortDir === "asc") ? "desc" : "asc";
        this._sortBy = col;
        this._loadWorks();
      });
    });
  }

  destroy() {}
}
