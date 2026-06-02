@echo off
chcp 65001 >nul
echo ============================================================
echo   3D相机多角度图像生成器 - 环境安装 (纯免费方案)
echo ============================================================
echo.

:: 检查 Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Python，请先安装 Python 3.10+
    echo 下载地址: https://www.python.org/downloads/
    pause
    exit /b 1
)
echo [√] Python 已就绪

:: 创建虚拟环境
if not exist "venv" (
    echo [*] 创建虚拟环境...
    python -m venv venv
)
echo [√] 虚拟环境已就绪

:: 激活并安装依赖
echo [*] 安装依赖 (约1-2分钟)...
call venv\Scripts\activate.bat
pip install --upgrade pip -q
pip install -r requirements.txt -q

echo.
echo ============================================================
echo   安装完成! 完全免费，无需任何 API Key
echo.
echo   启动方式: 双击 run.bat
echo   首次使用: HF Space 冷启动约30-60秒，之后很快
echo ============================================================
pause
