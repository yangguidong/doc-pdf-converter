@echo off
chcp 65001 >nul
echo ==========================================
echo   AI Video Generation Platform
echo   AI视频生成平台
echo ==========================================
echo.

echo [1/2] Starting backend server...
cd /d "%~dp0backend"
start "AI Video Backend" "D:\VS3\Python39_64\python.exe" -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

echo [2/2] Starting frontend dev server...
cd /d "%~dp0frontend"
start "AI Video Frontend" cmd /c "npm run dev"

echo.
echo ==========================================
echo   Backend:  http://127.0.0.1:8000
echo   Frontend: http://127.0.0.1:5173
echo   API Docs: http://127.0.0.1:8000/docs
echo ==========================================
echo.
echo Admin account: admin@ai-video.com / admin123
echo New users get 50 free credits!
echo.
echo Press any key to stop both servers...
pause > nul
taskkill /f /im node.exe 2>nul
taskkill /f /im python.exe 2>nul
