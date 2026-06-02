/** Admin Login Page */

import { adminApi } from "../admin-api.js";
import { showToast } from "../components/toast.js";

export class LoginPage {
  constructor(container) { this.container = container; }

  render() {
    this.container.innerHTML = `
      <div class="login-page">
        <div class="login-card">
          <h1>作品集管理</h1>
          <p class="subtitle">Sign in to manage your portfolio</p>
          <form id="loginForm">
            <div class="admin-form-group">
              <label class="admin-label">用户名</label>
              <input type="text" class="admin-input" id="login用户名" required autofocus>
            </div>
            <div class="admin-form-group">
              <label class="admin-label">密码</label>
              <input type="password" class="admin-input" id="login密码" required>
            </div>
            <button type="submit" class="admin-btn admin-btn--primary" style="width:100%;padding:12px;font-size:14px">登录</button>
          </form>
        </div>
      </div>
    `;

    document.getElementById("loginForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = e.target.query选择or("button");
      btn.disabled = true;
      btn.textContent = "登录中...";

      try {
        await adminApi.login({
          username: document.getElementById("login用户名").value,
          password: document.getElementById("login密码").value,
        });
        window.location.hash = "#/dashboard";
      } catch (err) {
        showToast(err.message || "登录失败", "error");
        btn.disabled = false;
        btn.textContent = "登录";
      }
    });
  }

  destroy() {}
}
