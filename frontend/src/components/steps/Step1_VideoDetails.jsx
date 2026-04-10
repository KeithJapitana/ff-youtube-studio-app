import { useState } from "react";
import { useVideoState } from "../../hooks/useVideoState";
import { loadSheetRows } from "../../services/api";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";

const DEFAULT_SHEET_ID = "1BrT7RTsPUotsESZq3CvNVOrRZ_9MJRT8-RN5TOnB3D0";

// RFC 4180 CSV parser — correctly handles multi-line quoted fields
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
        } else {
          inQuotes = false;
          i++;
        }
      } else {
        field += ch;
        i++;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
        i++;
      } else if (ch === ',') {
        row.push(field);
        field = '';
        i++;
      } else if (ch === '\r' && text[i + 1] === '\n') {
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
        i += 2;
      } else if (ch === '\n') {
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
        i++;
      } else {
        field += ch;
        i++;
      }
    }
  }

  // Flush last row
  row.push(field);
  if (row.some(f => f.trim())) {
    rows.push(row);
  }

  return rows;
}

// Map CSV header names to our field names
function mapHeader(header) {
  const h = header.toLowerCase().trim();
  if (h.includes('frame')) return 'frameLink';
  if (h.includes('youtube') || h.includes('youtu')) return 'youtubeLink';
  if (h.includes('client') || h.includes('industry')) return 'clientContext';
  if (h.includes('what the video') || h.includes('video about') || h.includes('about')) return 'videoAbout';
  if (h.includes('transcript') || h.includes('script')) return 'transcript';
  if (h.includes('video number') || h.includes('video #') || h.includes('number')) return 'videoNumber';
  if (h.includes('name')) return '_name';
  return null; // Unknown header
}

// Parse CSV into clean video objects
function parseVideoCSV(text) {
  const rows = parseCSV(text);
  if (rows.length < 2) return [];

  // Map headers
  const rawHeaders = rows[0];
  const headerMap = rawHeaders.map(mapHeader);

  const videos = [];
  for (let i = 1; i < rows.length; i++) {
    const cells = rows[i];
    // Skip empty rows
    if (cells.every(c => !c.trim())) continue;

    const video = { frameLink: '', youtubeLink: '', videoNumber: '', clientContext: '', videoAbout: '', transcript: '' };
    headerMap.forEach((field, colIdx) => {
      if (field && cells[colIdx] !== undefined) {
        let val = cells[colIdx].trim();
        // Clean transcript: strip filename header like "v3. Aug 15a.txt\nEnglish (US)\n\n"
        if (field === 'transcript') {
          val = val.replace(/^.*\.txt\s*/i, '').replace(/^English\s*\(.*?\)\s*/i, '').trim();
        }
        video[field] = val;
      }
    });

    // Also grab unnamed column (col 1) as a name/label if it has content
    if (!headerMap[1] && cells[1] && cells[1].trim()) {
      video._name = cells[1].trim();
    }

    // Only add if it has meaningful data
    if (video.frameLink || video.youtubeLink || video.videoAbout || video.transcript) {
      videos.push(video);
    }
  }

  return videos;
}

function Step1_VideoDetails({ onNext }) {
  const { state, update } = useVideoState();
  const [tab, setTab] = useState("manual");
  const [sheetRows, setSheetRows] = useState([]);
  const [sheetLoading, setSheetLoading] = useState(false);
  const [sheetError, setSheetError] = useState("");

  const [sheetApiKey, setSheetApiKey] = useState("");
  const [sheetId, setSheetId] = useState(DEFAULT_SHEET_ID);
  const [jsonError, setJsonError] = useState("");
  const [csvError, setCsvError] = useState("");
  const [csvRows, setCsvRows] = useState([]);
  const [selectedCsvIdx, setSelectedCsvIdx] = useState(null);

  function handleChange(e) {
    const { name, value } = e.target;
    update({ [name]: value });
  }

  async function handleLoadSheet() {
    if (!sheetApiKey || !sheetId) {
      setSheetError("Please provide both API Key and Spreadsheet ID");
      return;
    }
    setSheetLoading(true);
    setSheetError("");
    try {
      const result = await loadSheetRows({ sheetId, apiKey: sheetApiKey });
      if (!result.success) {
        setSheetError(result.error || "Failed to load sheet");
        return;
      }
      setSheetRows(result.rows);
    } catch (err) {
      setSheetError(err.message || "Failed to load sheet");
    } finally {
      setSheetLoading(false);
    }
  }

  function handleSelectRow(row) {
    update({
      frameLink: row.frameLink || row.frame_link || "",
      youtubeLink: row.youtubeLink || row.youtube_link || "",
      videoNumber: row.videoNumber || row.video_number || "",
      transcript: row.transcript || "",
      videoAbout: row.videoAbout || row.video_about || "",
      clientContext: row.clientContext || row.client_context || row.client_industry_context || "",
    });
  }

  function handleImportAll(rows) {
    update({ importedRows: rows });
    handleSelectRow(rows[0]);
  }

  function handleJsonUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        let entries = Array.isArray(data) ? data : [data];

        // Normalize JSON field names to match our internal format
        entries = entries.map(row => ({
          frameLink: row.frameLink || row.frame_link || '',
          youtubeLink: row.youtubeLink || row.youtube_link || '',
          videoNumber: row.videoNumber || row.video_number || '',
          clientContext: row.clientContext || row.client_context || row.client_industry_context || '',
          videoAbout: row.videoAbout || row.video_about || '',
          transcript: row.transcript || '',
          _name: row._name || row.name || '',
        }));

        setSheetRows(entries);
        setJsonError("");
      } catch (err) {
        setJsonError("Invalid JSON file: " + err.message);
      }
    };
    reader.readAsText(file);
  }

  function handleCsvUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const videos = parseVideoCSV(text);

        if (videos.length === 0) {
          setCsvError("No valid videos found. Check that your CSV has headers like: FrameLink, Youtube, Client, Video About, Transcript");
          return;
        }

        setCsvRows(videos);
        setCsvError("");
        setSelectedCsvIdx(null);
      } catch (err) {
        console.error("CSV parse error:", err);
        setCsvError("Failed to parse CSV: " + err.message);
      }
    };
    reader.readAsText(file);
  }

  function handleCsvSelectRow(idx) {
    setSelectedCsvIdx(idx);
    handleSelectRow(csvRows[idx]);
  }

  function handleCsvImportAll() {
    handleImportAll(csvRows);
    handleSelectRow(csvRows[0]);
    setTab("manual");
  }

  function handleCsvLoadSingle() {
    if (selectedCsvIdx !== null) {
      handleSelectRow(csvRows[selectedCsvIdx]);
      setTab("manual");
    }
  }

  const isFormValid = state.videoAbout && state.clientContext && state.transcript && state.transcript.length >= 50;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <span className="px-2 sm:px-3 py-1 bg-brand-primary/20 border border-brand-secondary/30 text-brand-secondary text-xs font-mono font-bold rounded">
            STEP 01
          </span>
          <Badge variant="default">Video Details</Badge>
        </div>
        <h2 className="font-display font-bold text-2xl sm:text-3xl lg:text-4xl text-white">
          What video are we working on?
        </h2>
        <p className="text-white/50 text-sm sm:text-base">
          Enter your video information manually, import from Google Sheets, or upload a CSV/JSON file.
        </p>
      </div>

      {/* Batch mode indicator */}
      {state.importedRows.length > 0 && (
        <Card className="p-4 sm:p-5 border-brand-secondary/30 bg-brand-primary/5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-primary/20 rounded-lg flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-brand-secondary" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
                </svg>
              </div>
              <div>
                <p className="text-brand-secondary font-medium text-sm sm:text-base">Batch Mode Active</p>
                <p className="text-xs sm:text-sm text-white/50">Processing video {state.currentIndex + 1} of {state.importedRows.length}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => update({ importedRows: [], currentIndex: 0 })}>
              Exit Batch
            </Button>
          </div>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-xl w-full sm:w-fit overflow-x-auto">
        <TabButton active={tab === "manual"} onClick={() => setTab("manual")}>Manual</TabButton>
        <TabButton active={tab === "sheet"} onClick={() => setTab("sheet")}>Sheets</TabButton>
        <TabButton active={tab === "csv"} onClick={() => setTab("csv")}>CSV</TabButton>
        <TabButton active={tab === "json"} onClick={() => setTab("json")}>JSON</TabButton>
      </div>

      {/* Manual Tab */}
      {tab === "manual" && (
        <Card className="p-4 sm:p-6 lg:p-8 space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Frame.io Link</label>
            <input type="url" name="frameLink" value={state.frameLink} onChange={handleChange} placeholder="https://frame.io/..." className="input-cinematic" />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">YouTube Link</label>
            <input type="url" name="youtubeLink" value={state.youtubeLink} onChange={handleChange} placeholder="https://youtube.com/watch?v=..." className="input-cinematic" />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Video Number</label>
            <input type="text" name="videoNumber" value={state.videoNumber} onChange={handleChange} placeholder="001" className="input-cinematic" />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Client Context</label>
            <input type="text" name="clientContext" value={state.clientContext} onChange={handleChange} placeholder="e.g., Coco Bubble Tea franchise expansion" className="input-cinematic" />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">What is this video about?</label>
            <input type="text" name="videoAbout" value={state.videoAbout} onChange={handleChange} placeholder="Brief description of the video content..." className="input-cinematic" />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Transcript</label>
            <textarea name="transcript" value={state.transcript} onChange={handleChange} placeholder="Paste the full video transcript here..." rows={6} className="input-cinematic resize-none" />
            <p className="text-xs text-white/30 mt-2 font-mono">{state.transcript.length} characters</p>
          </div>
        </Card>
      )}

      {/* Google Sheets Tab */}
      {tab === "sheet" && (
        <Card className="p-4 sm:p-6 lg:p-8 space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">API Key</label>
            <input type="text" value={sheetApiKey} onChange={(e) => setSheetApiKey(e.target.value)} placeholder="Enter Google Sheets API key" className="input-cinematic" />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Spreadsheet ID</label>
            <input type="text" value={sheetId} onChange={(e) => setSheetId(e.target.value)} className="input-cinematic" />
          </div>
          <div>
            <Button onClick={handleLoadSheet} disabled={sheetLoading} className="w-full sm:w-auto">
              {sheetLoading ? "Loading..." : "Load Rows"}
            </Button>
          </div>
          {sheetError && <p className="text-red-400 text-sm">{sheetError}</p>}
          {sheetRows.length > 0 && (
            <ImportPreview rows={sheetRows} onSelectRow={handleSelectRow} onImportAll={() => handleImportAll(sheetRows)} onClear={() => setSheetRows([])} />
          )}
        </Card>
      )}

      {/* CSV Tab */}
      {tab === "csv" && (
        <Card className="p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Upload area */}
          <div className="border-2 border-dashed border-white/10 rounded-2xl p-6 sm:p-10 text-center hover:border-brand-secondary/30 transition-colors">
            <input type="file" accept=".csv" onChange={handleCsvUpload} className="hidden" id="csv-upload" />
            <label htmlFor="csv-upload" className="cursor-pointer">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-brand-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 text-brand-secondary" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
              </div>
              <p className="text-white font-medium text-sm sm:text-base">Click to upload your CSV</p>
              <p className="text-xs text-white/40 mt-1">Expected headers: FrameLink, Youtube, Client, Video About, Transcript</p>
            </label>
          </div>

          {csvError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
              <p className="text-red-400 text-sm">{csvError}</p>
            </div>
          )}

          {/* Parsed videos preview */}
          {csvRows.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="brand">{csvRows.length} video{csvRows.length > 1 ? 's' : ''} found</Badge>
                </div>
                <Button variant="ghost" size="sm" onClick={() => { setCsvRows([]); setSelectedCsvIdx(null); }}>Clear</Button>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={handleCsvImportAll} className="flex-1">
                  Import All {csvRows.length} Videos & Start Batch
                </Button>
                {selectedCsvIdx !== null && (
                  <Button variant="secondary" onClick={handleCsvLoadSingle} className="flex-1">
                    Load Selected Video Only
                  </Button>
                )}
              </div>

              {/* Video cards */}
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {csvRows.map((video, i) => (
                  <div
                    key={i}
                    onClick={() => handleCsvSelectRow(i)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedCsvIdx === i
                        ? "border-brand-secondary/50 bg-brand-primary/15"
                        : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold shrink-0 ${
                        selectedCsvIdx === i ? "bg-brand-secondary text-white" : "bg-brand-primary/30 text-brand-secondary"
                      }`}>
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0 space-y-2">
                        {/* Top row: name + about */}
                        <div>
                          {video._name && <p className="text-brand-secondary text-xs font-medium">{video._name}</p>}
                          <p className="font-medium text-white text-sm">{video.videoAbout || "No description"}</p>
                          <p className="text-xs text-white/50">{video.clientContext || "No client"}</p>
                        </div>

                        {/* Details */}
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/30">
                          {video.youtubeLink && (
                            <span className="flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.556a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364l1.757 1.757" /></svg>
                              YouTube
                            </span>
                          )}
                          {video.frameLink && (
                            <span className="flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
                              Frame.io
                            </span>
                          )}
                          {video.transcript && (
                            <span className="flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                              {video.transcript.length} chars
                            </span>
                          )}
                        </div>

                        {/* Transcript preview */}
                        {video.transcript && (
                          <p className="text-xs text-white/20 line-clamp-2 italic">
                            {video.transcript.substring(0, 150)}...
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* JSON Tab */}
      {tab === "json" && (
        <Card className="p-4 sm:p-6 lg:p-8">
          <div className="border-2 border-dashed border-white/10 rounded-2xl p-6 sm:p-12 text-center hover:border-brand-secondary/30 transition-colors">
            <input type="file" accept=".json" onChange={handleJsonUpload} className="hidden" id="json-upload" />
            <label htmlFor="json-upload" className="cursor-pointer">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-brand-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-brand-secondary" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
              </div>
              <p className="text-white font-medium text-sm sm:text-base">Click to upload or drag and drop</p>
              <p className="text-xs sm:text-sm text-white/40 mt-1">JSON files only</p>
            </label>
          </div>
          {jsonError && <p className="text-red-400 text-sm mt-4">{jsonError}</p>}
          {sheetRows.length > 0 && (
            <div className="mt-6">
              <ImportPreview rows={sheetRows} onSelectRow={handleSelectRow} onImportAll={() => handleImportAll(sheetRows)} onClear={() => setSheetRows([])} />
            </div>
          )}
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-end pt-4">
        <Button onClick={onNext} disabled={!isFormValid} className="w-full sm:w-auto">
          {state.importedRows.length > 1
            ? `Continue (${state.currentIndex + 1}/${state.importedRows.length})`
            : "Continue to Generate"}
        </Button>
      </div>
    </div>
  );
}

function ImportPreview({ rows, onSelectRow, onImportAll, onClear }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Badge variant="brand">{rows.length} video{rows.length > 1 ? 's' : ''} found</Badge>
        <Button variant="ghost" size="sm" onClick={onClear}>Clear</Button>
      </div>
      <Button variant="secondary" onClick={onImportAll} className="w-full">
        Import All & Start Batch
      </Button>
      <div className="max-h-64 overflow-y-auto space-y-2">
        {rows.map((row, i) => (
          <div key={i} onClick={() => onSelectRow(row)} className="p-3 sm:p-4 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:bg-white/10 hover:border-white/20 transition-all">
            {row._name && <p className="text-brand-secondary text-xs font-medium mb-1">{row._name}</p>}
            <p className="font-medium text-white text-sm sm:text-base">{row.videoAbout || row.video_about || "Untitled"}</p>
            <p className="text-xs sm:text-sm text-white/40">{row.clientContext || row.client_context || row.client_industry_context || "No client context"}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 sm:flex-none px-4 sm:px-5 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
        active ? "bg-brand-primary text-white" : "text-white/50 hover:text-white hover:bg-white/5"
      }`}
    >
      {children}
    </button>
  );
}

export default Step1_VideoDetails;
