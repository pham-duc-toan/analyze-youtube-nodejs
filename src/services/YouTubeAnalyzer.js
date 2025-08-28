const puppeteer = require("puppeteer");
const youtubeDl = require("youtube-dl-exec");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

const ElevenLabsService = require("./ElevenLabsService");

class YouTubeAnalyzer {
  constructor() {
    this.uploadsDir = process.env.UPLOAD_DIR || "./uploads";
    this.resultsDir = process.env.RESULTS_DIR || "./results";
    this.screenshotsDir = process.env.SCREENSHOTS_DIR || "./screenshots";

    this.elevenLabs = new ElevenLabsService();
    const GPTZeroService = require("./GPTZeroService");
    this.gptZero = new GPTZeroService();
  }

  async analyze(url, jobId) {
    const result = {
      jobId,
      url,
      startTime: new Date().toISOString(),
      status: "processing",
    };

    try {
      // Save initial status
      await this.saveResult(jobId, result);

      // Step 1: Take screenshot with Puppeteer
      console.log(`[${jobId}] Taking screenshot...`);
      const screenshotPath = await this.takeScreenshot(url, jobId);
      result.screenshot = `/result/${jobId}/screenshot`;

      // Step 2: Download audio
      console.log(`[${jobId}] Downloading audio...`);
      const audioPath = await this.downloadAudio(url, jobId);

      // Step 3: Convert to WAV
      console.log(`[${jobId}] Converting audio to WAV...`);
      const wavPath = await this.convertToWav(audioPath, jobId);

      // Step 4: Transcribe with ElevenLabs
      console.log(`[${jobId}] Transcribing audio...`);
      const transcription = await this.elevenLabs.transcribe(wavPath);

      // Step 5: Run GPTZero for each segment
      if (transcription && Array.isArray(transcription.segments)) {
        for (let i = 0; i < transcription.segments.length; i++) {
          const segment = transcription.segments[i];
          if (segment.text && segment.text.trim().length > 0) {
            try {
              const aiProb = await this.gptZero.getAIPrediction(segment.text);
              segment.ai_probability = aiProb;
              console.log(
                `[${jobId}] GPTZero ai_probability for segment ${i}:`,
                aiProb
              );
            } catch (err) {
              segment.ai_probability = null;
            }
          } else {
            segment.ai_probability = null;
          }
        }
      }

      // Final result
      result.transcription = transcription;
      result.endTime = new Date().toISOString();
      result.status = "completed";

      await this.saveResult(jobId, result);

      // Cleanup temporary files
      await this.cleanup([audioPath, wavPath]);

      console.log(`[${jobId}] Analysis completed successfully`);
    } catch (error) {
      console.error(`[${jobId}] Analysis failed:`, error);
      result.error = error.message;
      result.status = "failed";
      result.endTime = new Date().toISOString();
      await this.saveResult(jobId, result);
    }
  }

  async takeScreenshot(url, jobId) {
    const browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
        "--window-size=1920,1080",
      ],
    });

    try {
      const page = await browser.newPage();

      // Set user agent to avoid detection
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      );
      await page.setViewport({ width: 1280, height: 720 });

      // Navigate to YouTube video with longer timeout
      await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      });

      // Wait for video player to load
      await page.waitForSelector("video", { timeout: 15000 });

      // Try to play the video
      try {
        await page.click('button[aria-label="Play"]', { timeout: 5000 });
      } catch (e) {
        // Video might auto-play or button might be different
        console.log("Could not click play button, video might be auto-playing");
      }

      // Wait a bit for video to start
      await page.waitForTimeout(3000);

      // Take screenshot
      const screenshotPath = path.join(this.screenshotsDir, `${jobId}.png`);
      await page.screenshot({
        path: screenshotPath,
        fullPage: false,
      });

      return screenshotPath;
    } catch (error) {
      console.log(
        `[${jobId}] Screenshot failed, creating mock screenshot:`,
        error.message
      );
      return await this.createMockScreenshot(jobId);
    } finally {
      await browser.close();
    }
  }

  async createMockScreenshot(jobId) {
    // Create a simple mock screenshot file when Puppeteer fails
    const screenshotPath = path.join(this.screenshotsDir, `${jobId}.png`);

    // Create a small mock PNG file (minimal PNG header + data)
    const mockPngData = Buffer.from([
      0x89,
      0x50,
      0x4e,
      0x47,
      0x0d,
      0x0a,
      0x1a,
      0x0a, // PNG signature
      0x00,
      0x00,
      0x00,
      0x0d,
      0x49,
      0x48,
      0x44,
      0x52, // IHDR chunk
      0x00,
      0x00,
      0x01,
      0x00,
      0x00,
      0x00,
      0x01,
      0x00, // 256x256 image
      0x08,
      0x02,
      0x00,
      0x00,
      0x00,
      0x90,
      0x91,
      0x68, // bit depth, color type, etc.
      0x36,
      0x00,
      0x00,
      0x00,
      0x0c,
      0x49,
      0x44,
      0x41, // IDAT chunk start
      0x54,
      0x08,
      0x99,
      0x01,
      0x01,
      0x01,
      0x00,
      0x00, // minimal pixel data
      0xfe,
      0xff,
      0x00,
      0x00,
      0x00,
      0x02,
      0x00,
      0x01, // end of pixel data
      0xe2,
      0x21,
      0xbc,
      0x33,
      0x00,
      0x00,
      0x00,
      0x00, // IEND chunk
      0x49,
      0x45,
      0x4e,
      0x44,
      0xae,
      0x42,
      0x60,
      0x82,
    ]);

    await fs.writeFile(screenshotPath, mockPngData);
    console.log(`[${jobId}] Mock screenshot created`);
    return screenshotPath;
  }

  async downloadAudio(url, jobId) {
    try {
      const audioPath = path.join(this.uploadsDir, `${jobId}.%(ext)s`);
      const finalPath = path.join(this.uploadsDir, `${jobId}.m4a`);

      console.log(`[${jobId}] Getting video info...`);

      // Get video info first
      const info = await youtubeDl(url, {
        dumpSingleJson: true,
        noPlaylist: true,
        noWarnings: true,
      });

      console.log(`[${jobId}] Video title: ${info.title}`);
      console.log(`[${jobId}] Video duration: ${info.duration}s`);

      // Check if video is too long (> 10 minutes)
      if (info.duration > 600) {
        throw new Error("Video too long (max 10 minutes for demo)");
      }

      console.log(`[${jobId}] Starting audio download...`);

      // Download audio only
      await youtubeDl(url, {
        extractAudio: true,
        audioFormat: "m4a", // Changed from 'mp4' to 'm4a'
        audioQuality: 0, // best quality
        output: audioPath,
        noPlaylist: true,
        maxFilesize: "50M", // 50MB limit
        noWarnings: true,
      });

      // Find the actual downloaded file
      const files = await fs.readdir(this.uploadsDir);
      const downloadedFile = files.find(
        (file) =>
          file.startsWith(jobId) &&
          (file.endsWith(".m4a") ||
            file.endsWith(".mp4") ||
            file.endsWith(".webm"))
      );

      if (downloadedFile) {
        const downloadedPath = path.join(this.uploadsDir, downloadedFile);
        if (downloadedPath !== finalPath) {
          await fs.move(downloadedPath, finalPath);
        }
        console.log(`[${jobId}] Audio download completed successfully`);
        return finalPath;
      } else {
        throw new Error("Downloaded audio file not found");
      }
    } catch (error) {
      console.error(`[${jobId}] Audio download error:`, error.message);
      throw error;
    }
  }

  async convertToWav(inputPath, jobId) {
    return new Promise((resolve, reject) => {
      const outputPath = path.join(this.uploadsDir, `${jobId}.wav`);

      console.log(`[${jobId}] Converting audio to WAV format...`);

      ffmpeg(inputPath)
        .audioCodec("pcm_s16le")
        .audioChannels(1)
        .audioFrequency(16000)
        .format("wav")
        .output(outputPath)
        .on("end", () => {
          console.log(`[${jobId}] Audio conversion completed successfully`);
          resolve(outputPath);
        })
        .on("error", (error) => {
          console.error(`[${jobId}] FFmpeg conversion error:`, error.message);
          reject(error);
        })
        .on("progress", (progress) => {
          if (progress.percent) {
            console.log(
              `[${jobId}] Conversion progress: ${Math.round(progress.percent)}%`
            );
          }
        })
        .run();
    });
  }

  async saveResult(jobId, result) {
    const resultPath = path.join(this.resultsDir, `${jobId}.json`);
    await fs.writeJson(resultPath, result, { spaces: 2 });
  }

  async cleanup(files) {
    for (const file of files) {
      try {
        if (await fs.pathExists(file)) {
          await fs.remove(file);
        }
      } catch (error) {
        console.error("Failed to cleanup file:", file, error);
      }
    }
  }
}

module.exports = YouTubeAnalyzer;
