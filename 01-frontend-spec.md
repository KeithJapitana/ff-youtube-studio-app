# Frontend Spec
## FranchiseFilming YouTube Content Studio

**Stack:** React (Vite) + TailwindCSS
**Build output:** `frontend/dist/` — served by Express in production

---

## Folder Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.jsx           # App header with logo + badge
│   │   │   └── Sidebar.jsx          # Step navigation (1–5)
│   │   ├── steps/
│   │   │   ├── Step1_VideoDetails.jsx
│   │   │   ├── Step2_Generate.jsx
│   │   │   ├── Step3_Review.jsx
│   │   │   ├── Step4_Thumbnail.jsx
│   │   │   └── Step5_Export.jsx
│   │   └── ui/
│   │       ├── Button.jsx
│   │       ├── Card.jsx
│   │       ├── FormField.jsx
│   │       ├── HookOption.jsx       # Clickable thumbnail hook card
│   │       ├── TitleOption.jsx      # Radio-button title card
│   │       └── ThumbnailCard.jsx    # YouTube still image card
│   ├── hooks/
│   │   ├── useVideoState.js         # Global state (React context)
│   │   └── useGeneration.js         # Handles generate API call + loading state
│   ├── services/
│   │   ├── api.js                   # fetch() wrappers for backend routes
│   │   └── exportHelpers.js         # CSV + JSON download utils
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── vite.config.js
└── package.json
```

---

## package.json

```json
{
  "name": "franchisefilming-frontend",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.0.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "vite": "^5.0.0"
  }
}
```

---

## vite.config.js

```javascript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": "http://localhost:3001", // dev proxy to Express backend
    },
  },
});
```

---

## Global State — `hooks/useVideoState.js`

All app state lives in one React context. No external state library needed.

```javascript
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
};

const VideoStateContext = createContext(null);

export function VideoStateProvider({ children }) {
  const [state, setState] = useState(initialState);

  function update(patch) {
    setState((prev) => ({ ...prev, ...patch }));
  }

  function reset() {
    setState(initialState);
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

  return (
    <VideoStateContext.Provider value={{ state, update, reset, setSelectedHook }}>
      {children}
    </VideoStateContext.Provider>
  );
}

export function useVideoState() {
  return useContext(VideoStateContext);
}
```

---

## Generation Hook — `hooks/useGeneration.js`

```javascript
import { useState } from "react";
import { generateContent } from "../services/api";

export function useGeneration() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function generate({ apiKey, videoAbout, clientContext, transcript }) {
    setLoading(true);
    setError(null);
    try {
      const result = await generateContent({ apiKey, videoAbout, clientContext, transcript });
      if (!result.success) throw new Error(result.error);
      return result.data; // { titles, description, tags, hooks }
    } catch (err) {
      setError(err.message || "Generation failed.");
      return null;
    } finally {
      setLoading(false);
    }
  }

  return { generate, loading, error };
}
```

---

## Services

### `services/api.js`

```javascript
const BASE = import.meta.env.VITE_API_BASE_URL || "";

export async function generateContent(payload) {
  const res = await fetch(`${BASE}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function loadSheetRows({ sheetId, apiKey }) {
  const params = new URLSearchParams({ sheetId, apiKey });
  const res = await fetch(`${BASE}/api/sheets?${params}`);
  return res.json();
}
```

---

### `services/exportHelpers.js`

```javascript
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
```

---

## Step Components

### Step 1 — `Step1_VideoDetails.jsx`

Three import tabs: Manual, Google Sheet, JSON File.

**Manual tab fields:**

| Field | Type | Notes |
|---|---|---|
| `frameLink` | URL input | Frame.io download link |
| `youtubeLink` | URL input | YouTube destination |
| `videoNumber` | Text input | Optional identifier |
| `clientContext` | Text input | Client name / franchise type |
| `videoAbout` | Text input | Brief topic description |
| `transcript` | Textarea | Full transcript (large) |

**Google Sheet tab:**
- Two inputs: Google Sheets API Key + Spreadsheet ID
- Button: **Load Rows** → calls `loadSheetRows()` from `api.js`
- Renders a list of rows; clicking a row populates the form fields
- Spreadsheet ID pre-filled: `1BrT7RTsPUotsESZq3CvNVOrRZ_9MJRT8-RN5TOnB3D0`

**JSON File tab:**
- Drag-and-drop zone or file picker (`.json` only)
- Expected format: array of objects with the same field names as `initialState`
- Renders a list of entries; clicking one populates the form

---

### Step 2 — `Step2_Generate.jsx`

- Anthropic API Key input (stored in state, session only — never in `localStorage`)
- Read-only preview card showing current video's `videoAbout` + `clientContext` + transcript word count
- **Generate with Claude AI** button
- On click: calls `useGeneration().generate(...)`, shows spinner during loading
- On success: updates state with `titles`, `hooks`, `description`, `tags` → auto-advance to Step 3
- On error: shows inline error with retry option

---

### Step 3 — `Step3_Review.jsx`

**Title Options section:**
- 3 radio-button cards (`TitleOption.jsx`)
- Selecting one sets `state.selectedTitle`

**Thumbnail Hooks section:**
- 3 clickable cards (`HookOption.jsx`) showing:
  - `heading` — large bold text
  - `subheading` — smaller muted text
- Selecting one calls `setSelectedHook(hook)` which splits into `state.heading` + `state.subheading`

**YouTube Description section:**
- Editable `<textarea>` pre-filled with `state.description`
- Character count shown below

**Tags section:**
- Pills rendered from `state.tags`
- Raw editable textarea below (comma-separated) for manual edits
- Tag pills update live as textarea changes

---

### Step 4 — `Step4_Thumbnail.jsx`

Extract YouTube video ID from `state.youtubeLink`:
```javascript
function extractVideoId(url) {
  const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}
```

Render 4 stills using YouTube's public CDN (no API key needed):

| Quality | URL Pattern |
|---|---|
| Max HD | `https://img.youtube.com/vi/{ID}/maxresdefault.jpg` |
| HQ Default | `https://img.youtube.com/vi/{ID}/hqdefault.jpg` |
| Medium | `https://img.youtube.com/vi/{ID}/mqdefault.jpg` |
| Standard | `https://img.youtube.com/vi/{ID}/sddefault.jpg` |

Each rendered as a `ThumbnailCard.jsx`:
- 16:9 aspect ratio image
- Quality label overlay at bottom
- Checkmark badge when selected
- Clicking sets `state.selectedThumb` to the image URL

Custom URL input at bottom: user can paste a different YouTube URL to load different stills.

---

### Step 5 — `Step5_Export.jsx`

**Canva Fields section:**
- Three rows with copy buttons: Heading, Sub Heading, Selected Title
- Values come from `state.heading`, `state.subheading`, `state.selectedTitle`

**Selected Thumbnail section:**
- Shows `<img src={state.selectedThumb} />` if a frame was selected
- Download button: fetches the image and triggers a file download
  - Note: YouTube thumbnail images may block direct fetch due to CORS. Provide the image URL as a direct link with `target="_blank"` as fallback if fetch fails.

**CSV Export section:**
- Live preview of the CSV content in a monospace box
- **Download CSV** button — calls `downloadCsv(heading, subheading)` from `exportHelpers.js`
- **Copy CSV** button — copies to clipboard
- **Open Canva Bulk Editor** link → `https://canva.link/9n5zoesowla646q`

**Full Export section:**
- **Export as JSON** — calls `downloadJson(state)` with all session data
- **Start New Video** — calls `reset()` and navigates back to Step 1

---

## App.jsx

```jsx
import { useState } from "react";
import { VideoStateProvider } from "./hooks/useVideoState";
import Header from "./components/layout/Header";
import Sidebar from "./components/layout/Sidebar";
import Step1_VideoDetails from "./components/steps/Step1_VideoDetails";
import Step2_Generate from "./components/steps/Step2_Generate";
import Step3_Review from "./components/steps/Step3_Review";
import Step4_Thumbnail from "./components/steps/Step4_Thumbnail";
import Step5_Export from "./components/steps/Step5_Export";

const STEPS = [
  Step1_VideoDetails,
  Step2_Generate,
  Step3_Review,
  Step4_Thumbnail,
  Step5_Export,
];

export default function App() {
  const [currentStep, setCurrentStep] = useState(0);
  const StepComponent = STEPS[currentStep];

  return (
    <VideoStateProvider>
      <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col">
        <Header />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar currentStep={currentStep} onStepClick={setCurrentStep} />
          <main className="flex-1 overflow-y-auto p-8">
            <StepComponent
              onNext={() => setCurrentStep((s) => Math.min(s + 1, 4))}
              onBack={() => setCurrentStep((s) => Math.max(s - 1, 0))}
              onReset={() => setCurrentStep(0)}
            />
          </main>
        </div>
      </div>
    </VideoStateProvider>
  );
}
```

---

## Environment Variables

### `frontend/.env`
```
VITE_API_BASE_URL=http://localhost:3001
```

### `frontend/.env.production`
```
VITE_API_BASE_URL=
# Leave blank — Vite proxy not used in production.
# Express serves both API and frontend from same origin.
```

---

## Build for Production

```bash
cd frontend
npm install
npm run build
# Output: frontend/dist/
```

The `dist/` folder is committed or uploaded alongside the backend. Express serves it via `express.static`.
