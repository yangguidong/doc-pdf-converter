/** Admin API Client */

const BASE = "/api/admin";

async function request(url, options = {}) {
  const config = { credentials: "same-origin", headers: { Accept: "application/json" }, ...options };
  if (config.body && !(config.body instanceof FormData)) {
    config.headers["Content-Type"] = "application/json";
    config.body = JSON.stringify(config.body);
  }
  if (config.body instanceof FormData) delete config.headers["Content-Type"];
  const res = await fetch(BASE + url, config);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const adminApi = {
  login: (body) => request("/login", { method: "POST", body }),
  logout: () => request("/logout", { method: "POST" }),
  me: () => request("/me"),
  changePassword: (body) => request("/change-password", { method: "PUT", body }),
  getWorks: (params) => request("/works?" + new URLSearchParams(params)),
  getWorkCategories: () => request("/works/categories/admin"),
  getWork: (id) => request("/works/" + id),
  createWork: (body) => request("/works", { method: "POST", body }),
  updateWork: (id, body) => request("/works/" + id, { method: "PUT", body }),
  deleteWork: (id) => request("/works/" + id, { method: "DELETE" }),
  togglePublish: (id, v) => request("/works/" + id + "/publish", { method: "PATCH", body: { is_published: v } }),
  toggleFeature: (id, v) => request("/works/" + id + "/feature", { method: "PATCH", body: { is_featured: v } }),
  addGalleryImages: (id, mediaIds) => request("/works/" + id + "/images", { method: "POST", body: { media_ids: mediaIds } }),
  removeGalleryImage: (workId, mediaId) => request("/works/" + workId + "/images/" + mediaId, { method: "DELETE" }),
  sortGallery: (workId, imageIds) => request("/works/" + workId + "/images/sort", { method: "PUT", body: { image_ids: imageIds } }),
  addVideo: (workId, body) => request("/works/" + workId + "/videos", { method: "POST", body }),
  updateVideo: (workId, videoId, body) => request("/works/" + workId + "/videos/" + videoId, { method: "PUT", body }),
  deleteVideo: (workId, videoId) => request("/works/" + workId + "/videos/" + videoId, { method: "DELETE" }),
  getMedia: (params) => request("/media?" + new URLSearchParams(params)),
  uploadMedia: (file) => { const fd = new FormData(); fd.append("file", file); return request("/media", { method: "POST", body: fd }); },
  batchUpload: (files) => { const fd = new FormData(); files.forEach((f) => fd.append("files", f)); return request("/media/batch", { method: "POST", body: fd }); },
  updateMedia: (id, body) => request("/media/" + id, { method: "PUT", body }),
  deleteMedia: (id) => request("/media/" + id, { method: "DELETE" }),
  getProfile: () => request("/profile"),
  updateProfile: (body) => request("/profile", { method: "PUT", body }),
  getHero: () => request("/hero"),
  updateHero: (body) => request("/hero", { method: "PUT", body }),
  getExhibitions: () => request("/exhibitions"),
  createExhibition: (body) => request("/exhibitions", { method: "POST", body }),
  updateExhibition: (id, body) => request("/exhibitions/" + id, { method: "PUT", body }),
  deleteExhibition: (id) => request("/exhibitions/" + id, { method: "DELETE" }),
  getSocialLinks: () => request("/social-links"),
  createSocialLink: (body) => request("/social-links", { method: "POST", body }),
  updateSocialLink: (id, body) => request("/social-links/" + id, { method: "PUT", body }),
  deleteSocialLink: (id) => request("/social-links/" + id, { method: "DELETE" }),
  getSiteConfig: () => request("/site-config"),
  updateSiteConfig: (body) => request("/site-config", { method: "PUT", body }),
};
