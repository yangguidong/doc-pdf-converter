/** 管理后台路由 */

class AdminRouter {
  constructor(container选择or, routes) {
    this.container = document.query选择or(container选择or);
    this.routes = routes;
    this.currentPage = null;
    window.addEventListener("hashchange", () => this.resolve());
  }

  resolve() {
    const hash = window.location.hash.slice(1) || "/";
    const match = this._matchRoute(hash);
    if (!match) { this.navigate("/"); return; }
    if (this.currentPage?.destroy) this.currentPage.destroy();
    const PageClass = match.route.page;
    const page = new PageClass(this.container);
    page.params = match.params;
    page.render();
    this.currentPage = page;
  }

  navigate(path) { window.location.hash = path; }

  _matchRoute(hash) {
    const parts = hash.split("/").filter(Boolean);
    for (const route of this.routes) {
      const rp = route.path.split("/").filter(Boolean);
      if (parts.length !== rp.length) continue;
      const params = {};
      let ok = true;
      for (let i = 0; i < rp.length; i++) {
        if (rp[i].startsWith(":")) {
          params[rp[i].slice(1)] = decodeURIComponent(parts[i]);
        } else if (rp[i] !== parts[i]) {
          ok = false; break;
        }
      }
      if (ok) return { route, params };
    }
    return null;
  }
}

export { AdminRouter };
