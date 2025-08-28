@echo off
REM deploy-gce.bat: Script khởi động và deploy Docker trên VPS Windows

REM Cài đặt Docker nếu chưa có
where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo Installing Docker...
    powershell -Command "Invoke-WebRequest -UseBasicParsing https://get.docker.com/ -OutFile install-docker.ps1; .\install-docker.ps1"
)

REM Clone repo nếu chưa có
if not exist "app" (
    echo Cloning project...
    git clone https://github.com/pham-duc-toan/analyze-youtube-nodejs app
)
cd app

REM Build Docker image
echo Building Docker image...
docker build -t youtube-analyzer .

REM Chạy Docker container
echo Running Docker container...
docker stop youtube-analyzer
REM Ignore error if not running
docker rm youtube-analyzer
REM Ignore error if not running
docker run -d --name youtube-analyzer -p 8080:8080 --env-file .env youtube-analyzer

echo App deployed and running on port 8080!
