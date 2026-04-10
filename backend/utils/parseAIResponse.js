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
