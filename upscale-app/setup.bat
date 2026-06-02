@echo off
chcp 65001 >nul
echo ============================================================
echo   高清无损放大软件 - 环境安装
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
echo [*] 安装依赖 (AI引擎较大，约需2-5分钟)...
call venv\Scripts\activate.bat
pip install --upgrade pip -q

:: 先安装 PyTorch (Real-ESRGAN 的前提)
echo [*] 安装 PyTorch...
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu -q

:: 安装其余依赖
pip install -r requirements.txt -q
if %errorlevel% neq 0 (
    echo.
    echo [!] 警告: AI引擎 (Real-ESRGAN) 安装失败
    echo [!] Lanczos 轻量引擎仍可正常使用
    echo [!] 如需AI引擎，请手动执行: pip install realesrgan
)

echo.
echo ============================================================
echo   安装完成!
echo.
echo   启动方式: 双击 run.bat
echo   引擎: Real-ESRGAN (AI) + Lanczos (轻量回退)
echo   注意: 首次使用AI引擎时会自动下载模型文件(~300MB)
echo ============================================================
pause
