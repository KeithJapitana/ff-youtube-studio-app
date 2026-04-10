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

function triggerDownload(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
