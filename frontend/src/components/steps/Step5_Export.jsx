import { useState } from "react";
import { useVideoState } from "../../hooks/useVideoState";
import { downloadCsv, downloadJson, downloadAllThumbnails } from "../../services/exportHelpers";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";

function Step5_Export({ onReset }) {
  const { state, reset, resetAll } = useVideoState();
  const [copied, setCopied] = useState(null);
  const [expandedIdx, setExpandedIdx] = useState(0);
  const [downloadingThumbs, setDownloadingThumbs] = useState(false);

  const isBatch = state.batchResults.length > 0;
  const videos = isBatch ? state.batchResults : [buildSingleVideo(state)];
  const currentVideo = videos[expandedIdx] || videos[0];

  if (!currentVideo?.selectedTitle && !isBatch) {
    return (
      <div className="text-center py-12 sm:py-20">
        <p className="text-white/40">No content to export. Please complete the previous steps first.</p>
      </div>
    );
  }

  function handleCopy(text, field) {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  }

  function handleExportAll() {
    const exportData = {
      totalVideos: videos.length,
      videos: videos.map(v => ({
        frameLink: v.frameLink || v.frame_link || "",
        youtubeLink: v.youtubeLink || v.youtube_link || "",
        clientContext: v.clientContext || v.client_context || v.client_industry_context || "",
        videoAbout: v.videoAbout || v.video_about || "",
        selectedTitle: v.selectedTitle || "",
        description: v.description || "",
        tags: v.tags || [],
        heading: v.heading || v.selectedHook?.heading || "",
        subheading: v.subheading || v.selectedHook?.subheading || "",
        selectedThumb: v.selectedThumb || "",
      })),
    };
    downloadJson(exportData);
  }

  function handleExportCanvaCsv() {
    const rows = videos.map(v => ({
      heading: v.heading || v.selectedHook?.heading || "",
      subheading: v.subheading || v.selectedHook?.subheading || "",
    }));

    // Build CSV content
    let csv = "heading,subheading\n";
    rows.forEach(r => {
      csv += `"${(r.heading || "").replace(/"/g, '""')}","${(r.subheading || "").replace(/"/g, '""')}"\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "canva-thumbnails.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <span className="px-2 sm:px-3 py-1 bg-brand-primary/20 border border-brand-secondary/30 text-brand-secondary text-xs font-mono font-bold rounded">
              STEP 05
            </span>
            <Badge variant="success">Ready to Export</Badge>
          </div>
          <h2 className="font-display font-bold text-2xl sm:text-3xl lg:text-4xl text-white">
            Your content is ready
          </h2>
        </div>
        {isBatch && (
          <Badge variant="brand">{videos.length} videos</Badge>
        )}
      </div>

      {/* Batch video cards */}
      {isBatch && (
        <section className="space-y-3">
          <h3 className="font-display font-semibold text-lg sm:text-xl text-white">Videos</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
            {videos.map((v, i) => (
              <button
                key={i}
                onClick={() => setExpandedIdx(i)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  i === expandedIdx
                    ? "border-brand-secondary/50 bg-brand-primary/15"
                    : "border-white/10 bg-white/5 hover:bg-white/10"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold ${
                    i === expandedIdx ? "bg-brand-secondary text-white" : "bg-white/10 text-white/50"
                  }`}>
                    {i + 1}
                  </span>
                  <span className="text-xs text-white/30 font-mono truncate">
                    {v.selectedThumb ? "Done" : "No thumb"}
                  </span>
                </div>
                <p className="text-xs text-white/70 truncate">{v.videoAbout || v.video_about || `Video ${i + 1}`}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Expanded video details */}
      <VideoExportCard video={currentVideo} index={expandedIdx} copied={copied} onCopy={handleCopy} />

      {/* Batch navigation */}
      {isBatch && (
        <div className="flex justify-center gap-2">
          <Button
            variant="ghost"
            onClick={() => setExpandedIdx(Math.max(0, expandedIdx - 1))}
            disabled={expandedIdx === 0}
          >
            ← Previous
          </Button>
          <Button
            variant="ghost"
            onClick={() => setExpandedIdx(Math.min(videos.length - 1, expandedIdx + 1))}
            disabled={expandedIdx === videos.length - 1}
          >
            Next →
          </Button>
        </div>
      )}

      {/* Thumbnails Export */}
      {isBatch && videos.some(v => v.selectedThumb) && (
        <section className="space-y-3 sm:space-y-4">
          <h3 className="font-display font-semibold text-lg sm:text-xl text-white">Thumbnails</h3>
          <Card className="p-4 sm:p-6">
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <Button
                onClick={async () => {
                  setDownloadingThumbs(true);
                  await downloadAllThumbnails(videos);
                  setDownloadingThumbs(false);
                }}
                disabled={downloadingThumbs}
                className="flex-1 sm:flex-none"
              >
                {downloadingThumbs ? "Downloading..." : `Download All ${videos.length} Thumbnails`}
              </Button>
            </div>
            <p className="text-xs text-white/30 mt-2">
              Downloads will start automatically. Allow multiple downloads if prompted by your browser.
            </p>
          </Card>
        </section>
      )}

      {/* Canva Bulk Export */}
      <section className="space-y-3 sm:space-y-4">
        <h3 className="font-display font-semibold text-lg sm:text-xl text-white">
          {isBatch ? `Canva Export (All ${videos.length} Videos)` : "Canva Bulk Export"}
        </h3>
        <Card className="p-4 sm:p-6">
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <Button onClick={handleExportCanvaCsv} className="flex-1 sm:flex-none">
              Download CSV
            </Button>
            <Button onClick={handleExportAll} variant="outline" className="flex-1 sm:flex-none">
              Export All JSON
            </Button>
            <a
              href="https://canva.link/9n5zoesowla646q"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-6 py-3 bg-brand-primary hover:bg-brand-tertiary text-white text-sm font-semibold rounded-xl transition-colors flex-1 sm:flex-none"
            >
              Open Canva
            </a>
          </div>
        </Card>
      </section>

      {/* Final Actions */}
      <div className="flex flex-col-reverse sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-4 border-t border-white/5">
        <Button variant="outline" onClick={() => { downloadJson(isBatch ? { totalVideos: videos.length, videos } : state); }}>
          Export Current JSON
        </Button>
        <Button variant="secondary" onClick={() => { resetAll(); onReset?.(); }}>
          Start New Batch
        </Button>
      </div>
    </div>
  );
}

function VideoExportCard({ video, index, copied, onCopy }) {
  const tagsString = (video.tags || []).join(", ");
  const heading = video.heading || video.selectedHook?.heading || "";
  const subheading = video.subheading || video.selectedHook?.subheading || "";

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Title & Link */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-mono text-white/40 uppercase tracking-wider">Title</label>
            <Button onClick={() => onCopy(video.selectedTitle, `title-${index}`)} variant="ghost" size="sm">
              {copied === `title-${index}` ? "Copied!" : "Copy"}
            </Button>
          </div>
          <p className="text-white font-medium text-sm break-words">{video.selectedTitle || "No title"}</p>
        </Card>

        {(video.youtubeLink || video.youtube_link) && (
          <Card className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-mono text-white/40 uppercase tracking-wider">YouTube Link</label>
              <div className="flex gap-1">
                <a
                  href={video.youtubeLink || video.youtube_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-3 py-1 bg-brand-primary hover:bg-brand-tertiary text-white text-xs font-medium rounded-lg transition-colors"
                >
                  Open
                </a>
                <Button onClick={() => onCopy(video.youtubeLink || video.youtube_link, `yt-${index}`)} variant="ghost" size="sm">
                  {copied === `yt-${index}` ? "Copied!" : "Copy"}
                </Button>
              </div>
            </div>
            <p className="text-white/60 text-xs truncate">{video.youtubeLink || video.youtube_link}</p>
          </Card>
        )}
      </div>

      {/* Description */}
      <Card className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-mono text-white/40 uppercase tracking-wider">Description</label>
          <Button onClick={() => onCopy(video.description, `desc-${index}`)} variant="ghost" size="sm">
            {copied === `desc-${index}` ? "Copied!" : "Copy"}
          </Button>
        </div>
        <p className="text-white/70 text-sm whitespace-pre-wrap max-h-32 overflow-y-auto">{video.description || "No description"}</p>
      </Card>

      {/* Tags */}
      <Card className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-mono text-white/40 uppercase tracking-wider">Tags</label>
          <Button onClick={() => onCopy(tagsString, `tags-${index}`)} variant="ghost" size="sm">
            {copied === `tags-${index}` ? "Copied!" : "Copy"}
          </Button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(video.tags || []).map((tag, i) => (
            <span key={i} className="px-2 py-1 bg-brand-primary/10 border border-brand-primary/20 text-brand-secondary text-xs rounded">
              {tag}
            </span>
          ))}
        </div>
      </Card>

      {/* Canva Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card className="p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-mono text-white/40 uppercase tracking-wider">Heading</label>
            <Button onClick={() => onCopy(heading, `hd-${index}`)} variant="ghost" size="sm">
              {copied === `hd-${index}` ? "Copied!" : "Copy"}
            </Button>
          </div>
          <p className="text-white text-sm break-words">{heading || "-"}</p>
        </Card>
        <Card className="p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-mono text-white/40 uppercase tracking-wider">Sub Heading</label>
            <Button onClick={() => onCopy(subheading, `sh-${index}`)} variant="ghost" size="sm">
              {copied === `sh-${index}` ? "Copied!" : "Copy"}
            </Button>
          </div>
          <p className="text-white text-sm break-words">{subheading || "-"}</p>
        </Card>
      </div>

      {/* Thumbnail */}
      {video.selectedThumb && (
        <Card className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <img src={video.selectedThumb} alt="Thumbnail" className="w-full sm:w-48 rounded-lg shadow-xl" />
            <div className="flex-1 space-y-3">
              <p className="text-white/60 text-sm">Selected thumbnail</p>
              <div className="flex flex-wrap gap-2">
                <a href={video.selectedThumb} download={`thumbnail-${index + 1}.jpg`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center px-4 py-2 bg-brand-primary hover:bg-brand-tertiary text-white text-sm font-medium rounded-xl transition-colors">
                  Download
                </a>
                <Button variant="outline" size="sm" onClick={() => onCopy(video.selectedThumb, `thumb-${index}`)}>
                  {copied === `thumb-${index}` ? "Copied!" : "Copy URL"}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

function buildSingleVideo(state) {
  return {
    frameLink: state.frameLink,
    youtubeLink: state.youtubeLink,
    videoNumber: state.videoNumber,
    clientContext: state.clientContext,
    videoAbout: state.videoAbout,
    heading: state.heading,
    subheading: state.subheading,
    selectedTitle: state.selectedTitle,
    description: state.description,
    tags: state.tags,
    selectedThumb: state.selectedThumb,
  };
}

export default Step5_Export;
