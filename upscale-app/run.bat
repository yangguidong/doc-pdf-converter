@echo off
chcp 65001 >nul
echo ============================================================
echo   高清无损放大软件 - 启动中...
echo ============================================================

:: 找到 Python
set PYTHON=
if exist "D:\VS3\Python39_64\python.exe" set PYTHON=D:\VS3\Python39_64\python.exe
if exist "venv\Scripts\python.exe" set PYTHON=venv\Scripts\python.exe
if "%PYTHON%"=="" (
    echo [错误] 未找到 Python，请先运行 setup.bat
    pause
    exit /b 1
)

echo [*] 启动 Gradio 应用...
echo [*] 浏览器打开 http://127.0.0.1:7860
%PYTHON% app.py

pause
