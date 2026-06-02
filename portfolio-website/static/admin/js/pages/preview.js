/** Admin 实时预览 Page */

import { renderSidebar } from "../components/sidebar.js";
import { renderDeviceFrame } from "../components/device-frame.js";
import { adminApi } from "../admin-api.js";

export class ‹iewPage {
  constructor(container) { this.container = container; }

  render() {
    this.container.innerHTML = `
      <div class="admin-layout">
        ${renderSidebar("/preview")}
        <div class="admin-main">
          <div class="admin-header">
            <h2 class="admin-header__title">实时预览</h2>
            <button class="admin-btn admin-btn--sm" id="btn退出">退出</button>
          </div>
          <div class="admin-content">
            <div id="deviceFrameContainer"></div>
          </div>
        </div>
      </div>
    `;

    renderDeviceFrame(document.getElementById("deviceFrameContainer"));

    document.getElementById("btn退出").addEventListener("click", async () => {
      await adminApi.logout();
      window.location.hash = "#/login";
    });
  }

  destroy() {}
}
