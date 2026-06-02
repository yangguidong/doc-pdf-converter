/** Hash-based SPA Router */

class HashRouter {
  constructor(containerSelector, routes) {
    this.container = document.querySelector(containerSelector);
    this.routes = routes;
    this.currentPage = null;
    this._listeners = { before: [], after: [] };
    window.addEventListener("hashchange", () => this.resolve());
  }

  resolve() {
    const hash = window.location.hash.slice(1) || "/";
    const match = this._matchRoute(hash);
    if (!match) {
      this.navigate("/");
      return;
    }

    this._emit("before", match);

    // Cleanup previous page
    if (this.currentPage?.destroy) {
      this.currentPage.destroy();
    }

    const PageClass = match.route.page;
    const page = new PageClass(this.container);
    page.params = match.params;
    page.render();
    this.currentPage = page;

    this._emit("after", match);
  }

  navigate(path) {
    window.location.hash = path;
  }

  _matchRoute(hash) {
    const parts = hash.split("/").filter(Boolean);
    for (const route of this.routes) {
      const routeParts = route.path.split("/").filter(Boolean);
      if (parts.length !== routeParts.length) continue;

      const params = {};
      let match = true;
      for (let i = 0; i < routeParts.length; i++) {
        if (routeParts[i].startsWith(":")) {
          params[routeParts[i].slice(1)] = decodeURIComponent(parts[i]);
        } else if (routeParts[i] !== parts[i]) {
          match = false;
          break;
        }
      }
      if (match) return { route, params };
    }
    return null;
  }

  on(event, callback) {
    if (this._listeners[event]) {
      this._listeners[event].push(callback);
    }
  }

  _emit(event, data) {
    this._listeners[event].forEach((fn) => {
      try { fn(data); } catch (e) { console.error(e); }
    });
  }
}

export function navigateTo(path) {
  window.location.hash = path;
}

export { HashRouter };
