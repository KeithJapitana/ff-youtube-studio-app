import { createContext, useContext, useState } from "react";

const initialState = {
  // Step 1 — inputs
  frameLink: "",
  youtubeLink: "",
  videoNumber: "",
  clientContext: "",
  videoAbout: "",
  transcript: "",

  // Step 2 — API key (session only, never persisted to localStorage)
  apiKey: "",
  provider: "anthropic",   // "anthropic" or "yuxor"
  baseUrl: "",              // set automatically based on provider

  // Step 3 — AI outputs
  titles: [],
  hooks: [],        // [{ heading, subheading }]
  description: "",
  tags: [],

  // Step 3 — user selections
  selectedTitle: "",
  selectedHook: null, // { heading, subheading }

  // Step 4 — thumbnail
  selectedThumb: "", // URL string

  // Step 5 — derived from selectedHook
  heading: "",
  subheading: "",

  // Batch import support
  importedRows: [],    // All rows imported from Sheets/JSON
  currentIndex: 0,     // Which row we're currently processing (0 = single mode)
  processedVideos: [], // Completed videos for batch export

  // Batch generation results — one entry per imported row
  batchResults: [],    // [{ titles, hooks, description, tags }]
  batchReviewIndex: 0, // Which video we're reviewing in Step 3
};

const VideoStateContext = createContext(null);

export function VideoStateProvider({ children }) {
  const [state, setState] = useState(initialState);

  function update(patch) {
    setState((prev) => ({ ...prev, ...patch }));
  }

  function reset() {
    // Keep importedRows and processedVideos if we're in batch mode
    setState((prev) => ({
      ...initialState,
      importedRows: prev.importedRows,
      processedVideos: prev.processedVideos,
      currentIndex: prev.importedRows.length > 0 ? prev.currentIndex + 1 : 0,
    }));
  }

  function resetAll() {
    setState(initialState);
  }

  // Load a row from imported rows into the current form
  function loadRow(index) {
    const row = state.importedRows[index];
    if (!row) return;

    setState((prev) => ({
      ...prev,
      currentIndex: index,
      frameLink: row.frame_link || row.frameLink || "",
      youtubeLink: row.youtube_link || row.youtubeLink || "",
      videoNumber: row.video_number || row.videoNumber || "",
      clientContext: row.client_context || row.clientContext || "",
      videoAbout: row.video_about || row.videoAbout || "",
      transcript: row.transcript || row.transcript || "",
      // Clear outputs
      titles: [],
      hooks: [],
      description: "",
      tags: [],
      selectedTitle: "",
      selectedHook: null,
      selectedThumb: "",
      heading: "",
      subheading: "",
    }));
  }

  // Save current video to processed list
  function saveProcessedVideo() {
    const video = {
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

    setState((prev) => ({
      ...prev,
      processedVideos: [...prev.processedVideos, video],
    }));
  }

  // When selectedHook is set, auto-split heading + subheading
  function setSelectedHook(hook) {
    setState((prev) => ({
      ...prev,
      selectedHook: hook,
      heading: hook?.heading || "",
      subheading: hook?.subheading || "",
    }));
  }

  // Batch: save generation results for all videos
  function setBatchResults(results) {
    setState((prev) => ({ ...prev, batchResults: results, batchReviewIndex: 0 }));
  }

  // Batch: update a single video's review selections
  function updateBatchResult(index, patch) {
    setState((prev) => {
      const updated = [...prev.batchResults];
      updated[index] = { ...updated[index], ...patch };
      return { ...prev, batchResults: updated };
    });
  }

  // Batch: set which video we're reviewing
  function setBatchReviewIndex(index) {
    setState((prev) => ({ ...prev, batchReviewIndex: index }));
  }

  // Reset batch review index to 0 (for when moving to next step)
  function resetBatchReviewIndex() {
    setState((prev) => ({ ...prev, batchReviewIndex: 0 }));
  }

  return (
    <VideoStateContext.Provider value={{
      state, update, reset, resetAll, setSelectedHook,
      loadRow, saveProcessedVideo,
      setBatchResults, updateBatchResult, setBatchReviewIndex, resetBatchReviewIndex,
    }}>
      {children}
    </VideoStateContext.Provider>
  );
}

export function useVideoState() {
  return useContext(VideoStateContext);
}
