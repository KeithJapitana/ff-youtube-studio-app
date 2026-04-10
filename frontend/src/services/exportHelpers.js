function escapeCSV(str) {
  return String(str).replace(/"/g, '""');
}

export function buildCsv(heading, subheading) {
  return `heading,subheading\n"${escapeCSV(heading)}","${escapeCSV(subheading)}"`;
}

export function downloadCsv(heading, subheading) {
  triggerDownload(buildCsv(heading, subheading), "canva-bulk-export.csv", "text/csv");
}

export function downloadJson(state) {
  triggerDownload(JSON.stringify(state, null, 2), "video-content-export.json", "application/json");
}

// Download all thumbnails from an array of videos
export async function downloadAllThumbnails(videos) {
  for (let i = 0; i < videos.length; i++) {
    const video = videos[i];
    const thumbnailUrl = video.selectedThumb;

    if (!thumbnailUrl) continue;

    try {
      const response = await fetch(thumbnailUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const videoName = (video.videoAbout || video.video_about || `video-${i + 1}`)
        .replace(/[^a-z0-9]/gi, '-')
        .substring(0, 50);
      a.download = `${videoName}-thumbnail.jpg`;
      a.click();
      URL.revokeObjectURL(url);

      // Small delay between downloads
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (err) {
      console.error(`Failed to download thumbnail ${i + 1}:`, err);
    }
  }
}

function triggerDownload(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
