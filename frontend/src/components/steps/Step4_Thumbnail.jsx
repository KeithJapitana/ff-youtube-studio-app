import { useState, useMemo } from "react";
import { useVideoState } from "../../hooks/useVideoState";
import { ThumbnailCard } from "../ui/ThumbnailCard";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";

function extractVideoId(url) {
  const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

const QUALITY_OPTIONS = [
  { urlKey: "maxresdefault", label: "Max HD" },
  { urlKey: "hqdefault", label: "High Quality" },
  { urlKey: "mqdefault", label: "Medium" },
  { urlKey: "sddefault", label: "Standard" },
];

function Step4_Thumbnail({ onNext, onBack }) {
  const { state, update, updateBatchResult, setBatchReviewIndex, resetBatchReviewIndex } = useVideoState();
  const [customUrl, setCustomUrl] = useState("");
  const [visitedCards, setVisitedCards] = useState(new Set([0]));

  const isBatch = state.batchResults.length > 0;
  const currentVideo = isBatch ? state.batchResults[state.batchReviewIndex] : null;

  const youtubeLink = isBatch ? (currentVideo?.youtubeLink || currentVideo?.youtube_link || "") : state.youtubeLink;
  const selectedThumb = isBatch ? (currentVideo?.selectedThumb || "") : state.selectedThumb;

  const videoId = useMemo(() => {
    const url = customUrl || youtubeLink;
    return url ? extractVideoId(url) : null;
  }, [customUrl, youtubeLink]);

  const thumbnails = useMemo(() => {
    if (!videoId) return [];
    return QUALITY_OPTIONS.map(q => ({
      url: `https://img.youtube.com/vi/${videoId}/${q.urlKey}.jpg`,
      quality: q.label,
    }));
  }, [videoId]);

  function handleSelectThumbnail(url) {
    if (isBatch) {
      updateBatchResult(state.batchReviewIndex, { selectedThumb: url });
    } else {
      update({ selectedThumb: url });
    }
  }

  function handleCardClick(index) {
    setCustomUrl("");
    setBatchReviewIndex(index);
    setVisitedCards(prev => new Set([...prev, index]));
  }

  function handleContinue() {
    if (isBatch) {
      // Check all cards have been visited
      if (visitedCards.size < state.batchResults.length) {
        const firstUnvisited = state.batchResults.findIndex((_, i) => !visitedCards.has(i));
        handleCardClick(firstUnvisited);
        return;
      }

      // Check all videos with YouTube links have thumbnails
      const incomplete = state.batchResults.findIndex(v => {
        const hasYoutubeLink = v.youtubeLink || v.youtube_link;
        return hasYoutubeLink && !v.selectedThumb;
      });

      if (incomplete !== -1) {
        handleCardClick(incomplete);
        return;
      }

      resetBatchReviewIndex();
    }
    onNext();
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <span className="px-2 sm:px-3 py-1 bg-brand-primary/20 border border-brand-secondary/30 text-brand-secondary text-xs font-mono font-bold rounded">
            STEP 04
          </span>
          <Badge variant="default">Select Thumbnail</Badge>
          {isBatch && (
            <Badge variant="brand">
              Video {state.batchReviewIndex + 1}/{state.batchResults.length}
            </Badge>
          )}
        </div>
        <h2 className="font-display font-bold text-2xl sm:text-3xl lg:text-4xl text-white">
          {isBatch ? "Choose thumbnails for each video" : "Choose your thumbnail"}
        </h2>
        <p className="text-white/50 text-sm sm:text-base">
          {isBatch
            ? `Select a thumbnail for each video. Click a card to navigate.`
            : "Select a still image from your YouTube video."
          }
        </p>
      </div>

      {/* Batch video cards */}
      {isBatch && (
        <section className="space-y-3">
          <h3 className="font-display font-semibold text-lg sm:text-xl text-white">Videos</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
            {state.batchResults.map((v, i) => {
              const hasThumb = !!v.selectedThumb;
              const isVisited = visitedCards.has(i);
              const isCurrent = i === state.batchReviewIndex;
              return (
                <button
                  key={i}
                  onClick={() => handleCardClick(i)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isCurrent
                      ? "border-brand-secondary/50 bg-brand-primary/15"
                      : "border-white/10 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold ${
                      isCurrent ? "bg-brand-secondary text-white" : "bg-white/10 text-white/50"
                    }`}>
                      {i + 1}
                    </span>
                    <span className="text-xs text-white/30 font-mono truncate">
                      {hasThumb ? "Done" : isVisited ? "Viewed" : "Not viewed"}
                    </span>
                  </div>
                  <p className="text-xs text-white/70 truncate">{v.videoAbout || v.video_about || `Video ${i + 1}`}</p>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Batch video info */}
      {isBatch && currentVideo && (
        <Card className="p-4 border-brand-secondary/30 bg-brand-primary/5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-brand-primary/30 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-brand-secondary font-bold text-sm">{state.batchReviewIndex + 1}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white text-sm truncate">{currentVideo.videoAbout || currentVideo.video_about || "Untitled"}</p>
              <p className="text-xs text-white/50 truncate">{currentVideo.clientContext || currentVideo.client_context || currentVideo.client_industry_context || "No client"}</p>
              {youtubeLink && <p className="text-xs text-brand-secondary/60 truncate mt-1">{youtubeLink}</p>}
            </div>
          </div>
        </Card>
      )}

      {/* Custom URL Input */}
      {!isBatch && (
        <Card className="p-4 sm:p-6">
          <label className="block text-sm font-medium text-white/60 mb-2">YouTube URL</label>
          <input
            type="url"
            value={customUrl || youtubeLink}
            onChange={(e) => setCustomUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            className="input-cinematic"
          />
        </Card>
      )}

      {!videoId ? (
        <div className="text-center py-12 sm:py-16">
          <div className="w-16 sm:w-20 h-16 sm:h-20 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 sm:w-10 h-8 sm:h-10 text-white/30" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z"/>
            </svg>
          </div>
          <p className="text-white/40 text-sm sm:text-base">No YouTube video detected</p>
          <p className="text-xs sm:text-sm text-white/30 mt-1">
            {isBatch ? "This video has no YouTube link. Click another card to navigate." : "Enter a YouTube URL above to load thumbnails"}
          </p>
        </div>
      ) : (
        <>
          {/* Thumbnail Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {thumbnails.map((thumb) => (
              <ThumbnailCard
                key={thumb.quality}
                src={thumb.url}
                quality={thumb.quality}
                selected={selectedThumb === thumb.url}
                onClick={() => handleSelectThumbnail(thumb.url)}
              />
            ))}
          </div>

          {/* Selected Preview */}
          {selectedThumb && (
            <Card className="p-4 sm:p-6 border-brand-secondary/30 bg-brand-primary/5">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-brand-secondary shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span className="text-brand-secondary font-medium text-sm sm:text-base">Selected Thumbnail</span>
              </div>
              <img src={selectedThumb} alt="Selected thumbnail" className="w-full sm:w-64 rounded-lg shadow-2xl" />
            </Card>
          )}
        </>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center pt-4 border-t border-white/5">
        <div className="flex gap-2">
          {!isBatch && <Button variant="ghost" onClick={onBack}>← Back</Button>}
        </div>
        <Button onClick={handleContinue} disabled={!selectedThumb && !isBatch} className="w-full sm:w-auto">
          {isBatch ? "Continue to Export →" : "Continue →"}
        </Button>
      </div>

      {/* Batch progress indicator */}
      {isBatch && (
        <div className="flex justify-center gap-1.5">
          {state.batchResults.map((v, i) => {
            const hasThumb = !!v.selectedThumb;
            const isVisited = visitedCards.has(i);
            return (
              <button
                key={i}
                onClick={() => handleCardClick(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === state.batchReviewIndex
                    ? "bg-brand-secondary w-6"
                    : hasThumb
                    ? "bg-brand-primary/50"
                    : isVisited
                    ? "bg-white/30"
                    : "bg-white/20"
                }`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Step4_Thumbnail;
