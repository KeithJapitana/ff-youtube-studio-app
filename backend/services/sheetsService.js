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
