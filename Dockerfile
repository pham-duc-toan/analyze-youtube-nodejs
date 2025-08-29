# Base nhẹ + ổn định
FROM node:18-bullseye

# Thiết lập môi trường
ENV NODE_ENV=production \
  # Không tải Chromium khi cài puppeteer
  PUPPETEER_SKIP_DOWNLOAD=true \
  # Puppeteer sẽ dùng binary chromium cài từ apt
  PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Cài FFmpeg + Chromium + deps cần cho Chromium
RUN apt-get update && \
  apt-get install -y --no-install-recommends \
  ffmpeg chromium \
  ca-certificates fonts-liberation \
  libasound2 libatk-bridge2.0-0 libatk1.0-0 \
  libcups2 libdrm2 libgbm1 libgtk-3-0 libnss3 \
  libx11-xcb1 libxcomposite1 libxdamage1 libxrandr2 \
  libxshmfence1 libxss1 libxkbcommon0 libxext6 libxfixes3 \
  libpango-1.0-0 libpangocairo-1.0-0 libu2f-udev \
  lsb-release && \
  rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Chỉ copy file khai báo dependency để tận dụng cache
COPY package*.json ./

# (Tùy chọn) bật BuildKit cache cho npm nếu builder hỗ trợ
# và tắt audit/fund để nhanh hơn
RUN npm config set fund false && npm config set audit false && \
  --mount=type=cache,target=/root/.npm \
  npm ci --omit=dev

# Copy phần còn lại của source
COPY . .

EXPOSE 8080
# Khởi chạy
CMD ["npm", "start"]
