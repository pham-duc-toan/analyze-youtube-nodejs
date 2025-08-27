const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");

class ElevenLabsService {
  constructor() {
    this.apiKey = process.env.ELEVENLABS_API_KEY;
    this.baseUrl = "https://api.elevenlabs.io/v1";
  }

  async transcribe(audioFilePath) {
    if (!this.apiKey) {
      throw new Error("ElevenLabs API key not configured");
    }

    try {
      console.log(`Preparing file for transcription: ${audioFilePath}`);

      // Check if file exists
      if (!fs.existsSync(audioFilePath)) {
        throw new Error(`Audio file not found: ${audioFilePath}`);
      }

      const fileStats = fs.statSync(audioFilePath);
      console.log(`File size: ${fileStats.size} bytes`);

      // Check file size (ElevenLabs has 25MB limit)
      if (fileStats.size > 25 * 1024 * 1024) {
        throw new Error("Audio file too large (max 25MB for ElevenLabs)");
      }

      const formData = new FormData();

      // Create file stream with correct content type
      const audioStream = fs.createReadStream(audioFilePath);
      formData.append("file", audioStream, {
        filename: "audio.wav",
        contentType: "audio/wav",
      });

      // Use correct parameter name: model_id instead of model
      formData.append("model_id", "scribe_v1");

      console.log("Sending request to ElevenLabs Speech-to-Text API...");

      const response = await axios.post(
        `${this.baseUrl}/speech-to-text`,
        formData,
        {
          headers: {
            "xi-api-key": this.apiKey,
            ...formData.getHeaders(),
          },
          timeout: 300000, // 5 minutes timeout
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        }
      );

      console.log("ElevenLabs API response received successfully");
      return this.formatTranscription(response.data);
    } catch (error) {
      console.error(
        "ElevenLabs transcription error:",
        error.response?.data || error.message
      );

      // Log more detailed error information
      if (error.response) {
        console.error("Response status:", error.response.status);
        console.error("Response headers:", error.response.headers);
        console.error(
          "Response data:",
          JSON.stringify(error.response.data, null, 2)
        );
      }

      // Don't use mock data - throw the real error
      throw new Error(
        "Transcription failed: " +
          (JSON.stringify(error.response?.data) || error.message)
      );
    }
  }

  formatTranscription(data) {
    // ElevenLabs scribe_v1 returns simplified format with just text
    // Create a simple segment from the full text

    const fullText = data.text || "";

    if (!fullText) {
      return {
        text: "",
        segments: [],
        language: "auto",
        duration: 0,
      };
    }

    // Split text into sentences for better readability
    const sentences = fullText
      .split(/[.!?]+/)
      .filter((s) => s.trim().length > 0);
    const segments = [];

    let startTime = 0;
    const avgWordsPerSecond = 2.5; // Estimate speaking rate

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i].trim();
      if (sentence.length === 0) continue;

      const wordCount = sentence.split(/\s+/).length;
      const duration = wordCount / avgWordsPerSecond;
      const endTime = startTime + duration;

      segments.push({
        start: Math.round(startTime * 100) / 100,
        end: Math.round(endTime * 100) / 100,
        text: sentence,
        speaker: "SPEAKER_00",
        words: [], // Word-level timestamps not available in scribe_v1
      });

      startTime = endTime + 0.5; // Small pause between sentences
    }

    const totalDuration =
      segments.length > 0 ? segments[segments.length - 1].end : 0;

    return {
      text: fullText,
      segments: segments,
      language: data.language || "auto",
      duration: totalDuration,
    };
  }
}

module.exports = ElevenLabsService;
