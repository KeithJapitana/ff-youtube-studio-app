const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const generateRoute = require("./routes/generate");
const sheetsRoute = require("./routes/sheets");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "2mb" })); // transcripts can be long

// Determine static files path (local: ../frontend/dist, Hostinger: ./dist)
const staticPath = fs.existsSync(path.join(__dirname, "./dist"))
  ? path.join(__dirname, "./dist")
  : path.join(__dirname, "../frontend/dist");

const indexPath = fs.existsSync(path.join(__dirname, "./dist/index.html"))
  ? path.join(__dirname, "./dist/index.html")
  : path.join(__dirname, "../frontend/dist/index.html");

// Serve built React frontend (production)
app.use(express.static(staticPath));

// API Routes
app.use("/api/generate", generateRoute);
app.use("/api/sheets", sheetsRoute);

// Fallback: serve React app for any non-API route
app.get("*", (req, res) => {
  res.sendFile(indexPath);
});

// Global error handler — must be last
app.use(errorHandler);

module.exports = app;
