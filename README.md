# YouTube Analyzer - End-to-End Deployment Guide

## Giới thiệu

Dự án này là một dịch vụ Node.js cho phép phân tích video YouTube, chụp ảnh thumbnail, trích xuất audio, phiên âm bằng ElevenLabs, kiểm tra AI probability với GPTZero, và trả về kết quả JSON hợp nhất cùng ảnh chụp.

## Demo

- Đã deploy thành công tại: [http://34.136.66.213:8080](http://34.136.66.213:8080)
- Video demo quy trình end-to-end: (bạn hãy quay video ≤90 giây thao tác gửi link, nhận kết quả, xem JSON và ảnh)

## Cài đặt & Khởi động

1. Clone repo:
   ```sh
   git clone https://github.com/pham-duc-toan/analyze-youtube-nodejs.git
   cd analyze-youtube-nodejs
   ```
2. Tạo file `.env` theo mẫu bên dưới.
3. Build và chạy Docker:
   ```sh
   docker build -t youtube-analyzer .
   docker run -d -p 8080:8080 --env-file .env youtube-analyzer
   ```
4. Truy cập web: [http://34.136.66.213:8080](http://34.136.66.213:8080)

## Môi trường & Biến môi trường

- Node.js 18+
- FFmpeg
- ElevenLabs API key
- Các biến môi trường:
  ```env
  PORT=8080
  ELEVENLABS_API_KEY=your_elevenlabs_api_key
  UPLOAD_DIR=./uploads
  RESULTS_DIR=./results
  SCREENSHOTS_DIR=./screenshots
  DEBUG_MODE=true
  MAX_VIDEO_DURATION=600
  ```

## Thiết kế & Quyết định

### Luồng hoạt động tổng thể

1. Người dùng gửi URL YouTube qua web hoặc API.
2. Server dùng Puppeteer headless để truy cập trang YouTube, xác minh video phát được, chụp ảnh thumbnail.
3. Tải audio track bằng youtube-dl-exec, chuyển sang WAV (16kHz, mono, 16-bit) bằng FFmpeg.
4. Gửi file audio sang ElevenLabs Scribe để phiên âm, lấy transcript chi tiết từng câu, từng người nói.
5. Với mỗi câu transcript, server dùng Puppeteer để truy cập domain của GPTZero và fetch API `/v2/predict/text` ngay trên trình duyệt domain đó (bypass CORS, không cần API key).

- **Lý do:** GPTZero không cung cấp API free, nhưng cho phép thử nghiệm trên domain của họ.
- **Nhược điểm:** Vẫn bị giới hạn số lượng request trên 1 IP (rate limit), nếu xử lý nhiều sẽ bị chặn hoặc delay.

6. Kết quả transcript được bổ sung trường `ai_probability` cho từng câu.
7. Lưu kết quả JSON và ảnh chụp, cung cấp API trả về kết quả và ảnh.
8. WebSocket truyền log realtime về client để hiển thị tiến trình.

### Thiết kế kỹ thuật

- Express, Puppeteer, youtube-dl-exec, FFmpeg, ElevenLabs, GPTZero (qua Puppeteer).
- Dockerfile tối ưu, chỉ cần một lệnh khởi động.
- `.dockerignore` loại trừ file không cần thiết.

## Mẫu JSON kết quả

```json
{
  "jobId": "...",
  "url": "...",
  "status": "completed",
  "screenshot": "/result/<jobId>/screenshot",
  "transcription": {
    "text": "...",
    "segments": [
      {
        "start": 0,
        "end": 4,
        "text": "...",
        "ai_probability": 0.12,
        "speaker": "SPEAKER_00"
      }
    ],
    "language": "auto",
    "duration": 173
  },
  "startTime": "...",
  "endTime": "..."
}
```

## Ảnh chụp mẫu

- Ảnh thumbnail được lưu tại `/result/<jobId>/screenshot` hoặc thư mục `screenshots/`.

## Liên hệ & License

- Tác giả: pham-duc-toan
- License: MIT
