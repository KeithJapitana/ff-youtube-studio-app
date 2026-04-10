const BASE = import.meta.env.VITE_API_BASE_URL || "";

export async function generateContent(payload) {
  const res = await fetch(`${BASE}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Generation failed.");
  return data;
}

export async function loadSheetRows({ sheetId, apiKey }) {
  const params = new URLSearchParams({ sheetId, apiKey });
  const res = await fetch(`${BASE}/api/sheets?${params}`);
  return res.json();
}
