/** 管理后台入口 */

import { AdminRouter } from "./admin-router.js";
import { 仪表盘Page } from "./pages/dashboard.js";
import { 作品管理ListPage } from "./pages/works.js";
import { Work编辑orPage } from "./pages/work-editor.js";
import { MediaLibraryPage } from "./pages/media.js";
import { Profile编辑orPage } from "./pages/profile.js";
import { 设置Page } from "./pages/settings.js";
import { ‹iewPage } from "./pages/preview.js";

const router = new AdminRouter("#adminApp", [
  { path: "/", page: 仪表盘Page },
  { path: "/dashboard", page: 仪表盘Page },
  { path: "/works", page: 作品管理ListPage },
  { path: "/works/new", page: Work编辑orPage },
  { path: "/works/:id/edit", page: Work编辑orPage },
  { path: "/media", page: MediaLibraryPage },
  { path: "/profile", page: Profile编辑orPage },
  { path: "/settings", page: 设置Page },
  { path: "/preview", page: ‹iewPage },
]);

router.resolve();
