/** Admin Profile 编辑or — Hero + Profile + Exhibitions + Social */

import { adminApi } from "../admin-api.js";
import { renderSidebar } from "../components/sidebar.js";
import { showToast } from "../components/toast.js";
import { openFilePicker } from "../components/file-picker.js";
import { escapeHtml, confirmDialog } from "../admin-utils.js";

export class Profile编辑orPage {
  constructor(container) { this.container = container; }

  async render() {
    this.container.innerHTML = `
      <div class="admin-layout">
        ${renderSidebar("/profile")}
        <div class="admin-main">
          <div class="admin-header">
            <h2 class="admin-header__title">个人与内容</h2>
            <button class="admin-btn admin-btn--sm" id="btn退出">退出</button>
          </div>
          <div class="admin-content">
            <div style="display:flex;gap:12px;margin-bottom:24px">
              <button class="admin-btn tab-btn active" data-tab="hero">Hero</button>
              <button class="admin-btn tab-btn" data-tab="profile">Profile</button>
              <button class="admin-btn tab-btn" data-tab="exhibitions">Exhibitions</button>
              <button class="admin-btn tab-btn" data-tab="social">社交媒体链接</button>
            </div>

            <div id="tabContent"></div>
          </div>
        </div>
      </div>
    `;

    this._loadTab("hero");
    this._bindTabs();
    document.getElementById("btn退出").addEventListener("click", async () => {
      await adminApi.logout();
      window.location.hash = "#/login";
    });
  }

  _bindTabs() {
    document.query选择or全部(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.query选择or全部(".tab-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        this._loadTab(btn.dataset.tab);
      });
    });
  }

  async _loadTab(tab) {
    const content = document.getElementById("tabContent");
    try {
      switch (tab) {
        case "hero": await this._renderHeroTab(content); break;
        case "profile": await this._renderProfileTab(content); break;
        case "exhibitions": await this._renderExhibitionsTab(content); break;
        case "social": await this._renderSocialTab(content); break;
      }
    } catch (err) {
      content.innerHTML = `<p style="color:red">加载失败: ${err.message}</p>`;
    }
  }

  async _renderHeroTab(content) {
    const data = await adminApi.getHero();
    content.innerHTML = `
      <div class="admin-card">
        <h3 class="admin-card__title">首页大屏</h3>
        <form id="heroForm">
          <div class="admin-form-group">
            <label class="admin-label">问候语</label>
            <input type="text" class="admin-input" name="greeting_text" value="${escapeHtml(data.greeting_text || "")}">
          </div>
          <div class="admin-form-group">
            <label class="admin-label">Name *</label>
            <input type="text" class="admin-input" name="name" value="${escapeHtml(data.name || "")}" required>
          </div>
          <div class="admin-form-group">
            <label class="admin-label">Tagline</label>
            <input type="text" class="admin-input" name="tagline" value="${escapeHtml(data.tagline || "")}">
          </div>
          <div class="admin-form-group">
            <label class="admin-label">背景类型</label>
            <select class="admin-select" name="background_type">
              <option value="gradient" ${data.background_type === "gradient" ? "selected" : ""}>Gradient</option>
              <option value="image" ${data.background_type === "image" ? "selected" : ""}>Image</option>
              <option value="video" ${data.background_type === "video" ? "selected" : ""}>Video</option>
            </select>
          </div>
          <div class="admin-form-group">
            <label class="admin-label">背景URL</label>
            <input type="text" class="admin-input" name="background_url" value="${escapeHtml(data.background_url || "")}">
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div class="admin-form-group">
              <label class="admin-label">渐变起始色</label>
              <input type="color" class="admin-input" name="gradient_start" value="${data.gradient_start || "#0f172a"}" style="height:40px">
            </div>
            <div class="admin-form-group">
              <label class="admin-label">渐变结束色</label>
              <input type="color" class="admin-input" name="gradient_end" value="${data.gradient_end || "#334155"}" style="height:40px">
            </div>
          </div>
          <div class="admin-form-group">
            <label><input type="checkbox" name="show_scroll_hint" ${data.show_scroll_hint ? "checked" : ""}> 显示向下滚动提示</label>
          </div>
          <button type="submit" class="admin-btn admin-btn--primary">保存首页</button>
        </form>
      </div>
    `;
    document.getElementById("heroForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const body = Object.fromEntries(fd);
      body.show_scroll_hint = fd.get("show_scroll_hint") === "on";
      await adminApi.updateHero(body);
      showToast("首页已保存！", "success");
    });
  }

  async _renderProfileTab(content) {
    const data = await adminApi.getProfile();
    content.innerHTML = `
      <div class="admin-card">
        <h3 class="admin-card__title">Profile</h3>
        <form id="profileForm">
          <div class="admin-form-group">
            <label class="admin-label">Name</label>
            <input type="text" class="admin-input" name="name" value="${escapeHtml(data.name || "")}">
          </div>
          <div class="admin-form-group">
            <label class="admin-label">Tagline</label>
            <input type="text" class="admin-input" name="tagline" value="${escapeHtml(data.tagline || "")}">
          </div>
          <div class="admin-form-group">
            <label class="admin-label">Bio</label>
            <textarea class="admin-textarea" name="bio" rows="4">${escapeHtml(data.bio || "")}</textarea>
          </div>
          <div class="admin-form-group">
            <label class="admin-label">Artistic Philosophy</label>
            <textarea class="admin-textarea" name="artistic_philosophy" rows="4">${escapeHtml(data.artistic_philosophy || "")}</textarea>
          </div>
          <div class="admin-form-group">
            <label class="admin-label">Avatar</label>
            <div id="avatar‹iew" style="margin-bottom:8px">${data.avatar_url ? `<img src="${data.avatar_url}" style="width:100px;height:100px;border-radius:50%;object-fit:cover">` : ""}</div>
            <button type="button" class="admin-btn" id="btnPickAvatar">选择 Avatar</button>
            <input type="hidden" name="avatar_media_id" value="${data.avatar_media_id || ""}">
          </div>
          <div class="admin-form-group">
            <label class="admin-label">Email</label>
            <input type="email" class="admin-input" name="email" value="${escapeHtml(data.email || "")}">
          </div>
          <div class="admin-form-group">
            <label class="admin-label">Location</label>
            <input type="text" class="admin-input" name="location" value="${escapeHtml(data.location || "")}">
          </div>
          <button type="submit" class="admin-btn admin-btn--primary">保存个人资料</button>
        </form>
      </div>
    `;

    document.getElementById("btnPickAvatar").addEventListener("click", () => {
      openFilePicker({
        multiple: false,
        on选择: (mid) => {
          if (mid) {
            document.query选择or('[name="avatar_media_id"]').value = mid;
            adminApi.getMedia(mid).then((res) => {
              document.getElementById("avatar‹iew").innerHTML = `<img src="${res.media.thumb_url || res.media.url}" style="width:100px;height:100px;border-radius:50%;object-fit:cover">`;
            });
          }
        },
      });
    });

    document.getElementById("profileForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const body = Object.fromEntries(fd);
      if (body.avatar_media_id) body.avatar_media_id = parseInt(body.avatar_media_id) || null;
      else body.avatar_media_id = null;
      await adminApi.updateProfile(body);
      showToast("资料已保存！", "success");
    });
  }

  async _renderExhibitionsTab(content) {
    const data = await adminApi.getExhibitions();
    content.innerHTML = `
      <div class="admin-card">
        <div class="admin-flex admin-flex-between admin-mb">
          <h3 class="admin-card__title" style="margin-bottom:0">展览与奖项</h3>
          <button class="admin-btn admin-btn--primary admin-btn--sm" id="btnAddEx">＋ Add</button>
        </div>
        <div id="exList">
          ${(data.exhibitions || [])
            .map(
              (ex) => `
            <div class="admin-card" style="margin-bottom:12px" data-ex-id="${ex.id}">
              <div class="admin-flex admin-flex-between admin-mb">
                <strong>${escapeHtml(ex.title)}</strong>
                <div>
                  <button class="admin-btn admin-btn--xs edit-ex">编辑</button>
                  <button class="admin-btn admin-btn--xs admin-btn--danger del-ex">删除</button>
                </div>
              </div>
              <div style="font-size:12px;color:#666">${ex.date_display} · ${ex.type} · ${ex.venue || ""}</div>
              ${ex.description ? `<div style="font-size:13px;margin-top:4px">${escapeHtml(ex.description)}</div>` : ""}
            </div>`
            )
            .join("")}
        </div>
      </div>
    `;

    this._bindEx操作();
  }

  _bindEx操作() {
    document.getElementById("btnAddEx")?.addEventListener("click", () => this._openExForm());
    document.query选择or全部(".edit-ex").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = parseInt(btn.closest("[data-ex-id]").dataset.exId);
        this._openExForm(id);
      });
    });
    document.query选择or全部(".del-ex").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = parseInt(btn.closest("[data-ex-id]").dataset.exId);
        if (await confirmDialog("删除", "删除 this entry?")) {
          await adminApi.deleteExhibition(id);
          showToast("删除d", "success");
          this._loadTab("exhibitions");
        }
      });
    });
  }

  async _openExForm(editId) {
    let existing = {};
    if (editId) {
      const data = await adminApi.getExhibitions();
      existing = (data.exhibitions || []).find((e) => e.id === editId) || {};
    }

    const formHtml = `
      <form id="exForm">
        <div class="admin-form-group"><label class="admin-label">Title</label><input type="text" class="admin-input" name="title" value="${escapeHtml(existing.title || "")}" required></div>
        <div class="admin-form-group"><label class="admin-label">Date Display</label><input type="text" class="admin-input" name="date_display" value="${escapeHtml(existing.date_display || "")}" placeholder="2025"></div>
        <div class="admin-form-group"><label class="admin-label">Venue</label><input type="text" class="admin-input" name="venue" value="${escapeHtml(existing.venue || "")}"></div>
        <div class="admin-form-group"><label class="admin-label">Type</label><select class="admin-select" name="type">
          ${["exhibition","award","publication","speaking","education"].map((t) => `<option value="${t}" ${existing.type === t ? "selected" : ""}>${t}</option>`).join("")}
        </select></div>
        <div class="admin-form-group"><label class="admin-label">描述</label><textarea class="admin-textarea" name="description" rows="3">${escapeHtml(existing.description || "")}</textarea></div>
        <div class="admin-form-group"><label class="admin-label">排序序号</label><input type="number" class="admin-input" name="sort_order" value="${existing.sort_order || 0}"></div>
        <button type="submit" class="admin-btn admin-btn--primary">保存</button>
      </form>
    `;

    const { openModal } = await import("../components/modal.js");
    const modal = openModal(editId ? "编辑 Entry" : "Add Entry", formHtml);

    modal.getBody().query选择or("#exForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const body = Object.fromEntries(fd);
      body.sort_order = parseInt(body.sort_order) || 0;
      if (editId) {
        await adminApi.updateExhibition(editId, body);
      } else {
        await adminApi.createExhibition(body);
      }
      modal.close();
      showToast("保存d!", "success");
      this._loadTab("exhibitions");
    });
  }

  async _renderSocialTab(content) {
    const data = await adminApi.getSocialLinks();
    content.innerHTML = `
      <div class="admin-card">
        <div class="admin-flex admin-flex-between admin-mb">
          <h3 class="admin-card__title" style="margin-bottom:0">社交媒体链接</h3>
          <button class="admin-btn admin-btn--primary admin-btn--sm" id="btnAddSocial">＋ Add</button>
        </div>
        <div id="socialList">
          ${(data.social_links || [])
            .map(
              (s) => `
            <div class="admin-flex admin-flex-between" style="padding:8px 0;border-bottom:1px solid var(--admin-border)" data-sl-id="${s.id}">
              <div>
                <strong>${escapeHtml(s.label)}</strong>
                <span style="color:#666;margin-left:8px;font-size:12px">${s.platform} · ${s.url}</span>
              </div>
              <div>
                <button class="admin-btn admin-btn--xs edit-sl">编辑</button>
                <button class="admin-btn admin-btn--xs admin-btn--danger del-sl">删除</button>
              </div>
            </div>`
            )
            .join("")}
        </div>
      </div>
    `;

    document.getElementById("btnAddSocial")?.addEventListener("click", () => this._openSocialForm());
    document.query选择or全部(".edit-sl").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = parseInt(btn.closest("[data-sl-id]").dataset.slId);
        this._openSocialForm(id);
      });
    });
    document.query选择or全部(".del-sl").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = parseInt(btn.closest("[data-sl-id]").dataset.slId);
        if (await confirmDialog("删除", "删除 this link?")) {
          await adminApi.deleteSocialLink(id);
          showToast("删除d", "success");
          this._loadTab("social");
        }
      });
    });
  }

  async _openSocialForm(editId) {
    let existing = {};
    if (editId) {
      const data = await adminApi.getSocialLinks();
      existing = (data.social_links || []).find((s) => s.id === editId) || {};
    }

    const formHtml = `
      <form id="slForm">
        <div class="admin-form-group"><label class="admin-label">Platform</label>
          <select class="admin-select" name="platform">
            ${["instagram","behance","dribbble","github","linkedin","twitter","youtube","bilibili","email","website","wechat"].map((p) => `<option value="${p}" ${existing.platform === p ? "selected" : ""}>${p}</option>`).join("")}
          </select></div>
        <div class="admin-form-group"><label class="admin-label">URL</label><input type="url" class="admin-input" name="url" value="${escapeHtml(existing.url || "")}" required></div>
        <div class="admin-form-group"><label class="admin-label">Label</label><input type="text" class="admin-input" name="label" value="${escapeHtml(existing.label || "")}"></div>
        <div class="admin-form-group"><label class="admin-label">排序序号</label><input type="number" class="admin-input" name="sort_order" value="${existing.sort_order || 0}"></div>
        <button type="submit" class="admin-btn admin-btn--primary">保存</button>
      </form>
    `;

    const { openModal } = await import("../components/modal.js");
    const modal = openModal(editId ? "编辑 Link" : "Add Link", formHtml);

    modal.getBody().query选择or("#slForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const body = Object.fromEntries(fd);
      body.sort_order = parseInt(body.sort_order) || 0;
      if (editId) {
        await adminApi.updateSocialLink(editId, body);
      } else {
        await adminApi.createSocialLink(body);
      }
      modal.close();
      showToast("保存d!", "success");
      this._loadTab("social");
    });
  }

  destroy() {}
}
