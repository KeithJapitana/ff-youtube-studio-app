import { useState } from "react";
import { useVideoState } from "../../hooks/useVideoState";
import { TitleOption } from "../ui/TitleOption";
import { HookOption } from "../ui/HookOption";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";

function Step3_Review({ onNext, onBack }) {
  const { state, update, setSelectedHook, updateBatchResult, setBatchReviewIndex, resetBatchReviewIndex } = useVideoState();

  const isBatch = state.batchResults.length > 0;
  const currentVideo = isBatch ? state.batchResults[state.batchReviewIndex] : null;
  const [visitedCards, setVisitedCards] = useState(new Set([0])); // Track which cards have been viewed

  // Use batch data or single video data
  const titles = isBatch ? currentVideo?.titles || [] : state.titles;
  const hooks = isBatch ? currentVideo?.hooks || [] : state.hooks;
  const description = isBatch ? currentVideo?.description || "" : state.description;
  const tags = isBatch ? currentVideo?.tags || [] : state.tags;
  const selectedTitle = isBatch ? currentVideo?.selectedTitle || "" : state.selectedTitle;
  const selectedHook = isBatch ? currentVideo?.selectedHook : state.selectedHook;

  if (!titles.length) {
    return (
      <div className="text-center py-12 sm:py-20">
        <div className="w-16 sm:w-20 h-16 sm:h-20 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 sm:w-10 h-8 sm:h-10 text-white/30" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
          </svg>
        </div>
        <p className="text-white/40 mb-2 text-sm sm:text-base">
          {isBatch && currentVideo && currentVideo.error ? `Error: ${currentVideo.error}` : "No content generated yet"}
        </p>
        {isBatch && (
          <p className="text-white/30 text-xs mb-4">
            Batch results: {state.batchResults.length} | Current: {state.batchReviewIndex}
          </p>
        )}
        <Button variant="secondary" onClick={onBack}>Go Back to Generate</Button>
      </div>
    );
  }

  function handleUpdate(patch) {
    if (isBatch) {
      updateBatchResult(state.batchReviewIndex, patch);
    } else {
      update(patch);
    }
  }

  function handleSetSelectedHook(hook) {
    if (isBatch) {
      updateBatchResult(state.batchReviewIndex, {
        selectedHook: hook,
        heading: hook?.heading || "",
        subheading: hook?.subheading || "",
      });
    } else {
      setSelectedHook(hook);
    }
  }

  function handleTagsChange(e) {
    const newTags = e.target.value.split(",").map(t => t.trim()).filter(Boolean);
    handleUpdate({ tags: newTags });
  }

  function handlePrev() {
    setBatchReviewIndex(state.batchReviewIndex - 1);
    setVisitedCards(prev => new Set([...prev, state.batchReviewIndex - 1]));
  }

  function handleNext() {
    setBatchReviewIndex(state.batchReviewIndex + 1);
    setVisitedCards(prev => new Set([...prev, state.batchReviewIndex + 1]));
  }

  function handleCardClick(index) {
    setBatchReviewIndex(index);
    setVisitedCards(prev => new Set([...prev, index]));
  }

  function handleContinue() {
    if (isBatch) {
      // Check all videos have been visited
      if (visitedCards.size < state.batchResults.length) {
        const firstUnvisited = state.batchResults.findIndex((_, i) => !visitedCards.has(i));
        setBatchReviewIndex(firstUnvisited);
        setVisitedCards(prev => new Set([...prev, firstUnvisited]));
        return;
      }

      // Check all videos have selections
      const allValid = state.batchResults.every(v => v.selectedTitle && v.selectedHook);
      if (!allValid) {
        // Find first incomplete video
        const firstIncomplete = state.batchResults.findIndex(v => !v.selectedTitle || !v.selectedHook);
        setBatchReviewIndex(firstIncomplete);
        return;
      }
      // Reset to card 1 for the next step
      resetBatchReviewIndex();
    }
    onNext();
  }

  const tagsString = tags.join(", ");
  const isValid = selectedTitle && selectedHook;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <span className="px-2 sm:px-3 py-1 bg-brand-primary/20 border border-brand-secondary/30 text-brand-secondary text-xs font-mono font-bold rounded">
            STEP 03
          </span>
          <Badge variant="default">Review & Edit</Badge>
          {isBatch && (
            <Badge variant="brand">
              Video {state.batchReviewIndex + 1}/{state.batchResults.length}
            </Badge>
          )}
        </div>
        <h2 className="font-display font-bold text-2xl sm:text-3xl lg:text-4xl text-white">
          {isBatch ? "Review each video" : "Customize your content"}
        </h2>
        <p className="text-white/50 text-sm sm:text-base">
          {isBatch
            ? `Review and customize each video. Use Next/Previous to navigate between ${state.batchResults.length} videos.`
            : "Select your preferred options and make any edits before finalizing."
          }
        </p>
      </div>

      {/* Batch video cards */}
      {isBatch && (
        <section className="space-y-3">
          <h3 className="font-display font-semibold text-lg sm:text-xl text-white">Videos</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
            {state.batchResults.map((v, i) => {
              const isComplete = v.selectedTitle && v.selectedHook;
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
                      {isComplete ? "Done" : isVisited ? "Viewed" : "Not viewed"}
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
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Left Column */}
        <div className="space-y-6 sm:space-y-8">
          {/* Title Options */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-base sm:text-lg text-white">Title Options</h3>
              <Badge variant="brand">Select 1</Badge>
            </div>
            <div className="space-y-3">
              {titles.map((title, i) => (
                <TitleOption
                  key={i}
                  title={title}
                  selected={selectedTitle === title}
                  onSelect={() => handleUpdate({ selectedTitle: title })}
                />
              ))}
            </div>
          </section>

          {/* Thumbnail Hooks */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-base sm:text-lg text-white">Thumbnail Hooks</h3>
              <Badge variant="brand">Select 1</Badge>
            </div>
            <div className="space-y-3">
              {hooks.map((hook, i) => (
                <HookOption
                  key={i}
                  hook={hook}
                  selected={selectedHook?.heading === hook.heading}
                  onClick={() => handleSetSelectedHook(hook)}
                />
              ))}
            </div>
          </section>
        </div>

        {/* Right Column */}
        <div className="space-y-6 sm:space-y-8">
          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-base sm:text-lg text-white">Description</h3>
              <span className="text-xs text-white/40 font-mono">{description.length} chars</span>
            </div>
            <textarea
              value={description}
              onChange={(e) => handleUpdate({ description: e.target.value })}
              rows={8}
              className="w-full px-3 sm:px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white/80 placeholder-white/20 focus:outline-none focus:border-brand-primary/50 focus:ring-2 focus:ring-brand-primary/20 resize-none text-sm"
            />
          </Card>

          <Card className="p-4 sm:p-6">
            <h3 className="font-display font-semibold text-base sm:text-lg text-white mb-4">Tags</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {tags.map((tag, i) => (
                <span key={i} className="px-2 sm:px-3 py-1 sm:py-1.5 bg-brand-primary/10 border border-brand-primary/20 text-brand-secondary text-xs rounded-lg">
                  {tag}
                </span>
              ))}
            </div>
            <textarea
              value={tagsString}
              onChange={handleTagsChange}
              placeholder="Enter tags separated by commas..."
              rows={3}
              className="w-full px-3 sm:px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white/80 placeholder-white/20 focus:outline-none focus:border-brand-primary/50 focus:ring-2 focus:ring-brand-primary/20 resize-none text-sm"
            />
          </Card>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-4 border-t border-white/5">
        <div className="flex gap-2">
          {!isBatch && <Button variant="ghost" onClick={onBack}>← Back</Button>}
        </div>
        <Button onClick={handleContinue} disabled={!isValid} className="w-full sm:w-auto">
          {isBatch ? "Continue to Thumbnails →" : "Continue →"}
        </Button>
      </div>

      {/* Batch progress indicator */}
      {isBatch && (
        <div className="flex justify-center gap-1.5">
          {state.batchResults.map((v, i) => {
            const isComplete = v.selectedTitle && v.selectedHook;
            const isVisited = visitedCards.has(i);
            return (
              <button
                key={i}
                onClick={() => handleCardClick(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === state.batchReviewIndex
                    ? "bg-brand-secondary w-6"
                    : isComplete
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

export default Step3_Review;
