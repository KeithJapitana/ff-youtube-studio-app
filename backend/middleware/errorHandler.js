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
