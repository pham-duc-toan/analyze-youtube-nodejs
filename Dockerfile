# Dockerfile for YouTube Analyzer Node.js project

FROM node:18-bullseye

# Install FFmpeg & Chrome dependencies for Puppeteer
RUN apt-get update && \
  apt-get install -y --no-install-recommends \
  ffmpeg \
  ca-certificates \
  fonts-liberation \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libcups2 \
  libdrm2 \
  libgbm1 \
  libgtk-3-0 \
  libnss3 \
  libx11-xcb1 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  libxshmfence1 \
  libxss1 \
  libxkbcommon0 \
  libxext6 \
  libxfixes3 \
  libpango-1.0-0 \
  libpangocairo-1.0-0 \
  libu2f-udev \
  lsb-release \
  && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy source code
COPY . .

# Expose port
EXPOSE 8080

# Start app
CMD ["npm", "start"]
