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
