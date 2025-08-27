const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs-extra");
require("dotenv").config();

const analyzeRoutes = require("./routes/analyze");
const resultRoutes = require("./routes/result");

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// Ensure directories exist
const ensureDirectories = async () => {
  const dirs = [
    process.env.UPLOAD_DIR || "./uploads",
    process.env.RESULTS_DIR || "./results",
    process.env.SCREENSHOTS_DIR || "./screenshots",
  ];

  for (const dir of dirs) {
    await fs.ensureDir(dir);
  }
};

// Routes
app.use("/analyze", analyzeRoutes);
app.use("/result", resultRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Serve static files for screenshots
app.use(
  "/screenshots",
  express.static(process.env.SCREENSHOTS_DIR || "./screenshots")
);

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("Error:", error);
  res.status(500).json({
    error: "Internal server error",
    message: error.message,
  });
});

// Start server
const startServer = async () => {
  try {
    await ensureDirectories();
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`YouTube Analyzer Service running on http://0.0.0.0:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
