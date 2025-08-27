const express = require("express");
const { v4: uuidv4 } = require("uuid");
const YouTubeAnalyzer = require("../services/YouTubeAnalyzer");

const router = express.Router();

// POST /analyze - Analyze YouTube video
router.post("/", async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: "YouTube URL is required" });
    }

    // Validate YouTube URL
    if (!isValidYouTubeUrl(url)) {
      return res.status(400).json({ error: "Invalid YouTube URL" });
    }

    const jobId = uuidv4();

    // Start analysis in background
    const analyzer = new YouTubeAnalyzer();
    analyzer.analyze(url, jobId).catch((error) => {
      console.error(`Analysis failed for job ${jobId}:`, error);
    });

    res.json({
      jobId,
      status: "started",
      message: "Analysis started. Use GET /result/:id to check progress.",
    });
  } catch (error) {
    console.error("Analysis error:", error);
    res.status(500).json({ error: "Failed to start analysis" });
  }
});

// Validate YouTube URL
function isValidYouTubeUrl(url) {
  try {
    // More flexible YouTube URL validation
    const urlObj = new URL(url);

    // Check for YouTube domains
    if (
      urlObj.hostname === "www.youtube.com" ||
      urlObj.hostname === "youtube.com"
    ) {
      // Must have watch?v= parameter
      return urlObj.pathname === "/watch" && urlObj.searchParams.has("v");
    }

    // Check for youtu.be short URLs
    if (urlObj.hostname === "youtu.be") {
      // Must have video ID in pathname
      return urlObj.pathname.length > 1;
    }

    return false;
  } catch (error) {
    // Invalid URL format
    return false;
  }
}

module.exports = router;
