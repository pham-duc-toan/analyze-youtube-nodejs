#!/bin/bash
# deploy-gce.sh: Script deploy Docker trên VPS Linux (Google Cloud)

set -e

# Cài đặt Docker nếu chưa có
if ! command -v docker &> /dev/null; then
  echo "Installing Docker..."
  sudo apt-get update
  sudo apt-get install -y docker.io
  sudo systemctl start docker
  sudo systemctl enable docker
fi

# Clone repo nếu chưa có
if [ ! -d "app" ]; then
  echo "Cloning project..."
  git clone https://github.com/pham-duc-toan/analyze-youtube-nodejs app
fi
cd app

# Build Docker image
echo "Building Docker image..."
docker build -t youtube-analyzer .

# Chạy Docker container
echo "Running Docker container..."
docker stop youtube-analyzer || true
docker rm youtube-analyzer || true
docker run -d --name youtube-analyzer -p 8080:8080 --env-file .env youtube-analyzer

echo "App deployed and running on port 8080!"
