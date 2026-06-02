@echo off
echo ==========================================
echo  自动同步媒体文件
echo ==========================================
echo.

echo [1/3] 解压覆盖 media_files.zip ...
powershell -Command "Expand-Archive -Path '%USERPROFILE%\Downloads\media_files.zip' -DestinationPath 'uploads\' -Force" 2>nul
powershell -Command "Expand-Archive -Path '%USERPROFILE%\Documents\media_files.zip' -DestinationPath 'uploads\' -Force" 2>nul

echo [2/3] Git 提交...
git add uploads/ data.js
git commit -m "Sync media files"

echo [3/3] 推送 GitHub...
git config http.proxy http://127.0.0.1:123
git config https.proxy http://127.0.0.1:123
git push origin main
git config --unset http.proxy
git config --unset https.proxy

echo.
echo ==========================================
echo  完成!
echo ==========================================
pause
