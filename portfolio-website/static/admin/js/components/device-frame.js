/** 设备预览框架 */

export function renderDeviceFrame(container) {
  let mode = "desktop";
  container.innerHTML = `
    <div class="admin-flex admin-flex-between admin-mb">
      <div class="admin-flex admin-gap-sm">
        <button class="admin-btn admin-btn--sm ${mode==="mobile"?"admin-btn--primary":""}" data-mode="mobile">📱 手机</button>
        <button class="admin-btn admin-btn--sm ${mode==="tablet"?"admin-btn--primary":""}" data-mode="tablet">📋 平板</button>
        <button class="admin-btn admin-btn--sm ${mode==="desktop"?"admin-btn--primary":""}" data-mode="desktop">🖥️ 桌面</button>
      </div>
      <a href="/" target="_blank" class="admin-btn admin-btn--sm">新窗口打开 ↗</a>
    </div>
    <div class="device-frame device-frame--${mode}" id="deviceFrame">
      <iframe src="/preview" id="previewIframe" style="width:100%;height:100%;border:none"></iframe>
    </div>`;
  container.querySelectorAll("[data-mode]").forEach((btn) => {
    btn.addEventListener("click", () => {
      mode = btn.dataset.mode;
      document.getElementById("deviceFrame").className = `device-frame device-frame--${mode}`;
      container.querySelectorAll("[data-mode]").forEach(b => b.classList.remove("admin-btn--primary"));
      btn.classList.add("admin-btn--primary");
      document.getElementById("previewIframe").contentWindow.location.reload();
    });
  });
}
