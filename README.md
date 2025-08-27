# YouTube Analyzer

Simple Node.js service that analyzes YouTube videos and generates transcriptions using ElevenLabs API.

## Features

- 📹 **YouTube URL Analysis**: Submit any YouTube URL for processing
- 🖼️ **Screenshot Capture**: Takes screenshots of the YouTube page using Puppeteer
- 🎵 **Audio Extraction**: Downloads audio from YouTube videos using youtube-dl-exec
- 🔄 **Audio Conversion**: Converts audio to WAV format using FFmpeg
- 📝 **Transcription**: Generates accurate transcriptions using ElevenLabs Speech-to-Text API
- 🌐 **Web Interface**: Simple web interface for easy URL submission
- 📊 **REST API**: RESTful endpoints for programmatic access

## Quick Start

### Prerequisites

- Node.js 18+
- FFmpeg installed on your system
- ElevenLabs API key

### Installation

1. Install dependencies:

```bash
npm install
```

2. Configure environment:

```bash
cp .env.example .env
# Edit .env and add your ElevenLabs API key
```

3. Start the service:

```bash
npm start
```

4. Access the web interface at `http://localhost:8080`

## API Usage

### Analyze YouTube Video

```bash
POST http://localhost:8080/analyze
Content-Type: application/json

{
  "url": "https://www.youtube.com/watch?v=VIDEO_ID"
}
```

**Response:**

```json
{
  "jobId": "unique-job-id",
  "status": "completed"
}
```

### Get Results

```bash
GET http://localhost:8080/result/{jobId}
```

**Response:**

```json
{
  "jobId": "unique-job-id",
  "url": "https://www.youtube.com/watch?v=VIDEO_ID",
  "status": "completed",
  "transcription": {
    "text": "Full transcription text...",
    "segments": [
      {
        "start": 0.0,
        "end": 3.5,
        "text": "Hello, this is a sample...",
        "speaker": "SPEAKER_00",
        "words": []
      }
    ],
    "language": "auto",
    "duration": 125.6
  },
  "startTime": "2025-08-27T15:30:00.000Z",
  "endTime": "2025-08-27T15:32:30.000Z"
}
```

### Get Screenshot

```bash
GET http://localhost:8080/result/{jobId}/screenshot
```

Returns the PNG screenshot of the YouTube page.

## Environment Variables

```env
PORT=8080
NODE_ENV=development
ELEVENLABS_API_KEY=your_elevenlabs_api_key
UPLOAD_DIR=./uploads
RESULTS_DIR=./results
SCREENSHOTS_DIR=./screenshots
DEBUG_MODE=true
MAX_VIDEO_DURATION=300
```

## File Structure

```
├── src/
│   ├── server.js              # Main Express server
│   ├── routes/
│   │   ├── analyze.js         # POST /analyze endpoint
│   │   └── result.js          # GET /result endpoints
│   └── services/
│       ├── YouTubeAnalyzer.js # Main orchestration service
│       └── ElevenLabsService.js # Transcription service
├── public/
│   └── index.html            # Web interface
├── uploads/                  # Audio files
├── results/                  # Analysis results (JSON)
├── screenshots/              # YouTube page screenshots
└── package.json
```

## Limitations

- Maximum video duration: 10 minutes (configurable)
- Maximum file size: 25MB (ElevenLabs limit)
- YouTube videos must be publicly accessible

## Dependencies

- **Express**: Web framework
- **Puppeteer**: Browser automation for screenshots
- **youtube-dl-exec**: YouTube video downloading
- **fluent-ffmpeg**: Audio conversion
- **axios**: HTTP client for ElevenLabs API
- **form-data**: Multipart form data for file uploads

## License

MIT
