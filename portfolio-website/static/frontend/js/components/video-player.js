/** Video player — supports YouTube, Vimeo, and direct MP4 */

export function renderVideoPlayer(video) {
  let embedHtml = "";

  if (video.platform === "youtube") {
    const videoId = extractYouTubeId(video.video_url);
    if (videoId) {
      embedHtml = `<iframe src="https://www.youtube-nocookie.com/embed/${videoId}"
        frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen></iframe>`;
    }
  } else if (video.platform === "vimeo") {
    const videoId = extractVimeoId(video.video_url);
    if (videoId) {
      embedHtml = `<iframe src="https://player.vimeo.com/video/${videoId}"
        frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
    }
  } else {
    // Direct video or unknown
    embedHtml = `<video controls playsinline>
      <source src="${video.video_url}" type="video/mp4">
      Your browser does not support the video tag.
    </video>`;
  }

  return `<div class="video-container">
    ${embedHtml}
    ${video.title ? `<p style="text-align:center;margin-top:8px;color:var(--color-text-muted);font-size:var(--font-size-sm)">${video.title}</p>` : ""}
  </div>`;
}

function extractYouTubeId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const match = url.match(p);
    if (match) return match[1];
  }
  return null;
}

function extractVimeoId(url) {
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match ? match[1] : null;
}
