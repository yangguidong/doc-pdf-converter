/** 仪表盘 */

import { adminApi } from "../admin-api.js";
import { renderSidebar } from "../components/sidebar.js";

export class DashboardPage {
  constructor(container) { this.container = container; }

  async render() {
    this.container.innerHTML = `
      <div class="admin-layout">
        ${renderSidebar("/dashboard")}
        <div class="admin-main">
          <div class="admin-header">
            <h2 class="admin-header__title">仪表盘</h2>
            <div class="admin-header__user"><span id="headerUser">加载中...</span></div>
          </div>
          <div class="admin-content">
            <div class="stat-grid" id="statGrid">
              <div class="stat-card"><div class="stat-card__value">...</div><div class="stat-card__label">作品总数</div></div>
              <div class="stat-card"><div class="stat-card__value">...</div><div class="stat-card__label">已发布</div></div>
              <div class="stat-card"><div class="stat-card__value">...</div><div class="stat-card__label">媒体文件</div></div>
              <div class="stat-card"><div class="stat-card__value">...</div><div class="stat-card__label">分类</div></div>
            </div>
          </div>
        </div>
      </div>`;

    try {
      const { user } = await adminApi.me();
      document.getElementById("headerUser").textContent = user.username;
    } catch {}
    try {
      const [worksRes, mediaRes, catRes] = await Promise.all([
        adminApi.getWorks({ per_page: 1, status: "all" }),
        adminApi.getMedia({ per_page: 1 }),
        adminApi.getWorkCategories(),
      ]);
      const pubRes = await adminApi.getWorks({ per_page: 1, status: "published" });
      document.getElementById("statGrid").innerHTML = `
        <div class="stat-card"><div class="stat-card__value">${worksRes.total}</div><div class="stat-card__label">作品总数</div></div>
        <div class="stat-card"><div class="stat-card__value">${pubRes.total}</div><div class="stat-card__label">已发布</div></div>
        <div class="stat-card"><div class="stat-card__value">${mediaRes.total}</div><div class="stat-card__label">媒体文件</div></div>
        <div class="stat-card"><div class="stat-card__value">${catRes.categories?.length || 0}</div><div class="stat-card__label">分类</div></div>`;
    } catch {}
  }

  destroy() {}
}
