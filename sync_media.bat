@echo off
echo ==========================================
echo  自动同步媒体文件到 uploads/
echo ==========================================
echo.
echo [1/3] 复制文件...
copy "%USERPROFILE%\Documents\p_*.jpeg" "uploads\" >nul 2>&1
copy "%USERPROFILE%\Documents\p_*.jpg" "uploads\" >nul 2>&1
copy "%USERPROFILE%\Documents\p_*.png" "uploads\" >nul 2>&1
copy "%USERPROFILE%\Documents\v_*.mp4" "uploads\" >nul 2>&1
copy "%USERPROFILE%\Documents\v_*.webm" "uploads\" >nul 2>&1
echo 完成!
echo.
echo [2/3] 提交到 Git...
git add uploads/ data.js
git commit -m "Sync media files"
echo.
echo [3/3] 推送到 GitHub...
git config http.proxy http://127.0.0.1:123
git config https.proxy http://127.0.0.1:123
git push origin main
git config --unset http.proxy
git config --unset https.proxy
echo.
echo ==========================================
echo  完成! 所有设备都能看到新文件了
echo ==========================================
pause
