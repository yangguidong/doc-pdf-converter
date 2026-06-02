/** Admin 设置 Page — Site Config + 密码 Change */

import { adminApi } from "../admin-api.js";
import { renderSidebar } from "../components/sidebar.js";
import { showToast } from "../components/toast.js";

export class 设置Page {
  constructor(container) { this.container = container; }

  async render() {
    this.container.innerHTML = `
      <div class="admin-layout">
        ${renderSidebar("/settings")}
        <div class="admin-main">
          <div class="admin-header">
            <h2 class="admin-header__title">设置</h2>
            <button class="admin-btn admin-btn--sm" id="btn退出">退出</button>
          </div>
          <div class="admin-content">
            <div class="admin-card">
              <h3 class="admin-card__title">修改密码</h3>
              <form id="pwForm">
                <div class="admin-form-group">
                  <label class="admin-label">当前密码</label>
                  <input type="password" class="admin-input" name="current_password" required>
                </div>
                <div class="admin-form-group">
                  <label class="admin-label">新密码</label>
                  <input type="password" class="admin-input" name="new_password" required minlength="6">
                </div>
                <button type="submit" class="admin-btn admin-btn--primary">修改密码</button>
              </form>
            </div>

            <div class="admin-card">
              <h3 class="admin-card__title">网站配置</h3>
              <form id="configForm">
                <div class="admin-form-group">
                  <label class="admin-label">网站标题</label>
                  <input type="text" class="admin-input" name="site_title" id="cfgSiteTitle">
                </div>
                <div class="admin-form-group">
                  <label class="admin-label">网站描述</label>
                  <input type="text" class="admin-input" name="site_description" id="cfgSiteDesc">
                </div>
                <div class="admin-form-group">
                  <label class="admin-label">页脚文字</label>
                  <input type="text" class="admin-input" name="footer_text" id="cfgFooter">
                </div>
                <div class="admin-form-group">
                  <label class="admin-label">Google Analytics ID</label>
                  <input type="text" class="admin-input" name="google_analytics_id" id="cfgGa">
                </div>
                <button type="submit" class="admin-btn admin-btn--primary">保存配置</button>
              </form>
            </div>

            <div class="admin-card">
              <h3 class="admin-card__title">Email Notification 设置</h3>
              <form id="emailForm">
                <div class="admin-form-group">
                  <label><input type="checkbox" name="email_notification_enabled" id="cfgEmailEnabled"> 启用邮件通知</label>
                </div>
                <div class="admin-form-group">
                  <label class="admin-label">SMTP 主机</label>
                  <input type="text" class="admin-input" name="smtp_host" id="cfgSmtpHost">
                </div>
                <div class="admin-form-group">
                  <label class="admin-label">SMTP 端口</label>
                  <input type="number" class="admin-input" name="smtp_port" id="cfgSmtpPort">
                </div>
                <div class="admin-form-group">
                  <label class="admin-label">SMTP 用户名</label>
                  <input type="text" class="admin-input" name="smtp_username" id="cfgSmtpUser">
                </div>
                <div class="admin-form-group">
                  <label class="admin-label">SMTP 密码</label>
                  <input type="password" class="admin-input" name="smtp_password" id="cfgSmtpPass">
                </div>
                <div class="admin-form-group">
                  <label class="admin-label">通知邮箱</label>
                  <input type="email" class="admin-input" name="notification_email" id="cfgNotifyEmail">
                </div>
                <div class="admin-form-group">
                  <label><input type="checkbox" name="smtp_use_tls" id="cfgSmtpTls"> 启用 TLS</label>
                </div>
                <button type="submit" class="admin-btn admin-btn--primary">保存 Email 设置</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    `;

    // Load current config
    try {
      const config = await adminApi.getSiteConfig();
      document.getElementById("cfgSiteTitle").value = config.site_title || "";
      document.getElementById("cfgSiteDesc").value = config.site_description || "";
      document.getElementById("cfgFooter").value = config.footer_text || "";
      document.getElementById("cfgGa").value = config.google_analytics_id || "";
      document.getElementById("cfgEmailEnabled").checked = config.email_notification_enabled === "true";
      document.getElementById("cfgSmtpHost").value = config.smtp_host || "";
      document.getElementById("cfgSmtpPort").value = config.smtp_port || "587";
      document.getElementById("cfgSmtpUser").value = config.smtp_username || "";
      document.getElementById("cfgSmtpPass").value = config.smtp_password || "";
      document.getElementById("cfgNotifyEmail").value = config.notification_email || "";
      document.getElementById("cfgSmtpTls").checked = config.smtp_use_tls !== "false";
    } catch {}

    // 密码 change
    document.getElementById("pwForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        await adminApi.change密码({
          current_password: fd.get("current_password"),
          new_password: fd.get("new_password"),
        });
        showToast("密码 changed!", "success");
        e.target.reset();
      } catch (err) {
        showToast(err.message, "error");
      }
    });

    // Site config
    document.getElementById("configForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      await adminApi.updateSiteConfig(Object.fromEntries(fd));
      showToast("配置已保存！", "success");
    });

    // Email config
    document.getElementById("emailForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      fd.set("email_notification_enabled", fd.get("email_notification_enabled") === "on" ? "true" : "false");
      fd.set("smtp_use_tls", fd.get("smtp_use_tls") === "on" ? "true" : "false");
      await adminApi.updateSiteConfig(Object.fromEntries(fd));
      showToast("邮件设置已保存！", "success");
    });

    document.getElementById("btn退出").addEventListener("click", async () => {
      await adminApi.logout();
      window.location.hash = "#/login";
    });
  }

  destroy() {}
}
