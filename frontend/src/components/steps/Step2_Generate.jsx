import { useState } from "react";
import { useVideoState } from "../../hooks/useVideoState";
import { useGeneration } from "../../hooks/useGeneration";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";

const PROVIDERS = {
  anthropic: {
    label: "Anthropic",
    baseUrl: "https://api.anthropic.com",
    placeholder: "sk-ant-...",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
      </svg>
    ),
  },
  yuxor: {
    label: "Yuxor",
    baseUrl: "https://api2.yuxor.tech",
    placeholder: "sk-...",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/>
      </svg>
    ),
  },
};

function detectProvider(key) {
  if (!key) return null;
  if (key.startsWith("sk-ant-")) return "anthropic";
  if (key.startsWith("sk-")) return "yuxor";
  return null;
}

function Step2_Generate({ onNext, onBack }) {
  const { state, update, setBatchResults, resetBatchReviewIndex } = useVideoState();
  const { generate } = useGeneration();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const wordCount = state.transcript ? state.transcript.split(/\s+/).length : 0;
  const currentProvider = PROVIDERS[state.provider] || PROVIDERS.anthropic;
  const isBatch = state.importedRows.length > 1;

  function handleApiKeyChange(e) {
    const key = e.target.value;
    const detected = detectProvider(key);
    if (detected && detected !== state.provider) {
      update({ apiKey: key, provider: detected, baseUrl: PROVIDERS[detected].baseUrl });
    } else {
      update({ apiKey: key });
    }
  }

  async function handleGenerate() {
    setLoading(true);
    setError(null);

    if (isBatch) {
      // Generate all imported videos
      const results = [];
      const total = state.importedRows.length;
      setProgress({ current: 0, total });

      for (let i = 0; i < total; i++) {
        const row = state.importedRows[i];
        setProgress({ current: i + 1, total });
        try {
          const result = await generate({
            apiKey: state.apiKey,
            provider: state.provider,
            baseUrl: state.baseUrl || currentProvider.baseUrl,
            videoAbout: row.videoAbout || row.video_about || "",
            clientContext: row.clientContext || row.client_context || row.client_industry_context || "",
            transcript: row.transcript || "",
          });
          if (result) {
            results.push({
              ...row,
              titles: result.titles || [],
              hooks: result.hooks || [],
              description: result.description || "",
              tags: result.tags || [],
              selectedTitle: result.titles?.[0] || "",
              selectedHook: result.hooks?.[0] || null,
            });
          } else {
            results.push({
              ...row,
              titles: [], hooks: [], description: "", tags: [],
              error: "Generation failed",
            });
          }
        } catch (err) {
          results.push({
            ...row,
            titles: [], hooks: [], description: "", tags: [],
            error: err.message,
          });
        }
      }

      setBatchResults(results);
      setLoading(false);
      onNext();
    } else {
      // Single video
      const result = await generate({
        apiKey: state.apiKey,
        provider: state.provider,
        baseUrl: state.baseUrl || currentProvider.baseUrl,
        videoAbout: state.videoAbout,
        clientContext: state.clientContext,
        transcript: state.transcript,
      });
      setLoading(false);
      if (result) {
        update({
          titles: result.titles,
          hooks: result.hooks,
          description: result.description,
          tags: result.tags,
        });
        onNext();
      }
    }
  }

  const detectedProvider = detectProvider(state.apiKey);
  const totalVideos = isBatch ? state.importedRows.length : 1;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <span className="px-2 sm:px-3 py-1 bg-brand-primary/20 border border-brand-secondary/30 text-brand-secondary text-xs font-mono font-bold rounded">
            STEP 02
          </span>
          <Badge variant="default">Generate Content</Badge>
          {isBatch && <Badge variant="brand">{totalVideos} videos</Badge>}
        </div>
        <h2 className="font-display font-bold text-2xl sm:text-3xl lg:text-4xl text-white">
          Let AI create your content
        </h2>
        <p className="text-white/50 text-sm sm:text-base">
          {isBatch
            ? `Generate titles, descriptions, and tags for all ${totalVideos} videos at once.`
            : "Provide your API key and Claude will generate titles, description, tags, and hooks."
          }
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* API Configuration */}
        <Card className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <h3 className="font-display font-semibold text-lg text-white">API Configuration</h3>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-white/60">Provider</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(PROVIDERS).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => update({ provider: key, baseUrl: config.baseUrl })}
                  className={`p-3 sm:p-4 rounded-xl border transition-all flex items-center gap-2 sm:gap-3 ${
                    state.provider === key
                      ? "border-brand-primary/50 bg-brand-primary/10"
                      : "border-white/10 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <div className={`p-1.5 sm:p-2 rounded-lg shrink-0 ${state.provider === key ? "bg-brand-primary/20" : "bg-white/5"}`}>
                    {config.icon}
                  </div>
                  <span className={`text-xs sm:text-sm font-medium truncate ${state.provider === key ? "text-white" : "text-white/60"}`}>
                    {config.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-white/60">API Key</label>
            <input
              type="text"
              value={state.apiKey}
              onChange={handleApiKeyChange}
              placeholder={currentProvider.placeholder}
              className="input-cinematic font-mono text-sm"
            />
            {detectedProvider && detectedProvider !== state.provider && (
              <p className="text-xs text-brand-secondary flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/>
                </svg>
                Key detected as {PROVIDERS[detectedProvider].label}
              </p>
            )}
            <p className="text-xs text-white/30">Your key is used only for this session and never stored.</p>
          </div>
        </Card>

        {/* Preview */}
        <div className="space-y-4 sm:space-y-6">
          <Card className="p-4 sm:p-6 bg-gradient-to-br from-white/[0.03] to-transparent">
            <h3 className="font-display font-semibold text-lg text-white mb-4">
              {isBatch ? "Batch Preview" : "Preview"}
            </h3>
            {isBatch ? (
              <div className="space-y-3">
                <PreviewRow label="Total Videos" value={totalVideos} />
                <PreviewRow label="Provider" value={currentProvider.label} />
                <div className="max-h-32 overflow-y-auto space-y-1 mt-2">
                  {state.importedRows.map((row, i) => (
                    <p key={i} className="text-xs text-white/40 truncate">
                      {i + 1}. {row.videoAbout || row.video_about || "Untitled"}
                    </p>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                <PreviewRow label="Video About" value={state.videoAbout} />
                <PreviewRow label="Client" value={state.clientContext} />
                <PreviewRow label="Transcript" value={`${wordCount} words`} />
                <PreviewRow label="Provider" value={currentProvider.label} />
              </div>
            )}
          </Card>

          {error && (
            <div className="p-3 sm:p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
              <p className="text-red-400 text-sm break-words">{error}</p>
            </div>
          )}

          {/* Batch progress */}
          {loading && isBatch && (
            <Card className="p-4 sm:p-6 border-brand-secondary/30">
              <div className="flex items-center gap-3 mb-3">
                <svg className="animate-spin h-5 w-5 text-brand-secondary shrink-0" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p className="text-brand-secondary text-sm font-medium">
                  Generating {progress.current} of {progress.total}...
                </p>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div
                  className="bg-brand-secondary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Generate Button */}
      <div className="flex flex-col-reverse sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-4 border-t border-white/5">
        <Button variant="ghost" onClick={onBack}>← Back</Button>
        <Button
          onClick={handleGenerate}
          disabled={!state.apiKey || loading}
          className={`w-full sm:w-auto sm:min-w-[220px] ${loading ? "animate-pulse-glow" : ""}`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-3">
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              {isBatch ? `Generating ${progress.current}/${progress.total}...` : "Generating..."}
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/>
              </svg>
              {isBatch ? `Generate All ${totalVideos} Videos` : "Generate with Claude"}
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}

function PreviewRow({ label, value }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between py-3 border-b border-white/5 last:border-0 gap-1">
      <span className="text-xs sm:text-sm text-white/40">{label}</span>
      <span className="text-sm text-white/80 sm:text-right sm:max-w-[200px] truncate">{value || "-"}</span>
    </div>
  );
}

export default Step2_Generate;
