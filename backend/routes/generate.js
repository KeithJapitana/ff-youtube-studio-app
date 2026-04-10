const express = require("express");
const router = express.Router();
const { generateYouTubeContent } = require("../services/claudeService");
const validateInput = require("../middleware/validateInput");

router.post("/", validateInput, async (req, res, next) => {
  try {
    const { apiKey, provider, baseUrl, videoAbout, clientContext, transcript } = req.body;

    const result = await generateYouTubeContent({
      apiKey,
      provider,
      baseUrl,
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
