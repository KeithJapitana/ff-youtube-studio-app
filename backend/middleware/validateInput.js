function validateInput(req, res, next) {
  const { apiKey, provider, videoAbout, clientContext, transcript } = req.body;
  const errors = [];

  // Validate API key — accept any key that's long enough
  if (!apiKey || typeof apiKey !== "string" || apiKey.trim().length < 10) {
    errors.push("API key is missing or too short.");
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
