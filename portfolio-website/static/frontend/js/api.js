/** Public API Client */

const BASE = "/api";

async function request(url, options = {}) {
  const config = {
    headers: { Accept: "application/json" },
    ...options,
  };
  if (config.body && !(config.body instanceof FormData)) {
    config.headers["Content-Type"] = "application/json";
    config.body = JSON.stringify(config.body);
  }
  if (config.body instanceof FormData) {
    delete config.headers["Content-Type"];
  }

  const res = await fetch(BASE + url, config);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const api = {
  getHero: () => request("/hero"),
  getProfile: () => request("/profile"),
  getWorks: (params) => request("/works?" + new URLSearchParams(params)),
  getWorkCategories: () => request("/works/categories"),
  getWork: (slug) => request("/works/" + slug),
  getRelatedWorks: (slug) => request("/works/related/" + slug),
  getExhibitions: (params) => request("/exhibitions?" + new URLSearchParams(params)),
  getSocialLinks: () => request("/social-links"),
  getSiteConfig: (keys) => request("/site-config?keys=" + keys.join(",")),
  submitContact: (data) => request("/contact", { method: "POST", body: data }),
};
