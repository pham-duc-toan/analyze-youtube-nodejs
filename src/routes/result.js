const express = require("express");
const fs = require("fs-extra");
const path = require("path");

const router = express.Router();

// GET /result/:id - Get analysis result
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const resultsDir = process.env.RESULTS_DIR || "./results";
    const resultFile = path.join(resultsDir, `${id}.json`);

    // Check if result exists
    if (!(await fs.pathExists(resultFile))) {
      return res.status(404).json({
        error: "Result not found",
        jobId: id,
        status: "not_found",
      });
    }

    // Read result
    const result = await fs.readJson(resultFile);

    // Add status based on completion
    if (result.error) {
      result.status = "failed";
    } else if (result.transcription && result.screenshot) {
      result.status = "completed";
    } else {
      result.status = "processing";
    }

    res.json(result);
  } catch (error) {
    console.error("Error fetching result:", error);
    res.status(500).json({ error: "Failed to fetch result" });
  }
});

// GET /result/:id/screenshot - Get screenshot
router.get("/:id/screenshot", async (req, res) => {
  try {
    const { id } = req.params;
    const screenshotsDir = process.env.SCREENSHOTS_DIR || "./screenshots";
    const screenshotFile = path.join(screenshotsDir, `${id}.png`);

    if (!(await fs.pathExists(screenshotFile))) {
      return res.status(404).json({ error: "Screenshot not found" });
    }

    res.sendFile(path.resolve(screenshotFile));
  } catch (error) {
    console.error("Error fetching screenshot:", error);
    res.status(500).json({ error: "Failed to fetch screenshot" });
  }
});

module.exports = router;
