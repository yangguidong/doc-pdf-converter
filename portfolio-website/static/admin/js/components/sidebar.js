/** 管理后台侧边栏导航 */

export function renderSidebar(activePath) {
  const items = [
    { path: "/dashboard", icon: "📊", label: "仪表盘" },
    { path: "/works", icon: "🖼️", label: "作品管理" },
    { path: "/media", icon: "📁", label: "媒体库" },
    { path: "/profile", icon: "👤", label: "个人与内容" },
    { path: "/settings", icon: "⚙️", label: "设置" },
    { path: "/preview", icon: "👁️", label: "实时预览" },
  ];
  return `
    <div class="admin-sidebar">
      <div class="admin-sidebar__brand">作品集管理</div>
      <ul class="admin-sidebar__nav">
        ${items.map((item) => `
          <li><a href="#${item.path}" class="${activePath === item.path ? "active" : ""}">
            <span>${item.icon}</span> ${item.label}
          </a></li>`).join("")}
      </ul>
      <div style="padding:16px 20px;border-top:1px solid rgba(255,255,255,0.06)">
        <a href="/" target="_blank" style="color:#a0a8c0;font-size:12px;text-decoration:none">🌐 查看网站</a>
      </div>
    </div>`;
}
