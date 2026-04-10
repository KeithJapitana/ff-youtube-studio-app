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
