# Backend + Middleware Spec
## FranchiseFilming YouTube Content Studio

**Stack:** Node.js + Express
**Entry point:** `backend/server.js`
**Deployment:** Hostinger Node.js hosting

---

## Folder Structure

```
backend/
├── routes/
│   ├── generate.js          # POST /api/generate
│   └── sheets.js            # GET  /api/sheets
├── middleware/
│   ├── validateInput.js     # Field validation before hitting Claude
│   └── errorHandler.js      # Global error formatter
├── services/
│   ├── claudeService.js     # Anthropic SDK wrapper + prompt builder
│   └── sheetsService.js     # Google Sheets API v4 wrapper
├── utils/
│   └── parseAIResponse.js   # Parses Claude's JSON output safely
├── app.js                   # Express app config (routes, middleware, CORS)
├── server.js                # Port binding + startup
├── .env
└── package.json
```

---

## package.json

```json
{
  "name": "franchisefilming-backend",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.24.0",
    "axios": "^1.6.0",
    "cors": "^2.8.5",
    "dotenv": "^16.0.0",
    "express": "^4.18.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.0"
  }
}
```

---

## server.js

```javascript
require("dotenv").config();
const app = require("./app");

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`FranchiseFilming API running on port ${PORT}`);
});
```

---

## app.js

```javascript
const express = require("express");
const cors = require("cors");
const path = require("path");

const generateRoute = require("./routes/generate");
const sheetsRoute = require("./routes/sheets");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "2mb" })); // transcripts can be long

// Serve built React frontend (production)
app.use(express.static(path.join(__dirname, "../frontend/dist")));

// API Routes
app.use("/api/generate", generateRoute);
app.use("/api/sheets", sheetsRoute);

// Fallback: serve React app for any non-API route
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});

// Global error handler — must be last
app.use(errorHandler);

module.exports = app;
```

---

## Routes

### `routes/generate.js` — POST /api/generate

```javascript
const express = require("express");
const router = express.Router();
const { generateYouTubeContent } = require("../services/claudeService");
const validateInput = require("../middleware/validateInput");

router.post("/", validateInput, async (req, res, next) => {
  try {
    const { apiKey, videoAbout, clientContext, transcript } = req.body;

    const result = await generateYouTubeContent({
      apiKey,
      videoAbout,
      clientContext,
      transcript,
    });

    res.json({ success: true, data: result });
  } catch (err) {
    next(err); // passes to errorHandler
  }
});

module.exports = router;
```

---

### `routes/sheets.js` — GET /api/sheets

```javascript
const express = require("express");
const router = express.Router();
const { fetchSheetRows } = require("../services/sheetsService");

router.get("/", async (req, res, next) => {
  try {
    const { sheetId, apiKey, range } = req.query;

    if (!sheetId || !apiKey) {
      return res.status(400).json({
        success: false,
        error: "Missing sheetId or apiKey query parameters.",
      });
    }

    const rows = await fetchSheetRows({ sheetId, apiKey, range });
    res.json({ success: true, rows });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
```

---

## Middleware

### `middleware/validateInput.js`

Runs before `generateYouTubeContent` is called. Blocks the request early with a clear error rather than wasting an API call.

```javascript
function validateInput(req, res, next) {
  const { apiKey, videoAbout, clientContext, transcript } = req.body;
  const errors = [];

  if (!apiKey || typeof apiKey !== "string" || !apiKey.startsWith("sk-ant-")) {
    errors.push("apiKey is missing or invalid. Must start with 'sk-ant-'.");
  }

  if (!videoAbout || videoAbout.trim().length === 0) {
    errors.push("videoAbout is required.");
  }

  if (!clientContext || clientContext.trim().length === 0) {
    errors.push("clientContext is required.");
  }

  if (!transcript || transcript.trim().length < 50) {
    errors.push("transcript is required and must be at least 50 characters.");
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, error: errors.join(" ") });
  }

  next();
}

module.exports = validateInput;
```

---

### `middleware/errorHandler.js`

Last middleware in `app.js`. Catches all errors thrown via `next(err)`.

```javascript
function errorHandler(err, req, res, next) {
  console.error("[Error]", err.message);
  if (process.env.NODE_ENV !== "production") {
    console.error(err.stack);
  }

  // Map Anthropic API errors to friendly messages
  if (err.status === 401 || err.message?.includes("401")) {
    return res.status(401).json({
      success: false,
      error: "Invalid Anthropic API key. Please check and try again.",
    });
  }

  if (err.status === 429 || err.message?.includes("429")) {
    return res.status(429).json({
      success: false,
      error: "Rate limit reached. Please wait a moment and try again.",
    });
  }

  if (err.status === 500 || err.message?.includes("overloaded")) {
    return res.status(503).json({
      success: false,
      error: "Claude API is temporarily unavailable. Please try again shortly.",
    });
  }

  // Fallback
  res.status(500).json({
    success: false,
    error: err.message || "An unexpected error occurred.",
  });
}

module.exports = errorHandler;
```

---

## Services

### `services/claudeService.js`

```javascript
const Anthropic = require("@anthropic-ai/sdk");
const { parseAIResponse } = require("../utils/parseAIResponse");

function buildPrompt({ videoAbout, clientContext, transcript }) {
  return `You are an expert YouTube content strategist for FranchiseFilming, a video production company specializing in franchise storytelling. Create engaging YouTube content that showcases our expertise and generates leads.

Deliverables:
1. 3 Title Options (SEO-optimized for YouTube)
2. Complete YouTube Description (SEO optimized, include placeholder timestamps, 3-5 key points, subtle CTA to contact FranchiseFilming)
3. Tags (15-20 tags as an array)
4. 3 Thumbnail Text Hooks

Guidelines:
- Write from FranchiseFilming's perspective
- Focus on value and insights, NOT summaries of the video
- Optimize for YouTube SEO and discoverability
- Target franchise owners/operators as primary audience
- Generate interest in our video production services
- Do NOT reiterate or summarize the transcript

Thumbnail Hook Format:
- Each hook = heading + subheading (two separate lines)
- Heading: the main click-worthy hook (numbers, secrets, emotional triggers)
- Subheading: Brand context — "FranchiseFilming [Video Type]"
- Examples:
  - heading: "Coco's Secret to 5,000+ Locations"
    subheading: "Inside Coco Bubble Tea's Global Franchise Strategy"
  - heading: "This is What Every Franchise Event Should Feel Like"
    subheading: "Ivy Kids Conference Reel"
  - heading: "I haven't missed any part of their life."
    subheading: "Ducklings Franchisee Story"

Video Context:
- What the video is about: ${videoAbout}
- Client/industry context: ${clientContext}

Video Transcript:
${transcript}

Respond ONLY with a valid JSON object. No markdown, no backticks, no extra text. Use this exact shape:
{
  "titles": ["title1", "title2", "title3"],
  "description": "full YouTube description here",
  "tags": ["tag1", "tag2", "tag3"],
  "hooks": [
    { "heading": "...", "subheading": "..." },
    { "heading": "...", "subheading": "..." },
    { "heading": "...", "subheading": "..." }
  ]
}`;
}

async function generateYouTubeContent({ apiKey, videoAbout, clientContext, transcript }) {
  const client = new Anthropic({ apiKey });

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1500,
    messages: [
      {
        role: "user",
        content: buildPrompt({ videoAbout, clientContext, transcript }),
      },
    ],
  });

  const rawText = message.content[0].text;
  return parseAIResponse(rawText);
}

module.exports = { generateYouTubeContent };
```

---

### `services/sheetsService.js`

```javascript
const axios = require("axios");

// Column index → field name mapping (0-based)
const COLUMN_MAP = {
  0: "frame_link",
  1: "youtube_link",
  2: "video_number",
  3: "transcript",
  4: "video_about",
  5: "client_context",
  // col 6 = Final Prompt (skip)
  // col 7 = Heading (output, skip on import)
  // col 8 = Sub heading (output, skip on import)
};

async function fetchSheetRows({ sheetId, apiKey, range = "Sheet1!A2:I100" }) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=${apiKey}`;

  const response = await axios.get(url);
  const values = response.data.values || [];

  // Filter and map only rows that have at least a video_about (col E)
  return values
    .filter((row) => row[4] && row[4].trim().length > 0)
    .map((row) => {
      const entry = {};
      Object.entries(COLUMN_MAP).forEach(([colIndex, fieldName]) => {
        entry[fieldName] = row[colIndex] || "";
      });
      return entry;
    });
}

module.exports = { fetchSheetRows };
```

---

## Utils

### `utils/parseAIResponse.js`

```javascript
function parseAIResponse(rawText) {
  // Strip accidental markdown code fences
  const cleaned = rawText
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    throw new Error("Claude returned invalid JSON. Raw response: " + rawText.slice(0, 200));
  }

  // Validate required fields
  if (!Array.isArray(parsed.titles) || parsed.titles.length === 0) {
    throw new Error("AI response missing 'titles' array.");
  }
  if (typeof parsed.description !== "string" || parsed.description.length === 0) {
    throw new Error("AI response missing 'description'.");
  }
  if (!Array.isArray(parsed.tags)) {
    throw new Error("AI response missing 'tags' array.");
  }
  if (!Array.isArray(parsed.hooks) || parsed.hooks.length === 0) {
    throw new Error("AI response missing 'hooks' array.");
  }

  // Normalize tags — handle both array and comma-string
  const tags = parsed.tags.flatMap((t) =>
    typeof t === "string" ? t.split(",").map((s) => s.trim()) : []
  ).filter(Boolean);

  return {
    titles: parsed.titles.slice(0, 3),
    description: parsed.description,
    tags,
    hooks: parsed.hooks.slice(0, 3).map((h) => ({
      heading: h.heading || "",
      subheading: h.subheading || "",
    })),
  };
}

module.exports = { parseAIResponse };
```

---

## Environment Variables

### `.env`
```
PORT=3001
NODE_ENV=development
```

### `.env.example`
```
PORT=3001
NODE_ENV=development
# No secrets stored here.
# API keys (Anthropic, Google Sheets) are passed per-request by the frontend user.
```

---

## Hostinger Deployment Notes

1. Upload the entire `backend/` folder to your Hostinger Node.js environment
2. Build the frontend first: `cd frontend && npm run build`
3. The built `frontend/dist/` folder is served statically by Express via `app.use(express.static(...))`
4. Set `PORT` in Hostinger's environment variable settings
5. Set `NODE_ENV=production`
6. Start command: `node server.js`

The backend serves **both** the API (`/api/*`) and the static React app from a single Node.js process — no separate static hosting needed.
