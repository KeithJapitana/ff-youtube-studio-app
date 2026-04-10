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
